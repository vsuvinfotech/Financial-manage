"use client";

import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EntryForm, EntryFormValues } from "@/components/forms/entry-form";
import { EntryTable } from "@/components/tables/entry-table";
import { api } from "@/lib/api";

export function EntryPage({ title, endpoint, primaryLabel, primaryOptions, secondaryLabel, secondaryOptions, columns, mapValues }: {
  title: string;
  endpoint: string;
  primaryLabel: string;
  primaryOptions?: readonly string[];
  secondaryLabel?: string;
  secondaryOptions?: readonly string[];
  columns: Array<{ key: string; label: string }>;
  mapValues: (values: EntryFormValues) => Record<string, unknown>;
}) {
  const queryClient = useQueryClient();
  async function onSubmit(values: EntryFormValues) {
    await api(endpoint, { method: "POST", body: JSON.stringify(mapValues(values)) });
    await queryClient.invalidateQueries({ queryKey: [endpoint] });
    toast.success("Entry saved");
  }
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="text-sm text-muted-foreground">Create, search, filter, and review financial entries.</p>
      </div>
      <Card>
        <CardHeader><CardTitle>New Entry</CardTitle></CardHeader>
        <CardContent><EntryForm primaryLabel={primaryLabel} secondaryLabel={secondaryLabel} primaryOptions={primaryOptions} secondaryOptions={secondaryOptions} onSubmit={onSubmit} /></CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Entries</CardTitle></CardHeader>
        <CardContent><EntryTable endpoint={endpoint} columns={columns} /></CardContent>
      </Card>
    </div>
  );
}
