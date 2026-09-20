# Firebase and Telegram setup

The Expo application already supports the web. This repository now exports it as a static web app for Firebase Hosting and sends order notifications through a callable Firebase Cloud Function. The Telegram bot token is never included in browser code.

## 1. Install the tools and dependencies

From the repository root:

```bash
npm install -g firebase-tools
firebase login
cd KjorNesodden54
npm install
cd ../functions
npm install
cd ..
```

## 2. Configure Firebase

The project is already set to `kjornesodden` in `.firebaserc`.

In Firebase Console:

1. Open **Authentication → Sign-in method** and enable **Email/Password**.
2. Open **Firestore Database** and create the database in a European region if it does not already exist.
3. In **Authentication → Settings → Authorized domains**, add the Firebase Hosting domain after the first deployment if it is not added automatically.
4. Upgrade the project to the **Blaze** plan before deploying Cloud Functions. Firebase still includes no-cost quotas, but a billing account is required for function deployment and outbound Telegram requests.

## 3. Create the Telegram bot

1. Open Telegram and message `@BotFather`.
2. Send `/newbot`, choose the bot name and username, and copy the bot token.
3. Open the new bot and press **Start**.
4. Send any message to the bot.
5. In a browser, open `https://api.telegram.org/botYOUR_TOKEN/getUpdates` and copy `message.chat.id`.
6. For a group, add the bot to the group, send a message in the group, and use the negative group `chat.id` returned by `getUpdates`.

Store both values as Firebase secrets:

```bash
firebase functions:secrets:set TELEGRAM_BOT_TOKEN
firebase functions:secrets:set TELEGRAM_CHAT_ID
```

Paste each value only when the Firebase CLI asks for it. Never place the token in source code or an `EXPO_PUBLIC_` variable.

## 4. Build and deploy

```bash
cd KjorNesodden54
npx expo export --platform web
cd ..
firebase deploy --only firestore:rules,functions,hosting
```

Firebase prints the public Hosting URL when deployment finishes.

## 5. Create the first admin

1. In Firebase Console, open **Authentication → Users** and create an email/password user.
2. Copy that user's UID.
3. In Firestore, create `users/{UID}` with these fields:

```text
role: "admin"
name: "Admin"
email: "your@email.no"
```

The admin can then log in through the same login screen and create restaurant accounts. Customers create their own accounts through **Registrer deg**.

## Local web test

```bash
cd KjorNesodden54
npm run web
```
