"use client";

import { create } from "zustand";

type SessionExpiredState = {
  open: boolean;
  show: () => void;
  hide: () => void;
};

export const useSessionExpiredStore = create<SessionExpiredState>((set) => ({
  open: false,
  show: () => set({ open: true }),
  hide: () => set({ open: false }),
}));
