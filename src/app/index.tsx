import React, { useRef, useState } from "react";
import { Alert } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Cart, cartTotals } from "./Data/Data";
import { OrderLine, getProducts, saveOrder } from "./Data/Db";
import HomeScreen from "./Screens/HomeScreen";
import CreateOrderScreen from "./Screens/OrderScreen";
import CashPaymentScreen from "./Screens/PaymentScreen";
import OrderSuccessScreen from "./Screens/SuccessScreen";
import CostingScreen from "./Screens/CostingScreen";
import SalesScreen from "./Screens/SalesScreen";

type Route = "home" | "order" | "payment" | "success" | "costing" | "sales";

export default function App() {
  const [route, setRoute] = useState<Route>("home");
  const [cart, setCart] = useState<Cart>({});
  const [cash, setCash] = useState(0);
  const saving = useRef(false); // blocks double-taps on confirm

  const { items, total } = cartTotals(cart);

  const startOver = (to: Route) => {
    setCart({});
    setCash(0);
    setRoute(to);
  };

  // save the order to SQLite, then go to the success screen
  const confirmPayment = async (paid: number) => {
    if (saving.current) return;
    saving.current = true;
    try {
      // look names up from the DB so custom products are included
      const products = await getProducts();
      const lines: OrderLine[] = Object.entries(cart)
        .filter(([, l]) => l.qty > 0)
        .map(([productId, l]) => ({
          productId,
          name: products.find((p) => p.id === productId)?.name ?? productId,
          price: l.price,
          qty: l.qty,
        }));

      await saveOrder(lines, total, paid);
      setCash(paid);
      setRoute("success");
    } catch (e) {
      console.warn("Failed to save order", e);
      Alert.alert("Couldn't save order", "Please try again.");
    } finally {
      saving.current = false;
    }
  };

  return (
    <SafeAreaProvider>
      {route === "home" && (
        <HomeScreen onOrder={() => setRoute("order")} onCosting={() => setRoute("costing")} onSales={() => setRoute("sales")} />
      )}

      {route === "order" && (
        <CreateOrderScreen
          cart={cart}
          onChange={(id, line) => setCart((c) => ({ ...c, [id]: line }))}
          onBack={() => startOver("home")}
          onNext={() => setRoute("payment")}
        />
      )}

      {route === "payment" && (
        <CashPaymentScreen
          total={total}
          itemCount={items}
          onBack={() => setRoute("order")}
          onConfirm={confirmPayment}
        />
      )}

      {route === "success" && (
        <OrderSuccessScreen total={total} cash={cash} onNewOrder={() => startOver("order")} onHome={() => startOver("home")} />
      )}

      {route === "costing" && <CostingScreen onBack={() => setRoute("home")} />}
      {route === "sales" && <SalesScreen onBack={() => setRoute("home")} />}
    </SafeAreaProvider>
  );
}