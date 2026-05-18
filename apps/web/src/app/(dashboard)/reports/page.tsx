"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { api, downloadReport } from "@/lib/api";
import { currency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Report = { totalRevenue: number; totalExpenses: number; totalPurchases: number; cashTotal: number; cardTotal: number; netProfit: number };

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
      <div>
        <h1 className="text-2xl font-semibold">Financial Reports</h1>
        <p className="text-sm text-muted-foreground">Daily, weekly, monthly, and custom financial summaries.</p>
      </div>
      <div className="flex flex-wrap gap-3">
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="daily">Daily</SelectItem>
            <SelectItem value="weekly">Weekly</SelectItem>
            <SelectItem value="monthly">Monthly</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={() => exportFile(`/reports/export/pdf?period=${period}`, "financial-report.pdf")}><Download className="h-4 w-4" />PDF</Button>
        <Button variant="outline" onClick={() => exportFile(`/reports/export/excel?period=${period}`, "financial-report.xlsx")}><Download className="h-4 w-4" />Excel</Button>
      </div>
      <Card>
        <CardHeader><CardTitle>Profit/Loss Report</CardTitle></CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map(([key, value]) => <div key={key} className="rounded-md border p-4"><p className="text-sm text-muted-foreground">{key}</p><p className="text-xl font-semibold">{currency(Number(value))}</p></div>)}
        </CardContent>
      </Card>
    </div>
  );
}
