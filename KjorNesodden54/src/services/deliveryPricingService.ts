import { doc, getDoc, getDocFromServer, onSnapshot, runTransaction, serverTimestamp } from "firebase/firestore";
import { auth, db } from "./firebase";
import { defaultDeliveryPricing, parseDeliveryPricing, type DeliveryPricing } from "./deliveryPricing";

const pricingReference = () => doc(db, "settings", "deliveryPricing");

export function subscribeToDeliveryPricing(
  onChange: (pricing: DeliveryPricing, saved: boolean) => void,
  onError: (error: Error) => void
) {
  return onSnapshot(pricingReference(), (snapshot) => {
    try {
      onChange(snapshot.exists() ? parseDeliveryPricing(snapshot.data()) : defaultDeliveryPricing, snapshot.exists());
    } catch (error) { onError(error as Error); }
  }, onError);
}

// Checkout must reach the server. Never silently replace a failed read with a cheaper default.
export async function getDeliveryPricingFromServer(): Promise<DeliveryPricing> {
  try {
    const snapshot = await getDocFromServer(pricingReference());
    return snapshot.exists() ? parseDeliveryPricing(snapshot.data()) : defaultDeliveryPricing;
  } catch {
    throw new Error("Kunne ikke kontrollere leveringsprisene. Prøv igjen når du er på nett.");
  }
}

export async function saveDeliveryPricing(pricing: DeliveryPricing, expectedRevision: number) {
  const user = auth.currentUser;
  if (!user) throw new Error("Du må være logget inn som administrator.");
  const profile = await getDoc(doc(db, "users", user.uid));
  if (!profile.exists() || profile.data().role !== "admin") throw new Error("Du har ikke admintilgang.");
  const validated = parseDeliveryPricing({ ...pricing, revision: expectedRevision + 1 });
  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(pricingReference());
    const current = snapshot.exists() ? parseDeliveryPricing(snapshot.data()) : defaultDeliveryPricing;
    if (current.revision !== expectedRevision) {
      throw new Error("Prisene er endret av en annen administrator. Last inn prisene på nytt før du lagrer.");
    }
    transaction.set(pricingReference(), {
      ...validated, updatedAt: serverTimestamp(), updatedBy: user.uid,
    });
  });
}
