"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type UserRole = "PLATFORM_ADMIN" | "OWNER" | "ADMIN" | "MANAGER" | "EMPLOYEE";

export type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  permissions: string[];
  companyId: string | null;
  companySlug: string | null;
  allowedStoreIds: string[];
};

export type ActiveStoreId = string | "all" | undefined;

type AuthState = {
  accessToken?: string;
  refreshToken?: string;
  user?: User;
  activeStoreId?: ActiveStoreId;
  setSession: (session: { accessToken?: string; refreshToken?: string; user: User }) => void;
  setActiveStoreId: (id: ActiveStoreId) => void;
  logout: () => void;
};

function defaultActiveStoreId(user: User): ActiveStoreId {
  if (user.role === "OWNER" || user.role === "ADMIN") return "all";
  return user.allowedStoreIds[0];
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      setSession: (session) =>
        set({
          accessToken: session.accessToken,
          refreshToken: session.refreshToken,
          user: session.user,
          // Owners/admins see all stores by default; others default to their first allowed store.
          activeStoreId: defaultActiveStoreId(session.user),
        }),
      setActiveStoreId: (id) => set({ activeStoreId: id }),
      logout: () => set({ accessToken: undefined, refreshToken: undefined, user: undefined, activeStoreId: undefined }),
    }),
    { name: "sfm-auth" },
  ),
);
