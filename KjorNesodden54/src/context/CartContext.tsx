import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  useAuth,
} from "./AuthContext";


// ==================================================
// TYPES
// ==================================================

export type CartItemType =
  | "restaurant"
  | "custom";


export type CartItem = {
  type: CartItemType;

  productId: string;

  restaurantId: string;

  restaurantName: string;

  productName: string;

  price: number;

  quantity: number;

  customPlace?: string;

  customRequest?: string;
};


type AddCartItem = {
  productId: string;

  restaurantId: string;

  restaurantName: string;

  productName: string;

  price: number;
};


type CartContextType = {
  items: CartItem[];

  addItem: (
    item: AddCartItem
  ) => void;

  addCustomItem: (
    place: string,
    request: string
  ) => void;

  increaseQuantity: (
    productId: string
  ) => void;

  decreaseQuantity: (
    productId: string
  ) => void;

  removeItem: (
    productId: string
  ) => void;

  clearCart: () => void;

  totalItems: number;

  totalPrice: number;
};


// ==================================================
// CONTEXT
// ==================================================

const CartContext =
  createContext<CartContextType>({
    items: [],

    addItem: () => {},

    addCustomItem: () => {},

    increaseQuantity:
      () => {},

    decreaseQuantity:
      () => {},

    removeItem:
      () => {},

    clearCart:
      () => {},

    totalItems: 0,

    totalPrice: 0,
  });


const STORAGE_PREFIX =
  "kjornesodden-cart";


// ==================================================
// NORMALIZE STORED CART
// ==================================================

function normalizeStoredCart(
  parsed: unknown
): CartItem[] {
  if (
    !Array.isArray(
      parsed
    )
  ) {
    return [];
  }


  return parsed
    .filter(
      (
        item
      ) =>
        item &&
        typeof item ===
          "object"
    )
    .map(
      (
        item: any
      ): CartItem => ({
        type:
          item.type ===
          "custom"
            ? "custom"
            : "restaurant",

        productId:
          String(
            item.productId ??
            ""
          ),

        restaurantId:
          String(
            item.restaurantId ??
            ""
          ),

        restaurantName:
          String(
            item.restaurantName ??
            ""
          ),

        productName:
          String(
            item.productName ??
            ""
          ),

        price:
          Number(
            item.price ??
            0
          ),

        quantity:
          Math.max(
            1,
            Number(
              item.quantity ??
              1
            )
          ),

        customPlace:
          item.customPlace
            ? String(
                item.customPlace
              )
            : undefined,

        customRequest:
          item.customRequest
            ? String(
                item.customRequest
              )
            : undefined,
      })
    )
    .filter(
      (
        item
      ) =>
        item.productId
    );
}


// ==================================================
// PROVIDER
// ==================================================

export function CartProvider({
  children,
}: {
  children: ReactNode;
}) {
  const {
    user,
  } =
    useAuth();


  const [
    items,
    setItems,
  ] =
    useState<CartItem[]>(
      []
    );


  const [
    loadedUserId,
    setLoadedUserId,
  ] =
    useState<
      string | null
    >(
      null
    );


  // ==================================================
  // LOAD CART FOR CURRENT USER
  // ==================================================

  useEffect(() => {
    const loadCart =
      async () => {
        if (!user) {
          setItems([]);

          setLoadedUserId(
            null
          );

          return;
        }


        const userId =
          user.uid;


        try {
          const key =
            `${STORAGE_PREFIX}-${userId}`;


          const storedCart =
            await AsyncStorage
              .getItem(
                key
              );


          if (
            storedCart
          ) {
            const parsed =
              JSON.parse(
                storedCart
              );


            setItems(
              normalizeStoredCart(
                parsed
              )
            );

          } else {
            setItems([]);
          }

        } catch (
          error
        ) {
          console.log(
            "Load cart error:",
            error
          );


          setItems([]);

        } finally {
          setLoadedUserId(
            userId
          );
        }
      };


    loadCart();

  }, [
    user?.uid,
  ]);


  // ==================================================
  // SAVE CART
  // ==================================================

  useEffect(() => {
    const saveCart =
      async () => {
        if (
          !user ||
          loadedUserId !==
            user.uid
        ) {
          return;
        }


        try {
          const key =
            `${STORAGE_PREFIX}-${user.uid}`;


          await AsyncStorage
            .setItem(
              key,

              JSON.stringify(
                items
              )
            );

        } catch (
          error
        ) {
          console.log(
            "Save cart error:",
            error
          );
        }
      };


    saveCart();

  }, [
    items,
    user?.uid,
    loadedUserId,
  ]);


  // ==================================================
  // ADD RESTAURANT ITEM
  // ==================================================

  const addItem =
    (
      newItem:
        AddCartItem
    ) => {
      setItems(
        (
          currentItems
        ) => {
          const existingItem =
            currentItems.find(
              (
                item
              ) =>
                item.type ===
                  "restaurant" &&
                item.productId ===
                  newItem.productId
            );


          if (
            existingItem
          ) {
            return currentItems.map(
              (
                item
              ) =>
                item.type ===
                  "restaurant" &&
                item.productId ===
                  newItem.productId
                  ? {
                      ...item,

                      quantity:
                        item.quantity +
                        1,
                    }
                  : item
            );
          }


          return [
            ...currentItems,

            {
              type:
                "restaurant",

              ...newItem,

              quantity:
                1,
            },
          ];
        }
      );
    };


  // ==================================================
  // ADD CUSTOM ITEM
  // ==================================================

  const addCustomItem =
    (
      place: string,
      request: string
    ) => {
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


      const uniqueId =
        `custom-${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 9)}`;


      setItems(
        (
          currentItems
        ) => [
          ...currentItems,

          {
            type:
              "custom",

            productId:
              uniqueId,

            restaurantId:
              uniqueId,

            restaurantName:
              cleanPlace,

            productName:
              "Fri bestilling",

            price:
              0,

            quantity:
              1,

            customPlace:
              cleanPlace,

            customRequest:
              cleanRequest,
          },
        ]
      );
    };


  // ==================================================
  // INCREASE
  // ==================================================

  const increaseQuantity =
    (
      productId:
        string
    ) => {
      setItems(
        (
          currentItems
        ) =>
          currentItems.map(
            (
              item
            ) =>
              item.type ===
                "restaurant" &&
              item.productId ===
                productId
                ? {
                    ...item,

                    quantity:
                      item.quantity +
                      1,
                  }
                : item
          )
      );
    };


  // ==================================================
  // DECREASE
  // ==================================================

  const decreaseQuantity =
    (
      productId:
        string
    ) => {
      setItems(
        (
          currentItems
        ) =>
          currentItems
            .map(
              (
                item
              ) => {
                if (
                  item.type !==
                    "restaurant" ||
                  item.productId !==
                    productId
                ) {
                  return item;
                }


                return {
                  ...item,

                  quantity:
                    item.quantity -
                    1,
                };
              }
            )
            .filter(
              (
                item
              ) =>
                item.quantity >
                0
            )
      );
    };


  // ==================================================
  // REMOVE
  // ==================================================

  const removeItem =
    (
      productId:
        string
    ) => {
      setItems(
        (
          currentItems
        ) =>
          currentItems.filter(
            (
              item
            ) =>
              item.productId !==
              productId
          )
      );
    };


  // ==================================================
  // CLEAR
  // ==================================================

  const clearCart =
    () => {
      setItems([]);
    };


  // ==================================================
  // TOTALS
  // ==================================================

  const totalItems =
    useMemo(
      () =>
        items.reduce(
          (
            total,
            item
          ) =>
            total +
            (
              item.type ===
              "custom"
                ? 1
                : item.quantity
            ),

          0
        ),

      [
        items,
      ]
    );


  /*
    Custom/free orders do not have a known price yet.
    Therefore totalPrice only includes normal restaurant
    products. The cart UI explains that the custom order
    price comes in addition.
  */

  const totalPrice =
    useMemo(
      () =>
        items.reduce(
          (
            total,
            item
          ) =>
            item.type ===
            "custom"
              ? total
              : total +
                item.price *
                  item.quantity,

          0
        ),

      [
        items,
      ]
    );


  // ==================================================
  // PROVIDER
  // ==================================================

  return (
    <CartContext.Provider
      value={{
        items,

        addItem,

        addCustomItem,

        increaseQuantity,

        decreaseQuantity,

        removeItem,

        clearCart,

        totalItems,

        totalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}


// ==================================================
// HOOK
// ==================================================

export function useCart() {
  return useContext(
    CartContext
  );
}