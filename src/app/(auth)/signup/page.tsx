import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  SafeAreaView,
  ScrollView,
} from "react-native";
import colors from "@/constants/colors";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Usuario } from "@/src/types/geral";
import { apiAuth } from "@/src/lib/auth";

export default function Signup() {
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Usuario>({
    login: "",
    email: "",
    senha: "",
    nomeCompleto: "",
    confirmaSenha: "",
  });

  const handleChange = (field: keyof Usuario, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formData.email) newErrors.email = "O email é obrigatório.";
    if (!formData.senha) newErrors.senha = "A senha é obrigatória.";
    if (!formData.nomeCompleto)
      newErrors.nomeCompleto = "Nome Completo é obrigatório.";
    if (formData.senha !== formData.confirmaSenha) {
      newErrors.confirmaSenha = "As senhas não coincidem.";
    }
    if (formData.email) {
      if (!emailRegex.test(formData.email)) {
        newErrors.email = "Por favor, insira um email válido.";
      }
    }

    return newErrors;
  };

  async function handleSingUp() {
    setErrors({});
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    try {
      const response = await apiAuth.addlogin({
        ...formData,
        login: formData.email,
      });

      if (!response.success) {
        setErrors({
          api: response.message || "Erro desconhecido ao registrar usuário.",
        });
      } else {
        router.replace("/(auth)/singin/page");
      }
    } catch (error) {
      console.error("Network request failed:", error);
      console.log(error);
      setErrors({
        api: "Erro ao registrar usuário. Tente novamente mais tarde." + error,
      });
      setLoading(false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView style={{ flex: 1, backgroundColor: colors.white }}>
        <View style={style.container}>
          <View style={style.header}>
            <Pressable style={style.backButton} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color={colors.white} />
            </Pressable>

            <Text style={style.logoText}>
              Ticket<Text style={{ color: colors.green }}>App</Text>
            </Text>
            <Text style={style.slogan}>Criar uma conta</Text>
          </View>

          <View style={style.form}>
            <View>
              <Text style={style.label}>Nome Completo</Text>
              <TextInput
                style={style.input}
                placeholder="Nome Completo..."
                keyboardType="default"
                value={formData.nomeCompleto}
                onChangeText={(text) => handleChange("nomeCompleto", text)}
              ></TextInput>
              {errors.nomeCompleto && (
                <Text style={style.labelError}>{errors.nomeCompleto}</Text>
              )}
            </View>

            <View>
              <Text style={style.label}>Email</Text>
              <TextInput
                style={style.input}
                placeholder="Digite seu email"
                keyboardType="email-address"
                value={formData.email}
                onChangeText={(text) => handleChange("email", text)}
              />
              {errors.email && (
                <Text style={style.labelError}>{errors.email}</Text>
              )}
            </View>

            <View>
              <Text style={style.label}>Senha</Text>
              <TextInput
                style={style.input}
                placeholder="Digite sua senha"
                secureTextEntry
                value={formData.senha}
                onChangeText={(text) => handleChange("senha", text)}
              />
              {errors.senha && (
                <Text style={style.labelError}>{errors.senha}</Text>
              )}
            </View>

            <View>
              <Text style={style.label}>Repetir Senha</Text>
              <TextInput
                style={style.input}
                placeholder="Repetir senha"
                secureTextEntry
                value={formData.confirmaSenha}
                onChangeText={(text) => handleChange("confirmaSenha", text)}
              />
              {errors.confirmaSenha && (
                <Text style={style.labelError}>{errors.confirmaSenha}</Text>
              )}
            </View>

            {errors.api && <Text style={style.labelError}>{errors.api}</Text>}

            <Pressable style={style.button} onPress={handleSingUp}>
              <Text style={style.buttonText}>
                {loading ? "Cadastrando..." : "Cadastrar"}
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const style = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 34,
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
    marginBottom: 36,
  },
  form: {
    flex: 1,
    backgroundColor: colors.white,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
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
    marginBottom: 18,
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
  backButton: {
    backgroundColor: "rgba(255,255,255, 0.55)",
    alignSelf: "flex-start",
    padding: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  labelError: {
    color: colors.red,
    marginTop: -18,
    marginBottom: 18,
  },
});
