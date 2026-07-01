import { Router } from "express";
import { prisma } from "../../config/prisma.js";
import { isPlatformAdmin } from "../../config/permissions.js";
import { authenticate, authorize, requirePermission } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { HttpError } from "../../utils/http-error.js";
import {
  createStoreSchema,
  listStoresQuerySchema,
  storeParamsSchema,
  updateStoreSchema,
} from "./stores.schema.js";

export const storesRoutes = Router();

storesRoutes.use(authenticate);

/** Resolves which company a store operation should target for the current user. */
function resolveCompanyId(req: any, bodyOrQueryCompanyId?: string): string {
  if (isPlatformAdmin(req.user.role)) {
    const companyId = bodyOrQueryCompanyId ?? req.user.companyId;
    if (!companyId) throw new HttpError(400, "companyId is required");
    return companyId;
  }
  if (!req.user.companyId) throw new HttpError(403, "User is not associated with a company");
  return req.user.companyId;
}

storesRoutes.get(
  "/",
  requirePermission("stores:read"),
  validate(listStoresQuerySchema),
  asyncHandler(async (req, res) => {
    const companyId = resolveCompanyId(req, req.query.companyId as string | undefined);
    const stores = await prisma.store.findMany({
      where: {
        companyId,
        ...(req.query.isActive !== undefined ? { isActive: req.query.isActive as unknown as boolean } : {}),
      },
      orderBy: { name: "asc" },
    });
    res.json(stores);
  }),
);

storesRoutes.post(
  "/",
  requirePermission("stores:write"),
  authorize("PLATFORM_ADMIN", "OWNER", "ADMIN"),
  validate(createStoreSchema),
  asyncHandler(async (req, res) => {
    const companyId = resolveCompanyId(req, req.body.companyId);
    const exists = await prisma.store.findUnique({
      where: { name_companyId: { name: req.body.name, companyId } },
    });
    if (exists) throw new HttpError(409, "A store with this name already exists in the company");

    const store = await prisma.store.create({
      data: { name: req.body.name, companyId, isActive: req.body.isActive ?? true },
    });
    res.status(201).json(store);
  }),
);

storesRoutes.put(
  "/:id",
  requirePermission("stores:write"),
  authorize("PLATFORM_ADMIN", "OWNER", "ADMIN"),
  validate(updateStoreSchema),
  asyncHandler(async (req, res) => {
    const existing = await prisma.store.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new HttpError(404, "Store not found");
    if (!isPlatformAdmin(req.user!.role) && existing.companyId !== req.user!.companyId) {
      throw new HttpError(403, "You cannot modify this store");
    }
    const store = await prisma.store.update({
      where: { id: req.params.id },
      data: {
        ...(req.body.name !== undefined ? { name: req.body.name } : {}),
        ...(req.body.isActive !== undefined ? { isActive: req.body.isActive } : {}),
      },
    });
    res.json(store);
  }),
);

storesRoutes.delete(
  "/:id",
  requirePermission("stores:write"),
  authorize("PLATFORM_ADMIN", "OWNER", "ADMIN"),
  validate(storeParamsSchema),
  asyncHandler(async (req, res) => {
    const existing = await prisma.store.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new HttpError(404, "Store not found");
    if (!isPlatformAdmin(req.user!.role) && existing.companyId !== req.user!.companyId) {
      throw new HttpError(403, "You cannot delete this store");
    }
    await prisma.store.delete({ where: { id: req.params.id } });
    res.status(204).send();
  }),
);
