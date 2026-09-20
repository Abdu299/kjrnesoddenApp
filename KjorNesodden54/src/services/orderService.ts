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
  httpsCallable,
} from "firebase/functions";

import {
  functions,
} from "./firebase";

// ==================================================
// TELEGRAM FUNCTION
// ==================================================

const sendOrderNotification =
  httpsCallable<
    {
      deliveryType: string;
      deliveryPlace: string;
      description: string;
    },
    {
      success: boolean;
    }
  >(
    functions,
    "sendOrderToTelegram"
  );


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
// SEND TO TELEGRAM THROUGH FIREBASE
// ==================================================

async function sendOrderToTelegram(data: {
  fullName: string;
  phone: string;
  deliveryAddress: string;
  deliveryType: string;
  deliveryPlace: string;
  description: string;
}) {
  // Name, phone and address are intentionally not sent from the
  // browser. The Cloud Function reads the authenticated customer's
  // profile directly from Firestore, which prevents spoofing.
  const result =
    await sendOrderNotification({
      deliveryType:
        data.deliveryType,

      deliveryPlace:
        data.deliveryPlace,

      description:
        data.description,
    });


  if (
    !result.data.success
  ) {
    throw new Error(
      "Kunne ikke sende bestillingen. Prøv igjen."
    );
  }


  return result.data;
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
  totalPrice: number
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
      "ℹ️ Pris for fri bestilling kommer i tillegg."
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

export async function submitCartOrder(
  items: CartItem[],
  totalPrice: number
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

  const profile =
    await getValidCustomerProfile();


  const restaurantItems =
    getRestaurantItems(
      items
    );


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
      totalPrice
    );


  const deliveryType =
    restaurantItems.length >
      0 &&
    customItems.length >
      0
      ? "Matbestilling og fri bestilling fra app"
      : customItems.length >
        0
      ? "Fri bestilling fra app"
      : "Matbestilling fra app";


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
    await sendOrderToTelegram({
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
          profile.phone
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

  const requestResult =
    await createRestaurantRequests(
      restaurantItems,
      profile.name,
      profile.phone
    );


  /*
    Firestore is the main source for normal restaurant
    requests. Telegram remains an additional notification.
  */

  let telegramSent =
    true;


  try {
    await sendOrderToTelegram({
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

  } catch (
    error
  ) {
    telegramSent =
      false;


    console.log(
      "Restaurant requests were saved, but Telegram notification failed:",
      error
    );
  }


  return {
    success:
      true,

    customerName:
      profile.name,

    orderGroupId:
      requestResult.orderGroupId,

    telegramSent,
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


  await sendOrderToTelegram({
    fullName:
      profile.name,

    phone:
      profile.phone,

    deliveryAddress:
      profile.address,

    deliveryType:
      "Fri bestilling fra app",

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
