"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { Banknote, ClipboardCheck, CreditCard, Receipt, ShoppingBag, TrendingUp, WalletCards } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardAccent, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SummaryCard } from "@/components/dashboard/summary-card";
import { PageHeader } from "@/components/dashboard/page-header";
import { api } from "@/lib/api";

type Summary = { totalRevenue: number; totalExpenses: number; totalPurchases: number; cashTotal: number; cardTotal: number; netProfit: number };

export default function DailyClosingPage() {
  const summary = useQuery({ queryKey: ["closing-summary"], queryFn: () => api<Summary>("/dashboard/summary") });
  const closeDay = useMutation({
    mutationFn: () => api("/daily-closing", { method: "POST", body: JSON.stringify({ date: new Date().toISOString() }) }),
    onSuccess: () => toast.success("Day closed"),
  });
  const data = summary.data ?? { totalRevenue: 0, totalExpenses: 0, totalPurchases: 0, cashTotal: 0, cardTotal: 0, netProfit: 0 };
  return (
    <div className="space-y-6">
      <PageHeader
        title="Daily Closing"
        description="Revenue - expenses - purchases determines net profit."
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <SummaryCard title="Total Revenue" value={data.totalRevenue} icon={TrendingUp} accent="emerald" />
        <SummaryCard title="Total Expenses" value={data.totalExpenses} icon={Receipt} accent="rose" />
        <SummaryCard title="Total Purchases" value={data.totalPurchases} icon={ShoppingBag} accent="amber" />
        <SummaryCard title="Cash Total" value={data.cashTotal} icon={Banknote} accent="sky" />
        <SummaryCard title="Card Total" value={data.cardTotal} icon={CreditCard} accent="violet" />
        <SummaryCard title="Net Profit" value={data.netProfit} icon={WalletCards} accent="indigo" />
      </div>
      <Card className="overflow-hidden border-0 shadow-md">
        <CardAccent className="from-rose-500 via-pink-500 to-fuchsia-500" />
        <CardHeader>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow-md">
            <ClipboardCheck className="h-5 w-5" />
          </div>
          <CardTitle className="text-lg font-semibold">Finalize Today</CardTitle>
          <p className="text-sm text-muted-foreground">Click below to close the current day and lock the books.</p>
        </CardHeader>
        <CardContent>
          <Button variant="gradient" onClick={() => closeDay.mutate()} disabled={closeDay.isPending}>Close Day</Button>
        </CardContent>
      </Card>
    </div>
  );
}
