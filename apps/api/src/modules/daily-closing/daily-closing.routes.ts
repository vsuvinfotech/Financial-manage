import { Router } from "express";
import { parseISO, startOfDay } from "date-fns";
import { prisma } from "../../config/prisma.js";
import { authenticate, requirePermission, requireStoreAccess } from "../../middleware/auth.middleware.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { HttpError } from "../../utils/http-error.js";
import { assertStoreAccess } from "../../utils/scoped-where.js";
import { calculateSummary } from "../financial/financial.service.js";

export const dailyClosingRoutes = Router();

dailyClosingRoutes.use(authenticate);
dailyClosingRoutes.post("/", requirePermission("dailyClosing:write"), requireStoreAccess, asyncHandler(async (req, res) => {
  const storeId = req.body.storeId as string;
  const store = await prisma.store.findUnique({ where: { id: storeId } });
  if (!store) throw new HttpError(400, "Store not found");
  if (req.user!.companyId && store.companyId !== req.user!.companyId) {
    throw new HttpError(403, "Store does not belong to your company");
  }

  const date = startOfDay(req.body.date ? parseISO(req.body.date) : new Date());
  const summary = await calculateSummary(
    { from: date, to: new Date(date.getTime() + 86_399_999) },
    { companyId: store.companyId, storeId },
  );
  const values = {
    totalRevenue: summary.totalRevenue,
    totalExpense: summary.totalExpenses,
    totalPurchase: summary.totalPurchases,
    totalTax: summary.totalTax,
    cashTotal: summary.cashTotal,
    cardTotal: summary.cardTotal,
    netProfit: summary.netProfit,
  };
  const closing = await prisma.dailyClosing.upsert({
    where: { storeId_date: { storeId, date } },
    update: values,
    create: { date, storeId, companyId: store.companyId, ...values },
  });
  res.status(201).json(closing);
}));

dailyClosingRoutes.get("/:storeId/:date", asyncHandler(async (req, res) => {
  assertStoreAccess(req, req.params.storeId);
  const date = startOfDay(parseISO(req.params.date));
  const closing = await prisma.dailyClosing.findUnique({
    where: { storeId_date: { storeId: req.params.storeId, date } },
  });
  res.json(closing);
}));
