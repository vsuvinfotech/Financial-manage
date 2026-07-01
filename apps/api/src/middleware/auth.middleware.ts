import jwt from "jsonwebtoken";
import type { NextFunction, Request, Response } from "express";
import { env } from "../config/env.js";
import { HttpError } from "../utils/http-error.js";
import { isPlatformAdmin, type AppRole, type Permission } from "../config/permissions.js";

type AccessPayload = Express.User & { type: "access" };

export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;
  if (!token) throw new HttpError(401, "Authentication required");

  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessPayload;
    if (payload.type !== "access") throw new Error("Invalid token type");
    req.user = {
      id: payload.id,
      email: payload.email,
      role: payload.role,
      name: payload.name,
      permissions: payload.permissions || [],
      companyId: payload.companyId ?? null,
      companySlug: payload.companySlug ?? null,
      allowedStoreIds: payload.allowedStoreIds ?? [],
    };
    next();
  } catch {
    throw new HttpError(401, "Invalid or expired token");
  }
}

/**
 * Ensures the caller may act on the store identified by `req.body.storeId`,
 * `req.params.storeId`, or `req.query.storeId`. Platform admins bypass the check.
 */
export function requireStoreAccess(req: Request, _res: Response, next: NextFunction) {
  if (!req.user) throw new HttpError(401, "Authentication required");
  if (isPlatformAdmin(req.user.role)) return next();

  const storeId =
    (req.body && (req.body.storeId as string | undefined)) ||
    (req.params && (req.params.storeId as string | undefined)) ||
    (typeof req.query?.storeId === "string" ? (req.query.storeId as string) : undefined);

  if (!storeId) throw new HttpError(400, "storeId is required");
  if (!req.user.allowedStoreIds.includes(storeId)) {
    throw new HttpError(403, "You do not have access to this store");
  }
  next();
}

export function authorize(...roles: AppRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) throw new HttpError(401, "Authentication required");
    if (!roles.includes(req.user.role)) throw new HttpError(403, "Insufficient permissions");
    next();
  };
}

export function requirePermission(permission: Permission) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) throw new HttpError(401, "Authentication required");
    if (!req.user.permissions.includes(permission)) throw new HttpError(403, "Insufficient permissions");
    next();
  };
}
