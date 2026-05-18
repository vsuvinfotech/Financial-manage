import { Router } from "express";
import { parseISO, startOfDay } from "date-fns";
import { prisma } from "../../config/prisma.js";
import { authenticate, requirePermission } from "../../middleware/auth.middleware.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { calculateSummary } from "../financial/financial.service.js";

export const dailyClosingRoutes = Router();

dailyClosingRoutes.use(authenticate);
dailyClosingRoutes.post("/", requirePermission("dailyClosing:write"), asyncHandler(async (req, res) => {
  const date = startOfDay(req.body.date ? parseISO(req.body.date) : new Date());
  const summary = await calculateSummary({ from: date, to: new Date(date.getTime() + 86_399_999) });
  const closing = await prisma.dailyClosing.upsert({
    where: { date },
    update: {
      totalRevenue: summary.totalRevenue,
      totalExpense: summary.totalExpenses,
      totalPurchase: summary.totalPurchases,
      cashTotal: summary.cashTotal,
      cardTotal: summary.cardTotal,
      netProfit: summary.netProfit,
    },
    create: {
      date,
      totalRevenue: summary.totalRevenue,
      totalExpense: summary.totalExpenses,
      totalPurchase: summary.totalPurchases,
      cashTotal: summary.cashTotal,
      cardTotal: summary.cardTotal,
      netProfit: summary.netProfit,
    },
  });
  res.status(201).json(closing);
}));

dailyClosingRoutes.get("/:date", asyncHandler(async (req, res) => {
  const date = startOfDay(parseISO(req.params.date));
  const closing = await prisma.dailyClosing.findUnique({ where: { date } });
  res.json(closing);
}));
