import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Platform,
} from "react-native";
import colors from "@/src/constants/colors";
import { Link, router } from "expo-router";
import { useState } from "react";
import { apiAuth } from "../../../lib/auth";
import BarMenu from "../../../components/BarMenu";
import StatusBarPage from "@/src/components/StatusBarPage";
import { useNavigation } from "@react-navigation/native";

interface ModalMsgProps {
  onClose?: () => void;
}

export default function Login({ onClose }: ModalMsgProps) {
  const navigation = useNavigation() as any;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  async function handleLogin() {
    setLoading(true);

    const result = await apiAuth.login({ login: email, senha: password });
    if (result.success) {
      // const response = await apiAuth.getUsuario({ search: email });
      // if (response.data[0]) {
      //   let usuario = response.data[0];
      // }

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

          {error && <Text style={style.labelError}>{error}</Text>}

          <Pressable style={style.button} onPress={handleLogin}>
            <Text style={style.buttonText}>
              {loading ? "Carregando..." : "Entrar"}
            </Text>
          </Pressable>

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
    marginTop: -18,
    marginBottom: 18,
  },
});
