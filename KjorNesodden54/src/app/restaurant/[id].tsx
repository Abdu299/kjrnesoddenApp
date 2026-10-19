import {
  useEffect,
  useRef,
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
    productsLoading,
    setProductsLoading,
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


  const [
    selectedCategory,
    setSelectedCategory,
  ] =
    useState("");


  const scrollRef =
    useRef<ScrollView>(null);


  const categoryOffsets =
    useRef<Record<string, number>>({});


  const productsOffset =
    useRef(0);


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


  useEffect(
    () => {
      const availableCategories =
        Array.from(
          new Set(
            products
              .map((product) => product.category?.trim() || "Annet")
          )
        );

      if (
        availableCategories.length > 0 &&
        !availableCategories.includes(selectedCategory)
      ) {
        setSelectedCategory(availableCategories[0]);
      }
    },
    [
      products,
      selectedCategory,
    ]
  );


  // ==================================================
  // REALTIME PRODUCTS FROM FIRESTORE
  // ==================================================

  useEffect(
    () => {
      if (!id) {
        return;
      }

      setProductsLoading(true);

      const unsubscribe = subscribeToProductsForRestaurant(
        id,
        (updatedProducts) => {
          setProducts(updatedProducts);
          setProductsLoading(false);
        },
        (error) => {
          console.log("Product listener error:", error);
          setProductsLoading(false);
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


      const currentCategory =
        [...categories]
          .reverse()
          .find(
            (category) =>
              scrollY + 150 >=
              (categoryOffsets.current[category] ?? Number.POSITIVE_INFINITY)
          );


      if (
        currentCategory &&
        currentCategory !== selectedCategory
      ) {
        setSelectedCategory(currentCategory);
      }
    };


  const scrollToCategory =
    (category: string) => {
      const offset =
        categoryOffsets.current[category];


      if (offset === undefined) {
        return;
      }


      setSelectedCategory(category);
      scrollRef.current?.scrollTo({
        y: Math.max(0, offset - 72),
        animated: true,
      });
    };


  // ==================================================
  // UI
  // ==================================================

  const categories =
    Array.from(
      new Set(
        products
          .map((product) => product.category?.trim() || "Annet")
      )
    );


  return (
    <SafeAreaView
      style={
        styles.container
      }
    >
      <ScrollView
        ref={scrollRef}
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
        stickyHeaderIndices={categories.length > 0 ? [2] : undefined}
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
            resizeMode="contain"
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


        <View style={styles.content}>

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

        </View>

        {categories.length > 0 && (
          <View style={styles.stickyCategoryBar}>
            {showFloatingBack && (
              <TouchableOpacity
                style={styles.stickyNavigationButton}
                activeOpacity={0.85}
                accessibilityLabel="Gå tilbake"
                onPress={() => router.back()}
              >
                <Text style={styles.stickyBackArrow}>←</Text>
              </TouchableOpacity>
            )}

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.categoryScroll}
              contentContainerStyle={styles.categoryTabs}
            >
              {categories.map((category) => {
                const selected = category === selectedCategory;

                return (
                  <TouchableOpacity
                    key={category}
                    style={[
                      styles.categoryTab,
                      selected && styles.categoryTabSelected,
                    ]}
                    onPress={() => scrollToCategory(category)}
                  >
                    <Text
                      style={[
                        styles.categoryTabText,
                        selected && styles.categoryTabTextSelected,
                      ]}
                    >
                      {category}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {showFloatingBack && (
              <TouchableOpacity
                style={styles.stickyNavigationButton}
                activeOpacity={0.85}
                accessibilityLabel="Gå til toppen"
                onPress={() => scrollRef.current?.scrollTo({ y: 0, animated: true })}
              >
                <Text style={styles.stickyTopArrow}>↑</Text>
              </TouchableOpacity>
            )}
          </View>
        )}


        {/* PRODUCTS */}

        <View
          style={styles.productsContainer}
          onLayout={(event) => {
            productsOffset.current = event.nativeEvent.layout.y;
          }}
        >
          {productsLoading ? (
            <View style={styles.menuLoading}>
              <ActivityIndicator
                size="small"
                color="#208AEF"
              />
              <Text style={styles.menuLoadingText}>
                Laster meny...
              </Text>
            </View>
          ) : products.length === 0 ? (
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
            categories.map((category) => (
              <View
                key={category}
                style={styles.categorySection}
                onLayout={(event) => {
                  categoryOffsets.current[category] =
                    productsOffset.current + event.nativeEvent.layout.y;
                }}
              >
                <Text style={styles.categoryHeading}>
                  {category}
                </Text>

                {products
                  .filter(
                    (product) =>
                      (product.category?.trim() || "Annet") === category
                  )
                  .map((product) => {
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
                    ) : null}


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
                  })}
              </View>
            ))
          )}
        </View>
      </ScrollView>


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
        "#FFFFFF",
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
      marginBottom: 0,
    },

    stickyCategoryBar: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#FFFFFF",
      borderBottomWidth: 1,
      borderBottomColor: "#E9E9E9",
      paddingVertical: 10,
      paddingHorizontal: 10,
      gap: 8,
      zIndex: 20,
      elevation: 5,
    },

    categoryScroll: {
      flex: 1,
    },

    categoryTabs: {
      gap: 10,
      paddingHorizontal: 12,
    },

    stickyNavigationButton: {
      width: 44,
      height: 44,
      flexShrink: 0,
      borderRadius: 22,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#FFFFFF",
      borderWidth: 1,
      borderColor: "#E5E5E5",
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.12,
      shadowRadius: 4,
      elevation: 4,
    },

    stickyBackArrow: {
      color: "#208AEF",
      fontSize: 26,
      fontWeight: "700",
      lineHeight: 29,
    },

    stickyTopArrow: {
      color: "#208AEF",
      fontSize: 25,
      fontWeight: "700",
      lineHeight: 28,
    },

    categoryTab: {
      minHeight: 46,
      paddingHorizontal: 18,
      borderRadius: 23,
      backgroundColor: "#F0EEE8",
      alignItems: "center",
      justifyContent: "center",
    },

    categoryTabSelected: {
      backgroundColor: "#17213B",
    },

    categoryTabText: {
      color: "#17213B",
      fontSize: 15,
      fontWeight: "700",
    },

    categoryTabTextSelected: {
      color: "#FFFFFF",
    },

    productsContainer: {
      paddingHorizontal: 22,
      paddingTop: 24,
    },

    categorySection: {
      marginBottom: 12,
    },

    categoryHeading: {
      color: "#111111",
      fontSize: 25,
      fontWeight: "800",
      marginBottom: 14,
      paddingTop: 4,
    },

    menuLoading: {
      minHeight: 120,
      alignItems: "center",
      justifyContent: "center",
    },

    menuLoadingText: {
      marginTop: 10,
      color: "#777777",
      fontSize: 14,
    },

    productCard: {
      borderWidth: 1,
      borderColor:
        "#E5E5E5",
      borderRadius: 18,
      overflow:
        "hidden",
      marginBottom: 14,
      backgroundColor:
        "#FFFFFF",
      shadowColor: "#000000",
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.05,
      shadowRadius: 7,
      elevation: 2,
    },

    productUnavailable: {
      opacity: 0.65,
    },

    productImage: {
      width:
        "100%",
      height: 190,
      backgroundColor:
        "#F2F2F2",
    },

    productContent: {
      padding: 16,
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
      fontSize: 18,
      fontWeight:
        "800",
      color:
        "#111111",
    },

    productDescription: {
      fontSize: 14,
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
      marginTop: 14,
    },

    productPrice: {
      fontSize: 18,
      fontWeight:
        "800",
      color:
        "#111111",
    },

    addButton: {
      backgroundColor:
        "#208AEF",
      paddingHorizontal: 16,
      minHeight: 42,
      borderRadius: 21,
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
