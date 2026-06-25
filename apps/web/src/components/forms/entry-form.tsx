"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { paymentMethods } from "@/lib/constants";

const schema = z.object({
  primary: z.string().min(1),
  secondary: z.string().optional(),
  amount: z.coerce.number().positive(),
  paymentMethod: z.enum(paymentMethods),
  date: z.string().min(1),
  notes: z.string().optional(),
});

export type EntryFormValues = z.infer<typeof schema>;

export function EntryForm({ primaryLabel, secondaryLabel, primaryOptions, secondaryOptions, onSubmit }: { primaryLabel: string; secondaryLabel?: string; primaryOptions?: readonly string[]; secondaryOptions?: readonly string[]; onSubmit: (values: EntryFormValues) => Promise<void> }) {
  const form = useForm<EntryFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { paymentMethod: "CASH", date: new Date().toISOString().slice(0, 10) },
  });
  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 md:grid-cols-2">
      <div className="space-y-2">
        <Label>{primaryLabel}</Label>
        {primaryOptions ? (
          <Select onValueChange={(value) => form.setValue("primary", value)}>
            <SelectTrigger><SelectValue placeholder={primaryLabel} /></SelectTrigger>
            <SelectContent>{primaryOptions.map((item) => <SelectItem key={item} value={item}>{item.replaceAll("_", " ")}</SelectItem>)}</SelectContent>
          </Select>
        ) : <Input {...form.register("primary")} />}
      </div>
      {secondaryLabel && (
        <div className="space-y-2">
          <Label>{secondaryLabel}</Label>
          {secondaryOptions ? (
            <Select onValueChange={(value) => form.setValue("secondary", value)}>
              <SelectTrigger><SelectValue placeholder={secondaryLabel} /></SelectTrigger>
              <SelectContent>{secondaryOptions.map((item) => <SelectItem key={item} value={item}>{item.replaceAll("_", " ")}</SelectItem>)}</SelectContent>
            </Select>
          ) : <Input {...form.register("secondary")} />}
        </div>
      )}
      <div className="space-y-2"><Label>Amount</Label><Input type="number" step="0.01" {...form.register("amount")} /></div>
      <div className="space-y-2">
        <Label>Payment Method</Label>
        <Select defaultValue="CASH" onValueChange={(value) => form.setValue("paymentMethod", value as "CASH" | "CARD")}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>{paymentMethods.map((item) => <SelectItem key={item} value={item}>{item === "CARD" ? "Credit/Debit" : "Cash"}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="space-y-2"><Label>Date</Label><Input type="date" {...form.register("date")} /></div>
      <div className="space-y-2 md:col-span-2"><Label>Notes</Label><Input {...form.register("notes")} /></div>
      <div className="md:col-span-2"><Button disabled={form.formState.isSubmitting}>Save Entry</Button></div>
    </form>
  );
}
