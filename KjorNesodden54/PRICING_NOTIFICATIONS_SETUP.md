# Delivery fees and order notifications

This work depends on PR #20 and PR #21. Unknown delivery fees remain `null`; the assigned worker or an admin may propose a fee. The customer accepts or declines it under Mine bestillinger. Pickup and delivery updates are blocked by Firestore rules while a fee is unknown, pending or declined. Each proposal and response is stored in `orderGroups/{orderId}/feeHistory`. All fee proposals require approval, including lower fees.

Automatic customer inbox events cover confirmation, cancellation, worker assignment, pickup, on-the-way, delivery and a new fee proposal. An inbox item is created once per Firestore event. It opens the relevant order; native push opens the same screen. This does not implement scheduled or custom broadcasts.

## Before release

1. The server implementation uses Firebase Cloud Functions 2nd gen. Deploying it requires a Firebase Blaze (pay-as-you-go) billing account; fees can apply. Do not enable billing without the project owner's decision.
2. In this directory run `npm ci`, then `npm --prefix functions ci`. Select the correct Firebase project and deploy the functions and Firestore rules (`firebase deploy --only functions,firestore:rules`). Do not deploy to production before testing in a separate Firebase project. The functions run in `europe-west1`.
3. Configure Apple APNs and Android FCM credentials for this EAS project and make fresh native app builds. The customer must grant notification permission. Android remote push is not supported in Expo Go; test with a development build or release build.
4. Update customer and worker apps together. Older customers cannot respond to a fee proposal, and unknown/pending fees will block pickup until approved in the new app.
5. Verify a declined fee, unknown fee, higher fee, and accepted fee; confirm the customer sees the correct order and the worker is blocked until approval. Check notification delivery on real iOS and Android devices.

The inbox event uses a deterministic ID to avoid duplicate entries on retries. Expo push is best effort and asynchronous: Firebase/Expo retries or ambiguous network failures can produce duplicate push alerts, while an Expo ticket does not prove delivery. Errors are logged; Expo receipts and invalid-token cleanup are not yet implemented. Existing price quotes and amounts at original checkout are still calculated client-side by the prior app, so the backend does not yet independently verify menu or delivery prices. The existing Telegram-first submission flow may send an order even if subsequent Firestore saving fails; contact the customer before retrying that case.

Run `npm run test:worker:rules` for Firestore permissions. To test callable handler logic against the Firestore emulator after installing function dependencies, run `GCLOUD_PROJECT=demo-kjor npx firebase-tools emulators:exec --only firestore --project demo-kjor 'node --test tests/fees-functions-emulator.test.cjs'`. These tests do not replace an end-to-end deployed push test.
