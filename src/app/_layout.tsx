// import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-gesture-handler";
// import { router } from "expo-router";
import { AuthProvider } from "../contexts_/AuthContext";
import { useEffect, useState } from "react";
// import { Drawer } from "expo-router/drawer";
import { Usuario } from "../types/geral";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiAuth } from "../lib/auth";

import Menu from "@/src/components/Menu";
import Routes from "./routes";

function MainLayout() {
  const [usuario, setUsuario] = useState<Usuario>();

  useEffect(() => {
    const fetchToken = async () => {
      let _token = await AsyncStorage.getItem("token");
      if (_token) {
        const response = await apiAuth.getUsurioToken(_token);

        console.log(response);
        if (response) {
          setUsuario(response as unknown as Usuario);
        }
      }

      // router.replace("/(panel)/home/page");
    };
    fetchToken();
  }, []);

  return <Routes />;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
}
