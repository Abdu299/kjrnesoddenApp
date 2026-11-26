import { collection, doc, runTransaction, serverTimestamp } from "firebase/firestore";
import { auth, db } from "./firebase";
export type FeeProposal = { id: string; previousFee: number | null; proposedFee: number; reason: string; proposedBy: string; status: "pending" | "approved" | "declined" };
export async function proposeFee(orderId: string, amount: number, reason: string) {
  const user = auth.currentUser; if (!user) throw new Error("Logg inn på nytt.");
  const clean = reason.trim();
  if (!Number.isInteger(amount) || amount < 0 || amount > 10000 || clean.length < 3 || clean.length > 300) throw new Error("Oppgi en gyldig pris og begrunnelse.");
  const orderRef = doc(db, "orderGroups", orderId), historyRef = doc(collection(orderRef, "feeHistory"));
  await runTransaction(db, async transaction => {
    const snapshot = await transaction.get(orderRef);
    if (!snapshot.exists()) throw new Error("Bestillingen finnes ikke.");
    const order = snapshot.data();
    if (["picked_up", "on_the_way", "delivered", "cancelled"].includes(order.status)) throw new Error("Prisen kan ikke endres etter henting.");
    if (order.feeProposal?.status === "pending") throw new Error("Et prisforslag venter allerede på svar.");
    const proposal = { id: historyRef.id, previousFee: order.deliveryFee ?? null, proposedFee: amount, reason: clean, proposedBy: user.uid, status: "pending", proposedAt: serverTimestamp() };
    transaction.update(orderRef, { feeProposal: proposal });
    transaction.set(historyRef, proposal);
    transaction.set(doc(collection(db, "users", order.customerId, "notifications")), { title: "Du har fått et nytt leveringsprisforslag", orderId, createdAt: serverTimestamp(), read: false, pushState: "pending", event: "fee" });
  });
}
export async function respondFee(orderId: string, proposalId: string, accept: boolean) {
  const user = auth.currentUser; if (!user) throw new Error("Logg inn på nytt.");
  const ref = doc(db, "orderGroups", orderId), history = doc(ref, "feeHistory", proposalId);
  await runTransaction(db, async transaction => {
    const [orderSnap, historySnap] = await Promise.all([transaction.get(ref), transaction.get(history)]);
    if (!orderSnap.exists() || !historySnap.exists()) throw new Error("Prisforslaget finnes ikke.");
    const order = orderSnap.data(), proposal = order.feeProposal;
    if (proposal?.id !== proposalId) throw new Error("Prisforslaget er endret.");
    if (proposal.status === (accept ? "approved" : "declined")) return;
    if (order.customerId !== user.uid || proposal.status !== "pending" || ["delivered", "cancelled"].includes(order.status)) throw new Error("Prisforslaget er ikke lenger aktivt.");
    const answer = { ...proposal, status: accept ? "approved" : "declined", respondedAt: serverTimestamp(), respondedBy: user.uid };
    transaction.update(ref, { feeProposal: answer, ...(accept ? { deliveryFee: proposal.proposedFee } : {}) });
    transaction.update(history, { status: answer.status, respondedAt: answer.respondedAt, respondedBy: user.uid });
  });
}
