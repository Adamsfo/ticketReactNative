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
import { router, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useState } from "react";
import { QueryParams, Usuario } from "@/src/types/geral";
import { apiAuth } from "@/src/lib/auth";
import BarMenu from "../../../components/BarMenu";
import StatusBarPage from "@/src/components/StatusBarPage";
import { useNavigation } from "@react-navigation/native";
import { useRoute } from "@react-navigation/native";
import { apiGeral } from "@/src/lib/geral";
import ModalMsg from "@/src/components/ModalMsg";

export default function Signup() {
  const navigation = useNavigation() as any;
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [formData, setFormData] = useState<Usuario>({
    login: "",
    email: "",
    senha: "",
    nomeCompleto: "",
    confirmaSenha: "",
    cpf: "",
    telefone: "",
    id_cliente: 0,
  });
  const [modalMsg, setModalMsg] = useState(false);
  const [msg, setMsg] = useState("");
  const route = useRoute();
  const { token } = route.params as { token: string };

  const getRegistros = async (_token: string) => {
    const response = await apiAuth.getUsurioToken<Usuario>(_token);
    console.log("API Response:", response); // Verifique a resposta da API
    if (response) {
      let usuario = response as unknown as Usuario;
      usuario.senha = "";
      usuario.confirmaSenha = "";
      setFormData(usuario);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (token) {
        localStorage.setItem("token", token as string);
        getRegistros(token);
      }
    }, [token])
  );

  const handleChange = (field: keyof Usuario, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const validate = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.senha) newErrors.senha = "A senha é obrigatória.";
    if (formData.senha !== formData.confirmaSenha) {
      newErrors.confirmaSenha = "As senhas não coincidem.";
    }

    return newErrors;
  };

  const handleSubmit = async () => {
    setErrors({});
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);

    try {
      const response = await apiGeral.updateResorce<Usuario>(
        `/usuario`,
        formData
      );

      if (!response.success) {
        setErrors({ geral: response.message || "Erro ao atualizar senha." });
      } else {
        setMsg("Senha redefinida com sucesso.");
        setModalMsg(true);
      }
    } catch (err) {
      console.error(err);
      setErrors({ geral: "Erro ao tentar redefir senha. Tente novamente." });
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
            <Text style={styles.logoText}>
              Ticket<Text style={{ color: colors.laranjado }}>Jango</Text>
            </Text>
            <Text style={styles.slogan}>Redefinir Senha</Text>
          </View>

          <ScrollView style={styles.scrollContainer}>
            {!formData.nomeCompleto && (
              <View style={styles.form}>
                <Text style={styles.labelNome}>
                  Tempo limite para redefinir senha expirado, solicitar
                  novamente o Recuperar senha na prataforma.
                </Text>
              </View>
            )}
            {formData.nomeCompleto && (
              <View style={styles.form}>
                <Text style={styles.labelNome}>
                  {formData.nomeCompleto + " " + formData.sobreNome}
                </Text>
                <View>
                  <Text style={styles.label}>Senha</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Digite sua senha"
                    secureTextEntry
                    value={formData.senha}
                    onChangeText={(text) => handleChange("senha", text)}
                  />
                  {errors.senha && (
                    <Text style={styles.labelError}>{errors.senha}</Text>
                  )}
                </View>

                <View>
                  <Text style={styles.label}>Repetir Senha</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Repetir senha"
                    secureTextEntry
                    value={formData.confirmaSenha}
                    onChangeText={(text) => handleChange("confirmaSenha", text)}
                  />
                  {errors.confirmaSenha && (
                    <Text style={styles.labelError}>
                      {errors.confirmaSenha}
                    </Text>
                  )}
                </View>

                {errors.geral && (
                  <Text style={styles.labelError}>{errors.geral}</Text>
                )}

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
            )}
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
  labelNome: {
    color: colors.black,
    fontSize: 16,
    marginBottom: 12,
    fontWeight: "bold",
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
