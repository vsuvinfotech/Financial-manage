"use client";

import { useEffect, useMemo } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { paymentMethods } from "@/lib/constants";
import { useStores } from "@/lib/use-stores";
import { Wallet, Receipt, Tag, Calendar, FileText, DollarSign, Store } from "lucide-react";

const schema = z.object({
  primary: z.string().min(1),
  secondary: z.string().optional(),
  amount: z.coerce.number().positive(),
  paymentMethod: z.enum(paymentMethods),
  date: z.string().min(1),
  notes: z.string().optional(),
  storeId: z.string().min(1),
});

export type EntryFormValues = z.infer<typeof schema>;

export function EntryForm({
  primaryLabel,
  secondaryLabel,
  primaryOptions,
  secondaryOptions,
  onSubmit,
}: {
  primaryLabel: string;
  secondaryLabel?: string;
  primaryOptions?: readonly string[];
  secondaryOptions?: readonly string[];
  onSubmit: (values: EntryFormValues) => Promise<void>;
}) {
  const { stores, activeStore } = useStores();
  const defaultStoreId = useMemo(() => {
    if (activeStore) return activeStore.id;
    return stores[0]?.id;
  }, [activeStore, stores]);

  const form = useForm<EntryFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      paymentMethod: "CASH",
      date: new Date().toISOString().slice(0, 10),
      storeId: defaultStoreId ?? "",
    },
  });

  useEffect(() => {
    if (defaultStoreId) form.setValue("storeId", defaultStoreId);
  }, [defaultStoreId, form]);
  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="grid gap-5 md:grid-cols-2"
    >
      <div className="space-y-2">
        <Label className="inline-flex items-center gap-2 text-sm font-semibold">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300">
            <Tag className="h-3.5 w-3.5" />
          </span>
          {primaryLabel}
        </Label>
        {primaryOptions ? (
          <Select onValueChange={(value) => form.setValue("primary", value)}>
            <SelectTrigger>
              <SelectValue placeholder={primaryLabel} />
            </SelectTrigger>
            <SelectContent>
              {primaryOptions.map((item) => (
                <SelectItem key={item} value={item}>
                  {item.replaceAll("_", " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Input {...form.register("primary")} />
        )}
      </div>
      {secondaryLabel && (
        <div className="space-y-2">
          <Label className="inline-flex items-center gap-2 text-sm font-semibold">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-violet-100 text-violet-600 dark:bg-violet-950 dark:text-violet-300">
              <Receipt className="h-3.5 w-3.5" />
            </span>
            {secondaryLabel}
          </Label>
          {secondaryOptions ? (
            <Select
              onValueChange={(value) => form.setValue("secondary", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder={secondaryLabel} />
              </SelectTrigger>
              <SelectContent>
                {secondaryOptions.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item.replaceAll("_", " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input {...form.register("secondary")} />
          )}
        </div>
      )}
      <div className="space-y-2">
        <Label className="inline-flex items-center gap-2 text-sm font-semibold">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300">
            <DollarSign className="h-3.5 w-3.5" />
          </span>
          Amount
        </Label>
        <Input type="number" step="0.01" {...form.register("amount")} />
      </div>
      <div className="space-y-2">
        <Label className="inline-flex items-center gap-2 text-sm font-semibold">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-300">
            <Wallet className="h-3.5 w-3.5" />
          </span>
          Payment Method
        </Label>
        <Select
          defaultValue="CASH"
          onValueChange={(value) =>
            form.setValue("paymentMethod", value as "CASH" | "CARD")
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {paymentMethods.map((item) => (
              <SelectItem key={item} value={item}>
                {item === "CARD" ? "Credit/Debit" : "Cash"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label className="inline-flex items-center gap-2 text-sm font-semibold">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-sky-100 text-sky-600 dark:bg-sky-950 dark:text-sky-300">
            <Calendar className="h-3.5 w-3.5" />
          </span>
          Date
        </Label>
        <Input
          type="date"
          max={new Date().toISOString().split("T")[0]}
          {...form.register("date")}
        />
      </div>
      <div className="space-y-2">
        <Label className="inline-flex items-center gap-2 text-sm font-semibold">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-orange-100 text-orange-600 dark:bg-orange-950 dark:text-orange-300">
            <Store className="h-3.5 w-3.5" />
          </span>
          Store
        </Label>
        <Select
          value={form.watch("storeId")}
          onValueChange={(value) => form.setValue("storeId", value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select store" />
          </SelectTrigger>
          <SelectContent>
            {stores.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2 md:col-span-2">
        <Label className="inline-flex items-center gap-2 text-sm font-semibold">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            <FileText className="h-3.5 w-3.5" />
          </span>
          Notes
        </Label>
        <Input {...form.register("notes")} />
      </div>
      <div className="md:col-span-2">
        <Button variant="gradient" disabled={form.formState.isSubmitting}>Save Entry</Button>
      </div>
    </form>
  );
}
