import { Router } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../../config/prisma.js";
import { canManageRole, isPlatformAdmin, type AppRole } from "../../config/permissions.js";
import { authenticate, requirePermission } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { HttpError } from "../../utils/http-error.js";
import {
  createUserSchema,
  storeAccessParamsSchema,
  storeAccessSchema,
  updateUserSchema,
  userParamsSchema,
} from "./users.schema.js";

export const userRoutes = Router();

userRoutes.use(authenticate);

/** Company the acting user manages; platform admins may target another via param. */
function actingCompanyId(req: any, override?: string): string | null {
  if (isPlatformAdmin(req.user.role)) return override ?? req.user.companyId ?? null;
  if (!req.user.companyId) throw new HttpError(403, "User is not associated with a company");
  return req.user.companyId;
}

/** Ensures all provided storeIds belong to the given company. */
async function assertStoresInCompany(storeIds: string[], companyId: string | null) {
  if (!storeIds.length) return;
  const stores = await prisma.store.findMany({ where: { id: { in: storeIds } } });
  if (stores.length !== storeIds.length) throw new HttpError(400, "One or more stores not found");
  if (companyId && stores.some((s) => s.companyId !== companyId)) {
    throw new HttpError(400, "Stores must belong to the same company");
  }
}

userRoutes.get(
  "/",
  requirePermission("users:read"),
  asyncHandler(async (req, res) => {
    const platform = isPlatformAdmin(req.user!.role);
    const where = platform
      ? typeof req.query.companyId === "string"
        ? { companyId: req.query.companyId }
        : {}
      : { companyId: req.user!.companyId };
    const users = await prisma.user.findMany({
      where,
      select: { id: true, name: true, email: true, companyId: true, role: { select: { name: true } }, createdAt: true, updatedAt: true },
      orderBy: { createdAt: "desc" },
    });
    res.json(users.map((u) => ({ ...u, role: u.role.name })));
  }),
);

userRoutes.post(
  "/",
  requirePermission("users:write"),
  validate(createUserSchema),
  asyncHandler(async (req, res) => {
    const targetRoleName = req.body.role as AppRole;
    if (!canManageRole(req.user!.role, targetRoleName)) throw new HttpError(403, "You cannot create this role");

    const companyId = actingCompanyId(req, req.body.companyId);

    const exists = await prisma.user.findFirst({
      where: { email: req.body.email, companyId },
    });
    if (exists) throw new HttpError(409, "Email already exists");

    const roleRecord = await prisma.role.findFirst({
      where: { name: targetRoleName, companyId },
    });
    if (!roleRecord) throw new HttpError(400, "Role not found for this company");

    const storeIds: string[] = req.body.storeIds ?? [];
    await assertStoresInCompany(storeIds, companyId);

    const password = await bcrypt.hash(req.body.password, 12);
    const user = await prisma.user.create({
      data: {
        name: req.body.name,
        email: req.body.email,
        password,
        roleId: roleRecord.id,
        companyId,
        storeAccess: { create: storeIds.map((storeId) => ({ storeId })) },
      },
      select: { id: true, name: true, email: true, companyId: true, role: { select: { name: true } }, createdAt: true, updatedAt: true },
    });
    res.status(201).json({ ...user, role: user.role.name });
  }),
);

userRoutes.put(
  "/:id",
  requirePermission("users:write"),
  validate(updateUserSchema),
  asyncHandler(async (req, res) => {
    const existing = await prisma.user.findUnique({ where: { id: req.params.id }, include: { role: true } });
    if (!existing) throw new HttpError(404, "User not found");
    if (!isPlatformAdmin(req.user!.role) && existing.companyId !== req.user!.companyId) {
      throw new HttpError(403, "You cannot update this user");
    }
    if (!canManageRole(req.user!.role, existing.role.name as AppRole)) throw new HttpError(403, "You cannot update this user");
    if (req.body.role && !canManageRole(req.user!.role, req.body.role)) throw new HttpError(403, "You cannot assign this role");

    const data: any = {
      name: req.body.name,
      email: req.body.email,
    };
    if (req.body.password) data.password = await bcrypt.hash(req.body.password, 12);

    if (req.body.role) {
      const roleRecord = await prisma.role.findFirst({
        where: { name: req.body.role, companyId: existing.companyId },
      });
      if (roleRecord) data.roleId = roleRecord.id;
    }

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data,
      select: { id: true, name: true, email: true, companyId: true, role: { select: { name: true } }, createdAt: true, updatedAt: true },
    });
    res.json({ ...user, role: user.role.name });
  }),
);

userRoutes.delete(
  "/:id",
  requirePermission("users:write"),
  validate(userParamsSchema),
  asyncHandler(async (req, res) => {
    const existing = await prisma.user.findUnique({ where: { id: req.params.id }, include: { role: true } });
    if (!existing) throw new HttpError(404, "User not found");
    if (existing.id === req.user!.id) throw new HttpError(400, "You cannot delete your own account");
    if (!isPlatformAdmin(req.user!.role) && existing.companyId !== req.user!.companyId) {
      throw new HttpError(403, "You cannot delete this user");
    }
    if (!canManageRole(req.user!.role, existing.role.name as AppRole)) throw new HttpError(403, "You cannot delete this user");
    await prisma.user.delete({ where: { id: req.params.id } });
    res.status(204).send();
  }),
);

// ---- Store access management ----

userRoutes.get(
  "/:id/store-access",
  requirePermission("users:read"),
  validate(userParamsSchema),
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      include: { storeAccess: { include: { store: { select: { id: true, name: true } } } } },
    });
    if (!user) throw new HttpError(404, "User not found");
    if (!isPlatformAdmin(req.user!.role) && user.companyId !== req.user!.companyId) {
      throw new HttpError(403, "You cannot view this user");
    }
    res.json(user.storeAccess.map((a) => a.store));
  }),
);

userRoutes.post(
  "/:id/store-access",
  requirePermission("users:write"),
  validate(storeAccessSchema),
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user) throw new HttpError(404, "User not found");
    if (!isPlatformAdmin(req.user!.role) && user.companyId !== req.user!.companyId) {
      throw new HttpError(403, "You cannot modify this user");
    }
    await assertStoresInCompany(req.body.storeIds, user.companyId);
    await prisma.$transaction(
      req.body.storeIds.map((storeId: string) =>
        prisma.userStoreAccess.upsert({
          where: { userId_storeId: { userId: user.id, storeId } },
          update: {},
          create: { userId: user.id, storeId },
        }),
      ),
    );
    res.status(201).json({ ok: true });
  }),
);

userRoutes.delete(
  "/:id/store-access/:storeId",
  requirePermission("users:write"),
  validate(storeAccessParamsSchema),
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user) throw new HttpError(404, "User not found");
    if (!isPlatformAdmin(req.user!.role) && user.companyId !== req.user!.companyId) {
      throw new HttpError(403, "You cannot modify this user");
    }
    await prisma.userStoreAccess.deleteMany({
      where: { userId: req.params.id, storeId: req.params.storeId },
    });
    res.status(204).send();
  }),
);
