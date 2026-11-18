import KeyboardScrollView from "../../components/KeyboardScrollView";
import { useThemedStyles } from "../../context/ThemeContext";
import type { AppThemeColors } from "../../constants/app-theme";
import {
  useState,
} from "react";

import {
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
} from "expo-router";

import {
  registerCustomer,
} from "../../services/authService";


// ==================================================
// REGISTER
// ==================================================

export default function CustomerRegisterScreen() {
  const { styles, colors } = useThemedStyles(createStyles);

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
        <KeyboardScrollView
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
            placeholderTextColor={colors.placeholder}
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
            placeholderTextColor={colors.placeholder}
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
            placeholderTextColor={colors.placeholder}
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
            placeholderTextColor={colors.placeholder}
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
            placeholderTextColor={colors.placeholder}
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
        colors.primary,
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
        colors.text,
      marginBottom:
        8,
    },

    subtitle: {
      fontSize:
        16,
      color:
        colors.textMuted,
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

    helperText: {
      color:
        colors.textMuted,
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

    errorText: {
      color:
        colors.danger,
      fontSize:
        14,
      lineHeight:
        20,
      fontWeight:
        "600",
    },

    registerButton: {
      backgroundColor:
        colors.primaryFill,
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

    loginText: {
      textAlign:
        "center",
      color:
        colors.primary,
      fontSize:
        15,
      fontWeight:
        "600",
      marginTop:
        24,
    },
  });
