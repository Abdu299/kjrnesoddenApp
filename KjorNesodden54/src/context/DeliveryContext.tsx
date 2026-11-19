import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { defaultDeliveryPricing, type DeliveryPricing } from "../services/deliveryPricing";
import { getDeliveryPricingFromServer, subscribeToDeliveryPricing } from "../services/deliveryPricingService";
import { subscribeToActiveRestaurants, type Restaurant } from "../services/restaurantService";

const initial = {
  pricing: defaultDeliveryPricing, pricingLoading: true, pricingError: "", saved: false,
  restaurants: [] as Restaurant[], restaurantsLoading: true, restaurantsError: "",
};
const DeliveryContext = createContext({ ...initial,
  reload: () => {}, refreshPricing: async (): Promise<DeliveryPricing> => defaultDeliveryPricing,
});

export function DeliveryProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(initial);
  const [generation, setGeneration] = useState(0);
  useEffect(() => {
    const prices = subscribeToDeliveryPricing((pricing, saved) => {
      setState((old) => pricing.revision < old.pricing.revision ? old : ({ ...old, pricing, saved, pricingLoading: false, pricingError: "" }));
    }, () => setState((old) => ({ ...old, pricingLoading: false,
      pricingError: "Kunne ikke hente leveringsprisene. Prøv igjen før du bestiller." })));
    const restaurants = subscribeToActiveRestaurants((restaurants) => {
      setState((old) => ({ ...old, restaurants, restaurantsLoading: false, restaurantsError: "" }));
    }, () => setState((old) => ({ ...old, restaurantsLoading: false,
      restaurantsError: "Kunne ikke hente restaurantenes leveringsområder." })));
    return () => { prices(); restaurants(); };
  }, [generation]);
  const reload = useCallback(() => {
    setState((old) => ({ ...old, pricingLoading: true, restaurantsLoading: true,
      pricingError: "", restaurantsError: "" }));
    setGeneration((old) => old + 1);
  }, []);
  const refreshPricing = useCallback(async () => {
    const pricing = await getDeliveryPricingFromServer();
    setState((old) => ({ ...old, pricing, pricingLoading: false, pricingError: "" }));
    return pricing;
  }, []);
  return <DeliveryContext.Provider value={{ ...state, reload, refreshPricing }}>{children}</DeliveryContext.Provider>;
}

export const useDelivery = () => useContext(DeliveryContext);
