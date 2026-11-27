import { areaName, type DeliveryAreaId } from "../services/deliveryPricing";
import { useDelivery } from "../context/DeliveryContext";
import KeyboardScrollView from "../components/KeyboardScrollView";
import { useThemedStyles } from "../context/ThemeContext";
import type { AppThemeColors } from "../constants/app-theme";
import {
  useEffect,
  useState,
} from "react";

import {
  ActivityIndicator,
  Alert,
  Linking,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import {
  router,
} from "expo-router";

import {
  useAuth,
} from "../context/AuthContext";

import {
  useRestaurantLanguage,
} from "../context/RestaurantLanguageContext";

import {
  deleteCustomerAccount,
  login,
  logout,
  sendPasswordResetLink,
} from "../services/authService";

import {
  getCurrentProfile,
  ProfileData,
  updateCustomerAddress,
  updateCustomerName,
  updateCustomerPhone,
} from "../services/profileService";

import AddressAutocomplete from "../components/AddressAutocomplete";
import AppearanceSettings from "../components/AppearanceSettings";

import type {
  AddressSuggestion,
} from "../services/addressService";

import {
  resolveNesoddenAddress,
} from "../services/addressService";


// ==================================================
// LOGIN / PROFILE
// ==================================================

export default function LoginScreen() {
  const { styles, colors } = useThemedStyles(createStyles);
  const delivery = useDelivery();

  const {
    user,
    role,
  } =
    useAuth();


  const {
    language,
    setLanguage,
  } =
    useRestaurantLanguage();


  const restaurantEnglish =
    role === "restaurant" &&
    language === "en";


  const trRestaurant =
    (
      norwegian: string,
      english: string
    ) =>
      restaurantEnglish
        ? english
        : norwegian;


  // LOGIN

  const [
    identifier,
    setIdentifier,
  ] = useState("");

  const [
    password,
    setPassword,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    loginError,
    setLoginError,
  ] = useState("");


  // RESET

  const [
    showReset,
    setShowReset,
  ] = useState(false);

  const [
    resetEmail,
    setResetEmail,
  ] = useState("");

  const [
    sendingReset,
    setSendingReset,
  ] = useState(false);


  // PROFILE

  const [
    profile,
    setProfile,
  ] =
    useState<
      ProfileData | null
    >(null);

  const [
    loadingProfile,
    setLoadingProfile,
  ] = useState(false);


  // NAME

  const [
    editingName,
    setEditingName,
  ] = useState(false);

  const [
    name,
    setName,
  ] = useState("");

  const [
    savingName,
    setSavingName,
  ] = useState(false);


  // PHONE

  const [
    editingPhone,
    setEditingPhone,
  ] = useState(false);

  const [
    phone,
    setPhone,
  ] = useState("");

  const [
    savingPhone,
    setSavingPhone,
  ] = useState(false);


  // ADDRESS

  const [
    editingAddress,
    setEditingAddress,
  ] = useState(false);

  const [
    address,
    setAddress,
  ] = useState("");

  const [
    savingAddress,
    setSavingAddress,
  ] = useState(false);

  const [
    selectedAddress,
    setSelectedAddress,
  ] = useState<AddressSuggestion | null>(null);

  const [
    addressSaveError,
    setAddressSaveError,
  ] = useState("");



  // DELETE ACCOUNT

  const [
    showDeleteAccount,
    setShowDeleteAccount,
  ] = useState(false);

  const [
    deletePassword,
    setDeletePassword,
  ] = useState("");

  const [
    deletingAccount,
    setDeletingAccount,
  ] = useState(false);


  // ==================================================
  // LOAD PROFILE
  // ==================================================

  const loadProfile =
    async () => {
      if (
        !user ||
        !role
      ) {
        setProfile(
          null
        );

        return;
      }


      try {
        setLoadingProfile(
          true
        );


        const data =
          await getCurrentProfile();


        setProfile(
          data
        );

        setName(
          data.name
        );

        setPhone(
          data.phone
        );

        setAddress(
          data.address
        );

        setSelectedAddress(null);

      } catch (
        error: any
      ) {
        console.log(
          "Profile error:",
          error
        );


        Alert.alert(
          trRestaurant(
            "Feil",
            "Error"
          ),
          restaurantEnglish
            ? "Could not load the profile."
            : error.message ||
              "Kunne ikke hente profilen."
        );

      } finally {
        setLoadingProfile(
          false
        );
      }
    };


  useEffect(() => {
    loadProfile();
  }, [
    user,
    role,
  ]);


  // ==================================================
  // LOGIN
  // ==================================================

  const handleLogin =
    async () => {
      const cleanIdentifier =
        identifier.trim();


      setLoginError("");


      if (!cleanIdentifier) {
        setLoginError(
          "Skriv inn e-post eller restaurantnavn."
        );

        return;
      }


      if (!password) {
        setLoginError(
          "Skriv inn passord."
        );

        return;
      }


      try {
        setLoading(
          true
        );


        await login(
          cleanIdentifier,
          password
        );


        setLoginError("");
        setIdentifier("");
        setPassword("");


        router.replace(
          "/"
        );

      } catch (
        error: any
      ) {
        console.log(
          "Login error:",
          error
        );


        setLoginError(
          error?.message ||
            "Kunne ikke logge inn. Prøv igjen."
        );

      } finally {
        setLoading(
          false
        );
      }
    };


  // ==================================================
  // RESET PASSWORD
  // ==================================================

  const openReset =
    () => {
      if (
        identifier.includes(
          "@"
        )
      ) {
        setResetEmail(
          identifier.trim()
        );
      }


      setShowReset(
        true
      );
    };


  const handleSendReset =
    async () => {
      try {
        setSendingReset(
          true
        );


        await sendPasswordResetLink(
          resetEmail
        );


        Alert.alert(
          "E-post sendt",
          "Hvis det finnes en konto med denne e-postadressen, vil du motta en lenke for å lage nytt passord."
        );


        setShowReset(
          false
        );

        setResetEmail(
          ""
        );

      } catch (
        error: any
      ) {
        Alert.alert(
          "Feil",
          error.message ||
            "Kunne ikke sende lenken."
        );

      } finally {
        setSendingReset(
          false
        );
      }
    };


  const handleProfileReset =
    () => {
      if (
        !profile?.email
      ) {
        return;
      }


      Alert.alert(
        "Bytt passord",
        `Vi sender en lenke til ${profile.email}.`,
        [
          {
            text:
              "Avbryt",
            style:
              "cancel",
          },

          {
            text:
              "Send lenke",

            onPress:
              async () => {
                try {
                  await sendPasswordResetLink(
                    profile.email
                  );


                  Alert.alert(
                    "E-post sendt",
                    "Sjekk innboksen din for lenken til å lage et nytt passord."
                  );

                } catch (
                  error
                ) {
                  console.log(
                    error
                  );


                  Alert.alert(
                    "Feil",
                    "Kunne ikke sende lenken."
                  );
                }
              },
          },
        ]
      );
    };


  // ==================================================
  // SAVE NAME
  // ==================================================

  const handleSaveName =
    async () => {
      try {
        setSavingName(
          true
        );


        const savedName =
          await updateCustomerName(
            name
          );


        setName(
          savedName
        );


        setEditingName(
          false
        );


        await loadProfile();


        Alert.alert(
          "Lagret",
          "Navnet ditt er oppdatert."
        );

      } catch (
        error: any
      ) {
        Alert.alert(
          "Feil",
          error.message ||
            "Kunne ikke oppdatere navnet."
        );

      } finally {
        setSavingName(
          false
        );
      }
    };


  // ==================================================
  // SAVE PHONE
  // ==================================================

  const handleSavePhone =
    async () => {
      try {
        setSavingPhone(
          true
        );


        const savedPhone =
          await updateCustomerPhone(
            phone
          );


        setPhone(
          savedPhone
        );


        setEditingPhone(
          false
        );


        await loadProfile();


        Alert.alert(
          "Lagret",
          "Mobilnummeret er oppdatert."
        );

      } catch (
        error: any
      ) {
        Alert.alert(
          "Feil",
          error.message ||
            "Kunne ikke oppdatere mobilnummeret."
        );

      } finally {
        setSavingPhone(
          false
        );
      }
    };


  // ==================================================
  // SAVE ADDRESS
  // ==================================================

  const handleSaveAddress =
    async () => {
      try {
        setAddressSaveError("");

        setSavingAddress(
          true
        );

        let deliveryUpdate:
          | {
              areaId: DeliveryAreaId;
              coordinates?: { latitude: number; longitude: number } | null;
            }
          | null
          | undefined;

        if (selectedAddress) {
          deliveryUpdate = {
            areaId: selectedAddress.zone.id,
            coordinates: { latitude: selectedAddress.latitude, longitude: selectedAddress.longitude },
          };
        } else if (
          address.trim() === profile?.address.trim() &&
          profile.deliveryAreaId !== null
        ) {
          deliveryUpdate = { areaId: profile.deliveryAreaId!, coordinates: profile.deliveryCoordinates };
        } else {
          const resolvedAddress =
            await resolveNesoddenAddress(address);

          deliveryUpdate = resolvedAddress
            ? {
                areaId: resolvedAddress.zone.id,
                coordinates: { latitude: resolvedAddress.latitude, longitude: resolvedAddress.longitude },
              }
            : null;
        }


        const savedAddress =
          await updateCustomerAddress(
            address,
            deliveryUpdate,
            deliveryUpdate?.coordinates ?? null
          );


        setAddress(
          savedAddress.address
        );


        setEditingAddress(
          false
        );


        await loadProfile();


        Alert.alert(
          "Adresse lagret",
          savedAddress.deliverySaved
            ? "Adressen din er oppdatert."
            : "Adressen er lagret, men leveringspunktet og området kunne ikke lagres. Kontakt KjørNesodden hvis du trenger hjelp."
        );

      } catch (
        error: any
      ) {
        const message =
          error.message ||
          "Kunne ikke lagre adressen.";

        setAddressSaveError(message);

        Alert.alert(
          "Feil",
          message
        );

      } finally {
        setSavingAddress(
          false
        );
      }
    };


  // ==================================================
  // DELETE ACCOUNT
  // ==================================================

  const openDeleteAccount =
    () => {
      if (
        profile?.role !==
        "customer"
      ) {
        return;
      }


      Alert.alert(
        "Slett konto?",

        "Dette vil permanent slette kundekontoen din, profilen din og bestillingsdata som er lagret i Firebase. Denne handlingen kan ikke angres.",

        [
          {
            text:
              "Avbryt",

            style:
              "cancel",
          },

          {
            text:
              "Fortsett",

            style:
              "destructive",

            onPress:
              () => {
                setDeletePassword(
                  ""
                );

                setShowDeleteAccount(
                  true
                );
              },
          },
        ]
      );
    };


  const cancelDeleteAccount =
    () => {
      if (
        deletingAccount
      ) {
        return;
      }


      setDeletePassword(
        ""
      );

      setShowDeleteAccount(
        false
      );
    };


  const handleDeleteAccount =
    async () => {
      if (
        !deletePassword
      ) {
        Alert.alert(
          "Mangler passord",
          "Skriv inn passordet ditt for å bekrefte slettingen."
        );

        return;
      }


      try {
        setDeletingAccount(
          true
        );


        await deleteCustomerAccount(
          deletePassword
        );


        setDeletePassword(
          ""
        );

        setShowDeleteAccount(
          false
        );

        setProfile(
          null
        );


        Alert.alert(
          "Konto slettet",

          "Kundekontoen din er slettet.",

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
          "Delete account error:",
          error
        );


        Alert.alert(
          "Kunne ikke slette kontoen",

          error.message ||
            "Noe gikk galt. Prøv igjen."
        );

      } finally {
        setDeletingAccount(
          false
        );
      }
    };


  // ==================================================
  // LOGOUT
  // ==================================================

  const handleLogout =
    async () => {
      try {
        await logout();


        setProfile(
          null
        );

        setEditingName(
          false
        );

        setEditingPhone(
          false
        );

        setEditingAddress(
          false
        );

        setShowDeleteAccount(
          false
        );

        setDeletePassword(
          ""
        );


        router.replace(
          "/"
        );

      } catch (
        error
      ) {
        console.log(
          "Logout error:",
          error
        );
      }
    };


  // ==================================================
  // PRIVACY POLICY
  // ==================================================

  const openPrivacyPolicy =
    async () => {
      try {
        await Linking.openURL(
          "https://kjornesodden.vercel.app/personvern"
        );

      } catch (
        error
      ) {
        console.log(
          "Privacy policy link error:",
          error
        );


        Alert.alert(
          trRestaurant(
            "Kunne ikke åpne siden",
            "Could not open the page"
          ),
          trRestaurant(
            "Prøv igjen senere.",
            "Please try again later."
          )
        );
      }
    };


  // ==================================================
  // PROFILE
  // ==================================================

  if (user) {
    return (
      <SafeAreaView
        style={
          styles.container
        }
      >
        <KeyboardScrollView
          contentContainerStyle={
            styles.profileContent
          }
          keyboardShouldPersistTaps="handled"
        >

          <Text
            style={
              styles.title
            }
          >
            {trRestaurant(
              "Profil",
              "Profile"
            )}
          </Text>


          <Text
            style={
              styles.subtitle
            }
          >
            {trRestaurant(
              "Kontoinformasjon",
              "Account information"
            )}
          </Text>


          {loadingProfile ||
          !profile ? (

            <ActivityIndicator
              size="large"
              color={colors.primary}
              style={{
                marginTop:
                  50,
              }}
            />

          ) : (

            <>
              {/* ==================================================
                  CUSTOMER
              ================================================== */}

              {profile.role ===
                "customer" && (
                <>

                  <View
                    style={
                      styles.profileCard
                    }
                  >
                    <Text
                      style={
                        styles.sectionTitle
                      }
                    >
                      Kontoinformasjon
                    </Text>


                    {/* NAME */}

                    <View
                      style={
                        styles.infoSection
                      }
                    >
                      <View
                        style={
                          styles.infoHeader
                        }
                      >
                        <Text
                          style={
                            styles.infoLabel
                          }
                        >
                          Navn
                        </Text>


                        {!editingName && (
                          <TouchableOpacity
                            onPress={() =>
                              setEditingName(
                                true
                              )
                            }
                          >
                            <Text
                              style={
                                styles.editText
                              }
                            >
                              Rediger
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>


                      {editingName ? (
                        <>
                          <TextInput
                            style={
                              styles.profileInput
                            }
                            value={
                              name
                            }
                            onChangeText={
                              setName
                            }
                            placeholder="Navnet ditt"
                            placeholderTextColor={colors.placeholder}
                            autoCapitalize="words"
                          />


                          <View
                            style={
                              styles.editButtons
                            }
                          >
                            <TouchableOpacity
                              style={
                                styles.cancelButton
                              }
                              onPress={() => {
                                setName(
                                  profile.name
                                );

                                setEditingName(
                                  false
                                );
                              }}
                            >
                              <Text
                                style={
                                  styles.cancelButtonText
                                }
                              >
                                Avbryt
                              </Text>
                            </TouchableOpacity>


                            <TouchableOpacity
                              style={[
                                styles.saveButton,

                                savingName &&
                                  styles.disabledButton,
                              ]}
                              disabled={
                                savingName
                              }
                              onPress={
                                handleSaveName
                              }
                            >
                              <Text
                                style={
                                  styles.saveButtonText
                                }
                              >
                                {savingName
                                  ? "Lagrer..."
                                  : "Lagre"}
                              </Text>
                            </TouchableOpacity>
                          </View>
                        </>

                      ) : (

                        <Text
                          style={
                            styles.infoValue
                          }
                        >
                          {profile.name ||
                            "Ikke registrert"}
                        </Text>

                      )}
                    </View>


                    <View
                      style={
                        styles.divider
                      }
                    />


                    {/* EMAIL */}

                    <View
                      style={
                        styles.infoSection
                      }
                    >
                      <Text
                        style={
                          styles.infoLabel
                        }
                      >
                        E-post
                      </Text>

                      <Text
                        style={
                          styles.infoValue
                        }
                      >
                        {profile.email}
                      </Text>
                    </View>


                    <View
                      style={
                        styles.divider
                      }
                    />


                    {/* PHONE */}

                    <View
                      style={
                        styles.infoSection
                      }
                    >
                      <View
                        style={
                          styles.infoHeader
                        }
                      >
                        <Text
                          style={
                            styles.infoLabel
                          }
                        >
                          Mobilnummer
                        </Text>


                        {!editingPhone && (
                          <TouchableOpacity
                            onPress={() =>
                              setEditingPhone(
                                true
                              )
                            }
                          >
                            <Text
                              style={
                                styles.editText
                              }
                            >
                              Rediger
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>


                      {editingPhone ? (
                        <>
                          <TextInput
                            style={
                              styles.profileInput
                            }
                            value={
                              phone
                            }
                            onChangeText={
                              setPhone
                            }
                            keyboardType="phone-pad"
                            placeholder="999 99 999"
                            placeholderTextColor={colors.placeholder}
                          />


                          <View
                            style={
                              styles.editButtons
                            }
                          >
                            <TouchableOpacity
                              style={
                                styles.cancelButton
                              }
                              onPress={() => {
                                setPhone(
                                  profile.phone
                                );

                                setEditingPhone(
                                  false
                                );
                              }}
                            >
                              <Text
                                style={
                                  styles.cancelButtonText
                                }
                              >
                                Avbryt
                              </Text>
                            </TouchableOpacity>


                            <TouchableOpacity
                              style={[
                                styles.saveButton,

                                savingPhone &&
                                  styles.disabledButton,
                              ]}
                              disabled={
                                savingPhone
                              }
                              onPress={
                                handleSavePhone
                              }
                            >
                              <Text
                                style={
                                  styles.saveButtonText
                                }
                              >
                                {savingPhone
                                  ? "Lagrer..."
                                  : "Lagre"}
                              </Text>
                            </TouchableOpacity>
                          </View>
                        </>

                      ) : (

                        <Text
                          style={
                            styles.infoValue
                          }
                        >
                          {profile.phone ||
                            "Ikke registrert"}
                        </Text>

                      )}
                    </View>
                  </View>


                  {/* PASSWORD */}

                  <View
                    style={
                      styles.profileCard
                    }
                  >
                    <Text
                      style={
                        styles.sectionTitle
                      }
                    >
                      Bytt passord
                    </Text>


                    <Text
                      style={
                        styles.cardDescription
                      }
                    >
                      Få tilsendt en sikker lenke på e-post for å velge et nytt passord.
                    </Text>


                    <TouchableOpacity
                      style={
                        styles.blueOutlineButton
                      }
                      onPress={
                        handleProfileReset
                      }
                    >
                      <Text
                        style={
                          styles.blueOutlineButtonText
                        }
                      >
                        Send lenke for nytt passord
                      </Text>
                    </TouchableOpacity>
                  </View>


                  {/* ADDRESS */}

                  <View
                    style={
                      styles.profileCard
                    }
                  >
                    <Text
                      style={
                        styles.sectionTitle
                      }
                    >
                      Leveringsadresse
                    </Text>


                    {profile.address ? (
                      <View
                        style={
                          styles.currentAddressBox
                        }
                      >
                        <Text
                          style={
                            styles.infoLabel
                          }
                        >
                          Lagret adresse
                        </Text>

                        <Text
                          style={
                            styles.addressValue
                          }
                        >
                          {profile.address}
                        </Text>

                        <Text style={styles.deliveryPriceText}>
                          {profile.deliveryAreaId !== null
                            ? `Område: ${areaName(profile.deliveryAreaId)}`
                            : "Området er ikke avklart. Velg et adresseforslag for automatisk pris."}
                        </Text>
                        <Text style={styles.deliveryPriceText}>
                          {delivery.pricingError ? "Leveringsprisene er midlertidig utilgjengelige."
                            : delivery.pricingLoading ? "Henter leveringspriser…"
                            : profile.deliveryAreaId === "fagerstrand"
                              ? `Fra restaurant i Fagerstrand: ${delivery.pricing.sameAreaFee} kr. Fra andre områder brukes vanlige satser.`
                              : profile.deliveryAreaId
                                ? `Områdesats: ${delivery.pricing.areaFees[profile.deliveryAreaId]} kr. Endelig pris vises ved restauranten og i handlekurven.`
                                : "Leveringsprisen beregnes når området og restauranten er kjent."}
                        </Text>
                      </View>
                    ) : (
                      <Text
                        style={
                          styles.cardDescription
                        }
                      >
                        Du har ikke lagt til en adresse enda.
                      </Text>
                    )}


                    {!editingAddress ? (
                      <TouchableOpacity
                        style={
                          styles.blueOutlineButton
                        }
                        onPress={() =>
                          setEditingAddress(true)
                        }
                      >
                        <Text
                          style={
                            styles.blueOutlineButtonText
                          }
                        >
                          {profile.address
                            ? "Endre adresse"
                            : "Adresse"}
                        </Text>
                      </TouchableOpacity>

                    ) : (

                      <View>
                        <AddressAutocomplete
                          value={address}
                          disabled={savingAddress}
                          onChangeText={(text) => {
                            setAddressSaveError("");
                            setAddress(text);
                            setSelectedAddress(null);
                          }}
                          onSelect={(suggestion) => {
                            setAddressSaveError("");
                            setAddress(suggestion.label);
                            setSelectedAddress(suggestion);
                          }}
                        />

                        {addressSaveError ? (
                          <Text style={styles.addressSaveError}>
                            {addressSaveError}
                          </Text>
                        ) : null}


                        <View
                          style={
                            styles.editButtons
                          }
                        >
                          <TouchableOpacity
                            style={
                              styles.cancelButton
                            }
                            onPress={() => {
                              setAddress(
                                profile.address
                              );

                              setSelectedAddress(null);

                              setAddressSaveError("");

                              setEditingAddress(
                                false
                              );
                            }}
                          >
                            <Text
                              style={
                                styles.cancelButtonText
                              }
                            >
                              Avbryt
                            </Text>
                          </TouchableOpacity>


                          <TouchableOpacity
                            style={[
                              styles.saveButton,

                              savingAddress &&
                                styles.disabledButton,
                            ]}
                            disabled={
                              savingAddress
                            }
                            onPress={
                              handleSaveAddress
                            }
                          >
                            <Text
                              style={
                                styles.saveButtonText
                              }
                            >
                              {savingAddress
                                ? "Lagrer..."
                                : "Lagre adresse"}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>

                    )}
                  </View>


                  {/* DELETE ACCOUNT */}

                  <View
                    style={[
                      styles.profileCard,
                      styles.dangerCard,
                    ]}
                  >
                    <Text
                      style={
                        styles.dangerTitle
                      }
                    >
                      Slett konto
                    </Text>


                    <Text
                      style={
                        styles.cardDescription
                      }
                    >
                      Slett kundekontoen din permanent. Profilen og bestillingsdata som er lagret i Firebase blir slettet. Handlingen kan ikke angres.
                    </Text>


                    {!showDeleteAccount ? (
                      <TouchableOpacity
                        style={
                          styles.dangerButton
                        }
                        onPress={
                          openDeleteAccount
                        }
                      >
                        <Text
                          style={
                            styles.dangerButtonText
                          }
                        >
                          Slett konto
                        </Text>
                      </TouchableOpacity>

                    ) : (
                      <>
                        <Text
                          style={
                            styles.deleteConfirmText
                          }
                        >
                          Skriv inn passordet ditt for å bekrefte.
                        </Text>


                        <TextInput
                          style={
                            styles.profileInput
                          }
                          value={
                            deletePassword
                          }
                          onChangeText={
                            setDeletePassword
                          }
                          placeholder="Passord"
                          placeholderTextColor={colors.placeholder}
                          secureTextEntry
                          autoCapitalize="none"
                          autoCorrect={
                            false
                          }
                          editable={
                            !deletingAccount
                          }
                        />


                        <View
                          style={
                            styles.editButtons
                          }
                        >
                          <TouchableOpacity
                            style={
                              styles.cancelButton
                            }
                            disabled={
                              deletingAccount
                            }
                            onPress={
                              cancelDeleteAccount
                            }
                          >
                            <Text
                              style={
                                styles.cancelButtonText
                              }
                            >
                              Avbryt
                            </Text>
                          </TouchableOpacity>


                          <TouchableOpacity
                            style={[
                              styles.deleteConfirmButton,

                              deletingAccount &&
                                styles.disabledButton,
                            ]}
                            disabled={
                              deletingAccount
                            }
                            onPress={
                              handleDeleteAccount
                            }
                          >
                            {deletingAccount ? (
                              <ActivityIndicator
                                color={colors.onPrimary}
                              />

                            ) : (
                              <Text
                                style={
                                  styles.deleteConfirmButtonText
                                }
                              >
                                Slett permanent
                              </Text>
                            )}
                          </TouchableOpacity>
                        </View>
                      </>
                    )}
                  </View>

                </>
              )}


              {/* RESTAURANT */}

              {profile.role ===
                "restaurant" && (
                <>
                  <View
                    style={
                      styles.profileCard
                    }
                  >
                    <Text
                      style={
                        styles.restaurantProfileName
                      }
                    >
                      {profile.restaurantName}
                    </Text>


                    {profile.description ? (
                      <Text
                        style={
                          styles.restaurantProfileDescription
                        }
                      >
                        {profile.description}
                      </Text>
                    ) : null}


                    <View
                      style={
                        styles.divider
                      }
                    />


                    <Text
                      style={
                        styles.infoLabel
                      }
                    >
                      {trRestaurant(
                        "Innloggingsnavn",
                        "Login name"
                      )}
                    </Text>

                    <Text
                      style={
                        styles.infoValue
                      }
                    >
                      {profile.loginName}
                    </Text>
                  </View>


                  <View
                    style={
                      styles.profileCard
                    }
                  >
                    <Text
                      style={
                        styles.sectionTitle
                      }
                    >
                      {trRestaurant(
                        "Språk",
                        "Language"
                      )}
                    </Text>


                    <Text
                      style={
                        styles.cardDescription
                      }
                    >
                      {trRestaurant(
                        "Velg språk for restaurantdelen av appen.",
                        "Choose the language for the restaurant section of the app."
                      )}
                    </Text>


                    <View
                      style={
                        styles.languageSelector
                      }
                    >
                      <TouchableOpacity
                        style={[
                          styles.languageOption,

                          language ===
                            "no" &&
                            styles.languageOptionActive,
                        ]}
                        onPress={() =>
                          setLanguage(
                            "no"
                          )
                        }
                      >
                        <Text
                          style={[
                            styles.languageOptionText,

                            language ===
                              "no" &&
                              styles.languageOptionTextActive,
                          ]}
                        >
                          Norsk
                        </Text>
                      </TouchableOpacity>


                      <TouchableOpacity
                        style={[
                          styles.languageOption,

                          language ===
                            "en" &&
                            styles.languageOptionActive,
                        ]}
                        onPress={() =>
                          setLanguage(
                            "en"
                          )
                        }
                      >
                        <Text
                          style={[
                            styles.languageOptionText,

                            language ===
                              "en" &&
                              styles.languageOptionTextActive,
                          ]}
                        >
                          English
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </>
              )}


              {profile.role === "worker" && <View style={styles.profileCard}><Text style={styles.sectionTitle}>Sjåførkonto</Text><Text style={styles.infoValue}>{profile.name}</Text><Text style={styles.infoValue}>{profile.email}</Text></View>}
              {/* ADMIN */}

              {profile.role ===
                "admin" && (
                <>
                  <View
                    style={
                      styles.profileCard
                    }
                  >
                    <Text
                      style={
                        styles.sectionTitle
                      }
                    >
                      Kontoinformasjon
                    </Text>


                    <Text
                      style={
                        styles.infoLabel
                      }
                    >
                      E-post
                    </Text>

                    <Text
                      style={
                        styles.infoValue
                      }
                    >
                      {profile.email}
                    </Text>
                  </View>


                  <View
                    style={
                      styles.profileCard
                    }
                  >
                    <Text
                      style={
                        styles.sectionTitle
                      }
                    >
                      Bytt passord
                    </Text>


                    <TouchableOpacity
                      style={
                        styles.blueOutlineButton
                      }
                      onPress={
                        handleProfileReset
                      }
                    >
                      <Text
                        style={
                          styles.blueOutlineButtonText
                        }
                      >
                        Send lenke for nytt passord
                      </Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}


              <AppearanceSettings english={restaurantEnglish} />

              {/* PRIVACY */}

              <View
                style={
                  styles.profileCard
                }
              >
                <Text
                  style={
                    styles.sectionTitle
                  }
                >
                  {trRestaurant(
                    "Personvern",
                    "Privacy"
                  )}
                </Text>


                <Text
                  style={
                    styles.cardDescription
                  }
                >
                  {trRestaurant(
                    "Les hvordan KjørNesodden behandler og beskytter personopplysningene dine.",
                    "Read how KjørNesodden handles and protects your personal data."
                  )}
                </Text>


                <TouchableOpacity
                  style={
                    styles.blueOutlineButton
                  }
                  onPress={
                    openPrivacyPolicy
                  }
                >
                  <Text
                    style={
                      styles.blueOutlineButtonText
                    }
                  >
                    {trRestaurant(
                      "Les personvernerklæringen",
                      "Read the privacy policy"
                    )}
                  </Text>
                </TouchableOpacity>
              </View>


              <TouchableOpacity
                style={
                  styles.logoutButton
                }
                onPress={
                  handleLogout
                }
              >
                <Text
                  style={
                    styles.logoutText
                  }
                >
                  {trRestaurant(
                    "Logg ut",
                    "Log out"
                  )}
                </Text>
              </TouchableOpacity>

            </>
          )}

        </KeyboardScrollView>
      </SafeAreaView>
    );
  }


  // ==================================================
  // LOGIN
  // ==================================================

  return (
    <SafeAreaView
      style={
        styles.container
      }
    >
      <KeyboardScrollView
        contentContainerStyle={
          styles.loginContent
        }
        keyboardShouldPersistTaps="handled"
      >

        <Text
          style={
            styles.title
          }
        >
          Logg inn
        </Text>


        <Text
          style={
            styles.subtitle
          }
        >
          Logg inn på KjørNesodden
        </Text>

        <Text
          style={
            styles.label
          }
        >
          E-post eller restaurantnavn
        </Text>

        <TextInput
          style={
            styles.input
          }
          placeholder="E-post eller restaurantnavn"
          placeholderTextColor={colors.placeholder}
          value={
            identifier
          }
          onChangeText={(value) => {
            setIdentifier(
              value
            );

            if (loginError) {
              setLoginError("");
            }
          }}
          autoCapitalize="none"
          autoCorrect={
            false
          }
        />


        <Text
          style={
            styles.label
          }
        >
          Passord
        </Text>

        <TextInput
          style={
            styles.input
          }
          placeholder="Passord"
          placeholderTextColor={colors.placeholder}
          value={
            password
          }
          onChangeText={(value) => {
            setPassword(
              value
            );

            if (loginError) {
              setLoginError("");
            }
          }}
          secureTextEntry
          autoCapitalize="none"
        />


        {loginError ? (
          <View
            style={
              styles.loginErrorBox
            }
          >
            <Text
              style={
                styles.loginErrorText
              }
            >
              {loginError}
            </Text>
          </View>
        ) : null}


        <TouchableOpacity
          style={[
            styles.loginButton,

            loading &&
              styles.disabledButton,
          ]}
          onPress={
            handleLogin
          }
          disabled={
            loading
          }
        >
          <Text
            style={
              styles.loginButtonText
            }
          >
            {loading
              ? "Logger inn..."
              : "Logg inn"}
          </Text>
        </TouchableOpacity>


        <TouchableOpacity
          onPress={
            openReset
          }
        >
          <Text
            style={
              styles.forgotPasswordText
            }
          >
            Glemt passord?
          </Text>
        </TouchableOpacity>


        <TouchableOpacity
          style={
            styles.privacyLoginButton
          }
          onPress={
            openPrivacyPolicy
          }
        >
          <Text
            style={
              styles.privacyLoginText
            }
          >
            Personvernerklæring
          </Text>
        </TouchableOpacity>


        {showReset && (
          <View
            style={
              styles.resetCard
            }
          >
            <Text
              style={
                styles.resetTitle
              }
            >
              Tilbakestill passord
            </Text>


            <TextInput
              style={
                styles.input
              }
              placeholder="navn@eksempel.no"
              placeholderTextColor={colors.placeholder}
              value={
                resetEmail
              }
              onChangeText={
                setResetEmail
              }
              autoCapitalize="none"
              keyboardType="email-address"
            />


            <TouchableOpacity
              style={
                styles.resetButton
              }
              onPress={
                handleSendReset
              }
              disabled={
                sendingReset
              }
            >
              <Text
                style={
                  styles.resetButtonText
                }
              >
                {sendingReset
                  ? "Sender..."
                  : "Send lenke"}
              </Text>
            </TouchableOpacity>


            <TouchableOpacity
              onPress={() =>
                setShowReset(
                  false
                )
              }
            >
              <Text
                style={
                  styles.cancelResetText
                }
              >
                Avbryt
              </Text>
            </TouchableOpacity>
          </View>
        )}


        <TouchableOpacity
          onPress={() =>
            router.push(
              "/auth/customer-register"
            )
          }
        >
          <Text
            style={
              styles.registerText
            }
          >
            Ny bruker? Opprett konto
          </Text>
        </TouchableOpacity>

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
      flex:
        1,
      backgroundColor:
        colors.background,
    },

    loginContent: {
      flexGrow:
        1,
      justifyContent:
        "center",
      paddingHorizontal:
        24,
      paddingVertical:
        40,
    },

    profileContent: {
      paddingHorizontal:
        22,
      paddingTop:
        35,
      paddingBottom:
        50,
    },

    title: {
      fontSize:
        32,
      fontWeight:
        "800",
      color:
        colors.text,
      marginBottom:
        7,
    },

    subtitle: {
      fontSize:
        16,
      color:
        colors.textMuted,
      marginBottom:
        30,
    },

    label: {
      fontSize:
        14,
      fontWeight:
        "600",
      color:
        colors.text,
      marginBottom:
        8,
    },

    input: {
      borderWidth:
        1,
      borderColor:
        colors.inputBorder,
      borderRadius:
        10,
      paddingHorizontal:
        14,
      paddingVertical:
        14,
      fontSize:
        16,
      color:
        colors.text,
      backgroundColor:
        colors.inputBackground,
      marginBottom:
        18,
    },

    loginErrorBox: {
      backgroundColor:
        colors.dangerSoft,
      borderWidth:
        1,
      borderColor:
        colors.dangerBorder,
      borderRadius:
        10,
      paddingHorizontal:
        14,
      paddingVertical:
        12,
      marginBottom:
        16,
    },

    loginErrorText: {
      color:
        colors.danger,
      fontSize:
        14,
      lineHeight:
        20,
      fontWeight:
        "600",
    },

    loginButton: {
      backgroundColor:
        colors.primaryFill,
      paddingVertical:
        16,
      borderRadius:
        10,
      alignItems:
        "center",
    },

    loginButtonText: {
      color:
        colors.onPrimary,
      fontSize:
        16,
      fontWeight:
        "700",
    },

    disabledButton: {
      opacity:
        0.6,
    },

    forgotPasswordText: {
      color:
        colors.primary,
      textAlign:
        "center",
      fontWeight:
        "600",
      marginTop:
        18,
    },

    registerText: {
      textAlign:
        "center",
      color:
        colors.primary,
      fontWeight:
        "600",
      marginTop:
        25,
    },

    privacyLoginButton: {
      alignSelf:
        "center",
      marginTop:
        14,
      paddingVertical:
        8,
      paddingHorizontal:
        12,
    },

    privacyLoginText: {
      color:
        colors.primary,
      fontSize:
        14,
      fontWeight:
        "600",
      textDecorationLine:
        "underline",
    },

    resetCard: {
      borderWidth:
        1,
      borderColor:
        colors.border,
      backgroundColor:
        colors.surfaceMuted,
      padding:
        18,
      borderRadius:
        14,
      marginTop:
        22,
    },

    resetTitle: {
      color: colors.text,
      fontSize:
        18,
      fontWeight:
        "800",
      marginBottom:
        15,
    },

    resetButton: {
      backgroundColor:
        colors.primaryFill,
      paddingVertical:
        14,
      borderRadius:
        10,
      alignItems:
        "center",
    },

    resetButtonText: {
      color:
        colors.onPrimary,
      fontWeight:
        "700",
    },

    cancelResetText: {
      color:
        colors.textMuted,
      textAlign:
        "center",
      marginTop:
        15,
      fontWeight:
        "600",
    },

    profileCard: {
      borderWidth:
        1,
      borderColor:
        colors.border,
      borderRadius:
        16,
      padding:
        20,
      marginBottom:
        18,
      backgroundColor:
        colors.surface,
    },

    sectionTitle: {
      fontSize:
        19,
      fontWeight:
        "800",
      color:
        colors.text,
      marginBottom:
        20,
    },

    infoSection: {
      paddingVertical:
        2,
    },

    infoHeader: {
      flexDirection:
        "row",
      justifyContent:
        "space-between",
      alignItems:
        "center",
    },

    infoLabel: {
      fontSize:
        13,
      color:
        colors.textMuted,
      marginBottom:
        6,
    },

    infoValue: {
      fontSize:
        17,
      fontWeight:
        "600",
      color:
        colors.text,
    },

    divider: {
      height:
        1,
      backgroundColor:
        colors.divider,
      marginVertical:
        18,
    },

    editText: {
      color:
        colors.primary,
      fontWeight:
        "700",
      fontSize:
        14,
    },

    profileInput: {
      color: colors.text,
      borderWidth:
        1,
      borderColor:
        colors.inputBorder,
      borderRadius:
        10,
      paddingHorizontal:
        13,
      paddingVertical:
        12,
      fontSize:
        16,
      marginTop:
        4,
      marginBottom:
        12,
      backgroundColor:
        colors.inputBackground,
    },

    editButtons: {
      flexDirection:
        "row",
      gap:
        10,
    },

    cancelButton: {
      flex:
        1,
      borderWidth:
        1,
      borderColor:
        colors.border,
      paddingVertical:
        12,
      borderRadius:
        9,
      alignItems:
        "center",
    },

    cancelButtonText: {
      color:
        colors.textSecondary,
      fontWeight:
        "700",
    },

    saveButton: {
      flex:
        1,
      backgroundColor:
        colors.primaryFill,
      paddingVertical:
        12,
      borderRadius:
        9,
      alignItems:
        "center",
    },

    saveButtonText: {
      color:
        colors.onPrimary,
      fontWeight:
        "700",
    },

    cardDescription: {
      color:
        colors.textMuted,
      fontSize:
        14,
      lineHeight:
        20,
      marginBottom:
        17,
    },

    blueOutlineButton: {
      borderWidth:
        1,
      borderColor:
        colors.primary,
      borderRadius:
        10,
      paddingVertical:
        13,
      alignItems:
        "center",
    },

    blueOutlineButtonText: {
      color:
        colors.primary,
      fontWeight:
        "700",
    },

    currentAddressBox: {
      backgroundColor:
        colors.surfaceMuted,
      borderRadius:
        10,
      padding:
        14,
      marginBottom:
        15,
    },

    addressValue: {
      fontSize:
        16,
      fontWeight:
        "600",
      color:
        colors.text,
      lineHeight:
        23,
    },

    deliveryPriceText: {
      marginTop: 8,
      color: colors.primary,
      fontSize: 13,
      fontWeight: "700",
    },

    addressSaveError: {
      color: colors.danger,
      fontSize: 13,
      lineHeight: 18,
      marginTop: 8,
    },

    addressInput: {
      minHeight:
        90,
      textAlignVertical:
        "top",
    },

    languageSelector: {
      flexDirection:
        "row",
      gap:
        10,
    },

    languageOption: {
      flex:
        1,
      borderWidth:
        1,
      borderColor:
        colors.inputBorder,
      backgroundColor:
        colors.inputBackground,
      borderRadius:
        10,
      paddingVertical:
        12,
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    languageOptionActive: {
      borderColor:
        colors.primary,
      backgroundColor:
        colors.primarySoft,
    },

    languageOptionText: {
      color:
        colors.textSecondary,
      fontWeight:
        "700",
      fontSize:
        15,
    },

    languageOptionTextActive: {
      color:
        colors.primary,
    },

    restaurantProfileName: {
      color: colors.text,
      fontSize:
        24,
      fontWeight:
        "800",
      marginBottom:
        7,
    },

    restaurantProfileDescription: {
      color:
        colors.textMuted,
      fontSize:
        15,
      lineHeight:
        21,
    },

    dangerCard: {
      borderColor:
        colors.dangerBorder,
      backgroundColor:
        colors.dangerSoft,
    },

    dangerTitle: {
      fontSize:
        19,
      fontWeight:
        "800",
      color:
        colors.danger,
      marginBottom:
        10,
    },

    dangerButton: {
      borderWidth:
        1,
      borderColor:
        colors.dangerBorder,
      borderRadius:
        10,
      paddingVertical:
        13,
      alignItems:
        "center",
    },

    dangerButtonText: {
      color:
        colors.danger,
      fontWeight:
        "700",
      fontSize:
        15,
    },

    deleteConfirmText: {
      color:
        colors.textSecondary,
      fontSize:
        14,
      lineHeight:
        20,
      marginBottom:
        10,
    },

    deleteConfirmButton: {
      flex:
        1,
      backgroundColor:
        colors.dangerFill,
      paddingVertical:
        12,
      borderRadius:
        9,
      alignItems:
        "center",
      justifyContent:
        "center",
      minHeight:
        44,
    },

    deleteConfirmButtonText: {
      color:
        colors.onPrimary,
      fontWeight:
        "700",
    },

    logoutButton: {
      borderWidth:
        1,
      borderColor:
        colors.dangerBorder,
      paddingVertical:
        15,
      borderRadius:
        11,
      alignItems:
        "center",
      marginTop:
        8,
    },

    logoutText: {
      color:
        colors.danger,
      fontSize:
        16,
      fontWeight:
        "700",
    },
  });

