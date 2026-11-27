import type { CustomerOrder } from "./customerOrders";

export function getHistoryDriver(order: CustomerOrder, names: ReadonlyMap<string, string>) {
  if (!order.assignedWorkerId) return "Ingen registrert sjåfør";
  return names.get(order.assignedWorkerId) || "Ukjent sjåfør";
}

const normalize = (value: string) => value.toLocaleLowerCase("nb-NO").normalize("NFC");

export function matchesAdminOrder(order: CustomerOrder, driver: string, search: string) {
  const fields = [
    order.id, order.customerName, order.customerPhone, order.address, driver,
    order.cancellation?.name, order.cancellation?.reason,
    order.cancellation?.role === "admin" ? "admin administrator" : order.cancellation ? "sjåfør" : undefined,
    ...(order.items ?? []).flatMap(item => [item.restaurantName, item.productName, item.customRequest]),
  ].filter(Boolean).join(" ");
  const haystack = normalize(fields);
  return normalize(search.trim()).split(/\s+/).filter(Boolean).every(term =>
    haystack.includes(term.replace(/^#/, "")));
}

export function groupOrdersByDriver(orders: CustomerOrder[], names: ReadonlyMap<string, string>) {
  const groups = new Map<string | null, { id: string | null; name: string; orders: CustomerOrder[] }>();
  for (const order of orders) {
    const id = order.assignedWorkerId || null;
    let group = groups.get(id);
    if (!group) {
      group = { id, name: getHistoryDriver(order, names), orders: [] };
      groups.set(id, group);
    }
    group.orders.push(order);
  }
  return [...groups.values()].sort((a, b) =>
    Number(a.id === null) - Number(b.id === null) || a.name.localeCompare(b.name, "nb-NO"));
}
