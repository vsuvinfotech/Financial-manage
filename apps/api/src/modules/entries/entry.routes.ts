import { Router } from "express";
import type { AnyZodObject } from "zod";
import { authenticate, authorize, requirePermission } from "../../middleware/auth.middleware.js";
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
} from "./entry.schema.js";
import { createEntryController } from "./entry.controller.js";

function buildEntryRoutes(model: "revenue" | "expense" | "purchase", createSchema: AnyZodObject, updateSchema: AnyZodObject) {
  const routes = Router();
  const controller = createEntryController(model);
  const resource = model === "expense" ? "expenses" : model === "purchase" ? "purchases" : "revenue";
  routes.use(authenticate);
  routes.get("/", requirePermission(`${resource}:read`), validate(listQuerySchema), controller.list);
  routes.post("/", requirePermission(`${resource}:write`), validate(createSchema), controller.create);
  routes.put("/:id", requirePermission(`${resource}:write`), authorize("SUPERADMIN", "ADMIN", "MANAGER"), validate(idParamsSchema.merge(updateSchema)), controller.update);
  routes.delete("/:id", requirePermission(`${resource}:write`), authorize("SUPERADMIN", "ADMIN"), validate(idParamsSchema), controller.remove);
  return routes;
}

export const revenueRoutes = buildEntryRoutes("revenue", revenueCreateSchema, revenueUpdateSchema);
export const expenseRoutes = buildEntryRoutes("expense", expenseCreateSchema, expenseUpdateSchema);
export const purchaseRoutes = buildEntryRoutes("purchase", purchaseCreateSchema, purchaseUpdateSchema);
