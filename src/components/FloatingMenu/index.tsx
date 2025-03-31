import colors from "@/src/constants/colors";
import { useAuth } from "@/src/contexts_/AuthContext";
import { apiAuth } from "@/src/lib/auth";
import { Usuario } from "@/src/types/geral";
import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import * as React from "react";
import {
  View,
  StyleSheet,
  Platform,
  StatusBar,
  TouchableOpacity,
  Text,
  Modal,
} from "react-native";
import { FAB } from "react-native-paper";

const FloatingMenu = ({ color }: { color?: string }) => {
  const [open, setOpen] = React.useState(false);
  const toggleMenu = () => setOpen(!open);
  // const [usuario, setUsuario] = React.useState<Usuario>({} as Usuario);
  const navigation = useNavigation() as any;
  const { user, setAuth } = useAuth();

  const fetchToken = async () => {
    console.log("Fetching token...");
    let _token = await AsyncStorage.getItem("token");
    console.log("Token:", _token); // Verifique se o token está sendo recuperado

    if (_token) {
      const response = await apiAuth.getUsurioToken(_token);
      console.log("API Response:", response); // Verifique a resposta da API

      if (response) {
        setAuth(response as unknown as Usuario);
        // setUsuario(response as unknown as Usuario);
        await AsyncStorage.setItem("usuario", JSON.stringify(response));
      } else {
        // setUsuario({} as Usuario);
        setAuth({} as Usuario);
      }
    } else {
      // setUsuario({} as Usuario);
      setAuth({} as Usuario);
      await AsyncStorage.removeItem("usuario");
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchToken();
    }, [])
  );

  function handleLogout() {
    apiAuth.logout();
    navigation.navigate("login");
  }

  return (
    <>
      <TouchableOpacity
        style={styles.container}
        onPress={toggleMenu}
        activeOpacity={0.5}
      >
        {user && !user.nomeCompleto && (
          <View style={styles.containerUsuario}>
            <Text
              style={[
                styles.tituloMenuUsuario,
                { color: color ? color : colors.roxo },
              ]}
            >
              Entrar ou Cadastre-se
            </Text>
            <Feather
              name="user"
              size={36}
              color={color ? color : colors.roxo}
            />
          </View>
        )}

        {user && user.nomeCompleto && (
          <View style={styles.containerUsuario}>
            <Text
              style={[
                styles.tituloMenuUsuarioLogado,
                { color: color ? color : colors.roxo },
              ]}
              numberOfLines={1}
            >
              {user?.nomeCompleto}
            </Text>
            <Feather
              name="user"
              size={36}
              color={color ? color : colors.roxo}
            />
          </View>
        )}
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade">
        <TouchableOpacity style={styles.overlay} onPress={toggleMenu} />
        <View style={styles.menu}>
          <FAB
            icon="account"
            label="Entrar"
            onPress={() => navigation.navigate("login")}
            style={styles.fabItem}
          />
          <FAB
            icon="account-plus"
            label="Cadastre-se"
            onPress={() => navigation.navigate("loginAdd")}
            style={styles.fabItem}
          />
          <FAB
            icon="logout"
            label="Sair"
            onPress={handleLogout}
            style={styles.fabItem}
          />
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 5,
    right: 10,
    zIndex: 10000, // Garantir que o contêiner fique acima de outros elementos
  },
  containerUsuario: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  tituloMenuUsuario: {
    fontSize: 14,
    width: 80,
  },
  tituloMenuUsuarioLogado: {
    fontSize: 16,
    width: 155,
    textAlign: "right",
    fontWeight: "bold",
    marginRight: 15,
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "transparent",
    zIndex: 10001,
  },
  menu: {
    position: "absolute",
    top: 52,
    right: 46,
    zIndex: 10002, // Garantir que o menu flutuante fique acima de outros elementos
    elevation: 5,
  },
  fabItem: {
    marginVertical: 8,
    backgroundColor: "white",
  },
});

export default FloatingMenu;
