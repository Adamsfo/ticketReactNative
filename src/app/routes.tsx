import React, { useCallback, useEffect, useState } from "react";
import { createDrawerNavigator } from "@react-navigation/drawer";
import colors from "../constants/colors";
import { Ionicons } from "@expo/vector-icons";

import Index from "./index";
import Home from "./(panel)/home/page";
import Login from "./(auth)/singin/page";
import Signup from "./(auth)/signup/page";
import Profile from "./(panel)/profile/page";
import Evento from "./(panel)/evento/page";
import MeusEventos from "./(panel)/meuseventos/page";
import MeusEventosEdit from "./(panel)/meuseventos/pageEdit";
import MeusEventoNewIngresso from "./(panel)/meuseventos/pageNewIngresso";
import Produtor from "./(panel)/produtor/page";
import TipoIngresso from "./(panel)/tipoIngresso/page";
import Ingressos from "./(panel)/ingressos/page";
import Conferencia from "./(panel)/conferencia/page";
import Pagamento from "./(panel)/pagamento/page";
import ChecoutMP from "./(panel)/checkoutmp/page";
import MeusIngressos from "./(panel)/meusingressos/page";
import {
  ActivityIndicator,
  Image,
  Linking,
  StyleSheet,
  Text,
  View,
} from "react-native";

const Drawer = createDrawerNavigator();

function Routes() {
  const [isLoading, setIsLoading] = useState(true);
  const [params, setParams] = useState<string>("");

  const getUrlAsync = async () => {
    const url = await Linking.getInitialURL();
    if (url) {
      setParams(url);
    }

    return url;
  };

  useEffect(() => {
    const fetchData = async () => {
      // Simula um carregamento inicial com duração de 3 segundos
      let url = "";
      url = (await getUrlAsync()) ?? "";
      if (url.includes("checkoutmp")) {
        setIsLoading(false);
      } else {
        const timer = setTimeout(() => {
          setIsLoading(false);
        }, 1000);

        return () => clearTimeout(timer); // Limpa o temporizador na desmontagem do componente
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loaderContainer}>
          <Image source={require("../assets/logoJango.png")} />
          <ActivityIndicator size="large" color={colors.laranjado} />
        </View>
        <Text style={styles.text}>Carregando...</Text>
      </View>
    );
  }

  return (
    // <GestureHandlerRootView>
    <Drawer.Navigator
      // initialRouteName={initialRoute}
      screenOptions={{
        drawerActiveBackgroundColor: colors.laranjado,
        drawerActiveTintColor: colors.white,
        drawerContentStyle: {
          marginTop: 26,
        },
        drawerLabelStyle: {
          fontSize: 16,
        },
      }}
    >
      <Drawer.Screen
        name="index"
        component={Index}
        initialParams={{ params }}
        options={{
          headerShown: false,
          drawerLabel: () => null,
          drawerIcon: () => null,
          drawerItemStyle: { display: "none" },
        }}
      />

      <Drawer.Screen
        name="home"
        component={Home}
        // initialParams={{ initialRoute: true }}
        options={{
          title: "Home",
          headerShown: false,
          drawerIcon: ({ focused, size, color }) => (
            <Ionicons
              name={focused ? "home" : "home-outline"}
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Drawer.Screen
        name="checkoutmp"
        component={ChecoutMP}
        // initialParams={{ initialRoute }}
        options={{
          headerShown: false,
          drawerLabel: () => null,
          drawerIcon: () => null,
          drawerItemStyle: { display: "none" },
        }}
      />

      <Drawer.Screen
        name="login"
        component={Login}
        options={{
          headerShown: false,
          drawerLabel: () => null,
          drawerIcon: () => null,
          drawerItemStyle: { display: "none" },
        }}
      />
      <Drawer.Screen
        name="loginAdd"
        component={Signup}
        options={{
          headerShown: false,
          drawerLabel: () => null,
          drawerIcon: () => null,
          drawerItemStyle: { display: "none" },
        }}
      />
      <Drawer.Screen
        name="perfil"
        component={Profile}
        options={{
          headerShown: false,
          drawerLabel: () => null,
          drawerIcon: () => null,
          drawerItemStyle: { display: "none" },
        }}
      />
      <Drawer.Screen
        name="evento"
        component={Evento}
        options={{
          headerShown: false,
          drawerLabel: () => null,
          drawerIcon: () => null,
          drawerItemStyle: { display: "none" },
        }}
      />
      <Drawer.Screen
        name="meusevento"
        component={MeusEventos}
        options={{
          headerShown: false,
          title: "Meus Eventos",
        }}
      />
      <Drawer.Screen
        name="meuseventoedit"
        component={MeusEventosEdit}
        options={{
          headerShown: false,
          drawerLabel: () => null,
          drawerIcon: () => null,
          drawerItemStyle: { display: "none" },
        }}
      />
      <Drawer.Screen
        name="meuseventonewingresso"
        component={MeusEventoNewIngresso}
        options={{
          headerShown: false,
          drawerLabel: () => null,
          drawerIcon: () => null,
          drawerItemStyle: { display: "none" },
        }}
      />
      <Drawer.Screen
        name="ingressos"
        component={Ingressos}
        options={{
          headerShown: false,
          drawerLabel: () => null,
          drawerIcon: () => null,
          drawerItemStyle: { display: "none" },
        }}
      />
      <Drawer.Screen
        name="conferencia"
        component={Conferencia}
        options={{
          headerShown: false,
          drawerLabel: () => null,
          drawerIcon: () => null,
          drawerItemStyle: { display: "none" },
        }}
      />
      <Drawer.Screen
        name="pagamento"
        component={Pagamento}
        options={{
          headerShown: false,
          drawerLabel: () => null,
          drawerIcon: () => null,
          drawerItemStyle: { display: "none" },
        }}
      />
      <Drawer.Screen
        name="produtor"
        component={Produtor}
        options={{
          headerShown: false,
          title: "Produtor",
        }}
      />
      <Drawer.Screen
        name="tipoingresso"
        component={TipoIngresso}
        options={{
          headerShown: false,
          title: "Tipo Ingresso",
        }}
      />
      <Drawer.Screen
        name="meusingressos"
        component={MeusIngressos}
        options={{
          headerShown: false,
          drawerLabel: () => null,
          drawerIcon: () => null,
          drawerItemStyle: { display: "none" },
        }}
      />
    </Drawer.Navigator>
    // </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.branco, // Cor de fundo da splash screen
  },
  loaderContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  text: {
    marginTop: 20,
    fontSize: 18,
    color: colors.laranjado,
  },
});

export default Routes;
