import KeyboardScrollView from "../components/KeyboardScrollView";
import { useThemedStyles } from "../context/ThemeContext";
import type { AppThemeColors } from "../constants/app-theme";
import {
  useCallback,
  useState,
} from "react";

import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import {
  router,
  useFocusEffect,
} from "expo-router";

import {
  getCurrentProfile,
} from "../services/profileService";

import {
  useCart,
} from "../context/CartContext";


// ==================================================
// CUSTOM ORDER
// ==================================================

export default function CustomOrderScreen() {
  const { styles, colors } = useThemedStyles(createStyles);

  const {
    addCustomItem,
  } =
    useCart();


  const [
    place,
    setPlace,
  ] =
    useState("");


  const [
    request,
    setRequest,
  ] =
    useState("");


  const [
    address,
    setAddress,
  ] =
    useState("");


  const [
    loadingProfile,
    setLoadingProfile,
  ] =
    useState(
      true
    );


  const [
    checkingAddress,
    setCheckingAddress,
  ] =
    useState(
      false
    );


  // ==================================================
  // LOAD CUSTOMER ADDRESS
  // ==================================================

  const loadCustomerAddress =
    useCallback(
      async () => {
        try {
          setLoadingProfile(
            true
          );


          const profile =
            await getCurrentProfile();


          if (
            profile.role ===
            "customer"
          ) {
            setAddress(
              profile.address ??
              ""
            );
          } else {
            setAddress("");
          }

        } catch (
          error
        ) {
          console.log(
            "Custom order profile error:",
            error
          );


          setAddress("");

        } finally {
          setLoadingProfile(
            false
          );
        }
      },
      []
    );


  useFocusEffect(
    useCallback(
      () => {
        loadCustomerAddress();
      },
      [
        loadCustomerAddress,
      ]
    )
  );


  // ==================================================
  // ADD TO CART
  // ==================================================

  const handleAddToCart =
    async () => {
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
        Alert.alert(
          "Mangler butikk",
          "Skriv inn navnet på restauranten eller butikken."
        );

        return;
      }


      if (
        cleanRequest.length <
        3
      ) {
        Alert.alert(
          "Mangler bestilling",
          "Fortell oss hva du vil at vi skal hente."
        );

        return;
      }


      if (
        cleanRequest.length >
        2000
      ) {
        Alert.alert(
          "Bestillingen er for lang",
          "Kort ned bestillingen før du legger den i handlekurven."
        );

        return;
      }


      try {
        setCheckingAddress(
          true
        );


        const profile =
          await getCurrentProfile();


        const latestAddress =
          profile.role ===
          "customer"
            ? (
                profile.address ??
                ""
              ).trim()
            : "";


        setAddress(
          latestAddress
        );


        if (
          !latestAddress
        ) {
          Alert.alert(
            "Mangler leveringsadresse",
            "Legg inn leveringsadressen din i Profil før du legger bestillingen i handlekurven."
          );

          return;
        }


        addCustomItem(
          cleanPlace,
          cleanRequest
        );


        setPlace("");
        setRequest("");


        router.push(
          "/cart" as any
        );

      } catch (
        error: any
      ) {
        console.log(
          "Custom order address check error:",
          error
        );


        Alert.alert(
          "Feil",
          error.message ||
            "Kunne ikke hente leveringsadressen. Prøv igjen."
        );

      } finally {
        setCheckingAddress(
          false
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
      <KeyboardScrollView
        contentContainerStyle={
          styles.content
        }
        keyboardShouldPersistTaps="handled"
      >

        {/* BACK */}

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
              styles.backText
            }
          >
            ← Tilbake
          </Text>
        </TouchableOpacity>


        {/* HERO */}

        <View
          style={
            styles.hero
          }
        >
          <Text
            style={
              styles.heroEmoji
            }
          >
            🛍️
          </Text>
        </View>


        {/* TITLE */}

        <Text
          style={
            styles.title
          }
        >
          Hva skal vi hente?
        </Text>


        <Text
          style={
            styles.subtitle
          }
        >
          Finner du ikke restauranten i appen, eller vil du kjøpe noe fra en butikk? Fortell oss hvor vi skal dra og hva vi skal hente.
        </Text>


        {/* INFO */}

        <View
          style={
            styles.infoBox
          }
        >
          <Text
            style={
              styles.infoText
            }
          >
            Du kan for eksempel legge til mat fra en annen restaurant, brød, grønnsaker, frukt, blomster eller andre varer. Bestillingen legges i handlekurven sammen med resten.
          </Text>
        </View>


        {/* FORM */}

        <View
          style={
            styles.formCard
          }
        >
          <Text
            style={
              styles.label
            }
          >
            Restaurant eller butikk
          </Text>


          <TextInput
            style={
              styles.input
            }
            value={
              place
            }
            onChangeText={
              setPlace
            }
            placeholder="F.eks. Meny, Kiwi, Floriss eller restaurantnavn"
            placeholderTextColor={colors.placeholder}
            autoCapitalize="words"
          />


          <Text
            style={
              styles.label
            }
          >
            Hva vil du at vi skal hente?
          </Text>


          <TextInput
            style={[
              styles.input,
              styles.messageInput,
            ]}
            value={
              request
            }
            onChangeText={
              setRequest
            }
            placeholder="F.eks. 2 grove brød, melk, bananer og en bukett blomster..."
            placeholderTextColor={colors.placeholder}
            multiline
            textAlignVertical="top"
          />


          {/* ADDRESS */}

          <View
            style={
              styles.addressBox
            }
          >
            <Text
              style={
                styles.addressLabel
              }
            >
              Leveringsadresse
            </Text>


            {loadingProfile ? (
              <ActivityIndicator
                size="small"
                color={colors.primary}
              />

            ) : address ? (
              <>
                <Text
                  style={
                    styles.addressText
                  }
                >
                  {address}
                </Text>


                <TouchableOpacity
                  onPress={() =>
                    router.push(
                      "/login"
                    )
                  }
                >
                  <Text
                    style={
                      styles.profileLink
                    }
                  >
                    Endre adresse i Profil
                  </Text>
                </TouchableOpacity>
              </>

            ) : (
              <>
                <Text
                  style={
                    styles.noAddressText
                  }
                >
                  Du har ikke registrert leveringsadresse.
                </Text>


                <TouchableOpacity
                  onPress={() =>
                    router.push(
                      "/login"
                    )
                  }
                >
                  <Text
                    style={
                      styles.profileLink
                    }
                  >
                    Legg til adresse i Profil
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>


          {/* ADD TO CART */}

          <TouchableOpacity
            style={[
              styles.submitButton,

              checkingAddress &&
                styles.submitButtonDisabled,
            ]}
            onPress={
              handleAddToCart
            }
            disabled={
              checkingAddress
            }
          >
            {checkingAddress ? (
              <ActivityIndicator
                color={colors.onPrimary}
              />

            ) : (
              <Text
                style={
                  styles.submitButtonText
                }
              >
                Legg i handlekurven
              </Text>
            )}
          </TouchableOpacity>
        </View>


        <Text
          style={
            styles.footerText
          }
        >
          Ingenting sendes før du går til handlekurven og bekrefter bestillingen.
        </Text>

      </KeyboardScrollView>
    </SafeAreaView>
  );
}


// ==================================================
// STYLES
// ==================================================

const createStyles = (colors: AppThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor:
        colors.background,
    },

    content: {
      padding: 22,
      paddingBottom: 50,
    },

    backButton: {
      alignSelf:
        "flex-start",
      paddingVertical: 10,
      marginBottom: 10,
    },

    backText: {
      color:
        colors.primary,
      fontSize: 15,
      fontWeight: "700",
    },

    hero: {
      height: 210,
      borderRadius: 18,
      backgroundColor:
        colors.primarySoft,
      alignItems:
        "center",
      justifyContent:
        "center",
      marginBottom: 25,
    },

    heroEmoji: {
      color: colors.text,
      fontSize: 70,
    },

    title: {
      fontSize: 30,
      fontWeight: "800",
      color:
        colors.text,
      marginBottom: 10,
    },

    subtitle: {
      color:
        colors.textMuted,
      fontSize: 16,
      lineHeight: 23,
      marginBottom: 20,
    },

    infoBox: {
      backgroundColor:
        colors.primarySoft,
      borderRadius: 12,
      padding: 15,
      marginBottom: 22,
    },

    infoText: {
      color:
        colors.textSecondary,
      fontSize: 14,
      lineHeight: 20,
    },

    formCard: {
      borderWidth: 1,
      borderColor:
        colors.border,
      borderRadius: 18,
      padding: 20,
      backgroundColor:
        colors.surface,
    },

    label: {
      fontSize: 14,
      fontWeight: "700",
      color:
        colors.text,
      marginBottom: 8,
    },

    input: {
      borderWidth: 1,
      borderColor:
        colors.inputBorder,
      borderRadius: 11,
      paddingHorizontal: 14,
      paddingVertical: 14,
      fontSize: 16,
      color:
        colors.text,
      backgroundColor:
        colors.inputBackground,
      marginBottom: 20,
    },

    messageInput: {
      color: colors.text,
      minHeight: 140,
      textAlignVertical:
        "top",
    },

    addressBox: {
      borderTopWidth: 1,
      borderTopColor:
        colors.border,
      paddingTop: 18,
      marginBottom: 22,
    },

    addressLabel: {
      fontSize: 14,
      fontWeight: "700",
      color:
        colors.text,
      marginBottom: 7,
    },

    addressText: {
      fontSize: 15,
      color:
        colors.textSecondary,
      lineHeight: 21,
      marginBottom: 8,
    },

    noAddressText: {
      color:
        colors.danger,
      fontSize: 14,
      marginBottom: 8,
    },

    profileLink: {
      color:
        colors.primary,
      fontWeight: "700",
      fontSize: 14,
    },

    submitButton: {
      minHeight: 54,
      borderRadius: 12,
      backgroundColor:
        colors.primaryFill,
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    submitButtonDisabled: {
      opacity: 0.65,
    },


    submitButtonText: {
      color:
        colors.onPrimary,
      fontSize: 16,
      fontWeight: "800",
    },

    footerText: {
      color:
        colors.textMuted,
      fontSize: 13,
      textAlign:
        "center",
      marginTop: 16,
    },
  });
