import "./firebase";
import { getApp } from "firebase/app";
import { getFunctions, httpsCallable } from "firebase/functions";
const functions = getFunctions(getApp(), "europe-west1");
export type FeeProposal = { id: string; previousFee: number | null; proposedFee: number; reason: string; proposedBy: string; status: "pending" | "approved" | "declined" };
export async function proposeFee(orderId: string, amount: number, reason: string) {
  await httpsCallable(functions, "proposeDeliveryFee")({ orderId, amount, reason });
}
export async function respondFee(orderId: string, proposalId: string, accept: boolean) {
  await httpsCallable(functions, "respondToDeliveryFee")({ orderId, proposalId, accept });
}
