"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FileSpreadsheet, FileText, Store, CalendarDays } from "lucide-react";
import { startOfMonth, format } from "date-fns";
import { toast } from "sonner";
import { api, downloadReport } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import { useStores } from "@/lib/use-stores";
import { currency, cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardAccent, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/dashboard/page-header";

type Report = { totalRevenue: number; totalExpenses: number; totalPurchases: number; totalTax: number; cashTotal: number; cardTotal: number; netProfit: number };

type CompanyReport = { id: string; name: string; slug: string; isActive: boolean; createdAt: string; updatedAt: string; _count: { stores: number; users: number }; summary: Report };

type DetailedRow = { date: string; revenue: number; expenses: number; purchases: number; taxes: number };

type StoreRow = { id: string; name: string; totalRevenue: number; totalExpenses: number; totalPurchases: number; totalTax: number; cashTotal: number; cardTotal: number; netProfit: number };

const reportColors: Record<string, string> = {
  totalRevenue: "from-emerald-500 to-teal-500",
  totalExpenses: "from-rose-500 to-pink-500",
  totalPurchases: "from-amber-500 to-orange-500",
  totalTax: "from-cyan-500 to-teal-500",
  cashTotal: "from-sky-500 to-blue-500",
  cardTotal: "from-violet-500 to-purple-500",
  netProfit: "from-indigo-500 to-fuchsia-500",
};

const reportLabels: Record<string, string> = {
  totalRevenue: "Total Revenue",
  totalExpenses: "Total Expenses",
  totalPurchases: "Total Purchases",
  totalTax: "Total Taxes",
  cashTotal: "Cash Total",
  cardTotal: "Card Total",
  netProfit: "Net Profit",
};

export default function ReportsPage() {
  const user = useAuthStore((state) => state.user);
  const activeStoreId = useAuthStore((state) => state.activeStoreId);
  const isPlatformAdmin = user?.role === "PLATFORM_ADMIN";
  const { stores, activeStore, isAllStores } = useStores();
  const [period, setPeriod] = useState("daily");
  const today = format(new Date(), "yyyy-MM-dd");
  const [detailedFrom, setDetailedFrom] = useState(format(startOfMonth(new Date()), "yyyy-MM-dd"));
  const [detailedTo, setDetailedTo] = useState(today);
  const [detailedStoreId, setDetailedStoreId] = useState<"all" | string>(activeStoreId ?? "all");
  const storeQuery = activeStoreId && activeStoreId !== "all" ? `&storeId=${activeStoreId}` : "";
  const report = useQuery({ queryKey: ["report", period, activeStoreId], queryFn: () => api<Report>(`/reports/profit-loss?period=${period}${storeQuery}`), enabled: !isPlatformAdmin });
  const companyReport = useQuery({ queryKey: ["report-companies", period], queryFn: () => api<{ companies: CompanyReport[] }>(`/reports/companies?period=${period}`), enabled: isPlatformAdmin });
  const detailedStoreFilter = detailedStoreId !== "all" ? `&storeId=${detailedStoreId}` : "";
  const detailedReport = useQuery({
    queryKey: ["report-detailed", detailedFrom, detailedTo, detailedStoreId],
    queryFn: () => api<DetailedRow[]>(`/reports/detailed?from=${detailedFrom}&to=${detailedTo}${detailedStoreFilter}`),
    enabled: !isPlatformAdmin,
  });
  const storeReport = useQuery({
    queryKey: ["report-by-store", detailedFrom, detailedTo],
    queryFn: () => api<StoreRow[]>(`/reports/by-store?from=${detailedFrom}&to=${detailedTo}`),
    enabled: !isPlatformAdmin,
  });
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
        title={isPlatformAdmin ? "Platform Reports" : "Financial Reports"}
        description={isPlatformAdmin ? "Per-company financial summaries across the platform." : "Daily, weekly, monthly, and custom financial summaries."}
      >
        {!isPlatformAdmin && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-medium backdrop-blur">
            <Store className="h-3.5 w-3.5" />
            {isAllStores ? "All Stores" : activeStore?.name ?? "No store"}
          </span>
        )}
      </PageHeader>
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
            <Button variant="outline" className="gap-2 border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700" onClick={() => exportFile(`/reports/export/pdf?period=${period}${storeQuery}`, "financial-report.pdf")}><FileText className="h-4 w-4" />PDF</Button>
            <Button variant="outline" className="gap-2 border-emerald-200 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700" onClick={() => exportFile(`/reports/export/excel?period=${period}${storeQuery}`, "financial-report.xlsx")}><FileSpreadsheet className="h-4 w-4" />Excel</Button>
          </div>
        </CardContent>
      </Card>
      {isPlatformAdmin ? (
        <Card className="overflow-hidden border-0 shadow-md">
          <CardAccent className="from-amber-500 via-orange-500 to-rose-500" />
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Company Reports</CardTitle>
            <p className="text-sm text-muted-foreground">Financial breakdown for every company.</p>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Stores</TableHead>
                  <TableHead>Users</TableHead>
                  <TableHead>Revenue</TableHead>
                  <TableHead>Expenses</TableHead>
                  <TableHead>Purchases</TableHead>
                  <TableHead>Taxes</TableHead>
                  <TableHead>Net Profit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(companyReport.data?.companies ?? []).map((company) => (
                  <TableRow key={company.id}>
                    <TableCell className="font-medium">{company.name}</TableCell>
                    <TableCell>{company._count.stores}</TableCell>
                    <TableCell>{company._count.users}</TableCell>
                    <TableCell>{currency(company.summary.totalRevenue)}</TableCell>
                    <TableCell>{currency(company.summary.totalExpenses)}</TableCell>
                    <TableCell>{currency(company.summary.totalPurchases)}</TableCell>
                    <TableCell>{currency(company.summary.totalTax)}</TableCell>
                    <TableCell>{currency(company.summary.netProfit)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <>
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
          <Card className="overflow-hidden border-0 shadow-md">
            <CardAccent className="from-sky-500 via-blue-500 to-indigo-500" />
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Detailed Day-wise Report</CardTitle>
              <p className="text-sm text-muted-foreground">Daily revenue, expenses, purchases, and taxes. Filter by date range and store.</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 rounded-lg border bg-muted/50 px-3 py-2">
                  <CalendarDays className="h-4 w-4 text-primary/70" />
                  <Input
                    type="date"
                    className="w-[150px] border-0 bg-transparent p-0 focus-visible:ring-0"
                    value={detailedFrom}
                    max={detailedTo}
                    onChange={(e) => setDetailedFrom(e.target.value)}
                  />
                  <span className="text-sm text-muted-foreground">to</span>
                  <Input
                    type="date"
                    className="w-[150px] border-0 bg-transparent p-0 focus-visible:ring-0"
                    value={detailedTo}
                    min={detailedFrom}
                    max={today}
                    onChange={(e) => setDetailedTo(e.target.value)}
                  />
                </div>
                <Select value={detailedStoreId} onValueChange={(id) => setDetailedStoreId(id)}>
                  <SelectTrigger className="w-44">
                    <SelectValue placeholder="Select store" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Stores</SelectItem>
                    {stores.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="outline" className="gap-2 border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700" onClick={() => exportFile(`/reports/detailed/export/pdf?from=${detailedFrom}&to=${detailedTo}${detailedStoreFilter}`, "detailed-report.pdf")}><FileText className="h-4 w-4" />PDF</Button>
                <Button variant="outline" className="gap-2 border-emerald-200 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700" onClick={() => exportFile(`/reports/detailed/export/excel?from=${detailedFrom}&to=${detailedTo}${detailedStoreFilter}`, "detailed-report.xlsx")}><FileSpreadsheet className="h-4 w-4" />Excel</Button>
              </div>
              {(() => {
                const data = detailedReport.data ?? [];
                const totals = data.reduce(
                  (acc, row) => ({
                    revenue: acc.revenue + row.revenue,
                    expenses: acc.expenses + row.expenses,
                    purchases: acc.purchases + row.purchases,
                    taxes: acc.taxes + row.taxes,
                  }),
                  { revenue: 0, expenses: 0, purchases: 0, taxes: 0 }
                );
                return (
                  <>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      <div className="relative overflow-hidden rounded-xl border p-4">
                        <div className={cn("absolute left-0 top-0 h-full w-1 bg-gradient-to-b", reportColors.totalRevenue)} />
                        <p className="text-sm text-muted-foreground">Revenue</p>
                        <p className="mt-1 text-xl font-bold text-foreground">{currency(totals.revenue)}</p>
                      </div>
                      <div className="relative overflow-hidden rounded-xl border p-4">
                        <div className={cn("absolute left-0 top-0 h-full w-1 bg-gradient-to-b", reportColors.totalExpenses)} />
                        <p className="text-sm text-muted-foreground">Expenses</p>
                        <p className="mt-1 text-xl font-bold text-foreground">{currency(totals.expenses)}</p>
                      </div>
                      <div className="relative overflow-hidden rounded-xl border p-4">
                        <div className={cn("absolute left-0 top-0 h-full w-1 bg-gradient-to-b", reportColors.totalPurchases)} />
                        <p className="text-sm text-muted-foreground">Purchases</p>
                        <p className="mt-1 text-xl font-bold text-foreground">{currency(totals.purchases)}</p>
                      </div>
                      <div className="relative overflow-hidden rounded-xl border p-4">
                        <div className={cn("absolute left-0 top-0 h-full w-1 bg-gradient-to-b", reportColors.totalTax)} />
                        <p className="text-sm text-muted-foreground">Taxes</p>
                        <p className="mt-1 text-xl font-bold text-foreground">{currency(totals.taxes)}</p>
                      </div>
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Revenue</TableHead>
                          <TableHead>Expenses</TableHead>
                          <TableHead>Purchases</TableHead>
                          <TableHead>Taxes</TableHead>
                          <TableHead>Net</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.map((row) => (
                          <TableRow key={row.date}>
                            <TableCell className="font-medium">{new Date(row.date).toLocaleDateString()}</TableCell>
                            <TableCell>{currency(row.revenue)}</TableCell>
                            <TableCell>{currency(row.expenses)}</TableCell>
                            <TableCell>{currency(row.purchases)}</TableCell>
                            <TableCell>{currency(row.taxes)}</TableCell>
                            <TableCell className={cn("font-semibold", row.revenue - row.expenses - row.purchases - row.taxes >= 0 ? "text-emerald-600" : "text-rose-600")}>{currency(row.revenue - row.expenses - row.purchases - row.taxes)}</TableCell>
                          </TableRow>
                        ))}
                        {data.length > 0 && (
                          <TableRow className="bg-muted/50 font-semibold">
                            <TableCell>Total</TableCell>
                            <TableCell>{currency(totals.revenue)}</TableCell>
                            <TableCell>{currency(totals.expenses)}</TableCell>
                            <TableCell>{currency(totals.purchases)}</TableCell>
                            <TableCell>{currency(totals.taxes)}</TableCell>
                            <TableCell className={cn(totals.revenue - totals.expenses - totals.purchases - totals.taxes >= 0 ? "text-emerald-600" : "text-rose-600")}>{currency(totals.revenue - totals.expenses - totals.purchases - totals.taxes)}</TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </>
                );
              })()}
            </CardContent>
          </Card>
          <Card className="overflow-hidden border-0 shadow-md">
            <CardAccent className="from-amber-500 via-orange-500 to-rose-500" />
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Store Comparison</CardTitle>
              <p className="text-sm text-muted-foreground">Total revenue, expenses, purchases, and taxes per store for the selected date range.</p>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Store</TableHead>
                    <TableHead>Revenue</TableHead>
                    <TableHead>Expenses</TableHead>
                    <TableHead>Purchases</TableHead>
                    <TableHead>Taxes</TableHead>
                    <TableHead>Net</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(storeReport.data ?? []).map((store) => (
                    <TableRow key={store.id}>
                      <TableCell className="font-medium">{store.name}</TableCell>
                      <TableCell>{currency(store.totalRevenue)}</TableCell>
                      <TableCell>{currency(store.totalExpenses)}</TableCell>
                      <TableCell>{currency(store.totalPurchases)}</TableCell>
                      <TableCell>{currency(store.totalTax)}</TableCell>
                      <TableCell className={cn("font-semibold", store.netProfit >= 0 ? "text-emerald-600" : "text-rose-600")}>{currency(store.netProfit)}</TableCell>
                    </TableRow>
                  ))}
                  {(storeReport.data ?? []).length > 0 && (
                    <TableRow className="bg-muted/50 font-semibold">
                      <TableCell>Total</TableCell>
                      <TableCell>{currency((storeReport.data ?? []).reduce((sum, s) => sum + s.totalRevenue, 0))}</TableCell>
                      <TableCell>{currency((storeReport.data ?? []).reduce((sum, s) => sum + s.totalExpenses, 0))}</TableCell>
                      <TableCell>{currency((storeReport.data ?? []).reduce((sum, s) => sum + s.totalPurchases, 0))}</TableCell>
                      <TableCell>{currency((storeReport.data ?? []).reduce((sum, s) => sum + s.totalTax, 0))}</TableCell>
                      <TableCell className={cn((storeReport.data ?? []).reduce((sum, s) => sum + s.netProfit, 0) >= 0 ? "text-emerald-600" : "text-rose-600")}>{currency((storeReport.data ?? []).reduce((sum, s) => sum + s.netProfit, 0))}</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
