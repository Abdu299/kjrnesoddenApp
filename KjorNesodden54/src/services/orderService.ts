import { getDeliveryPricingFromServer } from "./deliveryPricingService";
import { areaName, defaultDeliveryPricing, quoteDelivery, type DeliveryQuote } from "./deliveryPricing";
import type {
  CartItem,
} from "../context/CartContext";

import {
  getCurrentProfile,
} from "./profileService";

import {
  createRestaurantRequests,
} from "./restaurantRequestService";

import {
  getRestaurantById,
} from "./restaurantService";

import {
  openingStatus,
} from "./openingHoursService";


// ==================================================
// API
// ==================================================

const ORDER_API_URL =
  process.env
    .EXPO_PUBLIC_ORDER_API_URL;


// ==================================================
// VALIDATE PROFILE
// ==================================================

async function getValidCustomerProfile() {
  const profile =
    await getCurrentProfile();


  if (
    profile.role !==
    "customer"
  ) {
    throw new Error(
      "Kun kundekontoer kan sende bestillinger."
    );
  }


  if (
    !profile.name.trim()
  ) {
    throw new Error(
      "Du må legge inn navnet ditt i Profil før du kan bestille."
    );
  }


  if (
    !profile.phone.trim()
  ) {
    throw new Error(
      "Du må legge inn mobilnummeret ditt i Profil før du kan bestille."
    );
  }


  if (
    !profile.address.trim()
  ) {
    throw new Error(
      "Du må legge inn leveringsadressen din i Profil før du kan bestille."
    );
  }


  return profile;
}


// ==================================================
// SEND TO VERCEL
// ==================================================

async function sendOrderToVercel(data: {
  fullName: string;
  phone: string;
  deliveryAddress: string;
  deliveryType: string;
  deliveryPlace: string;
  description: string;
}) {
  if (
    !ORDER_API_URL
  ) {
    throw new Error(
      "Bestillingsserveren er ikke konfigurert."
    );
  }


  const response =
    await fetch(
      ORDER_API_URL,
      {
        method:
          "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body:
          JSON.stringify(
            data
          ),
      }
    );


  if (
    !response.ok
  ) {
    let message =
      "Kunne ikke sende bestillingen. Prøv igjen.";

    try {
      const errorData =
        await response.json();


      if (
        typeof errorData?.error ===
        "string"
      ) {
        message =
          errorData.error;
      }


      console.log(
        "Order API error:",
        errorData
      );

    } catch (
      error
    ) {
      console.log(
        "Could not read order API response:",
        error
      );
    }


    throw new Error(
      message
    );
  }


  return {
    success:
      true,
  };
}


// ==================================================
// HELPERS
// ==================================================

function getRestaurantItems(
  items: CartItem[]
) {
  return items.filter(
    (
      item
    ) =>
      item.type !==
      "custom"
  );
}


function getCustomItems(
  items: CartItem[]
) {
  return items.filter(
    (
      item
    ) =>
      item.type ===
      "custom"
  );
}


// ==================================================
// BUILD CART DESCRIPTION
// ==================================================

function buildOrderDescription(
  items: CartItem[],
  totalPrice: number,
  deliveryFee: number | null,
  deliveryZone: string,
  quote: DeliveryQuote
): string {
  const restaurantItems =
    getRestaurantItems(
      items
    );


  const customItems =
    getCustomItems(
      items
    );

  const restaurantIds =
    [
      ...new Set(
        restaurantItems.map(
          (
            item
          ) =>
            item.restaurantId
        )
      ),
    ];


  const restaurantSections =
    restaurantIds.map(
      (
        restaurantId
      ) => {
        const itemsForRestaurant =
          restaurantItems.filter(
            (
              item
            ) =>
              item.restaurantId ===
              restaurantId
          );


        const restaurantName =
          itemsForRestaurant[0]
            ?.restaurantName ??
          "Restaurant";


        const productLines =
          itemsForRestaurant.map(
            (
              item
            ) => {
              const itemTotal =
                item.price *
                item.quantity;


              return (
                `${item.quantity} × ${item.productName}` +
                ` – ${itemTotal.toLocaleString(
                  "nb-NO"
                )} kr`
              );
            }
          );


        return [
          `🏪 ${restaurantName}`,
          ...productLines,
        ].join(
          "\n"
        );
      }
    );


  const customSections =
    customItems.map(
      (
        item
      ) => {
        const place =
          item.customPlace ??
          item.restaurantName ??
          "Annet sted";


        const request =
          item.customRequest ??
          item.productName ??
          "";


        return [
          `🛍️ Fri bestilling – ${place}`,
          request,
          "💬 Pris avtales separat",
        ].join(
          "\n"
        );
      }
    );


  const summaryLines:
    string[] = [];


  if (
    restaurantItems.length >
    0
  ) {
    summaryLines.push(
      `💰 Restaurantvarer: ${totalPrice.toLocaleString(
        "nb-NO"
      )} kr`
    );
  }


  if (
    customItems.length >
    0
  ) {
    summaryLines.push(
      "ℹ️ Pris og eventuell ekstra levering for fri bestilling avtales separat."
    );
  }

  for (const route of quote.routes) {
    summaryLines.push(`Levering ${route.restaurantName}: ${areaName(route.restaurantAreaId)} → ${areaName(quote.customerAreaId)}: ${route.fee === null ? "avtales" : `${route.fee} kr`}`);
  }
  if (quote.routes.length > 1) summaryLines.push("Én leveringspris: høyeste rutepris, ikke summen av rutene.");

  summaryLines.push(
    deliveryFee !== null
      ? `🚗 Levering: ${deliveryFee.toLocaleString("nb-NO")} kr${
          deliveryZone ? ` (${deliveryZone})` : ""
        }`
      : "🚗 Levering: Pris avtales"
  );

  if (restaurantItems.length > 0 && deliveryFee !== null) {
    summaryLines.push(
      `💳 Totalt varer og levering: ${(
        totalPrice + deliveryFee
      ).toLocaleString("nb-NO")} kr`
    );
  }


  return [
    ...restaurantSections,
    ...customSections,
    "",
    ...summaryLines,
  ]
    .filter(
      (
        value
      ) =>
        value !==
        ""
    )
    .join(
      "\n\n"
    );
}


// ==================================================
// NORMAL CART ORDER
// ==================================================

export type CheckoutDeliveryQuote = DeliveryQuote & { cartKey: string };

function cartKey(items: CartItem[]) {
  return JSON.stringify(items.map((item) => [item.type, item.restaurantId, item.productId,
    item.quantity, item.price, item.customPlace ?? "", item.customRequest ?? ""]).sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b))));
}

async function prepareCheckout(items: CartItem[]) {
  if (items.length === 0) throw new Error("Handlekurven er tom.");
  const profile = await getValidCustomerProfile();
  const restaurantIds = [...new Set(getRestaurantItems(items).map((item) => item.restaurantId))];
  const orderedRestaurants = await Promise.all(restaurantIds.map((id) => getRestaurantById(id, true)));
  if (orderedRestaurants.some((restaurant) => !restaurant || !restaurant.active)) {
    throw new Error("En restaurant i handlekurven er ikke tilgjengelig. Kontroller bestillingen.");
  }
  for (const restaurant of orderedRestaurants) {
    const status = openingStatus(restaurant!.openingHours, restaurant!.closedUntil);
    if (!status.open) throw new Error(`${restaurant!.name} tar ikke imot bestillinger nå. ${status.text}.`);
  }
  // Pure custom orders have no known pickup area and retain an explicitly agreed price.
  const pricing = restaurantIds.length ? await getDeliveryPricingFromServer() : defaultDeliveryPricing;
  const quote: CheckoutDeliveryQuote = { ...quoteDelivery(orderedRestaurants.filter((restaurant) => restaurant !== null),
    profile.deliveryAreaId, profile.address, pricing), cartKey: cartKey(items) };
  return { profile, quote };
}

export async function prepareCartDelivery(items: CartItem[]): Promise<CheckoutDeliveryQuote> {
  return (await prepareCheckout(items)).quote;
}

export async function submitCartOrder(
  items: CartItem[],
  totalPrice: number,
  expectedQuote?: CheckoutDeliveryQuote
) {
  if (
    items.length ===
    0
  ) {
    throw new Error(
      "Handlekurven er tom."
    );
  }


  // ==================================================
  // CUSTOMER
  // ==================================================

  const { profile, quote } = await prepareCheckout(items);
  const restaurantItems = getRestaurantItems(items);
  if ((restaurantItems.length > 0 && !expectedQuote) || (expectedQuote &&
      (expectedQuote.signature !== quote.signature || expectedQuote.cartKey !== quote.cartKey))) {
    throw new Error("Bestillingen eller leveringsprisen er endret. Kontroller handlekurven og bekreft på nytt.");
  }
  const calculatedTotal = restaurantItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  if (!Number.isFinite(totalPrice) || Math.abs(calculatedTotal - totalPrice) > 0.001) {
    throw new Error("Varesummen er endret. Kontroller handlekurven og prøv igjen.");
  }

  const customItems =
    getCustomItems(
      items
    );


  // ==================================================
  // TELEGRAM DATA
  // ==================================================

  const restaurantNames =
    [
      ...new Set(
        restaurantItems.map(
          (
            item
          ) =>
            item.restaurantName
        )
      ),
    ];


  const customPlaces =
    customItems.map(
      (
        item
      ) =>
        item.customPlace ??
        item.restaurantName
    );


  const allPlaces =
    [
      ...restaurantNames,
      ...customPlaces,
    ]
      .filter(
        Boolean
      );


  const description =
    buildOrderDescription(
      items,
      totalPrice,
      quote.fee,
      areaName(quote.customerAreaId),
      quote
    );


  const deliveryType =
    restaurantItems.length > 0
      ? "Restauranter"
      : "Annet";


  // ==================================================
  // ORDERS WITH CUSTOM ITEMS
  // ==================================================

  /*
    A free/custom item only exists in the Telegram order.
    Therefore Telegram must succeed before we consider a
    cart containing custom items submitted.
  */

  if (
    customItems.length >
    0
  ) {
    await sendOrderToVercel({
      fullName:
        profile.name,

      phone:
        profile.phone,

      deliveryAddress:
        profile.address,

      deliveryType,

      deliveryPlace:
        allPlaces.join(
          ", "
        ),

      description,
    });


    let orderGroupId:
      string | null =
        null;


    if (
      restaurantItems.length >
      0
    ) {
      const requestResult =
        await createRestaurantRequests(
          restaurantItems,
          profile.name,
          profile.phone,
          quote
        );


      orderGroupId =
        requestResult.orderGroupId;
    }


    return {
      success:
        true,

      customerName:
        profile.name,

      orderGroupId,

      telegramSent:
        true,
    };
  }


  // ==================================================
  // RESTAURANT-ONLY ORDER
  // ==================================================

  // Telegram must confirm the message before the app reports success.
  await sendOrderToVercel({
    fullName:
      profile.name,

    phone:
      profile.phone,

    deliveryAddress:
      profile.address,

    deliveryType,

    deliveryPlace:
      allPlaces.join(
        ", "
      ),

    description,
  });


  const requestResult =
    await createRestaurantRequests(
      restaurantItems,
      profile.name,
      profile.phone,
      quote
    );


  return {
    success:
      true,

    customerName:
      profile.name,

    orderGroupId:
      requestResult.orderGroupId,

    telegramSent:
      true,
  };
}


// ==================================================
// LEGACY DIRECT CUSTOM ORDER
// ==================================================

/*
  Kept for compatibility with any older code.
  The current custom-order screen no longer calls this.
  It now adds the free order to the cart instead.
*/

export async function submitCustomOrder(
  place: string,
  request: string
) {
  const cleanPlace =
    place
      .trim()
      .replace(
        /\s+/g,
        " "
      );


  const cleanRequest =
    request
      .trim();


  if (
    cleanPlace.length <
    2
  ) {
    throw new Error(
      "Skriv inn navnet på restauranten eller butikken."
    );
  }


  if (
    cleanRequest.length <
    3
  ) {
    throw new Error(
      "Fortell oss hva du vil at vi skal hente."
    );
  }


  if (
    cleanRequest.length >
    2000
  ) {
    throw new Error(
      "Bestillingen er for lang."
    );
  }


  const profile =
    await getValidCustomerProfile();


  await sendOrderToVercel({
    fullName:
      profile.name,

    phone:
      profile.phone,

    deliveryAddress:
      profile.address,

    deliveryType:
      "Annet",

    deliveryPlace:
      cleanPlace,

    description:
      cleanRequest,
  });


  return {
    success:
      true,

    customerName:
      profile.name,
  };
}

