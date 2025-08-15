import React, { useCallback, useEffect, useState } from "react";
import { createDrawerNavigator } from "@react-navigation/drawer";
import colors from "../constants/colors";
import { Ionicons } from "@expo/vector-icons";

import Index from "./index";
import Home from "./(panel)/home/page";
import Login from "./(auth)/singin/page";
import Signup from "./(auth)/signup/page";
import MinhaConta from "./(auth)/minhaConta/page";
import Profile from "./(panel)/profile/page";
import Evento from "./(panel)/evento/page";
import MeusEventos from "./(panel)/meuseventos/page";
import MeusEventosEdit from "./(panel)/meuseventos/pageEdit";
import MeusEventoNewIngresso from "./(panel)/meuseventos/pageNewIngresso";
import Produtor from "./(panel)/produtor/page";
import Usuario from "./(panel)/usuario/page";
import TipoIngresso from "./(panel)/tipoIngresso/page";
import Ingressos from "./(panel)/ingressos/page";
import Conferencia from "./(panel)/conferencia/page";
import Pagamento from "./(panel)/pagamento/page";
import PagamentoPDV from "./(panel)/pagamentoPDV/page";
import ChecoutMP from "./(panel)/checkoutmp/page";
import MeusIngressos from "./(panel)/meusingressos/page";
import MinhasCompras from "./(panel)/minhascompras/page";
import Ingresso from "./(panel)/ingresso/page";
import Validador from "./(panel)/validador/page";
import IngressoTransacao from "./(panel)/ingressosTransacao/page";
import {
  ActivityIndicator,
  Image,
  Linking,
  StyleSheet,
  Text,
  View,
} from "react-native";
import RecuperarSenha from "./(auth)/recuperarSenha/page";
import RedefinirSenha from "./(auth)/redefinirSenha/page";
import { useAuth } from "../contexts_/AuthContext";
import CupomPromocional from "./(panel)/cupomPromocional/page";
import CupomPromocionalEdit from "./(panel)/cupomPromocional/pageEdit";
import TermosUso from "./(panel)/termosUso/page";
import PoliticaPrivacidade from "./(panel)/politicaPrivacidade/page";

// Simule ou obtenha de algum contexto/autenticação
// Aqui você pode obter esses valores de um contexto, props, Redux ou qualquer outro gerenciador de estado

// const isValidador = false;
// const isCliente = false;
// const isAdministrador = true;
// const isProdutor = true;
// Exemplo: const { isValidador, isCliente, isAdministrador } = useAuth();

const Drawer = createDrawerNavigator();

function Routes() {
  const [isLoading, setIsLoading] = useState(true);
  const [params, setParams] = useState<string>("");
  const { isAdministrador, isValidador, isCliente, isProdutor, isPDV } =
    useAuth();

  const getUrlAsync = async () => {
    const url = await Linking.getInitialURL();
    if (url) {
      setParams(url);
    }

    return url;
  };

  useEffect(() => {
    const fetchData = async () => {
      let url = "";
      url = (await getUrlAsync()) ?? "";
      if (url.includes("checkoutmp")) {
        setIsLoading(false);
      } else {
        const timer = setTimeout(() => {
          setIsLoading(false);
        }, 1000);

        return () => clearTimeout(timer);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loaderContainer}>
          <Image
            style={styles.imagem}
            source={require("../assets/logoJangoIngressosSemFundo.png")}
          />
          <ActivityIndicator
            style={{ marginTop: -25 }}
            size="large"
            color={colors.laranjado}
          />
        </View>
        <Text style={styles.text}>Carregando...</Text>
      </View>
    );
  }

  // Função para definir quais menus aparecem
  function renderDrawerScreens() {
    // ADMIN vê tudo
    if (isAdministrador) {
      return (
        <>
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
            name="meusevento"
            component={MeusEventos}
            options={{ headerShown: false, title: "Meus Eventos" }}
          />
          <Drawer.Screen
            name="produtor"
            component={Produtor}
            options={{ headerShown: false, title: "Produtor" }}
          />
          <Drawer.Screen
            name="validador"
            component={Validador}
            options={{ headerShown: false, title: "Validador" }}
          />
          <Drawer.Screen
            name="tipoingresso"
            component={TipoIngresso}
            options={{ headerShown: false, title: "Tipo Ingresso" }}
          />
          <Drawer.Screen
            name="minhaconta"
            component={MinhaConta}
            options={{
              headerShown: false,
              title: "Conta",
              drawerIcon: ({ focused, size, color }) => (
                <Ionicons
                  name={focused ? "person" : "person-outline"}
                  size={size}
                  color={color}
                />
              ),
            }}
          />
          <Drawer.Screen
            name="meusingressos"
            component={MeusIngressos}
            options={{
              headerShown: false,
              title: "Meus Ingressos",
              drawerIcon: ({ focused, size, color }) => (
                <Ionicons
                  name={focused ? "ticket" : "ticket-outline"}
                  size={size}
                  color={color}
                />
              ),
            }}
          />
          <Drawer.Screen
            name="cupompromocional"
            component={CupomPromocional}
            options={{ headerShown: false, title: "Cupom Promocional" }}
          />
          <Drawer.Screen
            name="cupompromocionaledit"
            component={CupomPromocionalEdit}
            options={{
              headerShown: false,
              drawerLabel: () => null,
              drawerIcon: () => null,
              drawerItemStyle: { display: "none" },
            }}
          />
        </>
      );
    }
    // Produtor vê só o menu "Produtor"
    if (isProdutor) {
      return (
        <>
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
            name="meusingressos"
            component={MeusIngressos}
            options={{
              headerShown: false,
              title: "Meus Ingressos",
              drawerIcon: ({ focused, size, color }) => (
                <Ionicons
                  name={focused ? "ticket" : "ticket-outline"}
                  size={size}
                  color={color}
                />
              ),
            }}
          />
          <Drawer.Screen
            name="minhascompras"
            component={MinhasCompras}
            options={{
              headerShown: false,
              title: "Minhas Compras",
              drawerIcon: ({ focused, size, color }) => (
                <Ionicons
                  name={focused ? "briefcase" : "briefcase-outline"}
                  size={size}
                  color={color}
                />
              ),
            }}
          />
          <Drawer.Screen
            name="meusevento"
            component={MeusEventos}
            options={{ headerShown: false, title: "Meus Eventos" }}
          />
          <Drawer.Screen
            name="cupompromocional"
            component={CupomPromocional}
            options={{ headerShown: false, title: "Cupom Promocional" }}
          />
          <Drawer.Screen
            name="cupompromocionaledit"
            component={CupomPromocionalEdit}
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
            options={{ headerShown: false, title: "Produtor" }}
          />
          <Drawer.Screen
            name="validador"
            component={Validador}
            options={{ headerShown: false, title: "Validador" }}
          />
          <Drawer.Screen
            name="usuario"
            component={Usuario}
            options={{
              headerShown: false,
              title: "Usuários",
              drawerIcon: ({ focused, size, color }) => (
                <Ionicons
                  name={focused ? "person-circle" : "person-circle-outline"}
                  size={size}
                  color={color}
                />
              ),
            }}
          />
          <Drawer.Screen
            name="minhaconta"
            component={MinhaConta}
            options={{
              headerShown: false,
              title: "Minha Conta",
              drawerIcon: ({ focused, size, color }) => (
                <Ionicons
                  name={focused ? "person" : "person-outline"}
                  size={size}
                  color={color}
                />
              ),
            }}
          />
        </>
      );
    }
    // VALIDADOR vê só o menu "Validador"
    if (isValidador) {
      return (
        <>
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
            name="validador"
            component={Validador}
            options={{
              headerShown: false,
              title: "Validador",
            }}
          />
        </>
      );
    }
    // VALIDADOR vê só o menu "Validador"
    if (isPDV) {
      return (
        <>
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
            name="validador"
            component={Validador}
            options={{ headerShown: false, title: "Validador" }}
          />
          <Drawer.Screen
            name="usuario"
            component={Usuario}
            options={{
              headerShown: false,
              title: "Usuários",
              drawerIcon: ({ focused, size, color }) => (
                <Ionicons
                  name={focused ? "person-circle" : "person-circle-outline"}
                  size={size}
                  color={color}
                />
              ),
            }}
          />
        </>
      );
    }
    // CLIENTE vê só "Meus Ingressos" e "Minhas Compras"
    if (isCliente) {
      return (
        <>
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
            name="meusingressos"
            component={MeusIngressos}
            options={{
              headerShown: false,
              title: "Meus Ingressos",
              drawerIcon: ({ focused, size, color }) => (
                <Ionicons
                  name={focused ? "ticket" : "ticket-outline"}
                  size={size}
                  color={color}
                />
              ),
            }}
          />
          <Drawer.Screen
            name="minhascompras"
            component={MinhasCompras}
            options={{
              headerShown: false,
              title: "Minhas Compras",
              drawerIcon: ({ focused, size, color }) => (
                <Ionicons
                  name={focused ? "briefcase" : "briefcase-outline"}
                  size={size}
                  color={color}
                />
              ),
            }}
          />
          <Drawer.Screen
            name="minhaconta"
            component={MinhaConta}
            options={{
              headerShown: false,
              title: "Conta",
              drawerIcon: ({ focused, size, color }) => (
                <Ionicons
                  name={focused ? "person" : "person-outline"}
                  size={size}
                  color={color}
                />
              ),
            }}
          />
        </>
      );
    }
    // Default: nada ou outros menus
    return null;
  }

  return (
    <Drawer.Navigator
      screenOptions={{
        drawerActiveBackgroundColor: colors.laranjado,
        drawerActiveTintColor: colors.white,
        drawerContentStyle: { marginTop: 26 },
        drawerLabelStyle: { fontSize: 16 },
      }}
    >
      {/* Sempre escondidos */}
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
        name="checkoutmp"
        component={ChecoutMP}
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
        name="recuperarsenha"
        component={RecuperarSenha}
        options={{
          headerShown: false,
          drawerLabel: () => null,
          drawerIcon: () => null,
          drawerItemStyle: { display: "none" },
        }}
      />
      <Drawer.Screen
        name="redefinirsenha"
        component={RedefinirSenha}
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
        name="ingresso"
        component={Ingresso}
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
        name="pagamentopdv"
        component={PagamentoPDV}
        options={{
          headerShown: false,
          drawerLabel: () => null,
          drawerIcon: () => null,
          drawerItemStyle: { display: "none" },
        }}
      />
      <Drawer.Screen
        name="ingressostransacao"
        component={IngressoTransacao}
        options={{
          headerShown: false,
          drawerLabel: () => null,
          drawerIcon: () => null,
          drawerItemStyle: { display: "none" },
        }}
      />
      <Drawer.Screen
        name="termosuso"
        component={TermosUso}
        options={{
          headerShown: false,
          drawerLabel: () => null,
          drawerIcon: () => null,
          drawerItemStyle: { display: "none" },
        }}
      />

      <Drawer.Screen
        name="politicadeprivacidade"
        component={PoliticaPrivacidade}
        options={{
          headerShown: false,
          drawerLabel: () => null,
          drawerIcon: () => null,
          drawerItemStyle: { display: "none" },
        }}
      />

      {/* Renderiza os menus de acordo com o papel */}
      {renderDrawerScreens()}
    </Drawer.Navigator>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.branco,
  },
  loaderContainer: {
    justifyContent: "center",
    alignItems: "center",
    marginTop: -25,
  },
  text: {
    fontSize: 18,
    color: colors.laranjado,
  },
  imagem: {
    width: 220,
    height: 180,
    marginLeft: 20,
    resizeMode: "stretch",
  },
});

export default Routes;
