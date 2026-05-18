"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowDownUp, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { api } from "@/lib/api";
import { currency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type Entry = Record<string, string | number | null> & { id: string; amount: number; paymentMethod: string; date: string; notes?: string };
type Paginated = { items: Entry[]; meta: { total: number } };

export function EntryTable({ endpoint, columns }: { endpoint: string; columns: Array<{ key: string; label: string }> }) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const query = useQuery({
    queryKey: [endpoint, search, page, sortOrder],
    queryFn: () => api<Paginated>(`${endpoint}?search=${encodeURIComponent(search)}&page=${page}&sortBy=date&sortOrder=${sortOrder}`),
  });
  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="Search entries" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} />
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column) => <TableHead key={column.key}>{column.label}</TableHead>)}
            <TableHead>Amount</TableHead>
            <TableHead>Payment</TableHead>
            <TableHead>
              <button className="inline-flex items-center gap-2" onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}>
                Date <ArrowDownUp className="h-3.5 w-3.5" />
              </button>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(query.data?.items ?? []).map((item) => (
            <TableRow key={item.id}>
              {columns.map((column) => <TableCell key={column.key}>{String(item[column.key] ?? "")}</TableCell>)}
              <TableCell>{currency(item.amount)}</TableCell>
              <TableCell>{item.paymentMethod}</TableCell>
              <TableCell>{new Date(item.date).toLocaleDateString()}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">{query.data?.meta.total ?? 0} entries</p>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={page === 1}><ChevronLeft className="h-4 w-4" /></Button>
          <span className="text-sm">{page}</span>
          <Button variant="outline" size="icon" onClick={() => setPage((value) => value + 1)} disabled={(query.data?.items.length ?? 0) < 10}><ChevronRight className="h-4 w-4" /></Button>
        </div>
      </div>
    </div>
  );
}
