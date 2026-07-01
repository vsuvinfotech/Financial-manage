import type { Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma.js";
import { getDateRange, getReportRange } from "../../utils/date-range.js";

function decimalToNumber(value: Prisma.Decimal | null | undefined) {
  return value ? Number(value) : 0;
}

export async function calculateSummary(
  range: { from: Date; to: Date },
  baseWhere: Record<string, unknown> = {},
) {
  const where = { ...baseWhere, date: { gte: range.from, lte: range.to } };
  const [revenue, expenses, purchases, taxes, cashRevenue, cardRevenue, cashExpense, cashPurchase, cashTax] =
    await Promise.all([
      prisma.revenue.aggregate({ where, _sum: { amount: true } }),
      prisma.expense.aggregate({ where, _sum: { amount: true } }),
      prisma.purchase.aggregate({ where, _sum: { amount: true } }),
      prisma.tax.aggregate({ where, _sum: { amount: true } }),
      prisma.revenue.aggregate({ where: { ...where, paymentMethod: "CASH" }, _sum: { amount: true } }),
      prisma.revenue.aggregate({ where: { ...where, paymentMethod: "CARD" }, _sum: { amount: true } }),
      prisma.expense.aggregate({ where: { ...where, paymentMethod: "CASH" }, _sum: { amount: true } }),
      prisma.purchase.aggregate({ where: { ...where, paymentMethod: "CASH" }, _sum: { amount: true } }),
      prisma.tax.aggregate({ where: { ...where, paymentMethod: "CASH" }, _sum: { amount: true } }),
    ]);
  const totalRevenue = decimalToNumber(revenue._sum.amount);
  const totalExpenses = decimalToNumber(expenses._sum.amount);
  const totalPurchases = decimalToNumber(purchases._sum.amount);
  const totalTax = decimalToNumber(taxes._sum.amount);
  const cashTotal =
    decimalToNumber(cashRevenue._sum.amount) -
    decimalToNumber(cashExpense._sum.amount) -
    decimalToNumber(cashPurchase._sum.amount) -
    decimalToNumber(cashTax._sum.amount);
  const cardTotal = decimalToNumber(cardRevenue._sum.amount);
  return {
    totalRevenue,
    totalExpenses,
    totalPurchases,
    totalTax,
    cashTotal,
    cardTotal,
    netProfit: totalRevenue - totalExpenses - totalPurchases - totalTax,
  };
}

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

export const financialService = {
  async dashboard(query: Record<string, unknown>, baseWhere: Record<string, unknown> = {}) {
    return calculateSummary(getDateRange(query), baseWhere);
  },

  async storeReport(query: Record<string, unknown>, baseWhere: Record<string, unknown> = {}) {
    const { from, to } = getDateRange(query);
    const where = { ...baseWhere, date: { gte: from, lte: to } };
    const storeFilter = baseWhere.storeId ? { id: baseWhere.storeId as string } : {};
    const stores = await prisma.store.findMany({
      where: { companyId: baseWhere.companyId as string, ...storeFilter },
      orderBy: { name: "asc" },
    });
    return Promise.all(
      stores.map(async (store) => {
        const summary = await calculateSummary({ from, to }, { ...where, storeId: store.id });
        return { id: store.id, name: store.name, ...summary };
      }),
    );
  },

  async detailedReport(query: Record<string, unknown>, baseWhere: Record<string, unknown> = {}) {
    const { from, to } = getDateRange(query);
    const where = { ...baseWhere, date: { gte: from, lte: to } };

    const [revenues, expenses, purchases, taxes] = await Promise.all([
      prisma.revenue.groupBy({ by: ["date"], where, _sum: { amount: true } }),
      prisma.expense.groupBy({ by: ["date"], where, _sum: { amount: true } }),
      prisma.purchase.groupBy({ by: ["date"], where, _sum: { amount: true } }),
      prisma.tax.groupBy({ by: ["date"], where, _sum: { amount: true } }),
    ]);

    const rows = new Map<string, { date: string; revenue: number; expenses: number; purchases: number; taxes: number }>();

    // Seed every day in the range so empty days appear as zeros.
    let cursor = new Date(from);
    while (cursor <= to) {
      const key = dateKey(cursor);
      rows.set(key, { date: key, revenue: 0, expenses: 0, purchases: 0, taxes: 0 });
      cursor.setDate(cursor.getDate() + 1);
    }

    for (const item of revenues) {
      const key = dateKey(item.date);
      const row = rows.get(key) ?? { date: key, revenue: 0, expenses: 0, purchases: 0, taxes: 0 };
      row.revenue = decimalToNumber(item._sum.amount);
      rows.set(key, row);
    }
    for (const item of expenses) {
      const key = dateKey(item.date);
      const row = rows.get(key) ?? { date: key, revenue: 0, expenses: 0, purchases: 0, taxes: 0 };
      row.expenses = decimalToNumber(item._sum.amount);
      rows.set(key, row);
    }
    for (const item of purchases) {
      const key = dateKey(item.date);
      const row = rows.get(key) ?? { date: key, revenue: 0, expenses: 0, purchases: 0, taxes: 0 };
      row.purchases = decimalToNumber(item._sum.amount);
      rows.set(key, row);
    }
    for (const item of taxes) {
      const key = dateKey(item.date);
      const row = rows.get(key) ?? { date: key, revenue: 0, expenses: 0, purchases: 0, taxes: 0 };
      row.taxes = decimalToNumber(item._sum.amount);
      rows.set(key, row);
    }

    return Array.from(rows.values()).sort((a, b) => a.date.localeCompare(b.date));
  },

  async revenueExpenseChart(query: Record<string, unknown>, baseWhere: Record<string, unknown> = {}) {
    const { from, to } = getDateRange(query);
    const where = { ...baseWhere, date: { gte: from, lte: to } };
    const [revenues, expenses] = await Promise.all([
      prisma.revenue.groupBy({ by: ["date"], where, _sum: { amount: true } }),
      prisma.expense.groupBy({ by: ["date"], where, _sum: { amount: true } }),
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

  async paymentSummary(query: Record<string, unknown>, baseWhere: Record<string, unknown> = {}) {
    const { from, to } = getDateRange(query);
    const rows = await prisma.revenue.groupBy({
      by: ["paymentMethod"],
      where: { ...baseWhere, date: { gte: from, lte: to } },
      _sum: { amount: true },
    });
    return rows.map((row) => ({ name: row.paymentMethod, value: decimalToNumber(row._sum.amount) }));
  },

  async report(period?: string, date?: string, baseWhere: Record<string, unknown> = {}) {
    return calculateSummary(getReportRange(period, date), baseWhere);
  },
};
