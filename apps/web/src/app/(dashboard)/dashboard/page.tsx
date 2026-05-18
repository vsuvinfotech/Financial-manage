"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { startOfDay, endOfDay, startOfMonth, endOfMonth, subDays } from "date-fns";
import { Banknote, CreditCard, Receipt, ShoppingBag, TrendingUp, WalletCards } from "lucide-react";
import { api } from "@/lib/api";
import { SummaryCard } from "@/components/dashboard/summary-card";
import { PaymentSplitChart, RevenueExpenseChart } from "@/components/dashboard/charts";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Summary = { totalRevenue: number; totalExpenses: number; totalPurchases: number; cashTotal: number; cardTotal: number; netProfit: number };

export default function DashboardPage() {
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

  const queryParams = `?from=${dateRange.from}&to=${dateRange.to}`;

  const summary = useQuery({ queryKey: ["summary", filter], queryFn: () => api<Summary>(`/dashboard/summary${queryParams}`) });
  const chart = useQuery({ queryKey: ["revenue-expense", filter], queryFn: () => api<Array<{ date: string; revenue: number; expenses: number }>>(`/dashboard/charts/revenue-expense${queryParams}`) });
  const split = useQuery({ queryKey: ["payment-split", filter], queryFn: () => api<Array<{ name: string; value: number }>>(`/dashboard/charts/payment-methods${queryParams}`) });

  if (summary.isLoading) return <Skeleton className="h-96 w-full" />;
  const data = summary.data ?? { totalRevenue: 0, totalExpenses: 0, totalPurchases: 0, cashTotal: 0, cardTotal: 0, netProfit: 0 };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Financial Dashboard</h1>
          <p className="text-sm text-muted-foreground">Revenue, expenses, purchases, and closing balances.</p>
        </div>
        <Select value={filter} onValueChange={(val: any) => setFilter(val)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="daily">Today (Daily)</SelectItem>
            <SelectItem value="weekly">Last 7 Days (Weekly)</SelectItem>
            <SelectItem value="monthly">This Month (Monthly)</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <SummaryCard title="Revenue" value={data.totalRevenue} icon={TrendingUp} />
        <SummaryCard title="Expenses" value={data.totalExpenses} icon={Receipt} />
        <SummaryCard title="Purchases" value={data.totalPurchases} icon={ShoppingBag} />
        <SummaryCard title="Cash Balance" value={data.cashTotal} icon={Banknote} />
        <SummaryCard title="Card Balance" value={data.cardTotal} icon={CreditCard} />
        <SummaryCard title="Net Profit" value={data.netProfit} icon={WalletCards} />
      </div>
      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <RevenueExpenseChart data={chart.data ?? []} />
        <PaymentSplitChart data={split.data ?? []} />
      </div>
    </div>
  );
}
