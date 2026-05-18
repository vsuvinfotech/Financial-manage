import jwt from "jsonwebtoken";
import type { NextFunction, Request, Response } from "express";
import { env } from "../config/env.js";
import { HttpError } from "../utils/http-error.js";
import type { AppRole, Permission } from "../config/permissions.js";

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
    };
    next();
  } catch {
    throw new HttpError(401, "Invalid or expired token");
  }
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
