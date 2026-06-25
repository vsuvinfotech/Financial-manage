"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowDownUp, CalendarDays, ChevronLeft, ChevronRight, Search, X, Wallet, CreditCard } from "lucide-react";
import { api } from "@/lib/api";
import { currency, cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type Entry = Record<string, string | number | null> & { id: string; amount: number; paymentMethod: string; date: string; notes?: string };
type Paginated = { items: Entry[]; meta: { total: number } };

export function EntryTable({ endpoint, columns }: { endpoint: string; columns: Array<{ key: string; label: string }> }) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  function buildUrl() {
    const params = new URLSearchParams({ page: String(page), sortBy: "date", sortOrder });
    if (search) params.set("search", search);
    if (fromDate) params.set("from", fromDate);
    if (toDate) params.set("to", toDate);
    return `${endpoint}?${params.toString()}`;
  }

  const query = useQuery({
    queryKey: [endpoint, search, page, sortOrder, fromDate, toDate],
    queryFn: () => api<Paginated>(buildUrl()),
  });

  const today = new Date().toISOString().slice(0, 10);

  function clearDateRange() {
    setFromDate("");
    setToDate("");
    setPage(1);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-sm flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-3 h-4 w-4 text-primary/70" />
          <Input className="pl-9" placeholder="Search entries" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 rounded-lg border bg-muted/50 px-3 py-2">
            <CalendarDays className="h-4 w-4 text-primary/70 shrink-0" />
            <Input
              type="date"
              className="w-[150px] border-0 bg-transparent p-0 focus-visible:ring-0"
              value={fromDate}
              max={toDate || today}
              onChange={(e) => { setFromDate(e.target.value); setPage(1); }}
            />
            <span className="text-muted-foreground text-sm">to</span>
            <Input
              type="date"
              className="w-[150px] border-0 bg-transparent p-0 focus-visible:ring-0"
              value={toDate}
              min={fromDate || undefined}
              max={today}
              onChange={(e) => { setToDate(e.target.value); setPage(1); }}
            />
            {(fromDate || toDate) && (
              <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full" onClick={clearDateRange} title="Clear date filter">
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column) => <TableHead key={column.key}>{column.label}</TableHead>)}
            <TableHead>Amount</TableHead>
            <TableHead>Payment</TableHead>
            <TableHead>
              <button className="inline-flex items-center gap-2 text-primary hover:text-primary/80" onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}>
                Date <ArrowDownUp className="h-3.5 w-3.5" />
              </button>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(query.data?.items ?? []).map((item) => (
            <TableRow key={item.id}>
              {columns.map((column) => <TableCell key={column.key}>{String(item[column.key] ?? "")}</TableCell>)}
              <TableCell className="font-semibold text-emerald-600">{currency(item.amount)}</TableCell>
              <TableCell>
                <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium", item.paymentMethod === "CASH" ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300" : "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300")}>
                  {item.paymentMethod === "CASH" ? <Wallet className="h-3 w-3" /> : <CreditCard className="h-3 w-3" />}
                  {item.paymentMethod}
                </span>
              </TableCell>
              <TableCell>{new Date(item.date).toLocaleDateString()}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="flex items-center justify-between gap-3 rounded-lg border bg-muted/40 px-4 py-3">
        <p className="text-xs font-medium text-muted-foreground">{query.data?.meta.total ?? 0} entries</p>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="rounded-full" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={page === 1}><ChevronLeft className="h-4 w-4" /></Button>
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">{page}</span>
          <Button variant="outline" size="icon" className="rounded-full" onClick={() => setPage((value) => value + 1)} disabled={(query.data?.items.length ?? 0) < 10}><ChevronRight className="h-4 w-4" /></Button>
        </div>
      </div>
    </div>
  );
}
