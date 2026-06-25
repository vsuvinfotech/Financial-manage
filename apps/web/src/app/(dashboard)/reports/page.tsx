"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FileSpreadsheet, FileText } from "lucide-react";
import { toast } from "sonner";
import { api, downloadReport } from "@/lib/api";
import { currency, cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardAccent, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/dashboard/page-header";

type Report = { totalRevenue: number; totalExpenses: number; totalPurchases: number; cashTotal: number; cardTotal: number; netProfit: number };

const reportColors: Record<string, string> = {
  totalRevenue: "from-emerald-500 to-teal-500",
  totalExpenses: "from-rose-500 to-pink-500",
  totalPurchases: "from-amber-500 to-orange-500",
  cashTotal: "from-sky-500 to-blue-500",
  cardTotal: "from-violet-500 to-purple-500",
  netProfit: "from-indigo-500 to-fuchsia-500",
};

const reportLabels: Record<string, string> = {
  totalRevenue: "Total Revenue",
  totalExpenses: "Total Expenses",
  totalPurchases: "Total Purchases",
  cashTotal: "Cash Total",
  cardTotal: "Card Total",
  netProfit: "Net Profit",
};

export default function ReportsPage() {
  const [period, setPeriod] = useState("daily");
  const report = useQuery({ queryKey: ["report", period], queryFn: () => api<Report>(`/reports/profit-loss?period=${period}`) });
  const rows = Object.entries(report.data ?? {});
  async function exportFile(path: string, filename: string) {
    try {
      await downloadReport(path, filename);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Export failed");
    }
  }
  return (
    <div className="space-y-6">
      <PageHeader
        title="Financial Reports"
        description="Daily, weekly, monthly, and custom financial summaries."
      />
      <Card className="overflow-hidden border-0 shadow-md">
        <CardAccent />
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Report Settings</CardTitle>
          <p className="text-sm text-muted-foreground">Choose a period and export your summary.</p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-3">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className="gap-2 border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700" onClick={() => exportFile(`/reports/export/pdf?period=${period}`, "financial-report.pdf")}><FileText className="h-4 w-4" />PDF</Button>
            <Button variant="outline" className="gap-2 border-emerald-200 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700" onClick={() => exportFile(`/reports/export/excel?period=${period}`, "financial-report.xlsx")}><FileSpreadsheet className="h-4 w-4" />Excel</Button>
          </div>
        </CardContent>
      </Card>
      <Card className="overflow-hidden border-0 shadow-md">
        <CardAccent className="from-emerald-500 via-violet-500 to-rose-500" />
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Profit/Loss Report</CardTitle>
          <p className="text-sm text-muted-foreground">Financial breakdown for the selected period.</p>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map(([key, value]) => (
            <div key={key} className="relative overflow-hidden rounded-xl border p-4">
              <div className={cn("absolute left-0 top-0 h-full w-1 bg-gradient-to-b", reportColors[key] ?? "from-indigo-500 to-purple-500")} />
              <p className="text-sm text-muted-foreground">{reportLabels[key] ?? key}</p>
              <p className="mt-1 text-xl font-bold text-foreground">{currency(Number(value))}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
