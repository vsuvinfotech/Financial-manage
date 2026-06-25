import type { Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma.js";
import { getDateRange } from "../../utils/date-range.js";
import { HttpError } from "../../utils/http-error.js";

type ModelName = "revenue" | "expense" | "purchase";

const categoryTypeByModel: Record<ModelName, "REVENUE" | "EXPENSE"> = {
  revenue: "REVENUE",
  expense: "EXPENSE",
  purchase: "REVENUE",
};

const categoryFieldByModel: Record<ModelName, string> = {
  revenue: "category",
  expense: "expenseType",
  purchase: "category",
};

async function assertCategory(model: ModelName, data: Record<string, unknown>) {
  const field = categoryFieldByModel[model];
  const value = data[field];
  if (typeof value !== "string" || !value) return;
  const category = await prisma.category.findUnique({
    where: { name_type: { name: value, type: categoryTypeByModel[model] } },
  });
  if (!category) throw new HttpError(400, `Unknown ${field}: "${value}"`);
  if (!category.isActive)
    throw new HttpError(400, `Category "${value}" is inactive`);
}

const searchableFields: Record<ModelName, string[]> = {
  revenue: ["notes"],
  expense: ["notes"],
  purchase: ["vendorName", "category", "notes"],
};

function buildWhere(model: ModelName, query: Record<string, unknown>) {
  const search = typeof query.search === "string" ? query.search : undefined;
  const hasDateFilter = typeof query.from === "string" || typeof query.to === "string";
  const where:
    | Prisma.RevenueWhereInput
    | Prisma.ExpenseWhereInput
    | Prisma.PurchaseWhereInput = {};
  if (hasDateFilter) {
    const { from, to } = getDateRange(query);
    Object.assign(where, { date: { gte: from, lte: to } });
  }
  if (search) {
    Object.assign(where, {
      OR: searchableFields[model].map((field) => ({
        [field]: { contains: search, mode: "insensitive" },
      })),
    });
  }
  return where;
}

export function createEntryService<TCreate extends object>(model: ModelName) {
  const client = prisma[model] as any;
  return {
    async list(query: Record<string, unknown>) {
      const page = Number(query.page ?? 1);
      const pageSize = Number(query.pageSize ?? 10);
      const sortBy = typeof query.sortBy === "string" ? query.sortBy : "date";
      const sortOrder = query.sortOrder === "asc" ? "asc" : "desc";
      const where = buildWhere(model, query);
      const [items, total] = await Promise.all([
        client.findMany({
          where,
          orderBy: { [sortBy]: sortOrder },
          skip: (page - 1) * pageSize,
          take: pageSize,
          include: {
            creator: { select: { id: true, name: true, email: true } },
          },
        }),
        client.count({ where }),
      ]);
      return {
        items,
        meta: { page, pageSize, total, pageCount: Math.ceil(total / pageSize) },
      };
    },

    async create(data: TCreate, userId: string) {
      await assertCategory(model, data as Record<string, unknown>);
      return client.create({ data: { ...data, createdBy: userId } });
    },

    async update(id: string, data: Partial<TCreate>) {
      await assertCategory(model, data as Record<string, unknown>);
      return client.update({ where: { id }, data });
    },

    async remove(id: string) {
      await client.delete({ where: { id } });
    },
  };
}
