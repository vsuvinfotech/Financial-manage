"use client";

import { EntryPage } from "@/components/entries/entry-page";

export default function PurchasesPage() {
  return (
    <EntryPage
      title="Purchase Management"
      endpoint="/purchases"
      primaryLabel="Vendor Name"
      secondaryLabel="Category"
      columns={[{ key: "vendorName", label: "Vendor" }, { key: "category", label: "Category" }]}
      mapValues={(v) => ({ vendorName: v.primary, category: v.secondary, amount: v.amount, paymentMethod: v.paymentMethod, date: v.date, notes: v.notes })}
    />
  );
}
