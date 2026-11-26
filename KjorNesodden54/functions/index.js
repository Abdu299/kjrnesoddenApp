const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { onDocumentUpdated, onDocumentCreated } = require('firebase-functions/v2/firestore');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
initializeApp();
const db = getFirestore();
const active = o => !['cancelled', 'delivered'].includes(o.status);
async function profile(transaction, uid) {
  const p = await transaction.get(db.doc(`users/${uid}`));
  if (!p.exists) throw new HttpsError('permission-denied', 'Ingen konto.');
  return p.data();
}
exports.proposeDeliveryFee = onCall({region:'europe-west1'}, async request => {
  const uid = request.auth?.uid; if (!uid) throw new HttpsError('unauthenticated','Logg inn.');
  const { orderId, amount, reason } = request.data || {};
  if (typeof orderId !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(orderId) || !Number.isInteger(amount) || amount < 0 || amount > 10000 || typeof reason !== 'string' || reason.trim().length < 3 || reason.length > 300) throw new HttpsError('invalid-argument','Oppgi gyldig pris og begrunnelse.');
  const ref = db.doc(`orderGroups/${orderId}`); const audit = ref.collection('feeHistory').doc();
  await db.runTransaction(async tx => {
    const [snap, user] = await Promise.all([tx.get(ref), profile(tx, uid)]);
    if (!snap.exists) throw new HttpsError('not-found','Bestillingen finnes ikke.');
    const order = snap.data();
    if (!(user.role === 'admin' || (user.role === 'worker' && user.active === true && order.assignedWorkerId === uid && order.assignmentStatus === 'assigned'))) throw new HttpsError('permission-denied','Ingen tilgang.');
    if (!active(order) || ['picked_up','on_the_way'].includes(order.status)) throw new HttpsError('failed-precondition','Prisen kan ikke endres etter henting.');
    if (order.feeProposal?.status === 'pending') throw new HttpsError('failed-precondition','Et prisforslag venter allerede på svar.');
    const proposal = { id: audit.id, previousFee: order.deliveryFee ?? null, proposedFee: amount, reason: reason.trim(), proposedBy: uid, status: 'pending', proposedAt: FieldValue.serverTimestamp() };
    tx.set(audit, { ...proposal }); tx.update(ref, { feeProposal: proposal });
  });
  return { proposalId: audit.id };
});
exports.respondToDeliveryFee = onCall({region:'europe-west1'}, async request => {
  const uid = request.auth?.uid; if (!uid) throw new HttpsError('unauthenticated','Logg inn.');
  const { orderId, proposalId, accept } = request.data || {};
  if (typeof orderId !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(orderId) || typeof proposalId !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(proposalId) || typeof accept !== 'boolean') throw new HttpsError('invalid-argument','Ugyldig svar.');
  const ref = db.doc(`orderGroups/${orderId}`); const history = ref.collection('feeHistory').doc(proposalId);
  await db.runTransaction(async tx => {
    const [snap, user, historySnap] = await Promise.all([tx.get(ref), profile(tx, uid), tx.get(history)]);
    if (!snap.exists || !historySnap.exists) throw new HttpsError('not-found','Prisforslaget finnes ikke.');
    const order = snap.data(), proposal = order.feeProposal;
    if (user.role !== 'customer' || order.customerId !== uid) throw new HttpsError('permission-denied','Ingen tilgang.');
    if (proposal?.id !== proposalId) throw new HttpsError('failed-precondition','Prisforslaget er endret.');
    if (proposal.status === (accept ? 'approved' : 'declined')) return;
    if (!active(order) || proposal.status !== 'pending') throw new HttpsError('failed-precondition','Prisforslaget er ikke lenger aktivt.');
    const answer = { ...proposal, status: accept ? 'approved' : 'declined', respondedAt: FieldValue.serverTimestamp(), respondedBy: uid };
    tx.update(ref, { feeProposal: answer, ...(accept ? { deliveryFee: proposal.proposedFee } : {}) });
    tx.update(history, { status: answer.status, respondedAt: answer.respondedAt, respondedBy: uid });
  });
  return { success:true };
});
const labels = { confirmed:'Bestillingen er bekreftet', cancelled:'Bestillingen er kansellert', picked_up:'Bestillingen er hentet', on_the_way:'Bestillingen er på vei', delivered:'Bestillingen er levert' };
exports.orderNotifications = onDocumentUpdated({document:'orderGroups/{orderId}',region:'europe-west1',retry:true}, async event => {
  const before = event.data.before.data(), after = event.data.after.data();
  const events = [];
  if (before.status !== after.status && labels[after.status]) events.push(['status', labels[after.status]]);
  if (before.assignedWorkerId !== after.assignedWorkerId && after.assignedWorkerId) events.push(['assigned','En sjåfør har tatt oppdraget']);
  if (before.feeProposal?.id !== after.feeProposal?.id && after.feeProposal?.status === 'pending') events.push(['fee','Du har fått et nytt leveringsprisforslag']);
  for (const [kind, title] of events) {
    const id = `${event.id.replace(/[^A-Za-z0-9_-]/g,'_')}_${kind}`;
    const notification = db.doc(`users/${after.customerId}/notifications/${id}`);
    const created = await db.runTransaction(async tx => {
      const current = await tx.get(notification); if (current.exists) return false;
      tx.create(notification,{title,orderId:event.params.orderId,createdAt:FieldValue.serverTimestamp(),read:false}); return true;
    });
    if (!created) continue;

  }
});

// A separate trigger makes push delivery retryable without duplicating inbox entries.
exports.deliverOrderPush = onDocumentCreated({document:'users/{uid}/notifications/{notificationId}',region:'europe-west1',retry:true}, async event => {
  const notification = event.data.data();
  const tokens = await db.collection(`users/${event.params.uid}/pushTokens`).get();
  const messages = tokens.docs.map(d=>d.data().token).filter(t=>typeof t === 'string' && /^(Expo|Exponent)PushToken\[/.test(t)).map(to=>({to,title:notification.title,body:'Åpne appen for å se bestillingen.',data:{orderId:notification.orderId},sound:'default'}));
  for (let i=0; i<messages.length; i+=100) {
    const res = await fetch('https://exp.host/--/api/v2/push/send',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(messages.slice(i,i+100))});
    if (!res.ok) throw new Error(`Expo push request failed: ${res.status}`);
    const result = await res.json();
    if (!Array.isArray(result.data)) throw new Error('Invalid Expo push response');
    result.data.forEach(item => { if (item.status === 'error') console.error('Expo push ticket failed',item.details?.error || item.message); });
  }
});
