import {
  useCallback,
  useState,
} from "react";

import {
  Alert,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import Ionicons from "@expo/vector-icons/Ionicons";

import {
  router,
  useFocusEffect,
} from "expo-router";

import {
  CartItem,
  useCart,
} from "../context/CartContext";

import {
  useAuth,
} from "../context/AuthContext";

import {
  submitCartOrder,
} from "../services/orderService";

import {
  getCurrentProfile,
} from "../services/profileService";


// ==================================================
// GROUP TYPE
// ==================================================

type RestaurantCartGroup = {
  restaurantId:
    string;

  restaurantName:
    string;

  items:
    CartItem[];
};


// ==================================================
// CART
// ==================================================

export default function CartScreen() {
  const {
    user,
  } =
    useAuth();


  const {
    items,

    increaseQuantity,

    decreaseQuantity,

    removeItem,

    clearCart,

    totalItems,

    totalPrice,
  } =
    useCart();


  const [
    submittingOrder,
    setSubmittingOrder,
  ] =
    useState(
      false
    );

  const [deliveryFee, setDeliveryFee] = useState<number | null>(null);
  const [deliveryZone, setDeliveryZone] = useState("");
  const [showClearConfirmation, setShowClearConfirmation] = useState(false);
  const [showOrderConfirmation, setShowOrderConfirmation] = useState(false);
  const [showLoginConfirmation, setShowLoginConfirmation] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      if (!user) {
        setDeliveryFee(null);
        setDeliveryZone("");
        return () => {
          active = false;
        };
      }

      getCurrentProfile()
        .then((profile) => {
          if (!active) {
            return;
          }

          setDeliveryFee(profile.deliveryFee);
          setDeliveryZone(profile.deliveryZone);
        })
        .catch(() => {
          if (!active) {
            return;
          }

          setDeliveryFee(null);
          setDeliveryZone("");
        });

      return () => {
        active = false;
      };
    }, [user])
  );


  // ==================================================
  // SPLIT CART
  // ==================================================

  const restaurantItems =
    items.filter(
      (
        item
      ) =>
        item.type !==
        "custom"
    );


  const customItems =
    items.filter(
      (
        item
      ) =>
        item.type ===
        "custom"
    );


  // ==================================================
  // GROUP BY RESTAURANT
  // ==================================================

  const restaurantGroups =
    restaurantItems.reduce<
      RestaurantCartGroup[]
    >(
      (
        groups,
        item
      ) => {
        const existingGroup =
          groups.find(
            (
              group
            ) =>
              group.restaurantId ===
              item.restaurantId
          );


        if (
          existingGroup
        ) {
          existingGroup
            .items
            .push(
              item
            );


          return groups;
        }


        groups.push({
          restaurantId:
            item.restaurantId,

          restaurantName:
            item.restaurantName,

          items:
            [
              item,
            ],
        });


        return groups;
      },

      []
    );


  // ==================================================
  // CLEAR
  // ==================================================

  const handleClearCart =
    () => {
      setShowClearConfirmation(true);
    };


  // ==================================================
  // SUBMIT ORDER
  // ==================================================

  const submitConfirmedOrder =
    async () => {
      if (
        submittingOrder
      ) {
        return;
      }


      try {
        setSubmittingOrder(
          true
        );


        await submitCartOrder(
          items,
          totalPrice
        );


        // Only clear after successful submission
        clearCart();


        Alert.alert(
          "Bestilling mottatt",

          "Vi har mottatt informasjonen din. Vi kontakter deg snart og henter bestillingen.",

          [
            {
              text:
                "OK",

              onPress:
                () =>
                  router.replace(
                    "/"
                  ),
            },
          ]
        );

      } catch (
        error: any
      ) {
        console.log(
          "Purchase error:",
          error
        );


        Alert.alert(
          "Kunne ikke sende bestillingen",

          error.message ||
            "Noe gikk galt. Prøv igjen."
        );

      } finally {
        setSubmittingOrder(
          false
        );
      }
    };


  // ==================================================
  // CONFIRM BEFORE BUY
  // ==================================================

  const handleBuy =
    () => {
      if (
        submittingOrder
      ) {
        return;
      }


      if (!user) {
        setShowLoginConfirmation(true);

        return;
      }

      setShowOrderConfirmation(true);
    };


  // ==================================================
  // EMPTY
  // ==================================================

  if (
    items.length ===
    0
  ) {
    return (
      <SafeAreaView
        style={
          styles.container
        }
      >
        <View
          style={
            styles.header
          }
        >
          <TouchableOpacity
            style={
              styles.headerIconButton
            }
            onPress={() =>
              router.back()
            }
          >
            <Ionicons
              name="arrow-back"
              size={24}
              color="#111111"
            />
          </TouchableOpacity>


          <Text
            style={
              styles.headerTitle
            }
          >
            Handlekurv
          </Text>


          <View
            style={
              styles.headerSpacer
            }
          />
        </View>


        <View
          style={
            styles.emptyContainer
          }
        >
          <View
            style={
              styles.emptyIcon
            }
          >
            <Ionicons
              name="cart-outline"
              size={42}
              color="#208AEF"
            />
          </View>


          <Text
            style={
              styles.emptyTitle
            }
          >
            Handlekurven er tom
          </Text>


          <Text
            style={
              styles.emptyDescription
            }
          >
            Legg til produkter fra restaurantene du ønsker.
          </Text>


          <TouchableOpacity
            style={
              styles.exploreButton
            }
            onPress={() =>
              router.replace(
                "/"
              )
            }
          >
            <Text
              style={
                styles.exploreButtonText
              }
            >
              Se restauranter
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }


  // ==================================================
  // CART UI
  // ==================================================

  return (
    <SafeAreaView
      style={
        styles.container
      }
    >
      {/* HEADER */}

      <View
        style={
          styles.header
        }
      >
        <TouchableOpacity
          style={
            styles.headerIconButton
          }
          onPress={() =>
            router.back()
          }
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color="#111111"
          />
        </TouchableOpacity>


        <View
          style={
            styles.headerCenter
          }
        >
          <Text
            style={
              styles.headerTitle
            }
          >
            Handlekurv
          </Text>


          <Text
            style={
              styles.headerSubtitle
            }
          >
            {totalItems}{" "}
            {totalItems ===
            1
              ? "produkt"
              : "produkter"}
          </Text>
        </View>


        <TouchableOpacity
          style={
            styles.headerIconButton
          }
          onPress={
            handleClearCart
          }
        >
          <Ionicons
            name="trash-outline"
            size={22}
            color="#E04646"
          />
        </TouchableOpacity>
      </View>


      {/* CONTENT */}

      <ScrollView
        style={
          styles.scroll
        }
        contentContainerStyle={
          styles.scrollContent
        }
      >
        {restaurantGroups.map(
          (
            group
          ) => {
            const restaurantTotal =
              group.items.reduce(
                (
                  total,
                  item
                ) =>
                  total +
                  item.price *
                    item.quantity,

                0
              );


            return (
              <View
                key={
                  group.restaurantId
                }
                style={
                  styles.restaurantCard
                }
              >
                {/* RESTAURANT HEADER */}

                <View
                  style={
                    styles.restaurantHeader
                  }
                >
                  <View
                    style={
                      styles.restaurantTitleContainer
                    }
                  >
                    <View
                      style={
                        styles.restaurantIcon
                      }
                    >
                      <Ionicons
                        name="restaurant-outline"
                        size={20}
                        color="#208AEF"
                      />
                    </View>


                    <Text
                      style={
                        styles.restaurantName
                      }
                    >
                      {group.restaurantName}
                    </Text>
                  </View>


                  <TouchableOpacity
                    onPress={() =>
                      router.push({
                        pathname:
                          "/restaurant/[id]",

                        params: {
                          id:
                            group.restaurantId,
                        },
                      })
                    }
                  >
                    <Text
                      style={
                        styles.addMoreText
                      }
                    >
                      Legg til mer
                    </Text>
                  </TouchableOpacity>
                </View>


                {/* PRODUCTS */}

                {group.items.map(
                  (
                    item,
                    index
                  ) => (
                    <View
                      key={
                        item.productId
                      }
                    >
                      {index >
                        0 && (
                        <View
                          style={
                            styles.divider
                          }
                        />
                      )}


                      <View
                        style={
                          styles.productRow
                        }
                      >
                        <View
                          style={
                            styles.productInfo
                          }
                        >
                          <Text
                            style={
                              styles.productName
                            }
                          >
                            {item.productName}
                          </Text>


                          <Text
                            style={
                              styles.productUnitPrice
                            }
                          >
                            {item.price.toLocaleString(
                              "nb-NO"
                            )}{" "}
                            kr per stk.
                          </Text>


                          <Text
                            style={
                              styles.productTotal
                            }
                          >
                            {(
                              item.price *
                              item.quantity
                            ).toLocaleString(
                              "nb-NO"
                            )}{" "}
                            kr
                          </Text>
                        </View>


                        <View
                          style={
                            styles.productActions
                          }
                        >
                          {/* QUANTITY */}

                          <View
                            style={
                              styles.quantityContainer
                            }
                          >
                            <TouchableOpacity
                              style={
                                styles.quantityButton
                              }
                              onPress={() =>
                                decreaseQuantity(
                                  item.productId
                                )
                              }
                            >
                              <Ionicons
                                name="remove"
                                size={18}
                                color="#208AEF"
                              />
                            </TouchableOpacity>


                            <Text
                              style={
                                styles.quantityText
                              }
                            >
                              {item.quantity}
                            </Text>


                            <TouchableOpacity
                              style={
                                styles.quantityButton
                              }
                              onPress={() =>
                                increaseQuantity(
                                  item.productId
                                )
                              }
                            >
                              <Ionicons
                                name="add"
                                size={18}
                                color="#208AEF"
                              />
                            </TouchableOpacity>
                          </View>


                          {/* REMOVE */}

                          <TouchableOpacity
                            style={
                              styles.removeButton
                            }
                            onPress={() =>
                              removeItem(
                                item.productId
                              )
                            }
                          >
                            <Ionicons
                              name="trash-outline"
                              size={18}
                              color="#E04646"
                            />
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  )
                )}


                {/* RESTAURANT SUBTOTAL */}

                <View
                  style={
                    styles.restaurantTotalRow
                  }
                >
                  <Text
                    style={
                      styles.restaurantTotalLabel
                    }
                  >
                    Delsum
                  </Text>


                  <Text
                    style={
                      styles.restaurantTotalValue
                    }
                  >
                    {restaurantTotal.toLocaleString(
                      "nb-NO"
                    )}{" "}
                    kr
                  </Text>
                </View>
              </View>
            );
          }
        )}


        {/* ==================================================
            CUSTOM / FREE ORDERS
        ================================================== */}

        {customItems.map(
          (
            item
          ) => (
            <View
              key={
                item.productId
              }
              style={
                styles.customOrderCard
              }
            >
              <View
                style={
                  styles.customOrderHeader
                }
              >
                <View
                  style={
                    styles.customOrderTitleContainer
                  }
                >
                  <View
                    style={
                      styles.customOrderIcon
                    }
                  >
                    <Ionicons
                      name="bag-handle-outline"
                      size={21}
                      color="#208AEF"
                    />
                  </View>


                  <View
                    style={
                      styles.customOrderTitleTextContainer
                    }
                  >
                    <Text
                      style={
                        styles.customOrderLabel
                      }
                    >
                      Fri bestilling
                    </Text>


                    <Text
                      style={
                        styles.customOrderPlace
                      }
                    >
                      {item.customPlace ??
                        item.restaurantName}
                    </Text>
                  </View>
                </View>


                <TouchableOpacity
                  style={
                    styles.customOrderRemoveButton
                  }
                  onPress={() =>
                    removeItem(
                      item.productId
                    )
                  }
                >
                  <Ionicons
                    name="trash-outline"
                    size={19}
                    color="#E04646"
                  />
                </TouchableOpacity>
              </View>


              <View
                style={
                  styles.customOrderRequestBox
                }
              >
                <Text
                  style={
                    styles.customOrderRequestLabel
                  }
                >
                  Hva skal hentes?
                </Text>


                <Text
                  style={
                    styles.customOrderRequest
                  }
                >
                  {item.customRequest ??
                    item.productName}
                </Text>
              </View>


              <View
                style={
                  styles.customOrderPriceRow
                }
              >
                <Ionicons
                  name="information-circle-outline"
                  size={18}
                  color="#777777"
                />

                <Text
                  style={
                    styles.customOrderPriceText
                  }
                >
                  Pris avtales separat og kommer i tillegg.
                </Text>
              </View>
            </View>
          )
        )}


        {/* INFO */}

        <View
          style={
            styles.multiRestaurantInfo
          }
        >
          <Ionicons
            name="information-circle-outline"
            size={21}
            color="#777777"
          />

          <Text
            style={
              styles.multiRestaurantInfoText
            }
          >
            Du kan ha produkter fra flere restauranter og frie bestillinger i samme handlekurv.
          </Text>
        </View>
      </ScrollView>


      {/* ==================================================
          CHECKOUT
      ================================================== */}

      <View
        style={
          styles.checkoutContainer
        }
      >
        <View style={styles.totalRow}>
          <Text
            style={
              styles.totalLabel
            }
          >
            {customItems.length >
              0
              ? restaurantItems.length >
                0
                ? "Restaurantvarer"
                : "Pris"
              : "Varer"}
          </Text>


          <Text
            style={
              styles.totalValue
            }
          >
            {customItems.length >
              0 &&
            restaurantItems.length ===
              0
              ? "Avtales"
              : `${totalPrice.toLocaleString(
                  "nb-NO"
                )} kr`}
          </Text>
        </View>

        <View style={styles.deliveryRow}>
          <Text style={styles.deliveryLabel}>Levering</Text>
          <Text style={styles.deliveryValue}>
            {deliveryFee !== null
              ? `${deliveryFee.toLocaleString("nb-NO")} kr`
              : "Avtales"}
          </Text>
        </View>

        {restaurantItems.length > 0 && deliveryFee !== null && (
          <View style={styles.grandTotalRow}>
            <Text style={styles.grandTotalLabel}>Totalt</Text>
            <Text style={styles.grandTotalValue}>
              {(totalPrice + deliveryFee).toLocaleString("nb-NO")} kr
            </Text>
          </View>
        )}


        {customItems.length >
          0 &&
        restaurantItems.length >
          0 && (
          <Text
            style={
              styles.checkoutCustomNote
            }
          >
            Pris for fri bestilling er ikke inkludert og avtales separat.
          </Text>
        )}


        <TouchableOpacity
          style={[
            styles.buyButton,

            submittingOrder &&
              styles.buyButtonDisabled,
          ]}
          onPress={
            handleBuy
          }
          disabled={
            submittingOrder
          }
        >
          <Text
            style={
              styles.buyButtonText
            }
          >
            {submittingOrder
              ? "Sender bestilling..."
              : "Kjøp"}
          </Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={showClearConfirmation}
        transparent
        animationType="fade"
        onRequestClose={() => setShowClearConfirmation(false)}
      >
        <View style={styles.confirmationBackdrop}>
          <View style={styles.confirmationCard}>
            <View style={styles.confirmationIcon}>
              <Ionicons
                name="trash-outline"
                size={28}
                color="#E04646"
              />
            </View>

            <Text style={styles.confirmationTitle}>
              Tøm handlekurv?
            </Text>

            <Text style={styles.confirmationText}>
              Vil du fjerne alle produktene fra handlekurven?
            </Text>

            <View style={styles.confirmationActions}>
              <TouchableOpacity
                style={styles.confirmationCancelButton}
                onPress={() => setShowClearConfirmation(false)}
              >
                <Text style={styles.confirmationCancelText}>Avbryt</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.confirmationDeleteButton}
                onPress={() => {
                  setShowClearConfirmation(false);
                  clearCart();
                }}
              >
                <Text style={styles.confirmationDeleteText}>Tøm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showOrderConfirmation}
        transparent
        animationType="fade"
        onRequestClose={() => setShowOrderConfirmation(false)}
      >
        <View style={styles.confirmationBackdrop}>
          <View style={styles.confirmationCard}>
            <View style={styles.orderConfirmationIcon}>
              <Ionicons
                name="checkmark-circle-outline"
                size={31}
                color="#208AEF"
              />
            </View>

            <Text style={styles.confirmationTitle}>
              Bekreft bestilling
            </Text>

            <Text style={styles.confirmationText}>
              Du bestiller {totalItems} {totalItems === 1 ? "produkt" : "produkter"}.
            </Text>

            <View style={styles.orderSummaryBox}>
              <View style={styles.orderSummaryRow}>
                <Text style={styles.orderSummaryLabel}>Varer</Text>
                <Text style={styles.orderSummaryValue}>
                  {totalPrice.toLocaleString("nb-NO")} kr
                </Text>
              </View>

              <View style={styles.orderSummaryRow}>
                <Text style={styles.orderSummaryLabel}>Levering</Text>
                <Text style={styles.orderSummaryValue}>
                  {deliveryFee !== null
                    ? `${deliveryFee.toLocaleString("nb-NO")} kr${deliveryZone ? ` (${deliveryZone})` : ""}`
                    : "Avtales"}
                </Text>
              </View>

              {restaurantItems.length > 0 && deliveryFee !== null && (
                <View style={[styles.orderSummaryRow, styles.orderSummaryTotal]}>
                  <Text style={styles.orderSummaryTotalText}>Totalt</Text>
                  <Text style={styles.orderSummaryTotalText}>
                    {(totalPrice + deliveryFee).toLocaleString("nb-NO")} kr
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.confirmationActions}>
              <TouchableOpacity
                style={styles.confirmationCancelButton}
                onPress={() => setShowOrderConfirmation(false)}
              >
                <Text style={styles.confirmationCancelText}>Avbryt</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.orderConfirmButton}
                onPress={() => {
                  setShowOrderConfirmation(false);
                  void submitConfirmedOrder();
                }}
              >
                <Text style={styles.confirmationDeleteText}>Ja, bestill</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showLoginConfirmation}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLoginConfirmation(false)}
      >
        <View style={styles.confirmationBackdrop}>
          <View style={styles.confirmationCard}>
            <View style={styles.orderConfirmationIcon}>
              <Ionicons name="person-outline" size={28} color="#208AEF" />
            </View>

            <Text style={styles.confirmationTitle}>Logg inn for å bestille</Text>
            <Text style={styles.confirmationText}>
              Du kan se menyen uten konto, men må logge inn eller registrere deg for å sende bestillingen.
            </Text>

            <View style={styles.confirmationActions}>
              <TouchableOpacity
                style={styles.confirmationCancelButton}
                onPress={() => setShowLoginConfirmation(false)}
              >
                <Text style={styles.confirmationCancelText}>Avbryt</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.orderConfirmButton}
                onPress={() => {
                  setShowLoginConfirmation(false);
                  router.push("/login");
                }}
              >
                <Text style={styles.confirmationDeleteText}>Logg inn</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}


// ==================================================
// STYLES
// ==================================================

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor:
        "#F7F8FA",
    },

    header: {
      minHeight: 70,
      paddingHorizontal: 18,
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "space-between",
      backgroundColor:
        "#FFFFFF",
      borderBottomWidth: 1,
      borderBottomColor:
        "#EEEEEE",
    },

    headerIconButton: {
      width: 44,
      height: 44,
      justifyContent:
        "center",
      alignItems:
        "center",
    },

    headerSpacer: {
      width: 44,
    },

    headerCenter: {
      alignItems:
        "center",
    },

    headerTitle: {
      fontSize: 20,
      fontWeight: "800",
      color: "#111111",
    },

    headerSubtitle: {
      fontSize: 12,
      color: "#888888",
      marginTop: 2,
    },

    scroll: {
      flex: 1,
    },

    scrollContent: {
      padding: 18,
      paddingBottom: 30,
    },

    restaurantCard: {
      backgroundColor:
        "#FFFFFF",
      borderRadius: 18,
      padding: 18,
      marginBottom: 18,
      borderWidth: 1,
      borderColor:
        "#E8E8E8",
    },

    restaurantHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "space-between",
      marginBottom: 18,
    },

    restaurantTitleContainer: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
      paddingRight: 10,
    },

    restaurantIcon: {
      width: 38,
      height: 38,
      borderRadius: 12,
      justifyContent:
        "center",
      alignItems:
        "center",
      backgroundColor:
        "#EAF5FF",
      marginRight: 10,
    },

    restaurantName: {
      flex: 1,
      fontSize: 18,
      fontWeight: "800",
      color: "#111111",
    },

    addMoreText: {
      color: "#208AEF",
      fontWeight: "700",
      fontSize: 13,
    },

    divider: {
      height: 1,
      backgroundColor:
        "#EEEEEE",
      marginVertical: 16,
    },

    productRow: {
      flexDirection: "row",
      alignItems:
        "center",
    },

    productInfo: {
      flex: 1,
      paddingRight: 12,
    },

    productName: {
      fontSize: 16,
      fontWeight: "700",
      color: "#111111",
      marginBottom: 5,
    },

    productUnitPrice: {
      color: "#888888",
      fontSize: 12,
      marginBottom: 6,
    },

    productTotal: {
      color: "#111111",
      fontSize: 15,
      fontWeight: "700",
    },

    productActions: {
      alignItems:
        "flex-end",
      gap: 10,
    },

    quantityContainer: {
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1,
      borderColor:
        "#DDE8F3",
      borderRadius: 12,
      overflow: "hidden",
      backgroundColor:
        "#F8FBFE",
    },

    quantityButton: {
      width: 38,
      height: 38,
      justifyContent:
        "center",
      alignItems:
        "center",
    },

    quantityText: {
      minWidth: 28,
      textAlign: "center",
      fontSize: 15,
      fontWeight: "700",
      color: "#111111",
    },

    removeButton: {
      width: 38,
      height: 34,
      borderRadius: 9,
      borderWidth: 1,
      borderColor:
        "#F3CCCC",
      justifyContent:
        "center",
      alignItems:
        "center",
    },

    restaurantTotalRow: {
      flexDirection: "row",
      justifyContent:
        "space-between",
      borderTopWidth: 1,
      borderTopColor:
        "#EEEEEE",
      paddingTop: 16,
      marginTop: 18,
    },

    restaurantTotalLabel: {
      fontSize: 14,
      color: "#777777",
      fontWeight: "600",
    },

    restaurantTotalValue: {
      fontSize: 16,
      color: "#111111",
      fontWeight: "800",
    },

    customOrderCard: {
      backgroundColor:
        "#FFFFFF",
      borderRadius: 18,
      padding: 18,
      marginBottom: 18,
      borderWidth: 1,
      borderColor:
        "#D8E9F8",
    },

    customOrderHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "space-between",
      marginBottom: 16,
    },

    customOrderTitleContainer: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      paddingRight: 12,
    },

    customOrderIcon: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor:
        "#EAF5FF",
      justifyContent:
        "center",
      alignItems:
        "center",
      marginRight: 11,
    },

    customOrderTitleTextContainer: {
      flex: 1,
    },

    customOrderLabel: {
      fontSize: 12,
      color: "#777777",
      fontWeight: "600",
      marginBottom: 2,
    },

    customOrderPlace: {
      fontSize: 18,
      color: "#111111",
      fontWeight: "800",
    },

    customOrderRemoveButton: {
      width: 38,
      height: 38,
      borderRadius: 10,
      borderWidth: 1,
      borderColor:
        "#F3CCCC",
      justifyContent:
        "center",
      alignItems:
        "center",
    },

    customOrderRequestBox: {
      backgroundColor:
        "#F7F8FA",
      borderRadius: 12,
      padding: 14,
    },

    customOrderRequestLabel: {
      fontSize: 12,
      color: "#777777",
      fontWeight: "700",
      marginBottom: 6,
    },

    customOrderRequest: {
      color: "#222222",
      fontSize: 15,
      lineHeight: 21,
    },

    customOrderPriceRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 7,
      marginTop: 14,
    },

    customOrderPriceText: {
      flex: 1,
      color: "#777777",
      fontSize: 12,
      lineHeight: 18,
    },

    multiRestaurantInfo: {
      flexDirection: "row",
      alignItems:
        "flex-start",
      paddingHorizontal: 5,
      gap: 8,
    },

    multiRestaurantInfoText: {
      flex: 1,
      color: "#777777",
      fontSize: 13,
      lineHeight: 19,
    },

    checkoutContainer: {
      backgroundColor:
        "#FFFFFF",
      paddingHorizontal: 20,
      paddingTop: 15,
      paddingBottom: 15,
      borderTopWidth: 1,
      borderTopColor:
        "#E7E7E7",
    },

    totalRow: {
      flexDirection: "row",
      justifyContent:
        "space-between",
      alignItems:
        "center",
      marginBottom: 13,
    },

    totalLabel: {
      fontSize: 16,
      color: "#555555",
      fontWeight: "600",
    },

    totalValue: {
      fontSize: 22,
      color: "#111111",
      fontWeight: "800",
    },

    deliveryRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 10,
    },

    deliveryLabel: {
      color: "#666666",
      fontSize: 14,
      fontWeight: "600",
    },

    deliveryValue: {
      color: "#222222",
      fontSize: 15,
      fontWeight: "700",
    },

    grandTotalRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingTop: 10,
      marginBottom: 13,
      borderTopWidth: 1,
      borderTopColor: "#E7E7E7",
    },

    grandTotalLabel: {
      color: "#111111",
      fontSize: 17,
      fontWeight: "800",
    },

    grandTotalValue: {
      color: "#111111",
      fontSize: 22,
      fontWeight: "800",
    },

    checkoutCustomNote: {
      color: "#777777",
      fontSize: 12,
      lineHeight: 18,
      marginTop: -3,
      marginBottom: 12,
    },

    buyButton: {
      backgroundColor:
        "#208AEF",
      borderRadius: 13,
      paddingVertical: 16,
      alignItems:
        "center",
    },

    buyButtonDisabled: {
      opacity: 0.55,
    },

    buyButtonText: {
      color: "#FFFFFF",
      fontSize: 17,
      fontWeight: "800",
    },

    confirmationBackdrop: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.42)",
      justifyContent: "center",
      alignItems: "center",
      padding: 24,
    },

    confirmationCard: {
      width: "100%",
      maxWidth: 380,
      backgroundColor: "#FFFFFF",
      borderRadius: 20,
      padding: 24,
      alignItems: "center",
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 20,
      elevation: 10,
    },

    confirmationIcon: {
      width: 58,
      height: 58,
      borderRadius: 29,
      backgroundColor: "#FDEEEE",
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 16,
    },

    orderConfirmationIcon: {
      width: 58,
      height: 58,
      borderRadius: 29,
      backgroundColor: "#EAF5FF",
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 16,
    },

    confirmationTitle: {
      color: "#111111",
      fontSize: 21,
      fontWeight: "800",
      marginBottom: 8,
    },

    confirmationText: {
      color: "#666666",
      fontSize: 15,
      lineHeight: 22,
      textAlign: "center",
      marginBottom: 22,
    },

    confirmationActions: {
      width: "100%",
      flexDirection: "row",
      gap: 10,
    },

    confirmationCancelButton: {
      flex: 1,
      minHeight: 48,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: "#D8D8D8",
      alignItems: "center",
      justifyContent: "center",
    },

    confirmationCancelText: {
      color: "#555555",
      fontSize: 15,
      fontWeight: "700",
    },

    confirmationDeleteButton: {
      flex: 1,
      minHeight: 48,
      borderRadius: 12,
      backgroundColor: "#E04646",
      alignItems: "center",
      justifyContent: "center",
    },

    confirmationDeleteText: {
      color: "#FFFFFF",
      fontSize: 15,
      fontWeight: "800",
    },

    orderConfirmButton: {
      flex: 1,
      minHeight: 48,
      borderRadius: 12,
      backgroundColor: "#208AEF",
      alignItems: "center",
      justifyContent: "center",
    },

    orderSummaryBox: {
      width: "100%",
      backgroundColor: "#F7F9FB",
      borderRadius: 13,
      padding: 14,
      marginBottom: 20,
    },

    orderSummaryRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 5,
    },

    orderSummaryLabel: {
      color: "#666666",
      fontSize: 14,
      fontWeight: "600",
    },

    orderSummaryValue: {
      color: "#222222",
      fontSize: 15,
      fontWeight: "700",
    },

    orderSummaryTotal: {
      borderTopWidth: 1,
      borderTopColor: "#DFE3E8",
      marginTop: 7,
      paddingTop: 12,
    },

    orderSummaryTotalText: {
      color: "#111111",
      fontSize: 16,
      fontWeight: "800",
    },

    emptyContainer: {
      flex: 1,
      justifyContent:
        "center",
      alignItems:
        "center",
      paddingHorizontal: 35,
    },

    emptyIcon: {
      width: 86,
      height: 86,
      borderRadius: 43,
      backgroundColor:
        "#EAF5FF",
      justifyContent:
        "center",
      alignItems:
        "center",
      marginBottom: 20,
    },

    emptyTitle: {
      fontSize: 23,
      fontWeight: "800",
      color: "#111111",
      marginBottom: 8,
    },

    emptyDescription: {
      fontSize: 15,
      lineHeight: 22,
      color: "#777777",
      textAlign: "center",
      marginBottom: 25,
    },

    exploreButton: {
      backgroundColor:
        "#208AEF",
      borderRadius: 11,
      paddingHorizontal: 30,
      paddingVertical: 14,
    },

    exploreButtonText: {
      color: "#FFFFFF",
      fontWeight: "700",
      fontSize: 15,
    },
  });
