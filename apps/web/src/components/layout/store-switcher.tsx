"use client";

import { Store } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useStores } from "@/lib/use-stores";
import { useAuthStore } from "@/stores/auth-store";

export function StoreSwitcher() {
  const user = useAuthStore((state) => state.user);
  const { stores, activeStoreId, isAllStores, setActiveStoreId } = useStores();

  if (user?.role === "PLATFORM_ADMIN" || stores.length === 0) return null;

  // Show "All Stores" whenever there is more than one store.
  const allowAllStores = stores.length > 1;
  const currentLabel = isAllStores ? "All Stores" : stores.find((s) => s.id === activeStoreId)?.name ?? "Select store";

  return (
    <>
      {/* Desktop */}
      <div className="hidden items-center gap-2 md:flex">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Store className="h-4 w-4" />
        </span>
        <Select
          value={activeStoreId}
          onValueChange={(id) => setActiveStoreId(id === "all" ? "all" : id)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select store">{currentLabel}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {allowAllStores && <SelectItem value="all">All Stores</SelectItem>}
            {stores.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {/* Mobile */}
      <div className="flex items-center gap-2 md:hidden">
        <Select
          value={activeStoreId}
          onValueChange={(id) => setActiveStoreId(id === "all" ? "all" : id)}
        >
          <SelectTrigger className="w-[140px] text-xs">
            <span className="flex items-center gap-1.5">
              <Store className="h-3.5 w-3.5 text-primary" />
              <SelectValue placeholder="Store">{currentLabel}</SelectValue>
            </span>
          </SelectTrigger>
          <SelectContent>
            {allowAllStores && <SelectItem value="all">All Stores</SelectItem>}
            {stores.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </>
  );
}
