"use client";

import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Card, CardAccent, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EntryForm, EntryFormValues } from "@/components/forms/entry-form";
import { EntryTable } from "@/components/tables/entry-table";
import { PageHeader } from "@/components/dashboard/page-header";
import { api } from "@/lib/api";

export function EntryPage({
  title,
  endpoint,
  primaryLabel,
  primaryOptions,
  secondaryLabel,
  secondaryOptions,
  columns,
  mapValues,
}: {
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
    await api(endpoint, {
      method: "POST",
      body: JSON.stringify(mapValues(values)),
    });
    await queryClient.invalidateQueries({ queryKey: [endpoint] });
    toast.success("Entry saved");
  }
  return (
    <div className="space-y-6">
      <PageHeader
        title={title}
        description="Create, search, filter, and review financial entries."
      />
      <Card className="overflow-hidden border-0 shadow-md">
        <CardAccent className="from-emerald-500 via-teal-500 to-cyan-500" />
        <CardHeader>
          <CardTitle className="text-lg font-semibold">New Entry</CardTitle>
          <p className="text-sm text-muted-foreground">Fill in the details below to record a new transaction.</p>
        </CardHeader>
        <CardContent>
          <EntryForm
            primaryLabel={primaryLabel}
            secondaryLabel={secondaryLabel}
            primaryOptions={primaryOptions}
            secondaryOptions={secondaryOptions}
            onSubmit={onSubmit}
          />
        </CardContent>
      </Card>
      <Card className="overflow-hidden border-0 shadow-md">
        <CardAccent className="from-indigo-500 via-purple-500 to-pink-500" />
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Entries</CardTitle>
          <p className="text-sm text-muted-foreground">Browse, search, and filter recorded entries.</p>
        </CardHeader>
        <CardContent>
          <EntryTable endpoint={endpoint} columns={columns} />
        </CardContent>
      </Card>
    </div>
  );
}
