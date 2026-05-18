"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type UserRole = "SUPERADMIN" | "ADMIN" | "MANAGER" | "EMPLOYEE";

type AuthState = {
  accessToken?: string;
  refreshToken?: string;
  user?: { id: string; name: string; email: string; role: string; permissions: string[] };
  setSession: (session: Pick<AuthState, "accessToken" | "refreshToken" | "user">) => void;
  logout: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      setSession: (session) => set(session),
      logout: () => set({ accessToken: undefined, refreshToken: undefined, user: undefined }),
    }),
    { name: "sfm-auth" },
  ),
);
