import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Alert,
  Modal,
} from "react-native";
import colors from "@/src/constants/colors";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { Usuario } from "@/src/types/geral";
import { apiAuth } from "@/src/lib/auth";
import BarMenu from "../../../components/BarMenu";
import StatusBarPage from "@/src/components/StatusBarPage";
import { useNavigation } from "@react-navigation/native";
import { api } from "../../../lib/api";
import ModalMsg from "@/src/components/ModalMsg";
import { useRoute } from "@react-navigation/native";

export default function Signup() {
  const route = useRoute();
  const { pemail } = route.params as { pemail: string };
  const navigation = useNavigation() as any;
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [modalMsg, setModalMsg] = useState(false);
  const [msg, setMsg] = useState("");

  const validateEmail = (value: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(value);
  };

  useEffect(() => {
    setEmail(pemail || "");
    setError("");
  }, []);

  const handleSubmit = async () => {
    setError("");

    if (!email) {
      setError("O e-mail é obrigatório.");
      return;
    }

    if (!validateEmail(email)) {
      setError("E-mail inválido.");
      return;
    }

    setLoading(true);

    try {
      const endpoint = api.getBaseUrlSite();
      const response = await apiAuth.emailrecuperarsenha(email, endpoint);

      if (!response.success) {
        setError(response.message || "Erro ao enviar e-mail.");
      } else {
        setModalMsg(true);
        setMsg("Informações para recuperar senha enviadas por e-mail.");
      }
    } catch (err) {
      console.error(err);
      setError("Erro ao tentar recuperar senha. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ backgroundColor: colors.zinc, flex: 1 }}>
      <StatusBarPage style="dark" />
      <BarMenu color={colors.line} />

      <View style={styles.container}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.header}>
            {/* <Text style={styles.logoText}>
              Ticket<Text style={{ color: colors.laranjado }}>Jango</Text>
            </Text> */}
            <Text style={styles.slogan}>Recuperar Senha</Text>
          </View>

          <ScrollView style={styles.scrollContainer}>
            <View style={styles.form}>
              <Text style={styles.label}>E-mail</Text>
              <TextInput
                style={styles.input}
                placeholder="Digite seu e-mail"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
              {error ? <Text style={styles.labelError}>{error}</Text> : null}

              <Pressable
                style={styles.button}
                onPress={handleSubmit}
                disabled={loading}
              >
                <Text style={styles.buttonText}>
                  {loading ? "Enviando..." : "Enviar"}
                </Text>
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
        <Modal visible={modalMsg} transparent animationType="fade">
          <ModalMsg
            onClose={() => {
              setModalMsg(false);
              navigation.navigate("login");
            }}
            msg={msg}
          />
        </Modal>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    marginTop: Platform.OS === "web" ? 80 : 120,
  },
  header: {
    marginBottom: 20,
  },
  logoText: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.white,
  },
  slogan: {
    fontSize: 36,
    color: colors.gray,
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: 16,
  },
  form: {
    marginTop: 20,
  },
  label: {
    color: colors.black,
    fontSize: 14,
    marginBottom: 4,
  },
  labelError: {
    color: colors.red,
    fontSize: 12,
    marginTop: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 6,
    padding: 12,
    backgroundColor: "#fff",
    fontSize: 16,
    marginBottom: 12,
  },
  button: {
    backgroundColor: colors.laranjado,
    padding: 14,
    borderRadius: 6,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});
