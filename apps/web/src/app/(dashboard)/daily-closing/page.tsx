"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { ClipboardCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SummaryCard } from "@/components/dashboard/summary-card";
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
      <div>
        <h1 className="text-2xl font-semibold">Daily Closing</h1>
        <p className="text-sm text-muted-foreground">Revenue - expenses - purchases determines net profit.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <SummaryCard title="Total Revenue" value={data.totalRevenue} icon={ClipboardCheck} />
        <SummaryCard title="Total Expenses" value={data.totalExpenses} icon={ClipboardCheck} />
        <SummaryCard title="Total Purchases" value={data.totalPurchases} icon={ClipboardCheck} />
        <SummaryCard title="Cash Total" value={data.cashTotal} icon={ClipboardCheck} />
        <SummaryCard title="Card Total" value={data.cardTotal} icon={ClipboardCheck} />
        <SummaryCard title="Net Profit" value={data.netProfit} icon={ClipboardCheck} />
      </div>
      <Card>
        <CardHeader><CardTitle>Finalize Today</CardTitle></CardHeader>
        <CardContent><Button onClick={() => closeDay.mutate()} disabled={closeDay.isPending}>Close Day</Button></CardContent>
      </Card>
    </div>
  );
}
