import type { CustomerOrder } from "./customerOrders";
export type DashboardOrder = CustomerOrder & { statusUpdatedAt?: { toDate: () => Date } | null };
export type RevenueSummary = { revenue: number; completed: number; unknownFees: number; missingDates: number };
export function osloYearMonth(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Oslo", year: "numeric", month: "2-digit" }).formatToParts(date);
  return `${parts.find(p => p.type === "year")?.value}-${parts.find(p => p.type === "month")?.value}`;
}
export function previousMonth(now: Date): string {
  const [year, month] = osloYearMonth(now).split("-").map(Number);
  return month === 1 ? `${year - 1}-12` : `${year}-${String(month - 1).padStart(2, "0")}`;
}
export function deliveredDate(order: DashboardOrder): Date | null {
  try { const date = (order.completedAt ?? order.statusUpdatedAt)?.toDate(); return date && Number.isFinite(date.getTime()) ? date : null; } catch { return null; }
}
export function summarize(orders: DashboardOrder[], month?: string): RevenueSummary {
  let revenue = 0, completed = 0, unknownFees = 0, missingDates = 0;
  for (const order of orders) {
    if (order.status !== "delivered") continue;
    const date = deliveredDate(order);
    if (month && !date) { missingDates++; continue; }
    if (month && osloYearMonth(date!) !== month) continue;
    completed++;
    if (typeof order.deliveryFee === "number" && Number.isFinite(order.deliveryFee) && order.deliveryFee >= 0) revenue += order.deliveryFee;
    else unknownFees++;
  }
  return { revenue, completed, unknownFees, missingDates };
}
