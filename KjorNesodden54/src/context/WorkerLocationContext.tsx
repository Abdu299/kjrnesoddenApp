import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { AppState } from "react-native";
import * as Location from "expo-location";
import { useAuth } from "./AuthContext";

type Position = { latitude: number; longitude: number; timestamp: number };
type LocationState = { position: Position | null; message: string };
const Context = createContext<LocationState>({ position: null, message: "Venter på posisjon" });
export const useWorkerLocation = () => useContext(Context);

export function WorkerLocationProvider({ children }: { children: ReactNode }) {
  const { user, role } = useAuth();
  const [state, setState] = useState<LocationState>({ position: null, message: "Venter på posisjon" });
  useEffect(() => {
    if (!user || role !== "worker") { setState({ position: null, message: "Posisjon er av" }); return; }
    let disposed = false;
    let generation = 0;
    let subscription: Location.LocationSubscription | undefined;
    const stop = () => { generation++; subscription?.remove(); subscription = undefined; };
    const start = async () => {
      stop();
      const current = generation;
      try {
        const permission = await Location.requestForegroundPermissionsAsync();
        if (disposed || current !== generation) return;
        if (!permission.granted) { setState({ position: null, message: "Gi appen posisjonstilgang i innstillingene" }); return; }
        const watcher = await Location.watchPositionAsync({ accuracy: Location.Accuracy.Balanced, timeInterval: 10000, distanceInterval: 25 }, location => {
          if (!disposed && current === generation) setState({ position: { ...location.coords, timestamp: location.timestamp }, message: "Posisjon aktiv" });
        });
        if (disposed || current !== generation) watcher.remove(); else subscription = watcher;
      } catch { if (!disposed && current === generation) setState({ position: null, message: "Kunne ikke hente posisjonen" }); }
    };
    if (AppState.currentState === "active") void start();
    const listener = AppState.addEventListener("change", next => { if (next === "active") void start(); else { stop(); setState({ position: null, message: "Posisjon er satt på pause" }); } });
    return () => { disposed = true; stop(); listener.remove(); };
  }, [user?.uid, role]);
  return <Context.Provider value={state}>{children}</Context.Provider>;
}
