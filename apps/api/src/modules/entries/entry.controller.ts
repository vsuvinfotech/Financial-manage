import type { Request } from "express";
import { isPlatformAdmin } from "../../config/permissions.js";
import { HttpError } from "../../utils/http-error.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { createEntryService, type ModelName, type TenantScope } from "./entry.service.js";

/** Derives the tenant scope (company + accessible stores) from the request. */
function buildScope(req: Request): TenantScope {
  const user = req.user!;
  const platform = isPlatformAdmin(user.role);
  const queryCompanyId = typeof req.query.companyId === "string" ? req.query.companyId : undefined;
  const companyId = platform ? queryCompanyId ?? user.companyId ?? "" : user.companyId ?? "";
  if (!platform && !companyId) throw new HttpError(403, "User is not associated with a company");
  return {
    companyId,
    allowedStoreIds: user.allowedStoreIds ?? [],
    isPlatformAdmin: platform,
    storeId: typeof req.query.storeId === "string" ? req.query.storeId : undefined,
  };
}

export function createEntryController(model: ModelName) {
  const service = createEntryService(model);
  return {
    list: asyncHandler(async (req, res) => {
      res.json(await service.list(req.query, buildScope(req)));
    }),
    create: asyncHandler(async (req, res) => {
      res.status(201).json(await service.create(req.body, req.user!.id, buildScope(req)));
    }),
    update: asyncHandler(async (req, res) => {
      res.json(await service.update(req.params.id, req.body, buildScope(req)));
    }),
    remove: asyncHandler(async (req, res) => {
      await service.remove(req.params.id, buildScope(req));
      res.status(204).send();
    }),
  };
}
