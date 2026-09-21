import {
  useState,
} from "react";

import {
  Alert,
  KeyboardAvoidingView,
  Platform,
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
  registerCustomer,
} from "../../services/authService";


// ==================================================
// REGISTER
// ==================================================

export default function CustomerRegisterScreen() {
  const [
    name,
    setName,
  ] =
    useState("");


  const [
    email,
    setEmail,
  ] =
    useState("");


  const [
    phone,
    setPhone,
  ] =
    useState("");


  const [
    password,
    setPassword,
  ] =
    useState("");


  const [
    confirmPassword,
    setConfirmPassword,
  ] =
    useState("");


  const [
    loading,
    setLoading,
  ] =
    useState(false);


  const [
    registerError,
    setRegisterError,
  ] =
    useState("");


  // ==================================================
  // REGISTER
  // ==================================================

  const handleRegister =
    async () => {
      setRegisterError("");


      if (!name.trim()) {
        setRegisterError(
          "Skriv inn navnet ditt."
        );

        return;
      }


      if (!email.trim()) {
        setRegisterError(
          "Skriv inn e-postadressen din."
        );

        return;
      }


      if (!phone.trim()) {
        setRegisterError(
          "Skriv inn mobilnummeret ditt."
        );

        return;
      }


      if (password.length < 6) {
        setRegisterError(
          "Passordet må være minst 6 tegn."
        );

        return;
      }


      if (
        password !==
        confirmPassword
      ) {
        setRegisterError(
          "Passordene er ikke like."
        );

        return;
      }


      try {
        setLoading(
          true
        );


        await registerCustomer(
          name,
          email,
          phone,
          password
        );


        setRegisterError("");


        Alert.alert(
          "Konto opprettet",
          "Kontoen din er klar."
        );


        router.replace(
          "/"
        );

      } catch (
        error: any
      ) {
        console.log(
          "Register error:",
          error
        );


        setRegisterError(
          error?.message ||
            "Kunne ikke opprette konto. Prøv igjen."
        );

      } finally {
        setLoading(
          false
        );
      }
    };


  return (
    <SafeAreaView
      style={
        styles.container
      }
    >
      <KeyboardAvoidingView
        style={{
          flex: 1,
        }}
        behavior={
          Platform.OS ===
          "ios"
            ? "padding"
            : undefined
        }
      >
        <ScrollView
          contentContainerStyle={
            styles.content
          }
          keyboardShouldPersistTaps="handled"
        >

          <TouchableOpacity
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


          <Text
            style={
              styles.title
            }
          >
            Opprett konto
          </Text>


          <Text
            style={
              styles.subtitle
            }
          >
            Registrer deg for å bestille med KjørNesodden.
          </Text>


          {/* NAME */}

          <Text
            style={
              styles.label
            }
          >
            Navn
          </Text>

          <TextInput
            style={
              styles.input
            }
            placeholder="Ola Nordmann"
            placeholderTextColor="#A0A0A0"
            value={
              name
            }
            onChangeText={(value) => {
              setName(
                value
              );

              if (registerError) {
                setRegisterError("");
              }
            }}
            autoCapitalize="words"
            autoCorrect={
              false
            }
          />


          {/* EMAIL */}

          <Text
            style={
              styles.label
            }
          >
            E-post
          </Text>

          <TextInput
            style={
              styles.input
            }
            placeholder="navn@eksempel.no"
            placeholderTextColor="#A0A0A0"
            value={
              email
            }
            onChangeText={(value) => {
              setEmail(
                value
              );

              if (registerError) {
                setRegisterError("");
              }
            }}
            autoCapitalize="none"
            autoCorrect={
              false
            }
            keyboardType="email-address"
          />


          {/* PHONE */}

          <Text
            style={
              styles.label
            }
          >
            Mobilnummer
          </Text>

          <TextInput
            style={
              styles.input
            }
            placeholder="999 99 999"
            placeholderTextColor="#A0A0A0"
            value={
              phone
            }
            onChangeText={(value) => {
              setPhone(
                value
              );

              if (registerError) {
                setRegisterError("");
              }
            }}
            keyboardType="phone-pad"
          />


          <Text
            style={
              styles.helperText
            }
          >
            Mobilnummeret brukes ved behov for kontakt om bestillingen.
          </Text>


          {/* PASSWORD */}

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
            placeholder="Minst 6 tegn"
            placeholderTextColor="#A0A0A0"
            value={
              password
            }
            onChangeText={(value) => {
              setPassword(
                value
              );

              if (registerError) {
                setRegisterError("");
              }
            }}
            secureTextEntry
            autoCapitalize="none"
          />


          <Text
            style={
              styles.label
            }
          >
            Gjenta passord
          </Text>

          <TextInput
            style={
              styles.input
            }
            placeholder="Gjenta passord"
            placeholderTextColor="#A0A0A0"
            value={
              confirmPassword
            }
            onChangeText={(value) => {
              setConfirmPassword(
                value
              );

              if (registerError) {
                setRegisterError("");
              }
            }}
            secureTextEntry
            autoCapitalize="none"
          />


          {registerError ? (
            <View
              style={
                styles.errorBox
              }
            >
              <Text
                style={
                  styles.errorText
                }
              >
                {registerError}
              </Text>
            </View>
          ) : null}


          <TouchableOpacity
            style={[
              styles.registerButton,

              loading &&
                styles.disabledButton,
            ]}
            disabled={
              loading
            }
            onPress={
              handleRegister
            }
          >
            <Text
              style={
                styles.registerButtonText
              }
            >
              {loading
                ? "Oppretter..."
                : "Opprett konto"}
            </Text>
          </TouchableOpacity>


          <TouchableOpacity
            onPress={() =>
              router.replace(
                "/login"
              )
            }
          >
            <Text
              style={
                styles.loginText
              }
            >
              Har du allerede konto? Logg inn
            </Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
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

    content: {
      flexGrow: 1,
      paddingHorizontal:
        24,
      paddingTop:
        30,
      paddingBottom:
        50,
    },

    backText: {
      color:
        "#208AEF",
      fontSize:
        15,
      fontWeight:
        "600",
      marginBottom:
        35,
    },

    title: {
      fontSize:
        32,
      fontWeight:
        "800",
      color:
        "#111111",
      marginBottom:
        8,
    },

    subtitle: {
      fontSize:
        16,
      color:
        "#777777",
      lineHeight:
        23,
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

    helperText: {
      color:
        "#888888",
      fontSize:
        12,
      lineHeight:
        17,
      marginTop:
        -8,
      marginBottom:
        20,
    },

    errorBox: {
      backgroundColor:
        "#FFF1F1",
      borderWidth:
        1,
      borderColor:
        "#F2B8B5",
      borderRadius:
        10,
      paddingHorizontal:
        14,
      paddingVertical:
        12,
      marginBottom:
        16,
    },

    errorText: {
      color:
        "#B3261E",
      fontSize:
        14,
      lineHeight:
        20,
      fontWeight:
        "600",
    },

    registerButton: {
      backgroundColor:
        "#208AEF",
      paddingVertical:
        16,
      borderRadius:
        10,
      alignItems:
        "center",
      marginTop:
        8,
    },

    registerButtonText: {
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

    loginText: {
      textAlign:
        "center",
      color:
        "#208AEF",
      fontSize:
        15,
      fontWeight:
        "600",
      marginTop:
        24,
    },
  });