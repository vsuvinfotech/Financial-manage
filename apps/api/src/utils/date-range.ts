import { endOfDay, endOfMonth, parseISO, startOfDay, startOfMonth, subDays } from "date-fns";

export function getDateRange(query: Record<string, unknown>) {
  const today = new Date();
  const from = typeof query.from === "string" ? startOfDay(parseISO(query.from)) : startOfDay(today);
  const to = typeof query.to === "string" ? endOfDay(parseISO(query.to)) : endOfDay(today);
  return { from, to };
}

export function getReportRange(period?: string, date?: string) {
  const base = date ? parseISO(date) : new Date();
  if (period === "weekly") return { from: startOfDay(subDays(base, 6)), to: endOfDay(base) };
  if (period === "monthly") return { from: startOfMonth(base), to: endOfMonth(base) };
  return { from: startOfDay(base), to: endOfDay(base) };
}
