import {
  useEffect,
  useState,
} from "react";

import {
  ActivityIndicator,
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import Ionicons from "@expo/vector-icons/Ionicons";

import {
  router,
} from "expo-router";

import {
  useAuth,
} from "../context/AuthContext";

import {
  useCart,
} from "../context/CartContext";

import {
  Restaurant as AdminRestaurant,
  createRestaurant,
  disableRestaurant,
  enableRestaurant,
  getRestaurants,
  updateRestaurant,
} from "../services/adminRestaurantService";

import {
  getActiveRestaurants,
  Restaurant as PublicRestaurant,
} from "../services/restaurantService";

import {
  createProduct,
  getMyProducts,
  Product,
  setProductAvailability,
} from "../services/productService";

import {
  pickAndPrepareImage,
} from "../services/imageService";


// ==================================================
// HOME
// ==================================================

export default function HomeScreen() {
  const {
    user,
    role,
    loading,
  } =
    useAuth();


  if (loading) {
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

          <Text
            style={
              styles.loadingText
            }
          >
            Laster...
          </Text>
        </View>
      </SafeAreaView>
    );
  }


  if (!user) {
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
          <Text
            style={
              styles.logo
            }
          >
            KjørNesodden
          </Text>
        </View>


        <View
          style={
            styles.centerContainer
          }
        >
          <Text
            style={
              styles.welcomeTitle
            }
          >
            Velkommen til KjørNesodden
          </Text>


          <Text
            style={
              styles.description
            }
          >
            Du må logge inn for å se restauranter og innholdet i appen.
          </Text>


          <TouchableOpacity
            style={
              styles.loginButton
            }
            onPress={() =>
              router.push(
                "/login"
              )
            }
          >
            <Text
              style={
                styles.loginButtonText
              }
            >
              Logg inn
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }


  if (
    role ===
    "customer"
  ) {
    return (
      <CustomerHomeScreen />
    );
  }


  if (
    role ===
    "restaurant"
  ) {
    return (
      <RestaurantHomeScreen />
    );
  }


  if (
    role ===
    "admin"
  ) {
    return (
      <AdminHomeScreen />
    );
  }


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
            styles.welcomeTitle
          }
        >
          Ingen brukerrolle funnet
        </Text>
      </View>
    </SafeAreaView>
  );
}


// ==================================================
// CUSTOMER
// ==================================================

function CustomerHomeScreen() {
  const {
    totalItems,
  } =
    useCart();


  const [
    restaurants,
    setRestaurants,
  ] =
    useState<
      PublicRestaurant[]
    >([]);


  const [
    loadingRestaurants,
    setLoadingRestaurants,
  ] =
    useState(true);


  const loadRestaurants =
    async () => {
      try {
        setLoadingRestaurants(
          true
        );


        const data =
          await getActiveRestaurants();


        setRestaurants(
          data
        );

      } catch (error) {
        console.log(
          error
        );


        Alert.alert(
          "Feil",
          "Kunne ikke hente restauranter."
        );

      } finally {
        setLoadingRestaurants(
          false
        );
      }
    };


  useEffect(() => {
    loadRestaurants();
  }, []);


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


        <TouchableOpacity
          style={
            styles.headerCartButton
          }
          onPress={() =>
            router.push(
              "/cart"
            )
          }
        >
          <Ionicons
            name="cart-outline"
            size={28}
            color="#111111"
          />


          {totalItems >
            0 && (
            <View
              style={
                styles.headerCartBadge
              }
            >
              <Text
                style={
                  styles.headerCartBadgeText
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


      {/* RESTAURANTS */}

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
          Restauranter
        </Text>


        <Text
          style={
            styles.pageSubtitle
          }
        >
          Hva har du lyst på i dag?
        </Text>


        {loadingRestaurants ? (
          <ActivityIndicator
            size="large"
            color="#208AEF"
          />
        ) : restaurants.length ===
          0 ? (
          <View
            style={
              styles.emptyCard
            }
          >
            <Text
              style={
                styles.emptyTitle
              }
            >
              Ingen restauranter
            </Text>

            <Text
              style={
                styles.emptyText
              }
            >
              Det finnes ingen aktive restauranter akkurat nå.
            </Text>
          </View>
        ) : (
          restaurants.map(
            (
              restaurant
            ) => (
              <TouchableOpacity
                key={
                  restaurant.id
                }
                style={
                  styles.customerRestaurantCard
                }
                activeOpacity={
                  0.8
                }
                onPress={() =>
                  router.push({
                    pathname:
                      "/restaurant/[id]",

                    params: {
                      id:
                        restaurant.id,
                    },
                  })
                }
              >
                {restaurant.imageUrl ? (
                  <Image
                    source={{
                      uri:
                        restaurant.imageUrl,
                    }}
                    style={
                      styles.restaurantImage
                    }
                    resizeMode="cover"
                  />
                ) : (
                  <View
                    style={
                      styles.restaurantImagePlaceholder
                    }
                  >
                    <Text
                      style={
                        styles.restaurantImageLetter
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
                    styles.customerRestaurantInfo
                  }
                >
                  <Text
                    style={
                      styles.customerRestaurantName
                    }
                  >
                    {restaurant.name}
                  </Text>


                  <Text
                    style={
                      styles.customerRestaurantDescription
                    }
                  >
                    {restaurant.description}
                  </Text>


                  <Text
                    style={
                      styles.openRestaurantText
                    }
                  >
                    Se meny →
                  </Text>
                </View>
              </TouchableOpacity>
            )
          )
        )}


        {/* ==================================================
            CUSTOM ORDER
        ================================================== */}

        <TouchableOpacity
          style={
            styles.customOrderCard
          }
          activeOpacity={
            0.8
          }
          onPress={() =>
            router.push(
              "/custom-order" as any
            )
          }
        >
          <View
            style={
              styles.customOrderImage
            }
          >
            <View
              style={
                styles.customOrderIcon
              }
            >
              <Ionicons
                name="bag-handle-outline"
                size={50}
                color="#208AEF"
              />
            </View>
          </View>


          <View
            style={
              styles.customOrderContent
            }
          >
            <Text
              style={
                styles.customOrderTitle
              }
            >
              Finner du ikke restauranten?
            </Text>


            <Text
              style={
                styles.customOrderDescription
              }
            >
              Vil du kjøpe brød, grønnsaker, frukt, blomster eller noe annet? Fortell oss hvor vi skal handle og hva du vil ha, så henter vi det for deg.
            </Text>


            <Text
              style={
                styles.customOrderLink
              }
            >
              Bestill noe annet →
            </Text>
          </View>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}


// ==================================================
// RESTAURANT
// ==================================================

function RestaurantHomeScreen() {
  const [
    products,
    setProducts,
  ] =
    useState<Product[]>([]);


  const [
    name,
    setName,
  ] =
    useState("");


  const [
    description,
    setDescription,
  ] =
    useState("");


  const [
    price,
    setPrice,
  ] =
    useState("");


  const [
    productImage,
    setProductImage,
  ] =
    useState("");


  const [
    loadingProducts,
    setLoadingProducts,
  ] =
    useState(true);


  const [
    creating,
    setCreating,
  ] =
    useState(false);


  const [
    selectingImage,
    setSelectingImage,
  ] =
    useState(false);


  const [
    productSearch,
    setProductSearch,
  ] =
    useState("");


  // ==================================================
  // LOAD
  // ==================================================

  const loadProducts =
    async () => {
      try {
        setLoadingProducts(
          true
        );


        const data =
          await getMyProducts();


        setProducts(
          data
        );

      } catch (
        error: any
      ) {
        console.log(
          error
        );


        Alert.alert(
          "Feil",
          error.message ||
            "Kunne ikke hente produkter."
        );

      } finally {
        setLoadingProducts(
          false
        );
      }
    };


  useEffect(() => {
    loadProducts();
  }, []);


  // ==================================================
  // IMAGE
  // ==================================================

  const handleSelectImage =
    async () => {
      try {
        setSelectingImage(
          true
        );


        const image =
          await pickAndPrepareImage();


        if (image) {
          setProductImage(
            image
          );
        }

      } catch (
        error: any
      ) {
        Alert.alert(
          "Feil",
          error.message ||
            "Kunne ikke velge bildet."
        );

      } finally {
        setSelectingImage(
          false
        );
      }
    };


  // ==================================================
  // CREATE PRODUCT
  // ==================================================

  const handleCreateProduct =
    async () => {
      try {
        setCreating(
          true
        );


        await createProduct(
          name,
          description,
          price,
          productImage
        );


        setName("");
        setDescription("");
        setPrice("");
        setProductImage("");


        await loadProducts();


        Alert.alert(
          "Produkt opprettet",
          "Produktet vises nå i restaurantens meny."
        );

      } catch (
        error: any
      ) {
        Alert.alert(
          "Feil",
          error.message ||
            "Kunne ikke opprette produkt."
        );

      } finally {
        setCreating(
          false
        );
      }
    };


  // ==================================================
  // AVAILABILITY
  // ==================================================

  const toggleProduct =
    async (
      product:
        Product
    ) => {
      try {
        await setProductAvailability(
          product.id,
          !product.available
        );


        await loadProducts();

      } catch (
        error: any
      ) {
        Alert.alert(
          "Feil",
          error.message ||
            "Kunne ikke oppdatere produktet."
        );
      }
    };


  // ==================================================
  // PRODUCT SEARCH
  // ==================================================

  const normalizedProductSearch =
    productSearch
      .trim()
      .toLowerCase();


  const filteredProducts =
    normalizedProductSearch
      ? products.filter(
          (
            product
          ) =>
            product.name
              .toLowerCase()
              .includes(
                normalizedProductSearch
              )
        )
      : products;


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
        <Text
          style={
            styles.logo
          }
        >
          KjørNesodden
        </Text>


        <View
          style={
            styles.roleBadge
          }
        >
          <Text
            style={
              styles.roleBadgeText
            }
          >
            Restaurant
          </Text>
        </View>
      </View>


      <ScrollView
        style={
          styles.scroll
        }
        contentContainerStyle={
          styles.scrollContent
        }
        keyboardShouldPersistTaps="handled"
      >
        <Text
          style={
            styles.pageTitle
          }
        >
          Produkter
        </Text>


        <Text
          style={
            styles.pageSubtitle
          }
        >
          Administrer restaurantens meny.
        </Text>


        {/* ADD PRODUCT */}

        <View
          style={
            styles.formCard
          }
        >
          <Text
            style={
              styles.sectionTitle
            }
          >
            Legg til produkt
          </Text>


          <Text
            style={
              styles.inputLabel
            }
          >
            Produktnavn
          </Text>

          <TextInput
            style={
              styles.input
            }
            placeholder="Cheeseburger"
            placeholderTextColor="#A0A0A0"
            value={
              name
            }
            onChangeText={
              setName
            }
          />


          <Text
            style={
              styles.inputLabel
            }
          >
            Beskrivelse
          </Text>

          <TextInput
            style={[
              styles.input,
              styles.multilineInput,
            ]}
            placeholder="Burger med ost, salat og dressing"
            placeholderTextColor="#A0A0A0"
            value={
              description
            }
            onChangeText={
              setDescription
            }
            multiline
          />


          <Text
            style={
              styles.inputLabel
            }
          >
            Pris
          </Text>

          <TextInput
            style={
              styles.input
            }
            placeholder="149"
            placeholderTextColor="#A0A0A0"
            value={
              price
            }
            onChangeText={
              setPrice
            }
            keyboardType="decimal-pad"
          />


          <Text
            style={
              styles.inputLabel
            }
          >
            Produktbilde
          </Text>


          <TouchableOpacity
            style={
              styles.imagePickerButton
            }
            onPress={
              handleSelectImage
            }
            disabled={
              selectingImage
            }
          >
            <Text
              style={
                styles.imagePickerButtonText
              }
            >
              {selectingImage
                ? "Behandler bilde..."
                : productImage
                ? "Bytt bilde"
                : "Velg bilde fra filer"}
            </Text>
          </TouchableOpacity>


          {productImage ? (
            <>
              <Image
                source={{
                  uri:
                    productImage,
                }}
                style={
                  styles.imagePreview
                }
                resizeMode="cover"
              />


              <TouchableOpacity
                onPress={() =>
                  setProductImage(
                    ""
                  )
                }
              >
                <Text
                  style={
                    styles.removeImageText
                  }
                >
                  Fjern bilde
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <View
              style={
                styles.noImageBox
              }
            >
              <Text
                style={
                  styles.noImageText
                }
              >
                Ingen bilde valgt
              </Text>
            </View>
          )}


          <TouchableOpacity
            style={[
              styles.primaryButton,

              creating &&
                styles.disabledButton,
            ]}
            disabled={
              creating
            }
            onPress={
              handleCreateProduct
            }
          >
            <Text
              style={
                styles.primaryButtonText
              }
            >
              {creating
                ? "Oppretter..."
                : "+ Legg til produkt"}
            </Text>
          </TouchableOpacity>
        </View>


        {/* PRODUCTS */}

        <Text
          style={
            styles.sectionTitle
          }
        >
          Mine produkter
        </Text>


        <View
          style={
            styles.productSearchContainer
          }
        >
          <Ionicons
            name="search-outline"
            size={19}
            color="#888888"
          />


          <TextInput
            style={
              styles.productSearchInput
            }
            value={
              productSearch
            }
            onChangeText={
              setProductSearch
            }
            placeholder="Søk etter produkt..."
            placeholderTextColor="#A0A0A0"
            autoCapitalize="none"
            autoCorrect={
              false
            }
            returnKeyType="search"
          />


          {productSearch.length >
            0 && (
            <TouchableOpacity
              style={
                styles.productSearchClearButton
              }
              onPress={() =>
                setProductSearch(
                  ""
                )
              }
            >
              <Ionicons
                name="close-circle"
                size={20}
                color="#A0A0A0"
              />
            </TouchableOpacity>
          )}
        </View>


        {loadingProducts ? (
          <ActivityIndicator
            size="large"
            color="#208AEF"
          />
        ) : products.length ===
          0 ? (
          <View
            style={
              styles.emptyCard
            }
          >
            <Text
              style={
                styles.emptyTitle
              }
            >
              Ingen produkter
            </Text>

            <Text
              style={
                styles.emptyText
              }
            >
              Legg til restaurantens første produkt ovenfor.
            </Text>
          </View>
        ) : filteredProducts.length ===
          0 ? (
          <View
            style={
              styles.emptyCard
            }
          >
            <Text
              style={
                styles.emptyTitle
              }
            >
              Ingen treff
            </Text>


            <Text
              style={
                styles.emptyText
              }
            >
              Ingen produkter matcher søket ditt.
            </Text>
          </View>
        ) : (
          filteredProducts.map(
            (
              product
            ) => (
              <View
                key={
                  product.id
                }
                style={
                  styles.manageProductCard
                }
              >
                {product.imageData ? (
                  <Image
                    source={{
                      uri:
                        product.imageData,
                    }}
                    style={
                      styles.manageProductImage
                    }
                    resizeMode="cover"
                  />
                ) : (
                  <View
                    style={
                      styles.manageProductPlaceholder
                    }
                  >
                    <Text
                      style={
                        styles.manageProductLetter
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


                <View
                  style={
                    styles.manageProductContent
                  }
                >
                  <View
                    style={
                      styles.manageProductTop
                    }
                  >
                    <Text
                      style={
                        styles.manageProductName
                      }
                    >
                      {product.name}
                    </Text>


                    <View
                      style={[
                        styles.statusBadge,

                        product.available
                          ? styles.activeBadge
                          : styles.inactiveBadge,
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusText,

                          product.available
                            ? styles.activeText
                            : styles.inactiveText,
                        ]}
                      >
                        {product.available
                          ? "Tilgjengelig"
                          : "Utsolgt"}
                      </Text>
                    </View>
                  </View>


                  <Text
                    style={
                      styles.manageProductDescription
                    }
                  >
                    {product.description}
                  </Text>


                  <Text
                    style={
                      styles.manageProductPrice
                    }
                  >
                    {product.price.toLocaleString(
                      "nb-NO"
                    )}{" "}
                    kr
                  </Text>


                  <TouchableOpacity
                    style={[
                      styles.availabilityButton,

                      product.available
                        ? styles.makeUnavailableButton
                        : styles.makeAvailableButton,
                    ]}
                    onPress={() =>
                      toggleProduct(
                        product
                      )
                    }
                  >
                    <Text
                      style={[
                        styles.availabilityButtonText,

                        product.available
                          ? styles.makeUnavailableText
                          : styles.makeAvailableText,
                      ]}
                    >
                      {product.available
                        ? "Marker som utsolgt"
                        : "Gjør tilgjengelig"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )
          )
        )}
      </ScrollView>
    </SafeAreaView>
  );
}


// ==================================================
// ADMIN
// ==================================================

function AdminHomeScreen() {
  const [
    restaurants,
    setRestaurants,
  ] =
    useState<
      AdminRestaurant[]
    >([]);


  const [
    name,
    setName,
  ] =
    useState("");


  const [
    description,
    setDescription,
  ] =
    useState("");


  const [
    code,
    setCode,
  ] =
    useState("");


  const [
    imageUrl,
    setImageUrl,
  ] =
    useState("");


  const [
    editingId,
    setEditingId,
  ] =
    useState<
      string | null
    >(null);


  const [
    editName,
    setEditName,
  ] =
    useState("");


  const [
    editDescription,
    setEditDescription,
  ] =
    useState("");


  const [
    editImageUrl,
    setEditImageUrl,
  ] =
    useState("");


  const [
    loadingRestaurants,
    setLoadingRestaurants,
  ] =
    useState(true);


  const [
    creating,
    setCreating,
  ] =
    useState(false);


  const [
    saving,
    setSaving,
  ] =
    useState(false);


  // ==================================================
  // LOAD
  // ==================================================

  const loadRestaurants =
    async () => {
      try {
        setLoadingRestaurants(
          true
        );


        const data =
          await getRestaurants();


        setRestaurants(
          data
        );

      } catch (
        error: any
      ) {
        Alert.alert(
          "Feil",
          error.message ||
            "Kunne ikke hente restauranter."
        );

      } finally {
        setLoadingRestaurants(
          false
        );
      }
    };


  useEffect(() => {
    loadRestaurants();
  }, []);


  // ==================================================
  // CREATE
  // ==================================================

  const handleCreateRestaurant =
    async () => {
      try {
        setCreating(
          true
        );


        await createRestaurant(
          name,
          description,
          code,
          imageUrl
        );


        setName("");
        setDescription("");
        setCode("");
        setImageUrl("");


        await loadRestaurants();


        Alert.alert(
          "Restaurant opprettet",
          "Restauranten kan nå logge inn."
        );

      } catch (
        error: any
      ) {
        Alert.alert(
          "Feil",
          error.message ||
            "Kunne ikke opprette restaurant."
        );

      } finally {
        setCreating(
          false
        );
      }
    };


  // ==================================================
  // EDIT
  // ==================================================

  const startEditing =
    (
      restaurant:
        AdminRestaurant
    ) => {
      setEditingId(
        restaurant.id
      );

      setEditName(
        restaurant.name
      );

      setEditDescription(
        restaurant.description
      );

      setEditImageUrl(
        restaurant.imageUrl
      );
    };


  const cancelEditing =
    () => {
      setEditingId(
        null
      );

      setEditName("");
      setEditDescription("");
      setEditImageUrl("");
    };


  const handleSaveEdit =
    async () => {
      if (!editingId) {
        return;
      }


      try {
        setSaving(
          true
        );


        await updateRestaurant(
          editingId,
          editName,
          editDescription,
          editImageUrl
        );


        cancelEditing();


        await loadRestaurants();


        Alert.alert(
          "Lagret",
          "Restauranten er oppdatert."
        );

      } catch (
        error: any
      ) {
        Alert.alert(
          "Feil",
          error.message ||
            "Kunne ikke lagre."
        );

      } finally {
        setSaving(
          false
        );
      }
    };


  // ==================================================
  // ACTIVE
  // ==================================================

  const toggleRestaurant =
    async (
      restaurant:
        AdminRestaurant
    ) => {
      try {
        if (
          restaurant.active
        ) {
          await disableRestaurant(
            restaurant.id
          );
        } else {
          await enableRestaurant(
            restaurant.id
          );
        }


        await loadRestaurants();

      } catch (
        error: any
      ) {
        Alert.alert(
          "Feil",
          error.message ||
            "Kunne ikke oppdatere."
        );
      }
    };


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
        <Text
          style={
            styles.logo
          }
        >
          KjørNesodden
        </Text>


        <View
          style={
            styles.roleBadge
          }
        >
          <Text
            style={
              styles.roleBadgeText
            }
          >
            Admin
          </Text>
        </View>
      </View>


      <ScrollView
        style={
          styles.scroll
        }
        contentContainerStyle={
          styles.scrollContent
        }
        keyboardShouldPersistTaps="handled"
      >
        <Text
          style={
            styles.pageTitle
          }
        >
          Restauranter
        </Text>


        <Text
          style={
            styles.pageSubtitle
          }
        >
          Administrer restaurantene i KjørNesodden.
        </Text>


        <View
          style={
            styles.formCard
          }
        >
          <Text
            style={
              styles.sectionTitle
            }
          >
            Legg til restaurant
          </Text>


          <Text
            style={
              styles.inputLabel
            }
          >
            Restaurantnavn
          </Text>

          <TextInput
            style={
              styles.input
            }
            value={
              name
            }
            onChangeText={
              setName
            }
          />


          <Text
            style={
              styles.inputLabel
            }
          >
            Beskrivelse
          </Text>

          <TextInput
            style={[
              styles.input,
              styles.multilineInput,
            ]}
            value={
              description
            }
            onChangeText={
              setDescription
            }
            multiline
          />


          <Text
            style={
              styles.inputLabel
            }
          >
            Bilde-URL
          </Text>

          <TextInput
            style={
              styles.input
            }
            placeholder="https://..."
            placeholderTextColor="#A0A0A0"
            value={
              imageUrl
            }
            onChangeText={
              setImageUrl
            }
            autoCapitalize="none"
          />


          <Text
            style={
              styles.inputLabel
            }
          >
            Innloggingskode
          </Text>

          <TextInput
            style={
              styles.input
            }
            placeholder="Minst 6 tegn"
            placeholderTextColor="#A0A0A0"
            value={
              code
            }
            onChangeText={
              setCode
            }
            secureTextEntry
          />


          <TouchableOpacity
            style={
              styles.primaryButton
            }
            onPress={
              handleCreateRestaurant
            }
            disabled={
              creating
            }
          >
            <Text
              style={
                styles.primaryButtonText
              }
            >
              {creating
                ? "Oppretter..."
                : "+ Legg til restaurant"}
            </Text>
          </TouchableOpacity>
        </View>


        <Text
          style={
            styles.sectionTitle
          }
        >
          Registrerte restauranter
        </Text>


        {loadingRestaurants ? (
          <ActivityIndicator
            size="large"
            color="#208AEF"
          />
        ) : (
          restaurants.map(
            (
              restaurant
            ) => (
              <View
                key={
                  restaurant.id
                }
                style={
                  styles.adminRestaurantCard
                }
              >
                {restaurant.imageUrl ? (
                  <Image
                    source={{
                      uri:
                        restaurant.imageUrl,
                    }}
                    style={
                      styles.adminRestaurantImage
                    }
                    resizeMode="cover"
                  />
                ) : (
                  <View
                    style={
                      styles.adminRestaurantPlaceholder
                    }
                  >
                    <Text
                      style={
                        styles.adminRestaurantLetter
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


                {editingId ===
                restaurant.id ? (
                  <View
                    style={
                      styles.editArea
                    }
                  >
                    <Text
                      style={
                        styles.inputLabel
                      }
                    >
                      Restaurantnavn
                    </Text>

                    <TextInput
                      style={
                        styles.input
                      }
                      value={
                        editName
                      }
                      onChangeText={
                        setEditName
                      }
                    />


                    <Text
                      style={
                        styles.inputLabel
                      }
                    >
                      Beskrivelse
                    </Text>

                    <TextInput
                      style={[
                        styles.input,
                        styles.multilineInput,
                      ]}
                      value={
                        editDescription
                      }
                      onChangeText={
                        setEditDescription
                      }
                      multiline
                    />


                    <Text
                      style={
                        styles.inputLabel
                      }
                    >
                      Bilde-URL
                    </Text>

                    <TextInput
                      style={
                        styles.input
                      }
                      value={
                        editImageUrl
                      }
                      onChangeText={
                        setEditImageUrl
                      }
                    />


                    <View
                      style={
                        styles.row
                      }
                    >
                      <TouchableOpacity
                        style={
                          styles.secondaryButton
                        }
                        onPress={
                          cancelEditing
                        }
                      >
                        <Text
                          style={
                            styles.secondaryButtonText
                          }
                        >
                          Avbryt
                        </Text>
                      </TouchableOpacity>


                      <TouchableOpacity
                        style={
                          styles.primarySmallButton
                        }
                        onPress={
                          handleSaveEdit
                        }
                        disabled={
                          saving
                        }
                      >
                        <Text
                          style={
                            styles.primaryButtonText
                          }
                        >
                          Lagre
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <View
                    style={
                      styles.adminCardContent
                    }
                  >
                    <View
                      style={
                        styles.manageProductTop
                      }
                    >
                      <Text
                        style={
                          styles.manageProductName
                        }
                      >
                        {restaurant.name}
                      </Text>


                      <View
                        style={[
                          styles.statusBadge,

                          restaurant.active
                            ? styles.activeBadge
                            : styles.inactiveBadge,
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusText,

                            restaurant.active
                              ? styles.activeText
                              : styles.inactiveText,
                          ]}
                        >
                          {restaurant.active
                            ? "Aktiv"
                            : "Deaktivert"}
                        </Text>
                      </View>
                    </View>


                    <Text
                      style={
                        styles.manageProductDescription
                      }
                    >
                      {restaurant.description}
                    </Text>


                    <TouchableOpacity
                      style={
                        styles.editButton
                      }
                      onPress={() =>
                        startEditing(
                          restaurant
                        )
                      }
                    >
                      <Text
                        style={
                          styles.editButtonText
                        }
                      >
                        Rediger
                      </Text>
                    </TouchableOpacity>


                    <TouchableOpacity
                      style={
                        styles.secondaryActionButton
                      }
                      onPress={() =>
                        toggleRestaurant(
                          restaurant
                        )
                      }
                    >
                      <Text
                        style={
                          styles.secondaryActionText
                        }
                      >
                        {restaurant.active
                          ? "Deaktiver"
                          : "Aktiver"}
                      </Text>
                    </TouchableOpacity>
                  </View>
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
        "#FFFFFF",
    },

    header: {
      height: 70,
      paddingHorizontal: 22,
      flexDirection: "row",
      alignItems:
        "center",
      justifyContent:
        "space-between",
      borderBottomWidth: 1,
      borderBottomColor:
        "#EEEEEE",
    },

    logo: {
      fontSize: 22,
      fontWeight: "800",
      color: "#208AEF",
    },


    // CART HEADER

    headerCartButton: {
      width: 50,
      height: 50,
      justifyContent:
        "center",
      alignItems:
        "center",
      position:
        "relative",
    },

    headerCartBadge: {
      position:
        "absolute",
      top: 2,
      right: 0,
      minWidth: 20,
      height: 20,
      borderRadius: 10,
      paddingHorizontal: 5,
      justifyContent:
        "center",
      alignItems:
        "center",
      backgroundColor:
        "#208AEF",
    },

    headerCartBadgeText: {
      color: "#FFFFFF",
      fontSize: 10,
      fontWeight: "800",
    },


    // COMMON

    roleBadge: {
      backgroundColor:
        "#EAF5FF",
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
    },

    roleBadgeText: {
      color: "#208AEF",
      fontWeight: "700",
    },

    centerContainer: {
      flex: 1,
      justifyContent:
        "center",
      alignItems:
        "center",
      padding: 30,
    },

    loadingText: {
      marginTop: 15,
      color: "#777777",
    },

    welcomeTitle: {
      fontSize: 28,
      fontWeight: "800",
      textAlign:
        "center",
      marginBottom: 15,
    },

    description: {
      color: "#777777",
      textAlign:
        "center",
      fontSize: 16,
      lineHeight: 24,
      marginBottom: 30,
    },

    loginButton: {
      backgroundColor:
        "#208AEF",
      paddingHorizontal: 40,
      paddingVertical: 15,
      borderRadius: 10,
    },

    loginButtonText: {
      color: "#FFFFFF",
      fontWeight: "700",
    },

    scroll: {
      flex: 1,
    },

    scrollContent: {
      padding: 22,
      paddingBottom: 60,
    },

    pageTitle: {
      fontSize: 28,
      fontWeight: "800",
      marginBottom: 5,
    },

    pageSubtitle: {
      fontSize: 16,
      color: "#777777",
      marginBottom: 25,
    },

    sectionTitle: {
      fontSize: 20,
      fontWeight: "800",
      marginBottom: 18,
    },

    productSearchContainer: {
      minHeight: 46,
      flexDirection: "row",
      alignItems: "center",
      backgroundColor:
        "#FFFFFF",
      borderWidth: 1,
      borderColor:
        "#E2E2E2",
      borderRadius: 12,
      paddingLeft: 13,
      paddingRight: 8,
      marginBottom: 18,
    },

    productSearchInput: {
      flex: 1,
      minHeight: 44,
      paddingHorizontal: 10,
      paddingVertical: 0,
      fontSize: 15,
      color:
        "#111111",
    },

    productSearchClearButton: {
      width: 38,
      height: 38,
      alignItems: "center",
      justifyContent:
        "center",
    },

    formCard: {
      borderWidth: 1,
      borderColor:
        "#E5E5E5",
      borderRadius: 15,
      padding: 18,
      backgroundColor:
        "#FAFAFA",
      marginBottom: 30,
    },

    inputLabel: {
      fontSize: 14,
      fontWeight: "600",
      marginBottom: 7,
    },

    input: {
      borderWidth: 1,
      borderColor:
        "#DDDDDD",
      backgroundColor:
        "#FFFFFF",
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 13,
      fontSize: 16,
      marginBottom: 17,
    },

    multilineInput: {
      minHeight: 85,
      textAlignVertical:
        "top",
    },

    primaryButton: {
      backgroundColor:
        "#208AEF",
      paddingVertical: 15,
      borderRadius: 10,
      alignItems:
        "center",
      marginTop: 8,
    },

    primarySmallButton: {
      flex: 1,
      backgroundColor:
        "#208AEF",
      paddingVertical: 13,
      borderRadius: 10,
      alignItems:
        "center",
    },

    primaryButtonText: {
      color: "#FFFFFF",
      fontWeight: "700",
      fontSize: 15,
    },

    disabledButton: {
      opacity: 0.6,
    },


    // IMAGE PICKER

    imagePickerButton: {
      borderWidth: 1,
      borderColor:
        "#208AEF",
      borderRadius: 10,
      paddingVertical: 14,
      alignItems:
        "center",
      backgroundColor:
        "#FFFFFF",
      marginBottom: 12,
    },

    imagePickerButtonText: {
      color: "#208AEF",
      fontWeight: "700",
      fontSize: 15,
    },

    imagePreview: {
      width: "100%",
      height: 230,
      borderRadius: 12,
      marginBottom: 8,
      backgroundColor:
        "#EEEEEE",
    },

    removeImageText: {
      color: "#E04646",
      fontWeight: "600",
      textAlign:
        "center",
      marginBottom: 16,
    },

    noImageBox: {
      height: 90,
      borderWidth: 1,
      borderStyle:
        "dashed",
      borderColor:
        "#CCCCCC",
      borderRadius: 10,
      justifyContent:
        "center",
      alignItems:
        "center",
      marginBottom: 17,
      backgroundColor:
        "#FFFFFF",
    },

    noImageText: {
      color: "#999999",
    },


    // CUSTOMER

    customerRestaurantCard: {
      borderWidth: 1,
      borderColor:
        "#E5E5E5",
      borderRadius: 18,
      overflow: "hidden",
      marginBottom: 24,
      backgroundColor:
        "#FFFFFF",
    },

    restaurantImage: {
      width: "100%",
      height: 230,
    },

    restaurantImagePlaceholder: {
      height: 230,
      backgroundColor:
        "#EAF5FF",
      justifyContent:
        "center",
      alignItems:
        "center",
    },

    restaurantImageLetter: {
      fontSize: 60,
      color: "#208AEF",
      fontWeight: "800",
    },

    customerRestaurantInfo: {
      padding: 20,
    },

    customerRestaurantName: {
      fontSize: 22,
      fontWeight: "800",
      marginBottom: 7,
    },

    customerRestaurantDescription: {
      color: "#777777",
      fontSize: 15,
      lineHeight: 21,
      marginBottom: 14,
    },

    openRestaurantText: {
      color: "#208AEF",
      fontWeight: "700",
      fontSize: 15,
    },


    // CUSTOM ORDER CARD

    customOrderCard: {
      borderWidth: 1,
      borderColor:
        "#D8E9F8",
      borderRadius: 18,
      overflow: "hidden",
      marginBottom: 24,
      backgroundColor:
        "#FFFFFF",
    },

    customOrderImage: {
      width: "100%",
      height: 230,
      backgroundColor:
        "#EAF5FF",
      justifyContent:
        "center",
      alignItems:
        "center",
    },

    customOrderIcon: {
      width: 105,
      height: 105,
      borderRadius: 53,
      backgroundColor:
        "#FFFFFF",
      justifyContent:
        "center",
      alignItems:
        "center",
    },

    customOrderContent: {
      padding: 20,
    },

    customOrderTitle: {
      fontSize: 22,
      fontWeight: "800",
      color: "#111111",
      marginBottom: 9,
    },

    customOrderDescription: {
      color: "#6F6F6F",
      fontSize: 15,
      lineHeight: 22,
      marginBottom: 14,
    },

    customOrderLink: {
      color: "#208AEF",
      fontWeight: "700",
      fontSize: 15,
    },


    // PRODUCT MANAGEMENT

    manageProductCard: {
      borderWidth: 1,
      borderColor:
        "#E5E5E5",
      borderRadius: 18,
      overflow: "hidden",
      marginBottom: 24,
      backgroundColor:
        "#FFFFFF",
    },

    manageProductImage: {
      width: "100%",
      height: 230,
    },

    manageProductPlaceholder: {
      height: 230,
      backgroundColor:
        "#EAF5FF",
      justifyContent:
        "center",
      alignItems:
        "center",
    },

    manageProductLetter: {
      fontSize: 55,
      color: "#208AEF",
      fontWeight: "800",
    },

    manageProductContent: {
      padding: 20,
    },

    manageProductTop: {
      flexDirection: "row",
      justifyContent:
        "space-between",
      alignItems:
        "center",
      gap: 10,
    },

    manageProductName: {
      flex: 1,
      fontSize: 20,
      fontWeight: "800",
    },

    manageProductDescription: {
      color: "#777777",
      fontSize: 15,
      lineHeight: 21,
      marginTop: 7,
    },

    manageProductPrice: {
      fontSize: 18,
      fontWeight: "800",
      marginTop: 14,
    },

    statusBadge: {
      paddingHorizontal: 9,
      paddingVertical: 5,
      borderRadius: 15,
    },

    activeBadge: {
      backgroundColor:
        "#E8F8EE",
    },

    inactiveBadge: {
      backgroundColor:
        "#FDECEC",
    },

    statusText: {
      fontSize: 11,
      fontWeight: "700",
    },

    activeText: {
      color: "#278A4B",
    },

    inactiveText: {
      color: "#C84343",
    },

    availabilityButton: {
      marginTop: 17,
      paddingVertical: 12,
      borderRadius: 9,
      borderWidth: 1,
      alignItems:
        "center",
    },

    makeUnavailableButton: {
      borderColor:
        "#E04646",
    },

    makeAvailableButton: {
      borderColor:
        "#208AEF",
    },

    availabilityButtonText: {
      fontWeight: "700",
    },

    makeUnavailableText: {
      color: "#E04646",
    },

    makeAvailableText: {
      color: "#208AEF",
    },


    // ADMIN

    adminRestaurantCard: {
      borderWidth: 1,
      borderColor:
        "#E5E5E5",
      borderRadius: 15,
      overflow: "hidden",
      marginBottom: 18,
    },

    adminRestaurantImage: {
      width: "100%",
      height: 200,
    },

    adminRestaurantPlaceholder: {
      height: 200,
      backgroundColor:
        "#EAF5FF",
      justifyContent:
        "center",
      alignItems:
        "center",
    },

    adminRestaurantLetter: {
      fontSize: 50,
      fontWeight: "800",
      color: "#208AEF",
    },

    adminCardContent: {
      padding: 17,
    },

    editArea: {
      padding: 17,
    },

    row: {
      flexDirection: "row",
      gap: 10,
    },

    secondaryButton: {
      flex: 1,
      borderWidth: 1,
      borderColor:
        "#CCCCCC",
      borderRadius: 10,
      paddingVertical: 13,
      alignItems:
        "center",
    },

    secondaryButtonText: {
      color: "#555555",
      fontWeight: "700",
    },

    editButton: {
      marginTop: 15,
      borderWidth: 1,
      borderColor:
        "#208AEF",
      paddingVertical: 11,
      borderRadius: 9,
      alignItems:
        "center",
    },

    editButtonText: {
      color: "#208AEF",
      fontWeight: "700",
    },

    secondaryActionButton: {
      marginTop: 10,
      borderWidth: 1,
      borderColor:
        "#E04646",
      paddingVertical: 11,
      borderRadius: 9,
      alignItems:
        "center",
    },

    secondaryActionText: {
      color: "#E04646",
      fontWeight: "700",
    },


    // EMPTY

    emptyCard: {
      borderWidth: 1,
      borderColor:
        "#E5E5E5",
      backgroundColor:
        "#FAFAFA",
      borderRadius: 15,
      padding: 25,
      alignItems:
        "center",
    },

    emptyTitle: {
      fontSize: 17,
      fontWeight: "700",
      marginBottom: 5,
    },

    emptyText: {
      color: "#777777",
      textAlign:
        "center",
    },
  });