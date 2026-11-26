import { DeliveryProvider } from "../context/DeliveryContext";
import AppUpdateGate from "../components/AppUpdateGate";
import {
  useEffect,
  useState,
} from "react";

import {
  Tabs,
  DarkTheme,
  DefaultTheme,
  ThemeProvider as NavigationThemeProvider,
} from "expo-router";

import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Text,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { ThemeProvider, useAppTheme } from "../context/ThemeContext";

import {
  AuthProvider,
  useAuth,
} from "../context/AuthContext";

import {
  CartProvider,
} from "../context/CartContext";

import {
  RestaurantLanguageProvider,
  useRestaurantLanguage,
} from "../context/RestaurantLanguageContext";

import {
  subscribeToMyRestaurantRequests,
} from "../services/restaurantRequestService";


// ==================================================
// TABS
// ==================================================

function AppTabs() {
  const { colors } = useAppTheme();
  const {
    user,
    role,
  } =
    useAuth();


  const {
    language,
  } =
    useRestaurantLanguage();


  const restaurantEnglish =
    role === "restaurant" &&
    language === "en";


  const [
    pendingRequestCount,
    setPendingRequestCount,
  ] =
    useState(
      0
    );


  // ==================================================
  // LIVE PENDING REQUEST COUNT
  // ==================================================

  useEffect(
    () => {
      if (
        role !==
        "restaurant"
      ) {
        setPendingRequestCount(
          0
        );

        return;
      }


      const unsubscribe =
        subscribeToMyRestaurantRequests(
          (
            requests
          ) => {
            const pendingCount =
              requests.filter(
                (
                  request
                ) =>
                  request.status ===
                  "pending"
              ).length;


            setPendingRequestCount(
              pendingCount
            );
          },

          (
            error
          ) => {
            console.log(
              "Order badge listener error:",
              error
            );

            setPendingRequestCount(
              0
            );
          }
        );


      return () => {
        unsubscribe();
      };

    },
    [
      role,
      user?.uid,
    ]
  );


  return (
    <Tabs
      screenOptions={{
        headerShown:
          false,

        tabBarHideOnKeyboard: true,

        tabBarActiveTintColor:
          colors.primary,

        tabBarInactiveTintColor:
          colors.textMuted,

        sceneStyle: { backgroundColor: colors.background },

        tabBarStyle: {
          height:
            68,

          paddingTop:
            7,

          paddingBottom:
            8,

          backgroundColor:
            colors.surface,

          borderTopColor:
            colors.border,

          borderTopWidth:
            1,
        },

        tabBarLabelStyle: {
          fontSize:
            12,

          fontWeight:
            "600",
        },
      }}
    >
      {/* ==================================================
          HOME
      ================================================== */}

      <Tabs.Screen
        name="index"
        options={{
          title:
            restaurantEnglish
              ? "Home"
              : "Hoved",

          tabBarIcon: ({
            focused,
          }) => (
            <Text
              style={{
                fontSize:
                  22,

                opacity:
                  focused
                    ? 1
                    : 0.6,
              }}
            >
              🏠
            </Text>
          ),
        }}
      />


      {/* ==================================================
          RESTAURANT REQUESTS
      ================================================== */}

      <Tabs.Screen
        name="requests"
        options={{
          title:
            restaurantEnglish
              ? "Orders"
              : "Bestillinger",

          href:
            role ===
            "restaurant"
              ? undefined
              : null,

          tabBarBadge:
            role ===
              "restaurant" &&
            pendingRequestCount >
              0
              ? pendingRequestCount >
                99
                ? "99+"
                : pendingRequestCount
              : undefined,

          tabBarBadgeStyle: {
            backgroundColor:
              colors.dangerFill,

            color:
              colors.onPrimary,

            fontSize:
              10,

            fontWeight:
              "800",
          },

          tabBarIcon: ({
            focused,
          }) => (
            <Text
              style={{
                fontSize:
                  22,

                opacity:
                  focused
                    ? 1
                    : 0.6,
              }}
            >
              📋
            </Text>
          ),
        }}
      />


      <Tabs.Screen name="worker-orders" options={{ title: "Oppdrag", href: role === "worker" ? undefined : null, tabBarIcon: () => <Text style={{ fontSize: 22 }}>🚗</Text> }} />

      <Tabs.Screen name="my-orders" options={{
        title: role === "admin" ? "Bestillinger" : "Mine bestillinger",
        href: role === "customer" || role === "admin" ? undefined : null,
        tabBarIcon: ({ focused }) => <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.6 }}>📦</Text>,
      }} />

      {/* ==================================================
          LOGIN / PROFILE
      ================================================== */}

      <Tabs.Screen
        name="login"
        options={{
          title:
            user
              ? restaurantEnglish
                ? "Profile"
                : "Profil"
              : "Logg inn",

          tabBarIcon: ({
            focused,
          }) => (
            <Text
              style={{
                fontSize:
                  22,

                opacity:
                  focused
                    ? 1
                    : 0.6,
              }}
            >
              {user
                ? "👤"
                : "🔑"}
            </Text>
          ),
        }}
      />


      {/* ==================================================
          HIDDEN AUTH
      ================================================== */}

      <Tabs.Screen
        name="auth"
        options={{
          // Keep this route reachable in SDK 58; hide only its tab button.
          tabBarButton: () => null,
          tabBarItemStyle: { display: "none" },
        }}
      />


      {/* ==================================================
          HIDDEN RESTAURANT PAGE
      ================================================== */}

      <Tabs.Screen
        name="restaurant/[id]"
        options={{
          // Keep this route reachable in SDK 58; hide only its tab button.
          tabBarButton: () => null,
          tabBarItemStyle: { display: "none" },
        }}
      />


      {/* ==================================================
          HIDDEN CART
      ================================================== */}

      <Tabs.Screen
        name="cart"
        options={{
          // Keep this route reachable in SDK 58; hide only its tab button.
          tabBarButton: () => null,
          tabBarItemStyle: { display: "none" },
        }}
      />


      {/* ==================================================
          HIDDEN CUSTOM ORDER
      ================================================== */}

      <Tabs.Screen
        name="custom-order"
        options={{
          // Keep this route reachable in SDK 58; hide only its tab button.
          tabBarButton: () => null,
          tabBarItemStyle: { display: "none" },
        }}
      />
    </Tabs>
  );
}

function ThemedApp() {
  const { colorScheme, colors, ready } = useAppTheme();
  const baseTheme = colorScheme === "dark" ? DarkTheme : DefaultTheme;
  const navigationTheme = {
    ...baseTheme,
    colors: {
      ...baseTheme.colors,
      background: colors.background,
      card: colors.surface,
      text: colors.text,
      border: colors.border,
      primary: colors.primary,
      notification: colors.dangerFill,
    },
  };

  return (
    <NavigationThemeProvider value={navigationTheme}>
      <View testID="app-surface" style={{ flex: 1, backgroundColor: colors.background }}>
        <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
        <AppUpdateGate>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding" enabled={Platform.OS !== "web"}>
          {ready ? <AppTabs /> : (
            <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
              <ActivityIndicator color={colors.primary} accessibilityLabel="Laster utseende" />
            </View>
          )}
        </KeyboardAvoidingView>
        </AppUpdateGate>
      </View>
    </NavigationThemeProvider>
  );
}


// ==================================================
// ROOT
// ==================================================

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <DeliveryProvider>
          <RestaurantLanguageProvider>
            <CartProvider>
              <ThemedApp />
            </CartProvider>
          </RestaurantLanguageProvider>
        </DeliveryProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
