"use client";

import { EntryPage } from "@/components/entries/entry-page";
import { useCategoryNames } from "@/lib/use-categories";

export default function PurchasesPage() {
  const categories = useCategoryNames("REVENUE");
  return (
    <EntryPage
      title="Purchase Management"
      endpoint="/purchases"
      primaryLabel="Vendor Name"
      secondaryLabel="Category"
      secondaryOptions={categories}
      columns={[
        { key: "vendorName", label: "Vendor" },
        { key: "category", label: "Category" },
      ]}
      mapValues={(v) => ({
        vendorName: v.primary,
        category: v.secondary,
        amount: v.amount,
        paymentMethod: v.paymentMethod,
        date: v.date,
        notes: v.notes,
        storeId: v.storeId,
      })}
    />
  );
}
