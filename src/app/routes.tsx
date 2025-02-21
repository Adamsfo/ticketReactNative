import React from "react";
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
import Produtor from "./(panel)/produtor/page";
import TipoIngresso from "./(panel)/tipoIngresso/page";
import { GestureHandlerRootView } from "react-native-gesture-handler";

const Drawer = createDrawerNavigator();

function Routes() {
  return (
    <GestureHandlerRootView>
      <Drawer.Navigator
        initialRouteName="index"
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
          options={{
            headerShown: true,
            drawerLabel: () => null, // Oculta o rótulo do menu
            drawerIcon: () => null, // Oculta o ícone do menu
            drawerItemStyle: { display: "none" }, // Oculta completamente o item do menu
          }}
        />
        <Drawer.Screen
          name="home"
          component={Home}
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
          name="login"
          component={Login}
          options={{
            headerShown: false,
            drawerLabel: () => null, // Oculta o rótulo do menu
            drawerIcon: () => null, // Oculta o ícone do menu
            drawerItemStyle: { display: "none" }, // Oculta completamente o item do menu
          }}
        />
        <Drawer.Screen
          name="loginAdd"
          component={Signup}
          options={{
            headerShown: false,
            drawerLabel: () => null, // Oculta o rótulo do menu
            drawerIcon: () => null, // Oculta o ícone do menu
            drawerItemStyle: { display: "none" }, // Oculta completamente o item do menu
          }}
        />
        <Drawer.Screen
          name="perfil"
          component={Profile}
          options={{
            headerShown: false,
            drawerLabel: () => null, // Oculta o rótulo do menu
            drawerIcon: () => null, // Oculta o ícone do menu
            drawerItemStyle: { display: "none" }, // Oculta completamente o item do menu
          }}
        />
        <Drawer.Screen
          name="evento"
          component={Evento}
          options={{
            headerShown: false,
            drawerLabel: () => null, // Oculta o rótulo do menu
            drawerIcon: () => null, // Oculta o ícone do menu
            drawerItemStyle: { display: "none" }, // Oculta completamente o item do menu
          }}
        />
        <Drawer.Screen
          name="meusevento"
          component={MeusEventos}
          options={{
            headerShown: false,
            title: "Meus Evento",
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
      </Drawer.Navigator>
    </GestureHandlerRootView>
  );
}

export default Routes;
