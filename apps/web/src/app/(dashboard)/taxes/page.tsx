"use client";

import { EntryPage } from "@/components/entries/entry-page";
import { taxTypes } from "@/lib/constants";

export default function TaxesPage() {
  return (
    <EntryPage
      title="Tax Management"
      endpoint="/taxes"
      primaryLabel="Tax Type"
      primaryOptions={taxTypes}
      columns={[{ key: "taxType", label: "Tax Type" }]}
      mapValues={(v) => ({
        taxType: v.primary,
        amount: v.amount,
        paymentMethod: v.paymentMethod,
        date: v.date,
        notes: v.notes,
        storeId: v.storeId,
      })}
    />
  );
}
