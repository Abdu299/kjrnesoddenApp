import { useCallback, useRef, useState } from "react";
import { useFocusEffect } from "expo-router";
import { useAuth } from "../context/AuthContext";
import { useDelivery } from "../context/DeliveryContext";
import { getCurrentProfile, type ProfileData } from "../services/profileService";
import { quoteDelivery } from "../services/deliveryPricing";

export function useDeliveryEstimate(restaurantIds: string[] = []) {
  const { user, role } = useAuth();
  const delivery = useDelivery();
  const [customer, setCustomer] = useState<{ uid: string; profile: ProfileData } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [generation, setGeneration] = useState(0);
  const requestGeneration = useRef(0);
  useFocusEffect(useCallback(() => {
    let active = true;
    requestGeneration.current = generation;
    const currentGeneration = generation;
    if (user && role === "customer") {
      getCurrentProfile().then((profile) => {
        if (active && requestGeneration.current === currentGeneration) { setCustomer({ uid: user.uid, profile }); setError(""); setLoading(false); }
      }).catch(() => { if (active && requestGeneration.current === currentGeneration) { setError("Kunne ikke hente leveringsadressen din."); setLoading(false); } });
    }
    return () => { active = false; };
  }, [user, role, generation]));
  const profile = customer?.uid === user?.uid ? customer?.profile ?? null : null;
  const restaurants = restaurantIds.map((id) => delivery.restaurants.find((restaurant) => restaurant.id === id) ??
    { id, name: "Restaurant", deliveryAreaId: null });
  const quote = quoteDelivery(restaurants, profile?.deliveryAreaId ?? null, profile?.address ?? "", delivery.pricing);
  return {
    ...delivery, profile, quote,
    loading: delivery.pricingLoading || delivery.restaurantsLoading || (!!user && role === "customer" && (loading || (!profile && !error))),
    error: delivery.pricingError || delivery.restaurantsError || (user && role === "customer" ? error : ""),
    reloadEstimate: () => { setError(""); setLoading(true); setGeneration((old) => old + 1); delivery.reload(); },
  };
}
