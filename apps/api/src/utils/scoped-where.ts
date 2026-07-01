import type { Request } from "express";
import { isPlatformAdmin } from "../config/permissions.js";
import { HttpError } from "./http-error.js";

/**
 * Builds a tenant-scoped Prisma `where` fragment that enforces multi-tenant isolation.
 *
 * Rules:
 * - Non-platform users are ALWAYS locked to their own `companyId`; any client-supplied
 *   `companyId` is ignored.
 * - Platform admins may optionally target a specific company via `query.companyId`.
 * - An optional `storeId` filter is applied when present and verified against the
 *   caller's allowed stores (platform admins bypass the store check).
 */
export function scopedWhere(req: Request, extra: Record<string, unknown> = {}) {
  const user = req.user;
  if (!user) throw new HttpError(401, "Authentication required");

  const where: Record<string, unknown> = { ...extra };
  const requestedStoreId =
    typeof req.query?.storeId === "string" ? (req.query.storeId as string) : undefined;

  if (isPlatformAdmin(user.role)) {
    const requestedCompanyId =
      typeof req.query?.companyId === "string" ? (req.query.companyId as string) : undefined;
    if (requestedCompanyId) where.companyId = requestedCompanyId;
    if (requestedStoreId) where.storeId = requestedStoreId;
    return where;
  }

  if (!user.companyId) throw new HttpError(403, "User is not associated with a company");
  where.companyId = user.companyId;

  if (requestedStoreId) {
    assertStoreAccess(req, requestedStoreId);
    where.storeId = requestedStoreId;
  } else {
    // Restrict to the stores the user can access within their company.
    where.storeId = { in: user.allowedStoreIds };
  }

  return where;
}

/** Throws unless the caller may act on the given store. Platform admins bypass. */
export function assertStoreAccess(req: Request, storeId: string) {
  const user = req.user;
  if (!user) throw new HttpError(401, "Authentication required");
  if (isPlatformAdmin(user.role)) return;
  if (!user.allowedStoreIds.includes(storeId)) {
    throw new HttpError(403, "You do not have access to this store");
  }
}

/** Resolves the companyId to persist on a new record for the current user. */
export function resolveCompanyId(req: Request, fallbackCompanyId?: string) {
  const user = req.user;
  if (!user) throw new HttpError(401, "Authentication required");
  if (isPlatformAdmin(user.role)) {
    const companyId = fallbackCompanyId ?? user.companyId ?? undefined;
    if (!companyId) throw new HttpError(400, "companyId is required for platform admin");
    return companyId;
  }
  if (!user.companyId) throw new HttpError(403, "User is not associated with a company");
  return user.companyId;
}
