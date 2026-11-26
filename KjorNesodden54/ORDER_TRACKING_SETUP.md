# Delivery locations and orders

Customers select an address in Profile and may set a delivery point on the map. Location permission is optional. The chosen address and point are copied into each new order. If the address cannot be matched to an area, delivery remains an agreed price. Existing orders cannot be reconstructed from older Telegram messages.

The admin account can view orders and update their stages under Bestillinger. Customers see active and previous orders under Mine bestillinger. Restaurant requests still use their existing independent pending/completed flow.

## Release steps

1. Deploy the updated Firestore rules for the correct Firebase project before releasing the app. From this directory, after selecting the correct Firebase project, run `firebase deploy --only firestore:rules`. This directory's `firebase.json` uses `firestore(4).rules`.
2. Install dependencies with `npm ci` and create new native iOS and Android builds; the location and maps packages require a new binary. Android release builds require Google Maps SDK configuration and an appropriate restricted API key, per Expo's react-native-maps documentation.
3. Test a real account, address search, manual address, denied location permission, map pin, checkout, admin stage changes, and both single and multiple restaurant orders in a non-production environment before release. Web supports manual addresses but not the map picker.

The existing Telegram endpoint is called before Firestore is written. If Telegram succeeds but the Firestore batch fails, the customer is told to contact KjørNesodden before trying again. The endpoint does not provide an idempotent order transaction, so this failure mode must be resolved operationally to avoid duplicates. No live driver tracking or estimated arrival time is included.
