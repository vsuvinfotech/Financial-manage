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

export const roles = ["SUPERADMIN", "ADMIN", "MANAGER", "EMPLOYEE"] as const;

export type UserRole = (typeof roles)[number];

export const clientPermissions: Record<UserRole, string[]> = {
  SUPERADMIN: ["dashboard", "revenue", "expenses", "purchases", "daily-closing", "reports", "users"],
  ADMIN: ["dashboard", "revenue", "expenses", "purchases", "daily-closing", "reports"],
  MANAGER: ["dashboard", "revenue", "expenses", "purchases", "daily-closing", "reports"],
  EMPLOYEE: ["dashboard", "revenue", "expenses", "purchases"],
};

export const roleRank: Record<UserRole, number> = {
  SUPERADMIN: 4,
  ADMIN: 3,
  MANAGER: 2,
  EMPLOYEE: 1,
};
