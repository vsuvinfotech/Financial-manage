"use client";

import { EntryPage } from "@/components/entries/entry-page";
import { expenseTypes } from "@/lib/constants";

export default function ExpensesPage() {
  return (
    <EntryPage
      title="Expense Management"
      endpoint="/expenses"
      primaryLabel="Expense Type"
      primaryOptions={expenseTypes}
      columns={[{ key: "expenseType", label: "Expense Type" }]}
      mapValues={(v) => ({ expenseType: v.primary, amount: v.amount, paymentMethod: v.paymentMethod, date: v.date, notes: v.notes })}
    />
  );
}
