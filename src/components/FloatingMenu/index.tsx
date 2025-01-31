import colors from "@/src/constants/colors";
import { apiAuth } from "@/src/lib/auth";
import { Usuario } from "@/src/types/geral";
import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as React from "react";
import {
  View,
  StyleSheet,
  Platform,
  StatusBar,
  TouchableOpacity,
  Text,
} from "react-native";
import { FAB, Portal, Provider } from "react-native-paper";

const FloatingMenu = ({ color }: { color?: string }) => {
  const [open, setOpen] = React.useState(false);
  const toggleMenu = () => setOpen(!open);
  const [usuario, setUsuario] = React.useState<Usuario>({} as Usuario);

  React.useEffect(() => {
    const fetchToken = async () => {
      let _token = await AsyncStorage.getItem("token");
      if (_token) {
        const response = await apiAuth.getUsurioToken(_token);

        if (response) {
          setUsuario(response as unknown as Usuario);
        }
      }

      // router.replace("/(panel)/home/page");
    };
    fetchToken();
  }, []);

  return (
    <View style={styles.container}>
      {!usuario.nomeCompleto && (
        <TouchableOpacity
          style={styles.containerUsuario}
          onPress={toggleMenu}
          activeOpacity={0.5}
        >
          <Text
            style={[
              styles.tituloMenuUsuario,
              { color: color ? color : colors.roxo },
            ]}
          >
            Entrar ou Cadastre-se
          </Text>
          <Feather name="user" size={36} color={color ? color : colors.roxo} />
        </TouchableOpacity>
      )}
      <Text>{usuario?.nomeCompleto}</Text>

      <Provider>
        <Portal>
          {open && (
            <View style={styles.menu}>
              <FAB
                icon="account"
                label="Entrar"
                size="large"
                onPress={() => console.log("Entrar Pressionado")}
                style={styles.fabItem}
              />
              <FAB
                icon="account-plus"
                label="Cadastre-se"
                size="large"
                onPress={() => console.log("Cadastre-se Pressionado")}
                style={styles.fabItem}
              />
              <FAB
                icon="logout"
                label="Sair"
                size="large"
                onPress={() => console.log("Sair Pressionado")}
                style={styles.fabItem}
              />
            </View>
          )}
        </Portal>
      </Provider>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 5,
    right: 0,
    marginRight: 20,
    position: "absolute",
    justifyContent: "space-around",
    alignItems: "flex-end",
    zIndex: 10000, // Garantir que o contêiner fique acima de outros elementos
  },
  menu: {
    position: "absolute",
    top: 5,
    right: 16,
    zIndex: 10001, // Garantir que o menu flutuante fique acima de outros elementos
    elevation: 5,
  },
  fabItem: {
    marginVertical: 8,
    backgroundColor: "white", // Ajuste conforme necessário
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
});

export default FloatingMenu;
