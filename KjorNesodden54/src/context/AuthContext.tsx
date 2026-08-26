import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  onAuthStateChanged,
  User,
} from "firebase/auth";

import {
  doc,
  onSnapshot,
} from "firebase/firestore";

import {
  auth,
  db,
} from "../services/firebase";


type UserRole =
  | "customer"
  | "restaurant"
  | "admin"
  | null;


type AuthContextType = {
  user:
    User | null;

  role:
    UserRole;

  loading:
    boolean;
};


const AuthContext =
  createContext<AuthContextType>({
    user:
      null,

    role:
      null,

    loading:
      true,
  });


// ==================================================
// PROVIDER
// ==================================================

export function AuthProvider({
  children,
}: {
  children:
    ReactNode;
}) {
  const [
    user,
    setUser,
  ] =
    useState<User | null>(
      null
    );


  const [
    role,
    setRole,
  ] =
    useState<UserRole>(
      null
    );


  const [
    loading,
    setLoading,
  ] =
    useState(
      true
    );


  useEffect(() => {
    let unsubscribeUserDocument:
      (() => void) | null =
        null;


    const unsubscribeAuth =
      onAuthStateChanged(
        auth,
        (
          firebaseUser
        ) => {

          // Stop old Firestore listener
          if (
            unsubscribeUserDocument
          ) {
            unsubscribeUserDocument();

            unsubscribeUserDocument =
              null;
          }


          setLoading(
            true
          );


          setUser(
            firebaseUser
          );


          // ==================================================
          // LOGGED OUT
          // ==================================================

          if (
            !firebaseUser
          ) {
            setRole(
              null
            );

            setLoading(
              false
            );

            return;
          }


          // ==================================================
          // WATCH USER DOCUMENT
          // ==================================================

          const userReference =
            doc(
              db,
              "users",
              firebaseUser.uid
            );


          unsubscribeUserDocument =
            onSnapshot(
              userReference,

              (
                userDocument
              ) => {

                if (
                  !userDocument.exists()
                ) {
                  setRole(
                    null
                  );

                  setLoading(
                    false
                  );

                  return;
                }


                const data =
                  userDocument.data();


                if (
                  data.role ===
                    "customer" ||
                  data.role ===
                    "restaurant" ||
                  data.role ===
                    "admin"
                ) {
                  setRole(
                    data.role
                  );

                } else {
                  setRole(
                    null
                  );
                }


                setLoading(
                  false
                );
              },

              (
                error
              ) => {
                console.log(
                  "User role listener error:",
                  error
                );

                setRole(
                  null
                );

                setLoading(
                  false
                );
              }
            );
        }
      );


    return () => {
      unsubscribeAuth();


      if (
        unsubscribeUserDocument
      ) {
        unsubscribeUserDocument();
      }
    };
  }, []);


  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}


// ==================================================
// HOOK
// ==================================================

export function useAuth() {
  return useContext(
    AuthContext
  );
}