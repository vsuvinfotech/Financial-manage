import { prisma } from "../../config/prisma.js";
import { getDateRange } from "../../utils/date-range.js";
import { HttpError } from "../../utils/http-error.js";

export type ModelName = "revenue" | "expense" | "purchase" | "tax";

/** Tenant scope derived from the authenticated request. */
export type TenantScope = {
  companyId: string;
  allowedStoreIds: string[];
  isPlatformAdmin: boolean;
  /** Optional explicit store filter from the query string. */
  storeId?: string;
};

// Tax uses a free-text taxType, so it has no backing Category.
const categoryTypeByModel: Record<ModelName, "REVENUE" | "EXPENSE" | null> = {
  revenue: "REVENUE",
  expense: "EXPENSE",
  purchase: "REVENUE",
  tax: null,
};

const categoryFieldByModel: Record<ModelName, string | null> = {
  revenue: "category",
  expense: "expenseType",
  purchase: "category",
  tax: null,
};

async function assertCategory(model: ModelName, data: Record<string, unknown>, companyId: string) {
  const field = categoryFieldByModel[model];
  const type = categoryTypeByModel[model];
  if (!field || !type) return;
  const value = data[field];
  if (typeof value !== "string" || !value) return;
  const category = await prisma.category.findUnique({
    where: { name_type_companyId: { name: value, type, companyId } },
  });
  if (!category) throw new HttpError(400, `Unknown ${field}: "${value}"`);
  if (!category.isActive) throw new HttpError(400, `Category "${value}" is inactive`);
}

const searchableFields: Record<ModelName, string[]> = {
  revenue: ["notes"],
  expense: ["notes"],
  purchase: ["vendorName", "category", "notes"],
  tax: ["taxType", "notes"],
};

/** Builds the tenant-isolated `where` clause for list queries. */
function buildWhere(model: ModelName, query: Record<string, unknown>, scope: TenantScope) {
  const where: Record<string, unknown> = {};

  // Tenant isolation: lock to the caller's company (platform admin may target one).
  if (!scope.isPlatformAdmin) where.companyId = scope.companyId;
  else if (scope.companyId) where.companyId = scope.companyId;

  // Store scoping: explicit store filter (must be allowed) or restrict to allowed stores.
  if (scope.storeId) {
    if (!scope.isPlatformAdmin && !scope.allowedStoreIds.includes(scope.storeId)) {
      throw new HttpError(403, "You do not have access to this store");
    }
    where.storeId = scope.storeId;
  } else if (!scope.isPlatformAdmin) {
    where.storeId = { in: scope.allowedStoreIds };
  }

  const hasDateFilter = typeof query.from === "string" || typeof query.to === "string";
  if (hasDateFilter) {
    const { from, to } = getDateRange(query);
    where.date = { gte: from, lte: to };
  }

  const search = typeof query.search === "string" ? query.search : undefined;
  if (search) {
    where.OR = searchableFields[model].map((field) => ({
      [field]: { contains: search, mode: "insensitive" },
    }));
  }

  return where;
}

/** Verifies a store belongs to the company and the caller can write to it. */
async function assertWritableStore(scope: TenantScope, storeId: string, companyId: string) {
  if (!storeId) throw new HttpError(400, "storeId is required");
  if (!scope.isPlatformAdmin && !scope.allowedStoreIds.includes(storeId)) {
    throw new HttpError(403, "You do not have access to this store");
  }
  const store = await prisma.store.findUnique({ where: { id: storeId } });
  if (!store || store.companyId !== companyId) {
    throw new HttpError(400, "Store does not belong to your company");
  }
}

export function createEntryService<TCreate extends object>(model: ModelName) {
  const client = prisma[model] as any;
  return {
    async list(query: Record<string, unknown>, scope: TenantScope) {
      const page = Number(query.page ?? 1);
      const pageSize = Number(query.pageSize ?? 10);
      const sortBy = typeof query.sortBy === "string" ? query.sortBy : "date";
      const sortOrder = query.sortOrder === "asc" ? "asc" : "desc";
      const where = buildWhere(model, query, scope);
      const [items, total] = await Promise.all([
        client.findMany({
          where,
          orderBy: { [sortBy]: sortOrder },
          skip: (page - 1) * pageSize,
          take: pageSize,
          include: {
            creator: { select: { id: true, name: true, email: true } },
            store: { select: { id: true, name: true } },
          },
        }),
        client.count({ where }),
      ]);
      return {
        items,
        meta: { page, pageSize, total, pageCount: Math.ceil(total / pageSize) },
      };
    },

    async create(data: TCreate & { storeId: string }, userId: string, scope: TenantScope) {
      const companyId = scope.companyId;
      await assertWritableStore(scope, data.storeId, companyId);
      await assertCategory(model, data as Record<string, unknown>, companyId);
      return client.create({ data: { ...data, companyId, createdBy: userId } });
    },

    async update(id: string, data: Partial<TCreate>, scope: TenantScope) {
      const existing = await client.findUnique({ where: { id } });
      if (!existing) throw new HttpError(404, "Record not found");
      if (!scope.isPlatformAdmin && existing.companyId !== scope.companyId) {
        throw new HttpError(403, "You cannot modify this record");
      }
      await assertCategory(model, data as Record<string, unknown>, existing.companyId);
      const nextStoreId = (data as Record<string, unknown>).storeId as string | undefined;
      if (nextStoreId) await assertWritableStore(scope, nextStoreId, existing.companyId);
      return client.update({ where: { id }, data });
    },

    async remove(id: string, scope: TenantScope) {
      const existing = await client.findUnique({ where: { id } });
      if (!existing) throw new HttpError(404, "Record not found");
      if (!scope.isPlatformAdmin && existing.companyId !== scope.companyId) {
        throw new HttpError(403, "You cannot delete this record");
      }
      await client.delete({ where: { id } });
    },
  };
}
