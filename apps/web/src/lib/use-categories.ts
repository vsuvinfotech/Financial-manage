import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export type CategoryType = "REVENUE" | "EXPENSE" | "PURCHASE";
export type Category = { id: string; name: string; type: CategoryType; isActive: boolean };

export function useCategories(type?: CategoryType, activeOnly = true) {
  return useQuery({
    queryKey: ["categories", { type: type ?? "ALL", activeOnly }],
    queryFn: () => {
      const params = new URLSearchParams();
      if (type) params.set("type", type);
      if (activeOnly) params.set("isActive", "true");
      const qs = params.toString();
      return api<Category[]>(`/categories${qs ? `?${qs}` : ""}`);
    },
  });
}

export function useCategoryNames(type: CategoryType): readonly string[] {
  const { data } = useCategories(type, true);
  return (data ?? []).map((c) => c.name);
}
