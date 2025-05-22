import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Platform,
  TouchableOpacity,
  Modal,
} from "react-native";
import colors from "@/src/constants/colors";
import { Link, router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { apiAuth } from "../../../lib/auth";
import BarMenu from "../../../components/BarMenu";
import StatusBarPage from "@/src/components/StatusBarPage";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "@/src/contexts_/AuthContext";
import ModalVerificacao from "@/src/components/ModalVerificacao";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Usuario } from "@/src/types/geral";

interface ModalMsgProps {
  onClose?: () => void;
}

export default function Login({ onClose }: ModalMsgProps) {
  const navigation = useNavigation() as any;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [modalMsg, setModalMsg] = useState(false);
  const [msg, setMsg] = useState("");
  const { setAuth, user } = useAuth();

  async function handleLogin() {
    setError("");
    setLoading(true);

    const result = await apiAuth.login({ login: email, senha: password });
    const vUser = await fetchToken();
    if (result.success) {
      if (!vUser?.ativo) {
        setMsg("Conta não ativada.\n\n");
        setModalMsg(true);
        setLoading(false);
        return;
      }

      if (onClose) {
        onClose();
      } else {
        setLoading(false);
        navigation.navigate("home");
      }
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
        return response as unknown as Usuario;
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
    useCallback(() => {
      setPassword("");
      setError("");
    }, [])
  );

  return (
    <View style={{ backgroundColor: colors.zinc, flex: 1 }}>
      <StatusBarPage style="dark" />
      <BarMenu color={colors.line} />

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

          {error && (
            <Text style={style.labelError}>
              {error}
              {error.includes("Credenciais inválidas") && (
                <TouchableOpacity
                  style={{
                    width: 150,
                    height: 20,
                    backgroundColor: colors.laranjado,
                    alignItems: "center",
                    borderRadius: 8,
                  }}
                  onPress={() => navigation.navigate("recuperarsenha")}
                >
                  <Text style={style.buttonText}>Recuperar senha</Text>
                </TouchableOpacity>
              )}
            </Text>
          )}

          <Pressable style={style.button} onPress={handleLogin}>
            <Text style={style.buttonText}>
              {loading ? "Carregando..." : "Entrar"}
            </Text>
          </Pressable>

          <Link
            href="/(auth)/signup/page"
            onPress={() => {
              setError("");
              navigation.navigate("loginAdd");
            }}
            style={{ marginTop: 16, textAlign: "center" }}
          >
            <Text style={{ textAlign: "center", color: colors.laranjado }}>
              Não tem uma conta? Cadastre-se
            </Text>
          </Link>

          {user && (
            <Modal visible={modalMsg} transparent animationType="fade">
              <ModalVerificacao
                onClose={() => {
                  setModalMsg(false);
                  navigation.navigate("login");
                }}
                msg={msg}
                user={user}
              />
            </Modal>
          )}
        </View>
      </View>
    </View>
  );
}

const style = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: Platform.OS === "web" ? 80 : 120,
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
    // fontSize: 16,
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
    // fontSize: 14,
    fontWeight: "bold",
  },
  labelError: {
    color: colors.red,
    marginTop: -12,
    marginBottom: 18,
  },
});
