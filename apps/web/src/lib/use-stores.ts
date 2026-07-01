import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuthStore, type ActiveStoreId } from "@/stores/auth-store";

export type Store = { id: string; name: string; companyId: string; createdAt: string; updatedAt: string };

export function useStores() {
  const user = useAuthStore((state) => state.user);
  const activeStoreId = useAuthStore((state) => state.activeStoreId);
  const setActiveStoreId = useAuthStore((state) => state.setActiveStoreId);

  const query = useQuery({
    queryKey: ["stores"],
    queryFn: () => api<Store[]>("/stores"),
    enabled: Boolean(user?.companyId) || user?.role === "PLATFORM_ADMIN",
  });

  const stores = query.data ?? [];
  const isAllStores = activeStoreId === "all";
  const activeStore = isAllStores ? undefined : stores.find((s) => s.id === activeStoreId);

  return {
    stores,
    isLoading: query.isLoading,
    activeStoreId,
    activeStore,
    isAllStores,
    setActiveStoreId: (id: ActiveStoreId) => setActiveStoreId(id),
  };
}
