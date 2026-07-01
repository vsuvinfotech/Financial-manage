import { Router } from "express";
import type { AnyZodObject } from "zod";
import { authenticate, authorize, requirePermission, requireStoreAccess } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import {
  expenseCreateSchema,
  expenseUpdateSchema,
  idParamsSchema,
  listQuerySchema,
  purchaseCreateSchema,
  purchaseUpdateSchema,
  revenueCreateSchema,
  revenueUpdateSchema,
  taxCreateSchema,
  taxUpdateSchema,
} from "./entry.schema.js";
import { createEntryController } from "./entry.controller.js";
import type { ModelName } from "./entry.service.js";

const resourceByModel: Record<ModelName, "revenue" | "expenses" | "purchases" | "taxes"> = {
  revenue: "revenue",
  expense: "expenses",
  purchase: "purchases",
  tax: "taxes",
};

function buildEntryRoutes(model: ModelName, createSchema: AnyZodObject, updateSchema: AnyZodObject) {
  const routes = Router();
  const controller = createEntryController(model);
  const resource = resourceByModel[model];
  routes.use(authenticate);
  routes.get("/", requirePermission(`${resource}:read`), validate(listQuerySchema), controller.list);
  routes.post("/", requirePermission(`${resource}:write`), validate(createSchema), requireStoreAccess, controller.create);
  routes.put("/:id", requirePermission(`${resource}:write`), authorize("PLATFORM_ADMIN", "OWNER", "ADMIN", "MANAGER"), validate(idParamsSchema.merge(updateSchema)), controller.update);
  routes.delete("/:id", requirePermission(`${resource}:write`), authorize("PLATFORM_ADMIN", "OWNER", "ADMIN"), validate(idParamsSchema), controller.remove);
  return routes;
}

export const revenueRoutes = buildEntryRoutes("revenue", revenueCreateSchema, revenueUpdateSchema);
export const expenseRoutes = buildEntryRoutes("expense", expenseCreateSchema, expenseUpdateSchema);
export const purchaseRoutes = buildEntryRoutes("purchase", purchaseCreateSchema, purchaseUpdateSchema);
export const taxRoutes = buildEntryRoutes("tax", taxCreateSchema, taxUpdateSchema);
