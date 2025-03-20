import "react-native-gesture-handler";
import { AuthProvider } from "../contexts_/AuthContext";
import Routes from "./routes";
import { CartProvider } from "../contexts_/CartContext";

function MainLayout() {
  return <Routes />;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <CartProvider>
        <MainLayout />
      </CartProvider>
    </AuthProvider>
  );
}
