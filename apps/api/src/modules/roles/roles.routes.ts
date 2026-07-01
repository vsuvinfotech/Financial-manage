import { Router } from "express";
import { prisma } from "../../config/prisma.js";
import { isPlatformAdmin } from "../../config/permissions.js";
import { authenticate, requirePermission } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { HttpError } from "../../utils/http-error.js";
import { createRoleSchema, updateRoleSchema, roleParamsSchema } from "./roles.schema.js";

export const rolesRoutes = Router();

const CORE_ROLES = ["OWNER", "ADMIN", "MANAGER", "EMPLOYEE"];

rolesRoutes.use(authenticate);

/** Resolves the company a role operation targets for the current user. */
function roleCompanyId(req: any, override?: string): string {
  if (isPlatformAdmin(req.user.role)) {
    const companyId = override ?? req.user.companyId;
    if (!companyId) throw new HttpError(400, "companyId is required");
    return companyId;
  }
  if (!req.user.companyId) throw new HttpError(403, "User is not associated with a company");
  return req.user.companyId;
}

rolesRoutes.get(
  "/",
  requirePermission("roles:read"),
  asyncHandler(async (req, res) => {
    const platform = isPlatformAdmin(req.user!.role);
    const where = platform
      ? typeof req.query.companyId === "string"
        ? { companyId: req.query.companyId }
        : {}
      : { companyId: req.user!.companyId };
    const roles = await prisma.role.findMany({ where, orderBy: { createdAt: "desc" } });
    res.json(roles);
  }),
);

rolesRoutes.post(
  "/",
  requirePermission("roles:write"),
  validate(createRoleSchema),
  asyncHandler(async (req, res) => {
    const companyId = roleCompanyId(req, req.body.companyId);
    const exists = await prisma.role.findUnique({
      where: { name_companyId: { name: req.body.name, companyId } },
    });
    if (exists) throw new HttpError(409, "Role already exists");

    const role = await prisma.role.create({
      data: { name: req.body.name, permissions: req.body.permissions, companyId },
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
    // System (platform) roles can only be managed by platform admins.
    if (existing.companyId === null && !isPlatformAdmin(req.user!.role)) {
      throw new HttpError(403, "Cannot edit system roles");
    }
    if (!isPlatformAdmin(req.user!.role) && existing.companyId !== req.user!.companyId) {
      throw new HttpError(403, "You cannot edit this role");
    }
    if (existing.name === "OWNER") throw new HttpError(403, "Cannot edit the OWNER role");

    const data: any = {};
    if (req.body.name) {
      if (req.body.name !== existing.name) {
        const nameExists = await prisma.role.findFirst({
          where: { name: req.body.name, companyId: existing.companyId },
        });
        if (nameExists) throw new HttpError(409, "Role name already exists");
      }
      data.name = req.body.name;
    }
    if (req.body.permissions) data.permissions = req.body.permissions;

    const role = await prisma.role.update({ where: { id: req.params.id }, data });
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
    if (existing.companyId === null) throw new HttpError(403, "Cannot delete system roles");
    if (!isPlatformAdmin(req.user!.role) && existing.companyId !== req.user!.companyId) {
      throw new HttpError(403, "You cannot delete this role");
    }
    if (CORE_ROLES.includes(existing.name)) {
      throw new HttpError(403, "Cannot delete core roles");
    }

    await prisma.role.delete({ where: { id: req.params.id } });
    res.status(204).send();
  }),
);
