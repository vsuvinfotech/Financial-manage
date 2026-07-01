import { Router } from "express";
import { authenticate, requirePermission } from "../../middleware/auth.middleware.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { scopedWhere } from "../../utils/scoped-where.js";
import { financialService } from "../financial/financial.service.js";

export const dashboardRoutes = Router();

dashboardRoutes.use(authenticate);
dashboardRoutes.get("/summary", requirePermission("dashboard:view"), asyncHandler(async (req, res) => res.json(await financialService.dashboard(req.query, scopedWhere(req)))));
dashboardRoutes.get("/charts/revenue-expense", requirePermission("dashboard:view"), asyncHandler(async (req, res) => res.json(await financialService.revenueExpenseChart(req.query, scopedWhere(req)))));
dashboardRoutes.get("/charts/payment-methods", requirePermission("dashboard:view"), asyncHandler(async (req, res) => res.json(await financialService.paymentSummary(req.query, scopedWhere(req)))));
