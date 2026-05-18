"use client";

import { EntryPage } from "@/components/entries/entry-page";
import { revenueCategories } from "@/lib/constants";

export default function RevenuePage() {
  return (
    <EntryPage
      title="Revenue Management"
      endpoint="/revenues"
      primaryLabel="Category"
      primaryOptions={revenueCategories}
      columns={[{ key: "category", label: "Category" }]}
      mapValues={(v) => ({ category: v.primary, amount: v.amount, paymentMethod: v.paymentMethod, date: v.date, notes: v.notes })}
    />
  );
}
