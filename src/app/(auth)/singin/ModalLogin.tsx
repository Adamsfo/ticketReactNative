import React, { useState } from "react";
import {
  Text,
  TouchableOpacity,
  View,
  TouchableWithoutFeedback,
  StyleSheet,
  Platform,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import colors from "@/src/constants/colors";
import { Pressable, TextInput } from "react-native-gesture-handler";
import { apiAuth } from "@/src/lib/auth";
import { Link } from "expo-router";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "@/src/contexts_/AuthContext";
import { Usuario } from "@/src/types/geral";

interface ModalMsgProps {
  onClose: () => void;
}

export default function ModalLogin({ onClose }: ModalMsgProps) {
  const navigation = useNavigation() as any;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const { setAuth } = useAuth();

  async function handleLogin() {
    setLoading(true);

    const result = await apiAuth.login({ login: email, senha: password });
    console.log("Login result:", result); // Adicione este log para depuração
    fetchToken(); // Chame a função fetchToken após o login
    if (result.success) {
      setLoading(false);
      onClose();
    } else {
      setError(result.message || "Erro desconhecido");
      setLoading(false);
    }
  }

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

  return (
    <View style={{ backgroundColor: colors.zinc, flex: 1 }}>
      <View style={styles.header}>
        <TouchableOpacity>
          {/* <Feather name="share" size={30} color="#212743" /> */}
        </TouchableOpacity>
        <Text style={styles.title}></Text>
        <TouchableOpacity onPress={onClose}>
          <Feather name="x" size={30} color="white" />
        </TouchableOpacity>
      </View>
      {/* <StatusBarPage style="dark" />
      <BarMenu color={colors.line} /> */}

      <View style={style.container}>
        <View style={style.header}>
          <Text style={style.logoText}>
            Ticket<Text style={{ color: colors.laranjado }}>Jango</Text>
          </Text>
          <Text style={style.slogan}>Faça login para comprar seu Ticket</Text>
        </View>

        <View style={style.form}>
          <View>
            <Text style={style.label}>Email</Text>
            <TextInput
              style={style.input}
              placeholder="Digite seu email"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <View>
            <Text style={style.label}>Senha</Text>
            <TextInput
              style={style.input}
              placeholder="Digite sua senha"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>

          {error && <Text style={style.labelError}>{error}</Text>}

          <TouchableOpacity style={style.button} onPress={handleLogin}>
            <Text style={style.buttonText}>
              {loading ? "Carregando..." : "Entrar"}
            </Text>
          </TouchableOpacity>

          <Link
            href="/(auth)/signup/page"
            onPress={() => navigation.navigate("loginAdd")}
            style={{ marginTop: 16, textAlign: "center" }}
          >
            <Text style={{ textAlign: "center", color: colors.laranjado }}>
              Não tem uma conta? Cadastre-se
            </Text>
          </Link>
        </View>
      </View>
    </View>
  );
}

// const styles = StyleSheet.create({
//   modalContainer: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   container: {
//     flex: 1,
//     backgroundColor: "#FFF",
//     borderTopLeftRadius: 10,
//     borderTopRightRadius: 10,
//     padding: 15,
//     width: "100%",
//     height: "100%",
//   },
//   header: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     marginTop: 1,
//     paddingVertical: 8,
//   },
//   area: {
//     flex: 1,
//     alignItems: "center",
//     justifyContent: "center",
//   },
//   title: {
//     fontSize: 33,
//     fontWeight: "bold",
//     color: "#212743",
//   },
//   innerContainer: {
//     flex: 1,
//     backgroundColor: colors.zinc,
//     width: "100%",
//     height: "100%",
//   },
// });

const style = StyleSheet.create({
  container: {
    flex: 1,
    // marginTop: Platform.OS === "web" ? 80 : 120,
    marginRight: 20,
    marginBottom: 20,
    marginLeft: 20,
    backgroundColor: colors.zinc,
  },
  header: {
    paddingLeft: 14,
    paddingRight: 14,
  },
  logoText: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.white,
    marginBottom: 8,
  },
  slogan: {
    fontSize: 36,
    color: colors.white,
    marginBottom: 24,
  },
  form: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 16,
    paddingTop: 24,
    paddingLeft: 14,
    paddingRight: 14,
  },
  label: {
    color: colors.zinc,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.gray,
    borderRadius: 8,
    marginBottom: 16,
    paddingHorizontal: 8,
    paddingTop: 14,
    paddingBottom: 14,
  },
  button: {
    backgroundColor: colors.laranjado,
    paddingTop: 14,
    paddingLeft: 14,
    paddingBottom: 14,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    borderRadius: 8,
  },
  buttonText: {
    color: colors.white,
    fontWeight: "bold",
  },
  labelError: {
    color: colors.red,
    marginTop: -18,
    marginBottom: 18,
  },
});

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: "#FFF",
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    padding: 15,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 1,
    paddingVertical: 8,
  },
  area: {
    flex: 1,
    alignItems: "center",
  },
  title: {
    fontSize: 33,
    fontWeight: "bold",
    color: "#212743",
  },
  mensagem: {
    fontSize: 17,
    color: "#1a7a7a7",
    marginBottom: 30,
    marginTop: 10,
  },
});
