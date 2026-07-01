export const revenueCategories = [
  "TOBACCO",
  "GROCERY",
  "NON_TAXABLE",
  "FOOD_STAMP",
  "LIQUOR",
  "WINE",
  "NON_ALCOHOLIC",
] as const;

export const expenseTypes = [
  "UTILITY",
  "STORE_EXPENSE",
  "ATM_COMMISSION",
  "BAR_COMMISSION",
  "MISC_EXPENSE",
] as const;

export const paymentMethods = ["CASH", "CARD"] as const;

export const roles = ["PLATFORM_ADMIN", "OWNER", "ADMIN", "MANAGER", "EMPLOYEE"] as const;

export type UserRole = (typeof roles)[number];

export const clientPermissions: Record<UserRole, string[]> = {
  PLATFORM_ADMIN: ["dashboard", "revenue", "expenses", "purchases", "daily-closing", "reports", "users", "roles", "categories", "taxes", "stores", "companies"],
  OWNER: ["dashboard", "revenue", "expenses", "purchases", "daily-closing", "reports", "users", "roles", "categories", "taxes", "stores"],
  ADMIN: ["dashboard", "revenue", "expenses", "purchases", "daily-closing", "reports", "users", "roles", "categories", "taxes", "stores"],
  MANAGER: ["dashboard", "revenue", "expenses", "purchases", "daily-closing", "reports", "taxes", "stores"],
  EMPLOYEE: ["dashboard", "revenue", "expenses", "purchases", "taxes"],
};

export const roleRank: Record<UserRole, number> = {
  PLATFORM_ADMIN: 5,
  OWNER: 4,
  ADMIN: 3,
  MANAGER: 2,
  EMPLOYEE: 1,
};

export const roleBadgeColors: Record<UserRole, string> = {
  PLATFORM_ADMIN: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  OWNER: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
  ADMIN: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
  MANAGER: "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
  EMPLOYEE: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
};

export const taxTypes = ["GST", "VAT", "SALES_TAX", "SERVICE_TAX", "OTHER"] as const;
