import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import {
  useAuth,
} from "../context/AuthContext";

import {
  useRestaurantLanguage,
} from "../context/RestaurantLanguageContext";

import {
  markRestaurantRequestCompleted,
  RestaurantRequest,
  subscribeToMyRestaurantRequests,
} from "../services/restaurantRequestService";


// ==================================================
// VIEW
// ==================================================

type RequestView =
  | "pending"
  | "completed";


// ==================================================
// DATE
// ==================================================

function formatDate(
  request:
    RestaurantRequest,
  completed:
    boolean,
  language:
    "no" | "en"
) {
  const timestamp =
    completed
      ? request.completedAt
      : request.createdAt;


  if (!timestamp) {
    return "";
  }


  try {
    return timestamp
      .toDate()
      .toLocaleString(
        language === "en"
          ? "en-GB"
          : "nb-NO",
        {
          day:
            "2-digit",

          month:
            "2-digit",

          year:
            "numeric",

          hour:
            "2-digit",

          minute:
            "2-digit",
        }
      );

  } catch {
    return "";
  }
}


// ==================================================
// PAGE
// ==================================================

export default function RequestsScreen() {
  const {
    user,
    role,
    loading:
      authLoading,
  } =
    useAuth();


  const {
    language,
  } =
    useRestaurantLanguage();


  const tr =
    (
      norwegian: string,
      english: string
    ) =>
      language === "en"
        ? english
        : norwegian;


  const [
    selectedView,
    setSelectedView,
  ] =
    useState<RequestView>(
      "pending"
    );


  const [
    requests,
    setRequests,
  ] =
    useState<
      RestaurantRequest[]
    >([]);


  const [
    loadingRequests,
    setLoadingRequests,
  ] =
    useState(
      true
    );


  const [
    completingId,
    setCompletingId,
  ] =
    useState<
      string | null
    >(
      null
    );


  // ==================================================
  // REALTIME LISTENER
  // ==================================================

  useEffect(
    () => {
      if (
        authLoading ||
        !user ||
        role !==
          "restaurant"
      ) {
        return;
      }


      setLoadingRequests(
        true
      );


      const unsubscribe =
        subscribeToMyRestaurantRequests(
          (
            updatedRequests
          ) => {
            setRequests(
              updatedRequests
            );

            setLoadingRequests(
              false
            );
          },

          (
            error
          ) => {
            console.log(
              "Requests page error:",
              error
            );


            setLoadingRequests(
              false
            );


            Alert.alert(
              tr(
                "Feil",
                "Error"
              ),
              tr(
                "Kunne ikke hente bestillingene.",
                "Could not load the orders."
              )
            );
          }
        );


      return unsubscribe;

    },
    [
      authLoading,
      user?.uid,
      role,
    ]
  );


  // ==================================================
  // FILTER
  // ==================================================

  const pendingRequests =
    useMemo(
      () =>
        requests.filter(
          (
            request
          ) =>
            request.status ===
            "pending"
        ),

      [
        requests,
      ]
    );


  const completedRequests =
    useMemo(
      () =>
        requests.filter(
          (
            request
          ) =>
            request.status ===
            "completed"
        ),

      [
        requests,
      ]
    );


  const visibleRequests =
    selectedView ===
    "pending"
      ? pendingRequests
      : completedRequests;


  // ==================================================
  // COMPLETE
  // ==================================================

  const completeRequest =
    async (
      request:
        RestaurantRequest
    ) => {
      if (
        completingId
      ) {
        return;
      }


      try {
        setCompletingId(
          request.id
        );


        await markRestaurantRequestCompleted(
          request.id
        );


        /*
          No manual move is necessary.

          Firestore onSnapshot updates the request,
          and it automatically disappears from Nye
          and appears under Ferdig.
        */

      } catch (
        error: any
      ) {
        console.log(
          "Complete request error:",
          error
        );


        Alert.alert(
          tr(
            "Feil",
            "Error"
          ),
          language === "en"
            ? "Could not mark the order as completed."
            : error.message ||
              "Kunne ikke markere bestillingen som ferdig."
        );

      } finally {
        setCompletingId(
          null
        );
      }
    };


  const handleComplete =
    (
      request:
        RestaurantRequest
    ) => {
      Alert.alert(
        tr(
          "Marker som ferdig",
          "Mark as completed"
        ),

        language === "en"
          ? `Do you want to mark the order from ${request.customerName} as completed?`
          : `Vil du markere bestillingen fra ${request.customerName} som ferdig?`,

        [
          {
            text:
              tr(
                "Avbryt",
                "Cancel"
              ),

            style:
              "cancel",
          },

          {
            text:
              tr(
                "Marker som ferdig",
                "Mark as completed"
              ),

            onPress:
              () =>
                completeRequest(
                  request
                ),
          },
        ]
      );
    };


  // ==================================================
  // LOADING AUTH
  // ==================================================

  if (
    authLoading
  ) {
    return (
      <SafeAreaView
        style={
          styles.container
        }
      >
        <View
          style={
            styles.centerContainer
          }
        >
          <ActivityIndicator
            size="large"
            color="#208AEF"
          />
        </View>
      </SafeAreaView>
    );
  }


  // ==================================================
  // RESTAURANT ONLY
  // ==================================================

  if (
    !user ||
    role !==
      "restaurant"
  ) {
    return (
      <SafeAreaView
        style={
          styles.container
        }
      >
        <View
          style={
            styles.centerContainer
          }
        >
          <Text
            style={
              styles.accessTitle
            }
          >
            {tr("Ikke tilgjengelig", "Not available")}
          </Text>


          <Text
            style={
              styles.accessText
            }
          >
            {tr("Denne siden er bare tilgjengelig for restauranter.", "This page is only available to restaurants.")}
          </Text>
        </View>
      </SafeAreaView>
    );
  }


  // ==================================================
  // UI
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
        <Text
          style={
            styles.logo
          }
        >
          KjørNesodden
        </Text>
      </View>


      <ScrollView
        style={
          styles.scroll
        }
        contentContainerStyle={
          styles.scrollContent
        }
      >
        <Text
          style={
            styles.pageTitle
          }
        >
          {tr("Bestillinger", "Orders")}
        </Text>


        <Text
          style={
            styles.pageSubtitle
          }
        >
          {tr("Se nye bestillinger og bestillinger som er ferdige.", "View new and completed orders.")}
        </Text>


        {/* ==================================================
            SWITCH
        ================================================== */}

        <View
          style={
            styles.switchContainer
          }
        >
          <TouchableOpacity
            style={[
              styles.switchButton,

              selectedView ===
                "pending" &&
                styles.switchButtonActive,
            ]}
            onPress={() =>
              setSelectedView(
                "pending"
              )
            }
          >
            <Text
              style={[
                styles.switchText,

                selectedView ===
                  "pending" &&
                  styles.switchTextActive,
              ]}
            >
              {tr("Nye", "New")}
            </Text>


            {pendingRequests.length >
              0 && (
              <View
                style={[
                  styles.countBadge,

                  selectedView ===
                    "pending" &&
                    styles.countBadgeActive,
                ]}
              >
                <Text
                  style={[
                    styles.countBadgeText,

                    selectedView ===
                      "pending" &&
                      styles.countBadgeTextActive,
                  ]}
                >
                  {pendingRequests.length}
                </Text>
              </View>
            )}
          </TouchableOpacity>


          <TouchableOpacity
            style={[
              styles.switchButton,

              selectedView ===
                "completed" &&
                styles.switchButtonActive,
            ]}
            onPress={() =>
              setSelectedView(
                "completed"
              )
            }
          >
            <Text
              style={[
                styles.switchText,

                selectedView ===
                  "completed" &&
                  styles.switchTextActive,
              ]}
            >
              {tr("Ferdig", "Completed")}
            </Text>


            {completedRequests.length >
              0 && (
              <View
                style={[
                  styles.countBadge,

                  selectedView ===
                    "completed" &&
                    styles.countBadgeActive,
                ]}
              >
                <Text
                  style={[
                    styles.countBadgeText,

                    selectedView ===
                      "completed" &&
                      styles.countBadgeTextActive,
                  ]}
                >
                  {completedRequests.length}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>


        {/* ==================================================
            LOADING
        ================================================== */}

        {loadingRequests ? (
          <View
            style={
              styles.loadingContainer
            }
          >
            <ActivityIndicator
              size="large"
              color="#208AEF"
            />


            <Text
              style={
                styles.loadingText
              }
            >
              {tr("Laster bestillinger...", "Loading orders...")}
            </Text>
          </View>

        ) : visibleRequests.length ===
          0 ? (
          <View
            style={
              styles.emptyCard
            }
          >
            <Text
              style={
                styles.emptyIcon
              }
            >
              {selectedView ===
              "pending"
                ? "📭"
                : "✅"}
            </Text>


            <Text
              style={
                styles.emptyTitle
              }
            >
              {selectedView ===
              "pending"
                ? tr(
                    "Ingen nye bestillinger",
                    "No new orders"
                  )
                : tr(
                    "Ingen ferdige bestillinger",
                    "No completed orders"
                  )}
            </Text>


            <Text
              style={
                styles.emptyText
              }
            >
              {selectedView ===
              "pending"
                ? tr(
                    "Nye bestillinger vises her automatisk.",
                    "New orders will appear here automatically."
                  )
                : tr(
                    "Bestillinger du markerer som ferdige vises her.",
                    "Orders you mark as completed will appear here."
                  )}
            </Text>
          </View>

        ) : (
          visibleRequests.map(
            (
              request
            ) => (
              <View
                key={
                  request.id
                }
                style={
                  styles.requestCard
                }
              >
                {/* CUSTOMER */}

                <View
                  style={
                    styles.customerHeader
                  }
                >
                  <View
                    style={
                      styles.customerIcon
                    }
                  >
                    <Text
                      style={
                        styles.customerIconText
                      }
                    >
                      👤
                    </Text>
                  </View>


                  <View
                    style={
                      styles.customerInfo
                    }
                  >
                    <Text
                      style={
                        styles.customerName
                      }
                    >
                      {request.customerName}
                    </Text>


                    <Text
                      style={
                        styles.customerPhone
                      }
                    >
                      {request.customerPhone}
                    </Text>
                  </View>


                  {request.status ===
                    "pending" ? (
                    <View
                      style={
                        styles.newBadge
                      }
                    >
                      <Text
                        style={
                          styles.newBadgeText
                        }
                      >
                        {tr("Ny", "New")}
                      </Text>
                    </View>

                  ) : (
                    <View
                      style={
                        styles.completedBadge
                      }
                    >
                      <Text
                        style={
                          styles.completedBadgeText
                        }
                      >
                        {tr("Ferdig", "Completed")}
                      </Text>
                    </View>
                  )}
                </View>


                {/* DATE */}

                <Text
                  style={
                    styles.dateText
                  }
                >
                  {request.status ===
                  "completed"
                    ? `${tr(
                        "Ferdig",
                        "Completed"
                      )}: ${formatDate(
                        request,
                        true,
                        language
                      )}`
                    : `${tr(
                        "Mottatt",
                        "Received"
                      )}: ${formatDate(
                        request,
                        false,
                        language
                      )}`}
                </Text>


                <View
                  style={
                    styles.divider
                  }
                />


                {/* PRODUCTS */}

                {request.items.map(
                  (
                    item,
                    index
                  ) => (
                    <View
                      key={
                        `${item.productId}-${index}`
                      }
                      style={
                        styles.productRow
                      }
                    >
                      <View
                        style={
                          styles.quantityBox
                        }
                      >
                        <Text
                          style={
                            styles.quantityText
                          }
                        >
                          {item.quantity}×
                        </Text>
                      </View>


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
                            styles.productPrice
                          }
                        >
                          {item.price.toLocaleString(
                            language === "en"
                              ? "en-GB"
                              : "nb-NO"
                          )}{" "}
                          {tr(
                            "kr per stk.",
                            "kr each"
                          )}
                        </Text>
                      </View>


                      <Text
                        style={
                          styles.lineTotal
                        }
                      >
                        {item.lineTotal.toLocaleString(
                          language === "en"
                            ? "en-GB"
                            : "nb-NO"
                        )}{" "}
                        kr
                      </Text>
                    </View>
                  )
                )}


                {/* TOTAL */}

                <View
                  style={
                    styles.totalRow
                  }
                >
                  <Text
                    style={
                      styles.totalLabel
                    }
                  >
                    {tr("Totalt", "Total")}
                  </Text>


                  <Text
                    style={
                      styles.totalValue
                    }
                  >
                    {request.subtotal.toLocaleString(
                      language === "en"
                        ? "en-GB"
                        : "nb-NO"
                    )}{" "}
                    kr
                  </Text>
                </View>


                {/* COMPLETE */}

                {request.status ===
                  "pending" && (
                  <TouchableOpacity
                    style={[
                      styles.completeButton,

                      completingId ===
                        request.id &&
                        styles.completeButtonDisabled,
                    ]}
                    disabled={
                      completingId ===
                      request.id
                    }
                    onPress={() =>
                      handleComplete(
                        request
                      )
                    }
                  >
                    {completingId ===
                    request.id ? (
                      <ActivityIndicator
                        color="#FFFFFF"
                      />

                    ) : (
                      <Text
                        style={
                          styles.completeButtonText
                        }
                      >
                        {tr("Marker som ferdig", "Mark as completed")}
                      </Text>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            )
          )
        )}
      </ScrollView>
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
      paddingHorizontal: 20,
      justifyContent:
        "center",
      backgroundColor:
        "#FFFFFF",
      borderBottomWidth: 1,
      borderBottomColor:
        "#EEEEEE",
    },

    logo: {
      fontSize: 22,
      fontWeight: "800",
      color: "#111111",
    },

    scroll: {
      flex: 1,
    },

    scrollContent: {
      padding: 18,
      paddingBottom: 40,
    },

    pageTitle: {
      fontSize: 30,
      fontWeight: "800",
      color: "#111111",
      marginBottom: 6,
    },

    pageSubtitle: {
      fontSize: 15,
      lineHeight: 21,
      color: "#777777",
      marginBottom: 22,
    },

    switchContainer: {
      flexDirection: "row",
      padding: 4,
      backgroundColor:
        "#EDEFF2",
      borderRadius: 14,
      marginBottom: 22,
    },

    switchButton: {
      flex: 1,
      minHeight: 48,
      borderRadius: 11,
      flexDirection: "row",
      justifyContent:
        "center",
      alignItems: "center",
      gap: 7,
    },

    switchButtonActive: {
      backgroundColor:
        "#FFFFFF",
    },

    switchText: {
      fontSize: 15,
      fontWeight: "700",
      color: "#777777",
    },

    switchTextActive: {
      color: "#208AEF",
    },

    countBadge: {
      minWidth: 23,
      height: 23,
      borderRadius: 12,
      paddingHorizontal: 6,
      justifyContent:
        "center",
      alignItems: "center",
      backgroundColor:
        "#DADDE2",
    },

    countBadgeActive: {
      backgroundColor:
        "#EAF5FF",
    },

    countBadgeText: {
      fontSize: 11,
      fontWeight: "800",
      color: "#666666",
    },

    countBadgeTextActive: {
      color: "#208AEF",
    },

    loadingContainer: {
      paddingVertical: 60,
      alignItems: "center",
    },

    loadingText: {
      marginTop: 12,
      color: "#777777",
      fontSize: 14,
    },

    emptyCard: {
      backgroundColor:
        "#FFFFFF",
      borderWidth: 1,
      borderColor:
        "#E5E5E5",
      borderRadius: 18,
      padding: 35,
      alignItems: "center",
    },

    emptyIcon: {
      fontSize: 40,
      marginBottom: 12,
    },

    emptyTitle: {
      fontSize: 18,
      fontWeight: "800",
      color: "#111111",
      marginBottom: 7,
    },

    emptyText: {
      textAlign: "center",
      color: "#777777",
      fontSize: 14,
      lineHeight: 20,
    },

    requestCard: {
      backgroundColor:
        "#FFFFFF",
      borderWidth: 1,
      borderColor:
        "#E5E5E5",
      borderRadius: 18,
      padding: 18,
      marginBottom: 18,
    },

    customerHeader: {
      flexDirection: "row",
      alignItems: "center",
    },

    customerIcon: {
      width: 46,
      height: 46,
      borderRadius: 23,
      backgroundColor:
        "#EAF5FF",
      alignItems: "center",
      justifyContent:
        "center",
      marginRight: 12,
    },

    customerIconText: {
      fontSize: 22,
    },

    customerInfo: {
      flex: 1,
    },

    customerName: {
      fontSize: 17,
      fontWeight: "800",
      color: "#111111",
      marginBottom: 3,
    },

    customerPhone: {
      fontSize: 14,
      color: "#666666",
    },

    newBadge: {
      paddingHorizontal: 11,
      paddingVertical: 6,
      borderRadius: 20,
      backgroundColor:
        "#EAF5FF",
    },

    newBadgeText: {
      fontSize: 12,
      fontWeight: "800",
      color: "#208AEF",
    },

    completedBadge: {
      paddingHorizontal: 11,
      paddingVertical: 6,
      borderRadius: 20,
      backgroundColor:
        "#EAF8EF",
    },

    completedBadgeText: {
      fontSize: 12,
      fontWeight: "800",
      color: "#27894A",
    },

    dateText: {
      marginTop: 12,
      fontSize: 12,
      color: "#999999",
    },

    divider: {
      height: 1,
      backgroundColor:
        "#EEEEEE",
      marginVertical: 17,
    },

    productRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 16,
    },

    quantityBox: {
      minWidth: 38,
      height: 38,
      borderRadius: 10,
      backgroundColor:
        "#F3F5F7",
      alignItems: "center",
      justifyContent:
        "center",
      marginRight: 11,
    },

    quantityText: {
      fontSize: 14,
      fontWeight: "800",
      color: "#333333",
    },

    productInfo: {
      flex: 1,
      paddingRight: 10,
    },

    productName: {
      fontSize: 15,
      fontWeight: "700",
      color: "#111111",
      marginBottom: 3,
    },

    productPrice: {
      fontSize: 12,
      color: "#888888",
    },

    lineTotal: {
      fontSize: 14,
      fontWeight: "700",
      color: "#111111",
    },

    totalRow: {
      flexDirection: "row",
      justifyContent:
        "space-between",
      alignItems: "center",
      borderTopWidth: 1,
      borderTopColor:
        "#EEEEEE",
      paddingTop: 16,
      marginTop: 3,
    },

    totalLabel: {
      fontSize: 16,
      fontWeight: "700",
      color: "#555555",
    },

    totalValue: {
      fontSize: 19,
      fontWeight: "800",
      color: "#111111",
    },

    completeButton: {
      minHeight: 50,
      backgroundColor:
        "#208AEF",
      borderRadius: 12,
      justifyContent:
        "center",
      alignItems: "center",
      marginTop: 18,
    },

    completeButtonDisabled: {
      opacity: 0.6,
    },

    completeButtonText: {
      color: "#FFFFFF",
      fontSize: 15,
      fontWeight: "800",
    },

    centerContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent:
        "center",
      padding: 30,
    },

    accessTitle: {
      fontSize: 21,
      fontWeight: "800",
      color: "#111111",
      marginBottom: 8,
    },

    accessText: {
      color: "#777777",
      fontSize: 14,
      textAlign: "center",
    },
  });