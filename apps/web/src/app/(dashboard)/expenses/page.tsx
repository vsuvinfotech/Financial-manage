"use client";

import { EntryPage } from "@/components/entries/entry-page";
import { useCategoryNames } from "@/lib/use-categories";

export default function ExpensesPage() {
  const categories = useCategoryNames("EXPENSE");
  return (
    <EntryPage
      title="Expense Management"
      endpoint="/expenses"
      primaryLabel="Expense Type"
      primaryOptions={categories}
      columns={[{ key: "expenseType", label: "Expense Type" }]}
      mapValues={(v) => ({ expenseType: v.primary, amount: v.amount, paymentMethod: v.paymentMethod, date: v.date, notes: v.notes, storeId: v.storeId })}
    />
  );
}
