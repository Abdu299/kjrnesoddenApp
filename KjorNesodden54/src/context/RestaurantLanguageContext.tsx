import {
    createContext,
    ReactNode,
    useContext,
    useEffect,
    useState,
} from "react";

import AsyncStorage from "@react-native-async-storage/async-storage";

import {
    useAuth,
} from "./AuthContext";


export type RestaurantLanguage =
  | "no"
  | "en";


type RestaurantLanguageContextType = {
  language:
    RestaurantLanguage;

  setLanguage: (
    language:
      RestaurantLanguage
  ) => void;
};


const RestaurantLanguageContext =
  createContext<RestaurantLanguageContextType>({
    language:
      "no",

    setLanguage:
      () => {},
  });


const STORAGE_PREFIX =
  "kjornesodden-restaurant-language";


export function RestaurantLanguageProvider({
  children,
}: {
  children:
    ReactNode;
}) {
  const {
    user,
    role,
  } =
    useAuth();


  const [
    language,
    setLanguageState,
  ] =
    useState<RestaurantLanguage>(
      "no"
    );


  useEffect(
    () => {
      let active =
        true;


      const loadLanguage =
        async () => {
          if (
            !user ||
            role !==
              "restaurant"
          ) {
            if (active) {
              setLanguageState(
                "no"
              );
            }

            return;
          }


          try {
            const savedLanguage =
              await AsyncStorage
                .getItem(
                  `${STORAGE_PREFIX}-${user.uid}`
                );


            if (
              active &&
              (
                savedLanguage ===
                  "no" ||
                savedLanguage ===
                  "en"
              )
            ) {
              setLanguageState(
                savedLanguage
              );

            } else if (
              active
            ) {
              setLanguageState(
                "no"
              );
            }

          } catch (
            error
          ) {
            console.log(
              "Restaurant language load error:",
              error
            );


            if (active) {
              setLanguageState(
                "no"
              );
            }
          }
        };


      loadLanguage();


      return () => {
        active =
          false;
      };

    },
    [
      user?.uid,
      role,
    ]
  );


  const setLanguage =
    (
      nextLanguage:
        RestaurantLanguage
    ) => {
      setLanguageState(
        nextLanguage
      );


      if (
        !user ||
        role !==
          "restaurant"
      ) {
        return;
      }


      AsyncStorage
        .setItem(
          `${STORAGE_PREFIX}-${user.uid}`,
          nextLanguage
        )
        .catch(
          (
            error
          ) => {
            console.log(
              "Restaurant language save error:",
              error
            );
          }
        );
    };


  return (
    <RestaurantLanguageContext.Provider
      value={{
        language,
        setLanguage,
      }}
    >
      {children}
    </RestaurantLanguageContext.Provider>
  );
}


export function useRestaurantLanguage() {
  return useContext(
    RestaurantLanguageContext
  );
}