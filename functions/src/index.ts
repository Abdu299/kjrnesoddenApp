import {initializeApp} from "firebase-admin/app";
import {getFirestore, Timestamp} from "firebase-admin/firestore";
import {logger} from "firebase-functions";
import {defineSecret} from "firebase-functions/params";
import {HttpsError, onCall} from "firebase-functions/v2/https";

initializeApp();

const telegramBotToken = defineSecret("TELEGRAM_BOT_TOKEN");
const telegramChatId = defineSecret("TELEGRAM_CHAT_ID");

type OrderPayload = {
  deliveryType?: unknown;
  deliveryPlace?: unknown;
  description?: unknown;
};

function readText(
  value: unknown,
  fieldName: string,
  maximumLength: number
): string {
  if (typeof value !== "string") {
    throw new HttpsError(
      "invalid-argument",
      `${fieldName} mangler.`
    );
  }

  const cleanValue = value.trim();

  if (!cleanValue || cleanValue.length > maximumLength) {
    throw new HttpsError(
      "invalid-argument",
      `${fieldName} er ugyldig.`
    );
  }

  return cleanValue;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export const sendOrderToTelegram = onCall(
  {
    region: "europe-west1",
    secrets: [telegramBotToken, telegramChatId],
    timeoutSeconds: 30,
    memory: "256MiB",
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError(
        "unauthenticated",
        "Du må være logget inn."
      );
    }

    const db = getFirestore();
    const userId = request.auth.uid;
    const userSnapshot = await db.collection("users").doc(userId).get();

    if (!userSnapshot.exists || userSnapshot.data()?.role !== "customer") {
      throw new HttpsError(
        "permission-denied",
        "Kun kundekontoer kan sende bestillinger."
      );
    }

    const user = userSnapshot.data() ?? {};
    const fullName = readText(user.name, "Navn", 80);
    const phone = readText(user.phone, "Mobilnummer", 20);
    const address = readText(user.address, "Leveringsadresse", 200);
    const payload = (request.data ?? {}) as OrderPayload;
    const deliveryType = readText(payload.deliveryType, "Bestillingstype", 100);
    const deliveryPlace = readText(payload.deliveryPlace, "Bestillingssted", 300);
    const description = readText(payload.description, "Bestilling", 2800);

    const rateLimitReference = db.collection("telegramRateLimits").doc(userId);

    await db.runTransaction(async (transaction) => {
      const rateLimitSnapshot = await transaction.get(rateLimitReference);
      const lastSentAt = rateLimitSnapshot.data()?.lastSentAt;

      if (lastSentAt instanceof Timestamp) {
        const elapsedMilliseconds = Date.now() - lastSentAt.toMillis();

        if (elapsedMilliseconds < 10_000) {
          throw new HttpsError(
            "resource-exhausted",
            "Vent noen sekunder før du sender på nytt."
          );
        }
      }

      transaction.set(rateLimitReference, {
        lastSentAt: Timestamp.now(),
      });
    });

    const message = [
      "<b>🛵 Ny bestilling – KjørNesodden</b>",
      "",
      `<b>Kunde:</b> ${escapeHtml(fullName)}`,
      `<b>Telefon:</b> ${escapeHtml(phone)}`,
      `<b>Adresse:</b> ${escapeHtml(address)}`,
      `<b>Type:</b> ${escapeHtml(deliveryType)}`,
      `<b>Sted:</b> ${escapeHtml(deliveryPlace)}`,
      "",
      `<b>Bestilling:</b>\n${escapeHtml(description)}`,
    ].join("\n");

    try {
      const telegramResponse = await fetch(
        `https://api.telegram.org/bot${telegramBotToken.value()}/sendMessage`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            chat_id: telegramChatId.value(),
            text: message,
            parse_mode: "HTML",
            disable_web_page_preview: true,
          }),
        }
      );

      if (!telegramResponse.ok) {
        const responseText = await telegramResponse.text();
        logger.error("Telegram rejected the order notification", {
          status: telegramResponse.status,
          responseText,
          userId,
        });

        throw new HttpsError(
          "internal",
          "Telegram-varslingen kunne ikke sendes."
        );
      }

      logger.info("Telegram order notification sent", {userId});

      return {success: true};
    } catch (error) {
      if (error instanceof HttpsError) {
        throw error;
      }

      logger.error("Telegram request failed", {error, userId});

      throw new HttpsError(
        "internal",
        "Telegram-varslingen kunne ikke sendes."
      );
    }
  }
);
