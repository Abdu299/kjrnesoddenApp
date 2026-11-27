# Free-plan fee approvals and notifications

Fee proposals and decisions use Firestore transactions and security rules, with an audit record. No Firebase Cloud Functions or Blaze billing upgrade is required for this code. Firestore Spark and Cloudflare Workers Free have usage limits. Customers must accept proposed delivery fees before pickup.

Order updates from the updated app write the customer inbox notification in the same Firestore transaction. A scheduled Cloudflare Worker checks pending notifications once a minute, requests the customer's Expo push tokens, and sends a push. Old app versions that write status changes without the notification transaction do not produce the new inbox events. In-app inbox events are retained when phone permission is denied.

## Setup before release

1. Test in a non-production Firebase project first. Deploy the updated rules and collection-group index using the `firebase.json` in this directory (`firebase deploy --only firestore:rules,firestore:indexes`).
2. Configure an IAM service account for the correct Firebase/Google Cloud project with Firestore access and create its JSON key. Treat that key as highly sensitive. Never commit it to GitHub or send it in chat.
3. In `push-worker/wrangler.toml`, set `GOOGLE_PROJECT_ID` to the test project ID. Authenticate Wrangler with the intended Cloudflare account. From `push-worker`, add the *contents* of the JSON key as a secret using `npx wrangler secret put GOOGLE_SERVICE_ACCOUNT_JSON < /path/to/key.json`; keep the key file private. Deploy with `npx wrangler deploy`. For production, repeat with the production project and a separate key.
4. Configure APNs and FCM push credentials in Expo/EAS, create new native builds and grant notification permission. Android remote push requires a development or release build, not Expo Go.
5. Test fee proposal, acceptance, rejection, assignment, every delivery stage, inbox, and push on real devices. Check Cloudflare logs and the Firestore `pushState` field if delivery fails. No scheduled/custom marketing broadcasts are included.

The Worker uses Firestore collection-group queries and processes up to 100 notices per run. Cron timing and provider delivery can be delayed; a crash after Expo accepts a message can cause a duplicate when the notice is retried. Expo ticket acceptance does not guarantee device delivery. Invalid-token cleanup and receipt processing are not implemented. The JSON service account key has project access: restrict its IAM permissions, protect the Cloudflare account and revoke/rotate the key if exposed.

Original checkout totals are still client-calculated, and Telegram is still sent before the Firestore order batch; see the previous order tracking setup notes. The new worker is not deployed or tested with live credentials yet.
