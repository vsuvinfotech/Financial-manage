"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { startOfDay, endOfDay, startOfMonth, endOfMonth, subDays } from "date-fns";
import { Banknote, CreditCard, Landmark, Receipt, ShoppingBag, Store, TrendingUp, Users, WalletCards } from "lucide-react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import { useStores } from "@/lib/use-stores";
import { SummaryCard } from "@/components/dashboard/summary-card";
import { PaymentSplitChart, RevenueExpenseChart } from "@/components/dashboard/charts";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardAccent, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/dashboard/page-header";
import { currency } from "@/lib/utils";

type Summary = { totalRevenue: number; totalExpenses: number; totalPurchases: number; totalTax: number; cashTotal: number; cardTotal: number; netProfit: number };
type Company = { id: string; name: string; slug: string; isActive: boolean; createdAt: string; updatedAt: string; _count: { stores: number; users: number } };

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user);
  const isPlatformAdmin = user?.role === "PLATFORM_ADMIN";
  const [filter, setFilter] = useState<"daily" | "weekly" | "monthly">("daily");

  const dateRange = useMemo(() => {
    const today = new Date();
    if (filter === "weekly") {
      return { from: startOfDay(subDays(today, 6)).toISOString(), to: endOfDay(today).toISOString() };
    }
    if (filter === "monthly") {
      return { from: startOfMonth(today).toISOString(), to: endOfMonth(today).toISOString() };
    }
    return { from: startOfDay(today).toISOString(), to: endOfDay(today).toISOString() };
  }, [filter]);

  const activeStoreId = useAuthStore((state) => state.activeStoreId);
  const isStoreScoped = activeStoreId && activeStoreId !== "all";
  const storeQuery = isStoreScoped ? `&storeId=${activeStoreId}` : "";
  const queryParams = `?from=${dateRange.from}&to=${dateRange.to}${storeQuery}`;
  const { activeStore, isAllStores } = useStores();

  const summary = useQuery({ queryKey: ["summary", filter, activeStoreId], queryFn: () => api<Summary>(`/dashboard/summary${queryParams}`), enabled: !isPlatformAdmin });
  const chart = useQuery({ queryKey: ["revenue-expense", filter, activeStoreId], queryFn: () => api<Array<{ date: string; revenue: number; expenses: number }>>(`/dashboard/charts/revenue-expense${queryParams}`), enabled: !isPlatformAdmin });
  const split = useQuery({ queryKey: ["payment-split", filter, activeStoreId], queryFn: () => api<Array<{ name: string; value: number }>>(`/dashboard/charts/payment-methods${queryParams}`), enabled: !isPlatformAdmin });
  const companies = useQuery({ queryKey: ["companies"], queryFn: () => api<Company[]>("/companies"), enabled: isPlatformAdmin });

  if (isPlatformAdmin) {
    if (companies.isLoading) return <Skeleton className="h-96 w-full" />;
    return (
      <div className="space-y-6">
        <PageHeader title="Platform Dashboard" description="Overview of all companies on the platform." />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard title="Companies" value={(companies.data ?? []).length} icon={Landmark} accent="amber" />
          <SummaryCard title="Total Stores" value={(companies.data ?? []).reduce((sum, c) => sum + c._count.stores, 0)} icon={Store} accent="cyan" />
          <SummaryCard title="Total Users" value={(companies.data ?? []).reduce((sum, c) => sum + c._count.users, 0)} icon={Users} accent="violet" />
          <SummaryCard title="Active Companies" value={(companies.data ?? []).filter((c) => c.isActive).length} icon={TrendingUp} accent="emerald" />
        </div>
        <Card className="overflow-hidden border-0 shadow-md">
          <CardAccent className="from-amber-500 via-orange-500 to-rose-500" />
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Companies</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Stores</TableHead>
                  <TableHead>Users</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(companies.data ?? []).map((company) => (
                  <TableRow key={company.id}>
                    <TableCell className="font-medium">{company.name}</TableCell>
                    <TableCell>{company.slug}</TableCell>
                    <TableCell>{company._count.stores}</TableCell>
                    <TableCell>{company._count.users}</TableCell>
                    <TableCell>{company.isActive ? "Active" : "Inactive"}</TableCell>
                    <TableCell>{new Date(company.createdAt).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (summary.isLoading) return <Skeleton className="h-96 w-full" />;
  const data = summary.data ?? { totalRevenue: 0, totalExpenses: 0, totalPurchases: 0, totalTax: 0, cashTotal: 0, cardTotal: 0, netProfit: 0 };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Financial Dashboard"
        description="Revenue, expenses, purchases, and closing balances at a glance."
      >
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-medium backdrop-blur">
          <Store className="h-3.5 w-3.5" />
          {isAllStores ? "All Stores" : activeStore?.name ?? "No store"}
        </span>
        <Select value={filter} onValueChange={(val: any) => setFilter(val)}>
          <SelectTrigger className="w-[200px] border-white/30 bg-white/15 text-white backdrop-blur hover:bg-white/25 focus:ring-white/40">
            <SelectValue placeholder="Select filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="daily">Today (Daily)</SelectItem>
            <SelectItem value="weekly">Last 7 Days (Weekly)</SelectItem>
            <SelectItem value="monthly">This Month (Monthly)</SelectItem>
          </SelectContent>
        </Select>
      </PageHeader>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-7">
        <SummaryCard title="Revenue" value={data.totalRevenue} icon={TrendingUp} accent="emerald" />
        <SummaryCard title="Expenses" value={data.totalExpenses} icon={Receipt} accent="rose" />
        <SummaryCard title="Purchases" value={data.totalPurchases} icon={ShoppingBag} accent="amber" />
        <SummaryCard title="Taxes" value={data.totalTax} icon={Landmark} accent="cyan" />
        <SummaryCard title="Cash Balance" value={data.cashTotal} icon={Banknote} accent="sky" />
        <SummaryCard title="Card Balance" value={data.cardTotal} icon={CreditCard} accent="violet" />
        <SummaryCard title="Net Profit" value={data.netProfit} icon={WalletCards} accent="indigo" />
      </div>
      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <RevenueExpenseChart data={chart.data ?? []} />
        <PaymentSplitChart data={split.data ?? []} />
      </div>
    </div>
  );
}
