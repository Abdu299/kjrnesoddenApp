import {
  useEffect,
  useState,
} from "react";

import "../global.css";

import {
  Tabs,
} from "expo-router";

import {
  Text,
} from "react-native";

import {
  AuthProvider,
  useAuth,
} from "../context/AuthContext";

import {
  CartProvider,
} from "../context/CartContext";

import {
  subscribeToMyRestaurantRequests,
} from "../services/restaurantRequestService";


// ==================================================
// TABS
// ==================================================

function AppTabs() {
  const {
    user,
    role,
  } =
    useAuth();


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

        tabBarActiveTintColor:
          "#208AEF",

        tabBarInactiveTintColor:
          "#888888",

        tabBarStyle: {
          height:
            68,

          paddingTop:
            7,

          paddingBottom:
            8,

          backgroundColor:
            "#FFFFFF",

          borderTopColor:
            "#E5E5E5",

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
            "Hoved",

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
            "Bestillinger",

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
              "#E53935",

            color:
              "#FFFFFF",

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


      {/* ==================================================
          LOGIN / PROFILE
      ================================================== */}

      <Tabs.Screen
        name="login"
        options={{
          title:
            user
              ? "Profil"
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
          href:
            null,
        }}
      />


      {/* ==================================================
          HIDDEN RESTAURANT PAGE
      ================================================== */}

      <Tabs.Screen
        name="restaurant/[id]"
        options={{
          href:
            null,
        }}
      />


      {/* ==================================================
          HIDDEN CART
      ================================================== */}

      <Tabs.Screen
        name="cart"
        options={{
          href:
            null,
        }}
      />


      {/* ==================================================
          HIDDEN CUSTOM ORDER
      ================================================== */}

      <Tabs.Screen
        name="custom-order"
        options={{
          href:
            null,
        }}
      />
    </Tabs>
  );
}


// ==================================================
// ROOT
// ==================================================

export default function RootLayout() {
  return (
    <AuthProvider>
      <CartProvider>
        <AppTabs />
      </CartProvider>
    </AuthProvider>
  );
}
