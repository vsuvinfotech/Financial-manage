import type { Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma.js";
import { getDateRange, getReportRange } from "../../utils/date-range.js";

function decimalToNumber(value: Prisma.Decimal | null | undefined) {
  return value ? Number(value) : 0;
}

export async function calculateSummary(range: { from: Date; to: Date }) {
  const where = { date: { gte: range.from, lte: range.to } };
  const [revenue, expenses, purchases, cashRevenue, cardRevenue, cashExpense, cashPurchase] = await Promise.all([
    prisma.revenue.aggregate({ where, _sum: { amount: true } }),
    prisma.expense.aggregate({ where, _sum: { amount: true } }),
    prisma.purchase.aggregate({ where, _sum: { amount: true } }),
    prisma.revenue.aggregate({ where: { ...where, paymentMethod: "CASH" }, _sum: { amount: true } }),
    prisma.revenue.aggregate({ where: { ...where, paymentMethod: "CARD" }, _sum: { amount: true } }),
    prisma.expense.aggregate({ where: { ...where, paymentMethod: "CASH" }, _sum: { amount: true } }),
    prisma.purchase.aggregate({ where: { ...where, paymentMethod: "CASH" }, _sum: { amount: true } }),
  ]);
  const totalRevenue = decimalToNumber(revenue._sum.amount);
  const totalExpenses = decimalToNumber(expenses._sum.amount);
  const totalPurchases = decimalToNumber(purchases._sum.amount);
  const cashTotal = decimalToNumber(cashRevenue._sum.amount) - decimalToNumber(cashExpense._sum.amount) - decimalToNumber(cashPurchase._sum.amount);
  const cardTotal = decimalToNumber(cardRevenue._sum.amount);
  return {
    totalRevenue,
    totalExpenses,
    totalPurchases,
    cashTotal,
    cardTotal,
    netProfit: totalRevenue - totalExpenses - totalPurchases,
  };
}

export const financialService = {
  async dashboard(query: Record<string, unknown>) {
    return calculateSummary(getDateRange(query));
  },

  async revenueExpenseChart(query: Record<string, unknown>) {
    const { from, to } = getDateRange(query);
    const [revenues, expenses] = await Promise.all([
      prisma.revenue.groupBy({ by: ["date"], where: { date: { gte: from, lte: to } }, _sum: { amount: true } }),
      prisma.expense.groupBy({ by: ["date"], where: { date: { gte: from, lte: to } }, _sum: { amount: true } }),
    ]);
    const rows = new Map<string, { date: string; revenue: number; expenses: number }>();
    for (const item of revenues) {
      const key = item.date.toISOString().slice(0, 10);
      rows.set(key, { date: key, revenue: decimalToNumber(item._sum.amount), expenses: 0 });
    }
    for (const item of expenses) {
      const key = item.date.toISOString().slice(0, 10);
      rows.set(key, { ...(rows.get(key) ?? { date: key, revenue: 0, expenses: 0 }), expenses: decimalToNumber(item._sum.amount) });
    }
    return Array.from(rows.values()).sort((a, b) => a.date.localeCompare(b.date));
  },

  async paymentSummary(query: Record<string, unknown>) {
    const { from, to } = getDateRange(query);
    const rows = await prisma.revenue.groupBy({
      by: ["paymentMethod"],
      where: { date: { gte: from, lte: to } },
      _sum: { amount: true },
    });
    return rows.map((row) => ({ name: row.paymentMethod, value: decimalToNumber(row._sum.amount) }));
  },

  async report(period?: string, date?: string) {
    return calculateSummary(getReportRange(period, date));
  },
};
