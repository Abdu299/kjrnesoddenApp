import AdminPage from "../components/AdminPage";
import DeliveryPricingEditor from "../components/DeliveryPricingEditor";
export default function AdminPricing() {
  return <AdminPage title="Leveringspriser" subtitle="Administrer prisene kundene får oppgitt ved bestilling."><DeliveryPricingEditor /></AdminPage>;
}
