import "react-native-gesture-handler";
import { AuthProvider } from "../contexts_/AuthContext";
import Routes from "./routes";

function MainLayout() {
  return <Routes />;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
}
