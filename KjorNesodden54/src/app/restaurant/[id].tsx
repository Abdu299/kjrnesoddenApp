import {
  useEffect,
  useState,
} from "react";

import {
  ActivityIndicator,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import {
  router,
  useLocalSearchParams,
} from "expo-router";

import {
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import {
  getRestaurantById,
  Restaurant,
} from "../../services/restaurantService";

import {
  Product,
  subscribeToProductsForRestaurant,
} from "../../services/productService";

import {
  useCart,
} from "../../context/CartContext";


// ==================================================
// PAGE
// ==================================================

export default function RestaurantScreen() {
  const insets =
    useSafeAreaInsets();


  const {
    id,
  } =
    useLocalSearchParams<{
      id: string;
    }>();


  const {
    items,
    addItem,
    totalItems,
  } =
    useCart();


  const [
    restaurant,
    setRestaurant,
  ] =
    useState<
      Restaurant | null
    >(null);


  const [
    products,
    setProducts,
  ] =
    useState<Product[]>(
      []
    );


  const [
    loading,
    setLoading,
  ] =
    useState(
      true
    );


  const [
    notFound,
    setNotFound,
  ] =
    useState(
      false
    );


  const [
    showFloatingBack,
    setShowFloatingBack,
  ] =
    useState(
      false
    );


  // ==================================================
  // LOAD RESTAURANT
  // ==================================================

  useEffect(
    () => {
      const loadRestaurant =
        async () => {
          if (!id) {
            setNotFound(
              true
            );

            setLoading(
              false
            );

            return;
          }


          try {
            const restaurantData =
              await getRestaurantById(
                id
              );


            if (
              !restaurantData ||
              !restaurantData.active
            ) {
              setNotFound(
                true
              );

              return;
            }


            setRestaurant(
              restaurantData
            );

          } catch (
            error
          ) {
            console.log(
              "Restaurant page error:",
              error
            );


            setNotFound(
              true
            );

          } finally {
            setLoading(
              false
            );
          }
        };


      loadRestaurant();

    },
    [
      id,
    ]
  );


  // ==================================================
  // REALTIME PRODUCTS
  // ==================================================

  useEffect(
    () => {
      if (!id) {
        return;
      }


      const unsubscribe =
        subscribeToProductsForRestaurant(
          id,

          (
            updatedProducts
          ) => {
            setProducts(
              updatedProducts
            );
          },

          (
            error
          ) => {
            console.log(
              "Product listener error:",
              error
            );
          }
        );


      return () => {
        unsubscribe();
      };

    },
    [
      id,
    ]
  );


  // ==================================================
  // LOADING
  // ==================================================

  if (loading) {
    return (
      <SafeAreaView
        style={
          styles.container
        }
      >
        <View
          style={
            styles.center
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
            Laster restaurant...
          </Text>
        </View>
      </SafeAreaView>
    );
  }


  // ==================================================
  // ERROR
  // ==================================================

  if (
    notFound ||
    !restaurant
  ) {
    return (
      <SafeAreaView
        style={
          styles.container
        }
      >
        <View
          style={
            styles.center
          }
        >
          <Text
            style={
              styles.errorTitle
            }
          >
            Restauranten er ikke tilgjengelig
          </Text>


          <TouchableOpacity
            style={
              styles.backButton
            }
            onPress={() =>
              router.back()
            }
          >
            <Text
              style={
                styles.backButtonText
              }
            >
              Tilbake
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }


  // ==================================================
  // ADD PRODUCT
  // ==================================================

  const handleAddProduct =
    (
      product:
        Product
    ) => {
      if (
        !product.available
      ) {
        return;
      }


      addItem({
        productId:
          product.id,

        restaurantId:
          restaurant.id,

        restaurantName:
          restaurant.name,

        productName:
          product.name,

        price:
          product.price,
      });
    };


  // ==================================================
  // SCROLL
  // ==================================================

  const handleScroll =
    (event: any) => {
      const scrollY =
        event.nativeEvent
          .contentOffset.y;


      const shouldShow =
        scrollY >
        220;


      if (
        shouldShow !==
        showFloatingBack
      ) {
        setShowFloatingBack(
          shouldShow
        );
      }
    };


  // ==================================================
  // UI
  // ==================================================

  return (
    <SafeAreaView
      style={
        styles.container
      }
    >
      <ScrollView
        contentContainerStyle={{
          paddingBottom:
            40,
        }}
        onScroll={
          handleScroll
        }
        scrollEventThrottle={
          16
        }
      >

        {/* RESTAURANT IMAGE */}

        {restaurant.imageUrl ? (
          <Image
            source={{
              uri:
                restaurant.imageUrl,
            }}
            style={
              styles.heroImage
            }
            resizeMode="cover"
          />
        ) : (
          <View
            style={
              styles.heroPlaceholder
            }
          >
            <Text
              style={
                styles.heroPlaceholderText
              }
            >
              {restaurant.name
                .charAt(
                  0
                )
                .toUpperCase()}
            </Text>
          </View>
        )}


        <View
          style={
            styles.content
          }
        >

          {/* TOP */}

          <View
            style={
              styles.topActions
            }
          >
            <TouchableOpacity
              style={
                styles.backAction
              }
              onPress={() =>
                router.back()
              }
            >
              <Text
                style={
                  styles.backText
                }
              >
                ← Tilbake
              </Text>
            </TouchableOpacity>


            <TouchableOpacity
              style={
                styles.cartHeaderButton
              }
              onPress={() =>
                router.push(
                  "/cart" as any
                )
              }
            >
              <Text
                style={
                  styles.cartIcon
                }
              >
                🛒
              </Text>


              {totalItems >
                0 && (
                <View
                  style={
                    styles.cartBadge
                  }
                >
                  <Text
                    style={
                      styles.cartBadgeText
                    }
                  >
                    {totalItems >
                    99
                      ? "99+"
                      : totalItems}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>


          {/* RESTAURANT INFO */}

          <Text
            style={
              styles.name
            }
          >
            {restaurant.name}
          </Text>


          <Text
            style={
              styles.description
            }
          >
            {restaurant.description}
          </Text>


          <View
            style={
              styles.divider
            }
          />


          <Text
            style={
              styles.menuTitle
            }
          >
            Meny
          </Text>


          {/* PRODUCTS */}

          {products.length ===
          0 ? (
            <View
              style={
                styles.emptyProducts
              }
            >
              <Text
                style={
                  styles.emptyProductsTitle
                }
              >
                Ingen produkter enda
              </Text>


              <Text
                style={
                  styles.emptyProductsText
                }
              >
                Restauranten har ikke lagt til noen produkter enda.
              </Text>
            </View>
          ) : (
            products.map(
              (
                product
              ) => {
                const cartItem =
                  items.find(
                    (
                      item
                    ) =>
                      item.productId ===
                      product.id
                  );


                return (
                  <View
                    key={
                      product.id
                    }
                    style={[
                      styles.productCard,

                      !product.available &&
                        styles.productUnavailable,
                    ]}
                  >

                    {/* IMAGE */}

                    {product.imageData ? (
                      <Image
                        source={{
                          uri:
                            product.imageData,
                        }}
                        style={
                          styles.productImage
                        }
                        resizeMode="cover"
                      />
                    ) : (
                      <View
                        style={
                          styles.productImagePlaceholder
                        }
                      >
                        <Text
                          style={
                            styles.productImageLetter
                          }
                        >
                          {product.name
                            .charAt(
                              0
                            )
                            .toUpperCase()}
                        </Text>
                      </View>
                    )}


                    {/* PRODUCT CONTENT */}

                    <View
                      style={
                        styles.productContent
                      }
                    >
                      <View
                        style={
                          styles.productTitleRow
                        }
                      >
                        <Text
                          style={
                            styles.productName
                          }
                        >
                          {product.name}
                        </Text>


                        {!product.available && (
                          <View
                            style={
                              styles.soldOutBadge
                            }
                          >
                            <Text
                              style={
                                styles.soldOutText
                              }
                            >
                              Utsolgt
                            </Text>
                          </View>
                        )}
                      </View>


                      <Text
                        style={
                          styles.productDescription
                        }
                      >
                        {product.description}
                      </Text>


                      {cartItem && (
                        <Text
                          style={
                            styles.inCartText
                          }
                        >
                          {cartItem.quantity} stk. i handlekurven
                        </Text>
                      )}


                      <View
                        style={
                          styles.productBottom
                        }
                      >
                        <Text
                          style={
                            styles.productPrice
                          }
                        >
                          {product.price.toLocaleString(
                            "nb-NO"
                          )}{" "}
                          kr
                        </Text>


                        <TouchableOpacity
                          style={[
                            styles.addButton,

                            !product.available &&
                              styles.addButtonDisabled,
                          ]}
                          disabled={
                            !product.available
                          }
                          onPress={() =>
                            handleAddProduct(
                              product
                            )
                          }
                        >
                          <Text
                            style={
                              styles.addButtonText
                            }
                          >
                            + Legg til
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                );
              }
            )
          )}
        </View>
      </ScrollView>


      {/* ==================================================
          FLOATING BACK BUTTON
      ================================================== */}

      {showFloatingBack && (
        <TouchableOpacity
          style={[
            styles.floatingBackButton,

            {
              top:
                insets.top +
                10,
            },
          ]}
          activeOpacity={
            0.85
          }
          onPress={() =>
            router.back()
          }
        >
          <Text
            style={
              styles.floatingBackArrow
            }
          >
            ←
          </Text>


          <Text
            style={
              styles.floatingBackText
            }
          >
            Tilbake
          </Text>
        </TouchableOpacity>
      )}


      {/* ==================================================
          GO TO CART
      ================================================== */}

      {totalItems > 0 && (
        <View
          style={
            styles.cartFooter
          }
        >
          <TouchableOpacity
            style={
              styles.cartFooterButton
            }
            activeOpacity={
              0.85
            }
            onPress={() =>
              router.push(
                "/cart" as any
              )
            }
          >
            <Text
              style={
                styles.cartFooterButtonText
              }
            >
              Gå til handlekurven
            </Text>


            <View
              style={
                styles.cartFooterCount
              }
            >
              <Text
                style={
                  styles.cartFooterCountText
                }
              >
                {totalItems > 99
                  ? "99+"
                  : totalItems}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      )}
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
        "#FFFFFF",
    },

    center: {
      flex: 1,
      justifyContent:
        "center",
      alignItems:
        "center",
      padding: 30,
    },

    loadingText: {
      marginTop: 14,
      color:
        "#777777",
    },

    heroImage: {
      width:
        "100%",
      height: 280,
      backgroundColor:
        "#F2F2F2",
    },

    heroPlaceholder: {
      width:
        "100%",
      height: 280,
      backgroundColor:
        "#EAF5FF",
      justifyContent:
        "center",
      alignItems:
        "center",
    },

    heroPlaceholderText: {
      fontSize: 75,
      fontWeight:
        "800",
      color:
        "#208AEF",
    },

    content: {
      padding: 22,
    },

    topActions: {
      flexDirection:
        "row",
      justifyContent:
        "space-between",
      alignItems:
        "center",
      marginBottom: 22,
    },

    backAction: {
      minHeight: 44,
      justifyContent:
        "center",
    },

    backText: {
      color:
        "#208AEF",
      fontSize: 15,
      fontWeight:
        "700",
    },

    floatingBackButton: {
      position:
        "absolute",
      left: 14,
      zIndex: 30,
      elevation: 8,
      minHeight: 44,
      borderRadius: 22,
      paddingHorizontal: 15,
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "center",
      backgroundColor:
        "#FFFFFF",
      borderWidth: 1,
      borderColor:
        "#E5E5E5",
      shadowColor:
        "#000000",
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity:
        0.16,
      shadowRadius:
        5,
    },

    floatingBackArrow: {
      color:
        "#208AEF",
      fontSize: 21,
      fontWeight:
        "700",
      marginRight: 6,
      marginTop: -1,
    },

    floatingBackText: {
      color:
        "#208AEF",
      fontSize: 14,
      fontWeight:
        "800",
    },

    cartHeaderButton: {
      width: 48,
      height: 48,
      justifyContent:
        "center",
      alignItems:
        "center",
      position:
        "relative",
    },

    cartIcon: {
      fontSize: 26,
    },

    cartBadge: {
      position:
        "absolute",
      top: 0,
      right: 0,
      minWidth: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor:
        "#208AEF",
      justifyContent:
        "center",
      alignItems:
        "center",
      paddingHorizontal: 4,
    },

    cartBadgeText: {
      color:
        "#FFFFFF",
      fontSize: 10,
      fontWeight:
        "800",
    },

    cartFooter: {
      backgroundColor:
        "#FFFFFF",
      borderTopWidth: 1,
      borderTopColor:
        "#E7E7E7",
      paddingHorizontal: 18,
      paddingTop: 12,
      paddingBottom: 12,
    },

    cartFooterButton: {
      minHeight: 56,
      borderRadius: 14,
      backgroundColor:
        "#208AEF",
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "center",
      paddingHorizontal: 18,
      position:
        "relative",
    },

    cartFooterButtonText: {
      color:
        "#FFFFFF",
      fontSize: 17,
      fontWeight:
        "800",
    },

    cartFooterCount: {
      position:
        "absolute",
      right: 16,
      minWidth: 30,
      height: 30,
      borderRadius: 15,
      backgroundColor:
        "#FFFFFF",
      alignItems:
        "center",
      justifyContent:
        "center",
      paddingHorizontal: 7,
    },

    cartFooterCountText: {
      color:
        "#208AEF",
      fontSize: 13,
      fontWeight:
        "800",
    },

    name: {
      fontSize: 30,
      fontWeight:
        "800",
      color:
        "#111111",
      marginBottom: 8,
    },

    description: {
      fontSize: 16,
      color:
        "#777777",
      lineHeight: 23,
    },

    divider: {
      height: 1,
      backgroundColor:
        "#EEEEEE",
      marginVertical: 25,
    },

    menuTitle: {
      fontSize: 24,
      fontWeight:
        "800",
      color:
        "#111111",
      marginBottom: 20,
    },

    productCard: {
      borderWidth: 1,
      borderColor:
        "#E5E5E5",
      borderRadius: 18,
      overflow:
        "hidden",
      marginBottom: 24,
      backgroundColor:
        "#FFFFFF",
    },

    productUnavailable: {
      opacity: 0.65,
    },

    productImage: {
      width:
        "100%",
      height: 240,
      backgroundColor:
        "#F2F2F2",
    },

    productImagePlaceholder: {
      width:
        "100%",
      height: 240,
      backgroundColor:
        "#F2F7FC",
      justifyContent:
        "center",
      alignItems:
        "center",
    },

    productImageLetter: {
      fontSize: 60,
      fontWeight:
        "800",
      color:
        "#208AEF",
    },

    productContent: {
      padding: 20,
    },

    productTitleRow: {
      flexDirection:
        "row",
      justifyContent:
        "space-between",
      alignItems:
        "center",
      gap: 10,
    },

    productName: {
      flex: 1,
      fontSize: 21,
      fontWeight:
        "800",
      color:
        "#111111",
    },

    productDescription: {
      fontSize: 15,
      color:
        "#777777",
      lineHeight: 21,
      marginTop: 8,
    },

    inCartText: {
      color:
        "#208AEF",
      fontSize: 13,
      fontWeight:
        "700",
      marginTop: 10,
    },

    productBottom: {
      flexDirection:
        "row",
      justifyContent:
        "space-between",
      alignItems:
        "center",
      marginTop: 18,
    },

    productPrice: {
      fontSize: 19,
      fontWeight:
        "800",
      color:
        "#111111",
    },

    addButton: {
      backgroundColor:
        "#208AEF",
      paddingHorizontal: 18,
      minHeight: 46,
      borderRadius: 23,
      justifyContent:
        "center",
      alignItems:
        "center",
    },

    addButtonDisabled: {
      backgroundColor:
        "#CCCCCC",
    },

    addButtonText: {
      color:
        "#FFFFFF",
      fontSize: 14,
      fontWeight:
        "700",
    },

    soldOutBadge: {
      backgroundColor:
        "#FDECEC",
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 20,
    },

    soldOutText: {
      color:
        "#C84343",
      fontSize: 12,
      fontWeight:
        "700",
    },

    emptyProducts: {
      borderWidth: 1,
      borderColor:
        "#E5E5E5",
      borderRadius: 15,
      padding: 25,
      backgroundColor:
        "#FAFAFA",
      alignItems:
        "center",
    },

    emptyProductsTitle: {
      fontSize: 17,
      fontWeight:
        "700",
      color:
        "#111111",
      marginBottom: 6,
    },

    emptyProductsText: {
      fontSize: 14,
      color:
        "#777777",
      textAlign:
        "center",
      lineHeight: 20,
    },

    errorTitle: {
      fontSize: 21,
      fontWeight:
        "700",
      color:
        "#111111",
      textAlign:
        "center",
      marginBottom: 20,
    },

    backButton: {
      backgroundColor:
        "#208AEF",
      paddingHorizontal: 30,
      paddingVertical: 13,
      borderRadius: 10,
    },

    backButtonText: {
      color:
        "#FFFFFF",
      fontWeight:
        "700",
    },
  });