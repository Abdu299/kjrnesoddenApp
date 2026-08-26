import {
    collection,
    doc,
    getDoc,
    onSnapshot,
    query,
    serverTimestamp,
    updateDoc,
    where,
    writeBatch,
    type Timestamp,
} from "firebase/firestore";

import {
    auth,
    db,
} from "./firebase";

import type {
    CartItem,
} from "../context/CartContext";


// ==================================================
// TYPES
// ==================================================

export type RestaurantRequestStatus =
  | "pending"
  | "completed";


export type RestaurantRequestItem = {
  productId: string;

  productName: string;

  price: number;

  quantity: number;

  lineTotal: number;
};


export type RestaurantRequest = {
  id: string;

  orderGroupId: string;

  restaurantId: string;

  restaurantName: string;

  customerId: string;

  customerName: string;

  customerPhone: string;

  items: RestaurantRequestItem[];

  subtotal: number;

  status: RestaurantRequestStatus;

  createdAt: Timestamp | null;

  completedAt: Timestamp | null;
};


// ==================================================
// CURRENT RESTAURANT
// ==================================================

async function getCurrentRestaurantId():
Promise<string> {
  const currentUser =
    auth.currentUser;


  if (!currentUser) {
    throw new Error(
      "Du må være logget inn."
    );
  }


  const userDocument =
    await getDoc(
      doc(
        db,
        "users",
        currentUser.uid
      )
    );


  if (
    !userDocument.exists()
  ) {
    throw new Error(
      "Brukeren finnes ikke."
    );
  }


  const userData =
    userDocument.data();


  if (
    userData.role !==
    "restaurant"
  ) {
    throw new Error(
      "Kun restaurantkontoer kan se bestillinger."
    );
  }


  if (
    !userData.restaurantId
  ) {
    throw new Error(
      "Restaurantkontoen mangler restaurant."
    );
  }


  return userData.restaurantId;
}


// ==================================================
// CREATE REQUESTS FROM CART
// ==================================================

export async function createRestaurantRequests(
  items: CartItem[],
  customerName: string,
  customerPhone: string
) {
  const currentUser =
    auth.currentUser;


  if (!currentUser) {
    throw new Error(
      "Du må være logget inn."
    );
  }


  if (
    items.length ===
    0
  ) {
    throw new Error(
      "Handlekurven er tom."
    );
  }


  // ==================================================
  // CHECK CUSTOMER ROLE
  // ==================================================

  const userDocument =
    await getDoc(
      doc(
        db,
        "users",
        currentUser.uid
      )
    );


  if (
    !userDocument.exists() ||
    userDocument.data().role !==
      "customer"
  ) {
    throw new Error(
      "Kun kundekontoer kan opprette bestillinger."
    );
  }


  // ==================================================
  // GROUP ITEMS BY RESTAURANT
  // ==================================================

  const restaurantGroups =
    items.reduce<
      Record<
        string,
        CartItem[]
      >
    >(
      (
        groups,
        item
      ) => {
        if (
          !groups[
            item.restaurantId
          ]
        ) {
          groups[
            item.restaurantId
          ] = [];
        }


        groups[
          item.restaurantId
        ].push(
          item
        );


        return groups;
      },

      {}
    );


  // One ID connects all restaurant requests
  // that came from the same customer checkout.

  const orderGroupId =
    doc(
      collection(
        db,
        "orderGroups"
      )
    ).id;


  const batch =
    writeBatch(
      db
    );


  Object.entries(
    restaurantGroups
  ).forEach(
    ([
      restaurantId,
      restaurantItems,
    ]) => {
      const firstItem =
        restaurantItems[0];


      const requestItems:
        RestaurantRequestItem[] =
        restaurantItems.map(
          (
            item
          ) => ({
            productId:
              item.productId,

            productName:
              item.productName,

            price:
              item.price,

            quantity:
              item.quantity,

            lineTotal:
              item.price *
              item.quantity,
          })
        );


      const subtotal =
        requestItems.reduce(
          (
            total,
            item
          ) =>
            total +
            item.lineTotal,

          0
        );


      const requestReference =
        doc(
          collection(
            db,
            "restaurantRequests"
          )
        );


      batch.set(
        requestReference,
        {
          orderGroupId,

          restaurantId,

          restaurantName:
            firstItem
              ?.restaurantName ??
            "Restaurant",

          customerId:
            currentUser.uid,

          customerName:
            customerName.trim(),

          customerPhone:
            customerPhone.trim(),

          items:
            requestItems,

          subtotal,

          status:
            "pending",

          createdAt:
            serverTimestamp(),

          completedAt:
            null,
        }
      );
    }
  );


  await batch.commit();


  return {
    success:
      true,

    orderGroupId,
  };
}


// ==================================================
// MAP DOCUMENT
// ==================================================

function documentToRestaurantRequest(
  requestDocument: any
): RestaurantRequest {
  const data =
    requestDocument.data();


  const rawItems =
    Array.isArray(
      data.items
    )
      ? data.items
      : [];


  return {
    id:
      requestDocument.id,

    orderGroupId:
      data.orderGroupId ??
      "",

    restaurantId:
      data.restaurantId ??
      "",

    restaurantName:
      data.restaurantName ??
      "",

    customerId:
      data.customerId ??
      "",

    customerName:
      data.customerName ??
      "",

    customerPhone:
      data.customerPhone ??
      "",

    items:
      rawItems.map(
        (
          item: any
        ) => ({
          productId:
            item.productId ??
            "",

          productName:
            item.productName ??
            "",

          price:
            Number(
              item.price ??
              0
            ),

          quantity:
            Number(
              item.quantity ??
              0
            ),

          lineTotal:
            Number(
              item.lineTotal ??
              0
            ),
        })
      ),

    subtotal:
      Number(
        data.subtotal ??
        0
      ),

    status:
      data.status ===
      "completed"
        ? "completed"
        : "pending",

    createdAt:
      data.createdAt ??
      null,

    completedAt:
      data.completedAt ??
      null,
  };
}


// ==================================================
// TIMESTAMP HELPER
// ==================================================

function getTimestampMilliseconds(
  timestamp:
    Timestamp | null
) {
  if (!timestamp) {
    return 0;
  }


  try {
    return timestamp.toMillis();

  } catch {
    return 0;
  }
}


// ==================================================
// REALTIME REQUESTS FOR LOGGED-IN RESTAURANT
// ==================================================

export function subscribeToMyRestaurantRequests(
  onRequestsChanged: (
    requests:
      RestaurantRequest[]
  ) => void,

  onError?: (
    error: Error
  ) => void
) {
  let active =
    true;

  let unsubscribeSnapshot:
    (() => void) | null =
      null;


  const startListener =
    async () => {
      try {
        const restaurantId =
          await getCurrentRestaurantId();


        if (!active) {
          return;
        }


        const requestsQuery =
          query(
            collection(
              db,
              "restaurantRequests"
            ),

            where(
              "restaurantId",
              "==",
              restaurantId
            )
          );


        unsubscribeSnapshot =
          onSnapshot(
            requestsQuery,

            (
              snapshot
            ) => {
              const requests =
                snapshot.docs.map(
                  (
                    requestDocument
                  ) =>
                    documentToRestaurantRequest(
                      requestDocument
                    )
                );


              requests.sort(
                (
                  a,
                  b
                ) =>
                  getTimestampMilliseconds(
                    b.createdAt
                  ) -
                  getTimestampMilliseconds(
                    a.createdAt
                  )
              );


              onRequestsChanged(
                requests
              );
            },

            (
              error
            ) => {
              console.log(
                "Restaurant request listener error:",
                error
              );


              if (
                onError
              ) {
                onError(
                  error
                );
              }
            }
          );

      } catch (
        error: any
      ) {
        console.log(
          "Could not start restaurant request listener:",
          error
        );


        if (
          onError
        ) {
          onError(
            error
          );
        }
      }
    };


  startListener();


  return () => {
    active =
      false;


    if (
      unsubscribeSnapshot
    ) {
      unsubscribeSnapshot();
    }
  };
}


// ==================================================
// MARK COMPLETED
// ==================================================

export async function markRestaurantRequestCompleted(
  requestId: string
) {
  const restaurantId =
    await getCurrentRestaurantId();


  const requestReference =
    doc(
      db,
      "restaurantRequests",
      requestId
    );


  const requestDocument =
    await getDoc(
      requestReference
    );


  if (
    !requestDocument.exists()
  ) {
    throw new Error(
      "Bestillingen finnes ikke."
    );
  }


  const requestData =
    requestDocument.data();


  if (
    requestData.restaurantId !==
    restaurantId
  ) {
    throw new Error(
      "Du har ikke tilgang til denne bestillingen."
    );
  }


  if (
    requestData.status ===
    "completed"
  ) {
    return;
  }


  await updateDoc(
    requestReference,
    {
      status:
        "completed",

      completedAt:
        serverTimestamp(),
    }
  );
}