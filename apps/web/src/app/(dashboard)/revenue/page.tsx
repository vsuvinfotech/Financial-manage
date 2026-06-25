"use client";

import { EntryPage } from "@/components/entries/entry-page";
import { useCategoryNames } from "@/lib/use-categories";

export default function RevenuePage() {
  const categories = useCategoryNames("REVENUE");
  return (
    <EntryPage
      title="Revenue Management"
      endpoint="/revenues"
      primaryLabel="Category"
      primaryOptions={categories}
      columns={[{ key: "category", label: "Category" }]}
      mapValues={(v) => ({ category: v.primary, amount: v.amount, paymentMethod: v.paymentMethod, date: v.date, notes: v.notes })}
    />
  );
}
