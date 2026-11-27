import { useAuth } from "../context/AuthContext";
import AdminOrders from "../components/AdminOrders";
import CustomerOrderList from "../components/CustomerOrderList";

export default function MyOrders() {
  const { role } = useAuth();
  return role === "admin" ? <AdminOrders /> : <CustomerOrderList />;
}
