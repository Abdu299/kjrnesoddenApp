import {
  useEffect,
  useState,
} from "react";

import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
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


// ==================================================
// LOGIN / PROFILE
// ==================================================

export default function LoginScreen() {
  const {
    user,
    role,
  } =
    useAuth();


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

      } catch (
        error: any
      ) {
        console.log(
          "Profile error:",
          error
        );


        Alert.alert(
          "Feil",
          error.message ||
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
      if (
        !identifier.trim()
      ) {
        Alert.alert(
          "Feil",
          "Skriv inn e-post eller restaurantnavn."
        );

        return;
      }


      if (!password) {
        Alert.alert(
          "Feil",
          "Skriv inn passord."
        );

        return;
      }


      try {
        setLoading(
          true
        );


        await login(
          identifier,
          password
        );


        setIdentifier("");
        setPassword("");


        router.replace(
          "/"
        );

      } catch (
        error: any
      ) {
        Alert.alert(
          "Feil",
          error.message ||
            "Kunne ikke logge inn."
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
        setSavingAddress(
          true
        );


        const savedAddress =
          await updateCustomerAddress(
            address
          );


        setAddress(
          savedAddress
        );


        setEditingAddress(
          false
        );


        await loadProfile();


        Alert.alert(
          "Adresse lagret",
          "Adressen din er oppdatert."
        );

      } catch (
        error: any
      ) {
        Alert.alert(
          "Feil",
          error.message ||
            "Kunne ikke lagre adressen."
        );

      } finally {
        setSavingAddress(
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
  // PROFILE
  // ==================================================

  if (user) {
    return (
      <SafeAreaView
        style={
          styles.container
        }
      >
        <ScrollView
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
            Profil
          </Text>


          <Text
            style={
              styles.subtitle
            }
          >
            Kontoinformasjon
          </Text>


          {loadingProfile ||
          !profile ? (

            <ActivityIndicator
              size="large"
              color="#208AEF"
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
                            placeholderTextColor="#A0A0A0"
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
                            placeholderTextColor="#A0A0A0"
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
                          setEditingAddress(
                            true
                          )
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
                        <TextInput
                          style={[
                            styles.profileInput,
                            styles.addressInput,
                          ]}
                          value={
                            address
                          }
                          onChangeText={
                            setAddress
                          }
                          placeholder="Tangenveien 10, 1450 Nesoddtangen"
                          placeholderTextColor="#A0A0A0"
                          multiline
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
                              setAddress(
                                profile.address
                              );

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

                </>
              )}


              {/* RESTAURANT */}

              {profile.role ===
                "restaurant" && (
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
                    Innloggingsnavn
                  </Text>

                  <Text
                    style={
                      styles.infoValue
                    }
                  >
                    {profile.loginName}
                  </Text>
                </View>
              )}


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
                  Logg ut
                </Text>
              </TouchableOpacity>

            </>
          )}

        </ScrollView>
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
      <ScrollView
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
          placeholderTextColor="#A0A0A0"
          value={
            identifier
          }
          onChangeText={
            setIdentifier
          }
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
          placeholderTextColor="#A0A0A0"
          value={
            password
          }
          onChangeText={
            setPassword
          }
          secureTextEntry
          autoCapitalize="none"
        />


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
              placeholderTextColor="#A0A0A0"
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
      flex:
        1,
      backgroundColor:
        "#FFFFFF",
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
        "#111111",
      marginBottom:
        7,
    },

    subtitle: {
      fontSize:
        16,
      color:
        "#777777",
      marginBottom:
        30,
    },

    label: {
      fontSize:
        14,
      fontWeight:
        "600",
      color:
        "#222222",
      marginBottom:
        8,
    },

    input: {
      borderWidth:
        1,
      borderColor:
        "#DDDDDD",
      borderRadius:
        10,
      paddingHorizontal:
        14,
      paddingVertical:
        14,
      fontSize:
        16,
      color:
        "#111111",
      backgroundColor:
        "#FFFFFF",
      marginBottom:
        18,
    },

    loginButton: {
      backgroundColor:
        "#208AEF",
      paddingVertical:
        16,
      borderRadius:
        10,
      alignItems:
        "center",
    },

    loginButtonText: {
      color:
        "#FFFFFF",
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
        "#208AEF",
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
        "#208AEF",
      fontWeight:
        "600",
      marginTop:
        25,
    },

    resetCard: {
      borderWidth:
        1,
      borderColor:
        "#E5E5E5",
      backgroundColor:
        "#FAFAFA",
      padding:
        18,
      borderRadius:
        14,
      marginTop:
        22,
    },

    resetTitle: {
      fontSize:
        18,
      fontWeight:
        "800",
      marginBottom:
        15,
    },

    resetButton: {
      backgroundColor:
        "#208AEF",
      paddingVertical:
        14,
      borderRadius:
        10,
      alignItems:
        "center",
    },

    resetButtonText: {
      color:
        "#FFFFFF",
      fontWeight:
        "700",
    },

    cancelResetText: {
      color:
        "#777777",
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
        "#E8E8E8",
      borderRadius:
        16,
      padding:
        20,
      marginBottom:
        18,
      backgroundColor:
        "#FFFFFF",
    },

    sectionTitle: {
      fontSize:
        19,
      fontWeight:
        "800",
      color:
        "#111111",
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
        "#888888",
      marginBottom:
        6,
    },

    infoValue: {
      fontSize:
        17,
      fontWeight:
        "600",
      color:
        "#222222",
    },

    divider: {
      height:
        1,
      backgroundColor:
        "#EEEEEE",
      marginVertical:
        18,
    },

    editText: {
      color:
        "#208AEF",
      fontWeight:
        "700",
      fontSize:
        14,
    },

    profileInput: {
      borderWidth:
        1,
      borderColor:
        "#D5D5D5",
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
        "#FFFFFF",
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
        "#CCCCCC",
      paddingVertical:
        12,
      borderRadius:
        9,
      alignItems:
        "center",
    },

    cancelButtonText: {
      color:
        "#666666",
      fontWeight:
        "700",
    },

    saveButton: {
      flex:
        1,
      backgroundColor:
        "#208AEF",
      paddingVertical:
        12,
      borderRadius:
        9,
      alignItems:
        "center",
    },

    saveButtonText: {
      color:
        "#FFFFFF",
      fontWeight:
        "700",
    },

    cardDescription: {
      color:
        "#777777",
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
        "#208AEF",
      borderRadius:
        10,
      paddingVertical:
        13,
      alignItems:
        "center",
    },

    blueOutlineButtonText: {
      color:
        "#208AEF",
      fontWeight:
        "700",
    },

    currentAddressBox: {
      backgroundColor:
        "#F7F9FB",
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
        "#222222",
      lineHeight:
        23,
    },

    addressInput: {
      minHeight:
        90,
      textAlignVertical:
        "top",
    },

    restaurantProfileName: {
      fontSize:
        24,
      fontWeight:
        "800",
      marginBottom:
        7,
    },

    restaurantProfileDescription: {
      color:
        "#777777",
      fontSize:
        15,
      lineHeight:
        21,
    },

    logoutButton: {
      borderWidth:
        1,
      borderColor:
        "#E04646",
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
        "#E04646",
      fontSize:
        16,
      fontWeight:
        "700",
    },
  });