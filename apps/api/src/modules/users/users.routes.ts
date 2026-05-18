import { Router } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../../config/prisma.js";
import { canManageRole, type AppRole } from "../../config/permissions.js";
import { authenticate, requirePermission } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { HttpError } from "../../utils/http-error.js";
import { createUserSchema, updateUserSchema, userParamsSchema } from "./users.schema.js";

export const userRoutes = Router();

userRoutes.use(authenticate);

userRoutes.get(
  "/",
  requirePermission("users:read"),
  asyncHandler(async (_req, res) => {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: { select: { name: true } }, createdAt: true, updatedAt: true },
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

    const exists = await prisma.user.findUnique({ where: { email: req.body.email } });
    if (exists) throw new HttpError(409, "Email already exists");

    const roleRecord = await prisma.role.findUnique({ where: { name: targetRoleName } });
    if (!roleRecord) throw new HttpError(400, "Role not found");

    const password = await bcrypt.hash(req.body.password, 12);
    const user = await prisma.user.create({
      data: { name: req.body.name, email: req.body.email, password, roleId: roleRecord.id },
      select: { id: true, name: true, email: true, role: { select: { name: true } }, createdAt: true, updatedAt: true },
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
    if (!canManageRole(req.user!.role, existing.role.name as AppRole)) throw new HttpError(403, "You cannot update this user");
    if (req.body.role && !canManageRole(req.user!.role, req.body.role)) throw new HttpError(403, "You cannot assign this role");

    const data: any = {
      name: req.body.name,
      email: req.body.email,
    };
    if (req.body.password) data.password = await bcrypt.hash(req.body.password, 12);
    
    if (req.body.role) {
      const roleRecord = await prisma.role.findUnique({ where: { name: req.body.role } });
      if (roleRecord) data.roleId = roleRecord.id;
    }

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data,
      select: { id: true, name: true, email: true, role: { select: { name: true } }, createdAt: true, updatedAt: true },
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
    if (!canManageRole(req.user!.role, existing.role.name as AppRole)) throw new HttpError(403, "You cannot delete this user");
    await prisma.user.delete({ where: { id: req.params.id } });
    res.status(204).send();
  }),
);
