import React from "react";
import { createDrawerNavigator } from "@react-navigation/drawer";
import colors from "../constants/colors";
import { Ionicons } from "@expo/vector-icons";

import Index from "./index";
import Home from "./(panel)/home/page";
import Login from "./(auth)/singin/page";
import Signup from "./(auth)/signup/page";
import Profile from "./(panel)/profile/page";
import { GestureHandlerRootView } from "react-native-gesture-handler";

const Drawer = createDrawerNavigator();

function Routes() {
  return (
    <GestureHandlerRootView>
      <Drawer.Navigator
        initialRouteName="Home"
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
        {/* <Drawer.Screen
        name="index"
        component={Index}
        options={{
          headerShown: true,
          drawerLabel: () => null, // Oculta o rótulo do menu
          drawerIcon: () => null,
        }}
      /> */}
        <Drawer.Screen
          name="Home"
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
          name="Login"
          component={Login}
          options={{
            title: "Login",
            headerShown: false,
            drawerIcon: ({ focused, size, color }) => (
              <Ionicons
                name={focused ? "log-in" : "log-in-outline"}
                size={size}
                color={color}
              />
            ),
          }}
        />
        <Drawer.Screen
          name="Cadastro Login"
          component={Signup}
          options={{
            title: "Cadastro Login",
            headerShown: false,
            drawerIcon: ({ focused, size, color }) => (
              <Ionicons
                name={focused ? "person-add" : "person-add-outline"}
                size={size}
                color={color}
              />
            ),
          }}
        />
        <Drawer.Screen
          name="Perfil Login"
          component={Profile}
          options={{
            title: "Perfil Login",
            headerShown: false,
            drawerIcon: ({ focused, size, color }) => (
              <Ionicons
                name={focused ? "person" : "person-outline"}
                size={size}
                color={color}
              />
            ),
          }}
        />
      </Drawer.Navigator>
    </GestureHandlerRootView>
  );
}

export default Routes;
