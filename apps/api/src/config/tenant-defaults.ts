import type { PrismaClient } from "@prisma/client";

/** Permission sets for the default per-tenant roles. */
export const ownerPermissions = [
  "dashboard:view", "dashboard:read",
  "revenue:view", "revenue:read", "revenue:write",
  "expenses:view", "expenses:read", "expenses:write",
  "purchases:view", "purchases:read", "purchases:write",
  "taxes:view", "taxes:read", "taxes:write",
  "dailyClosing:view", "dailyClosing:read", "dailyClosing:write",
  "reports:view", "reports:read", "reports:write",
  "users:view", "users:read", "users:write",
  "roles:view", "roles:read", "roles:write",
  "categories:view", "categories:read", "categories:write",
  "stores:view", "stores:read", "stores:write",
];

export const adminPermissions = [
  "dashboard:view", "dashboard:read",
  "revenue:view", "revenue:read", "revenue:write",
  "expenses:view", "expenses:read", "expenses:write",
  "purchases:view", "purchases:read", "purchases:write",
  "taxes:view", "taxes:read", "taxes:write",
  "dailyClosing:view", "dailyClosing:read", "dailyClosing:write",
  "reports:view", "reports:read",
  "users:view", "users:read", "users:write",
  "categories:view", "categories:read", "categories:write",
  "stores:view", "stores:read",
];

export const managerPermissions = [
  "dashboard:view", "dashboard:read",
  "revenue:view", "revenue:read", "revenue:write",
  "expenses:view", "expenses:read", "expenses:write",
  "purchases:view", "purchases:read", "purchases:write",
  "taxes:view", "taxes:read", "taxes:write",
  "dailyClosing:view", "dailyClosing:read", "dailyClosing:write",
  "reports:view", "reports:read",
  "categories:read",
  "stores:view", "stores:read",
];

export const employeePermissions = [
  "dashboard:view",
  "revenue:view", "revenue:read", "revenue:write",
  "expenses:view", "expenses:read", "expenses:write",
  "purchases:view", "purchases:read", "purchases:write",
  "taxes:view", "taxes:read", "taxes:write",
  "categories:read",
];

export const platformAdminPermissions = [
  ...ownerPermissions,
  "companies:view", "companies:read", "companies:write",
];

export const defaultTenantRoles: Array<{ name: string; permissions: string[] }> = [
  { name: "OWNER", permissions: ownerPermissions },
  { name: "ADMIN", permissions: adminPermissions },
  { name: "MANAGER", permissions: managerPermissions },
  { name: "EMPLOYEE", permissions: employeePermissions },
];

export const defaultCategories: Array<{ name: string; type: "REVENUE" | "EXPENSE" }> = [
  { name: "TOBACCO", type: "REVENUE" },
  { name: "GROCERY", type: "REVENUE" },
  { name: "NON_TAXABLE", type: "REVENUE" },
  { name: "FOOD_STAMP", type: "REVENUE" },
  { name: "LIQUOR", type: "REVENUE" },
  { name: "WINE", type: "REVENUE" },
  { name: "NON_ALCOHOLIC", type: "REVENUE" },
  { name: "UTILITY", type: "EXPENSE" },
  { name: "STORE_EXPENSE", type: "EXPENSE" },
  { name: "ATM_COMMISSION", type: "EXPENSE" },
  { name: "BAR_COMMISSION", type: "EXPENSE" },
  { name: "MISC_EXPENSE", type: "EXPENSE" },
];

/**
 * Provisions the default roles and categories for a freshly created tenant.
 * Idempotent: safe to run multiple times.
 */
export async function seedTenantDefaults(prisma: PrismaClient, companyId: string) {
  for (const role of defaultTenantRoles) {
    await prisma.role.upsert({
      where: { name_companyId: { name: role.name, companyId } },
      update: { permissions: role.permissions },
      create: { name: role.name, permissions: role.permissions, companyId },
    });
  }
  for (const c of defaultCategories) {
    await prisma.category.upsert({
      where: { name_type_companyId: { name: c.name, type: c.type, companyId } },
      update: { isActive: true },
      create: { name: c.name, type: c.type, isActive: true, companyId },
    });
  }
}
