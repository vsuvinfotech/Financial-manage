export type AppRole = string;
export type PermissionAction = "view" | "read" | "write";
export type PermissionResource =
  | "dashboard"
  | "revenue"
  | "expenses"
  | "purchases"
  | "dailyClosing"
  | "reports"
  | "users"
  | "roles";

export type Permission = `${PermissionResource}:${PermissionAction}`;

export const roleHierarchy: Record<string, number> = {
  SUPERADMIN: 4,
  ADMIN: 3,
  MANAGER: 2,
  EMPLOYEE: 1,
};

export function canManageRole(actorRole: AppRole, targetRole: AppRole) {
  if (actorRole === "SUPERADMIN") return true;
  const actorRank = roleHierarchy[actorRole] || 0;
  const targetRank = roleHierarchy[targetRole] || 0;
  return actorRank > targetRank && targetRole !== "SUPERADMIN";
}
