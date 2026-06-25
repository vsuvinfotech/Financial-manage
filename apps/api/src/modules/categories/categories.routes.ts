import { Router } from "express";
import { prisma } from "../../config/prisma.js";
import { authenticate, authorize, requirePermission } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { HttpError } from "../../utils/http-error.js";
import {
  categoryParamsSchema,
  createCategorySchema,
  listCategoriesQuerySchema,
  updateCategorySchema,
} from "./categories.schema.js";

export const categoriesRoutes = Router();

categoriesRoutes.use(authenticate);

// Any authenticated user with read permission OR any of the entry-write permissions
// can list categories (needed to populate selects in entry forms).
categoriesRoutes.get(
  "/",
  validate(listCategoriesQuerySchema),
  asyncHandler(async (req, res) => {
    const permissions = req.user?.permissions ?? [];
    const allowed =
      permissions.includes("categories:read") ||
      permissions.includes("categories:view") ||
      permissions.includes("revenue:write") ||
      permissions.includes("expenses:write") ||
      permissions.includes("revenue:read") ||
      permissions.includes("expenses:read");
    if (!allowed) throw new HttpError(403, "Insufficient permissions");

    const { type, isActive } = req.query as { type?: "REVENUE" | "EXPENSE"; isActive?: boolean };
    const categories = await prisma.category.findMany({
      where: {
        ...(type ? { type } : {}),
        ...(isActive !== undefined ? { isActive } : {}),
      },
      orderBy: [{ type: "asc" }, { name: "asc" }],
    });
    res.json(categories);
  }),
);

categoriesRoutes.post(
  "/",
  requirePermission("categories:write"),
  authorize("SUPERADMIN", "ADMIN"),
  validate(createCategorySchema),
  asyncHandler(async (req, res) => {
    const name = req.body.name.trim();
    const exists = await prisma.category.findUnique({
      where: { name_type: { name, type: req.body.type } },
    });
    if (exists) throw new HttpError(409, "Category already exists for this type");

    const category = await prisma.category.create({
      data: {
        name,
        type: req.body.type,
        isActive: req.body.isActive ?? true,
      },
    });
    res.status(201).json(category);
  }),
);

categoriesRoutes.put(
  "/:id",
  requirePermission("categories:write"),
  authorize("SUPERADMIN", "ADMIN"),
  validate(updateCategorySchema),
  asyncHandler(async (req, res) => {
    const existing = await prisma.category.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new HttpError(404, "Category not found");

    const nextName = req.body.name ? req.body.name.trim() : existing.name;
    const nextType = req.body.type ?? existing.type;
    if (nextName !== existing.name || nextType !== existing.type) {
      const conflict = await prisma.category.findUnique({
        where: { name_type: { name: nextName, type: nextType } },
      });
      if (conflict && conflict.id !== existing.id) {
        throw new HttpError(409, "Another category with the same name and type already exists");
      }
    }

    const category = await prisma.category.update({
      where: { id: req.params.id },
      data: {
        name: nextName,
        type: nextType,
        ...(req.body.isActive !== undefined ? { isActive: req.body.isActive } : {}),
      },
    });
    res.json(category);
  }),
);

categoriesRoutes.delete(
  "/:id",
  requirePermission("categories:write"),
  authorize("SUPERADMIN", "ADMIN"),
  validate(categoryParamsSchema),
  asyncHandler(async (req, res) => {
    const existing = await prisma.category.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new HttpError(404, "Category not found");

    // Block hard-delete if category is referenced by any entries; soft-disable instead.
    const [revCount, expCount] = await Promise.all([
      existing.type === "REVENUE"
        ? prisma.revenue.count({ where: { category: existing.name } })
        : Promise.resolve(0),
      existing.type === "EXPENSE"
        ? prisma.expense.count({ where: { expenseType: existing.name } })
        : Promise.resolve(0),
    ]);

    if (revCount + expCount > 0) {
      const category = await prisma.category.update({
        where: { id: existing.id },
        data: { isActive: false },
      });
      res.json({ ...category, softDeleted: true });
      return;
    }

    await prisma.category.delete({ where: { id: req.params.id } });
    res.status(204).send();
  }),
);
