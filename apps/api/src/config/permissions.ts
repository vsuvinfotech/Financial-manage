export type AppRole = string;
export type PermissionAction = "view" | "read" | "write";
export type PermissionResource =
  | "dashboard"
  | "revenue"
  | "expenses"
  | "purchases"
  | "taxes"
  | "dailyClosing"
  | "reports"
  | "users"
  | "roles"
  | "categories"
  | "companies"
  | "stores";

export type Permission = `${PermissionResource}:${PermissionAction}`;

// Platform-level role operates the whole SaaS and bypasses all tenant checks.
export const PLATFORM_ADMIN = "PLATFORM_ADMIN";

// Tenant role hierarchy (scoped within a single company).
export const roleHierarchy: Record<string, number> = {
  OWNER: 4,
  ADMIN: 3,
  MANAGER: 2,
  EMPLOYEE: 1,
};

export function isPlatformAdmin(role: AppRole) {
  return role === PLATFORM_ADMIN;
}

export function canManageRole(actorRole: AppRole, targetRole: AppRole) {
  if (actorRole === PLATFORM_ADMIN) return true;
  const actorRank = roleHierarchy[actorRole] || 0;
  const targetRank = roleHierarchy[targetRole] || 0;
  return actorRank > targetRank && targetRole !== PLATFORM_ADMIN;
}
