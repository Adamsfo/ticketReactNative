import "react-native-gesture-handler";
import { AuthProvider } from "../contexts_/AuthContext";
import Routes from "./routes";
import { CartProvider } from "../contexts_/CartContext";
import FloatingWhatsAppButton from "../components/Whatsapp";
import GoogleAnalytics from "../components/GoogleAnalytics";
import { useSegments } from "expo-router";
import { useEffect } from "react";
import { logPageView } from "../components/GoogleAnalytics/analytics";

function MainLayout() {
  const segments = useSegments();

  useEffect(() => {
    if (segments.length > 0) {
      const path = "/" + segments.join("/");
      logPageView(path); // envia para o GA
    }
  }, [segments]);

  return (
    <>
      <Routes />
      <FloatingWhatsAppButton />
    </>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <CartProvider>
        <GoogleAnalytics />
        <MainLayout />
      </CartProvider>
    </AuthProvider>
  );
}
