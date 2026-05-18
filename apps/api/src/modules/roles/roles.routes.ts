import { Router } from "express";
import { prisma } from "../../config/prisma.js";
import { authenticate, requirePermission } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { HttpError } from "../../utils/http-error.js";
import { createRoleSchema, updateRoleSchema, roleParamsSchema } from "./roles.schema.js";

export const rolesRoutes = Router();

rolesRoutes.use(authenticate);

rolesRoutes.get(
  "/",
  requirePermission("roles:read"),
  asyncHandler(async (_req, res) => {
    const roles = await prisma.role.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.json(roles);
  }),
);

rolesRoutes.post(
  "/",
  requirePermission("roles:write"),
  validate(createRoleSchema),
  asyncHandler(async (req, res) => {
    const exists = await prisma.role.findUnique({ where: { name: req.body.name } });
    if (exists) throw new HttpError(409, "Role already exists");

    const role = await prisma.role.create({
      data: { name: req.body.name, permissions: req.body.permissions },
    });
    res.status(201).json(role);
  }),
);

rolesRoutes.put(
  "/:id",
  requirePermission("roles:write"),
  validate(updateRoleSchema),
  asyncHandler(async (req, res) => {
    const existing = await prisma.role.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new HttpError(404, "Role not found");
    if (existing.name === "SUPERADMIN" || existing.name === "ADMIN") {
        throw new HttpError(403, "Cannot edit core system roles directly");
    }

    const data: any = {};
    if (req.body.name) {
      if (req.body.name !== existing.name) {
        const nameExists = await prisma.role.findUnique({ where: { name: req.body.name } });
        if (nameExists) throw new HttpError(409, "Role name already exists");
      }
      data.name = req.body.name;
    }
    if (req.body.permissions) data.permissions = req.body.permissions;

    const role = await prisma.role.update({
      where: { id: req.params.id },
      data,
    });
    res.json(role);
  }),
);

rolesRoutes.delete(
  "/:id",
  requirePermission("roles:write"),
  validate(roleParamsSchema),
  asyncHandler(async (req, res) => {
    const existing = await prisma.role.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new HttpError(404, "Role not found");
    if (["SUPERADMIN", "ADMIN", "MANAGER", "EMPLOYEE"].includes(existing.name)) {
        throw new HttpError(403, "Cannot delete core system roles");
    }

    await prisma.role.delete({ where: { id: req.params.id } });
    res.status(204).send();
  }),
);
