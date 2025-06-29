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
  Modal,
} from "react-native";
import colors from "@/src/constants/colors";
import { router, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useState } from "react";
import { Usuario } from "@/src/types/geral";
import { apiAuth } from "@/src/lib/auth";
import BarMenu from "../../../components/BarMenu";
import StatusBarPage from "@/src/components/StatusBarPage";
import { useNavigation } from "@react-navigation/native";
import ModalMsg from "@/src/components/ModalMsg";
import { api } from "@/src/lib/api";
import ModalVerificacao from "@/src/components/ModalVerificacao";
import { apiGeral } from "@/src/lib/geral";

export default function Signup() {
  const navigation = useNavigation() as any;
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);
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

  const handleChange = (field: keyof Usuario, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  useFocusEffect(
    useCallback(() => {
      setFormData({
        login: "",
        email: "",
        senha: "",
        nomeCompleto: "",
        confirmaSenha: "",
        cpf: "",
        telefone: "",
        id_cliente: 0,
      });
      setErrors({});
      setMsg("");
    }, [])
  );

  const isValidCPF = (cpf: string): boolean => {
    cpf = cpf.replace(/\D/g, "");

    if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;

    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += Number(cpf[i]) * (10 - i);
    }
    let firstDigit = (sum * 10) % 11;
    if (firstDigit === 10 || firstDigit === 11) firstDigit = 0;
    if (firstDigit !== Number(cpf[9])) return false;

    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += Number(cpf[i]) * (11 - i);
    }
    let secondDigit = (sum * 10) % 11;
    if (secondDigit === 10 || secondDigit === 11) secondDigit = 0;
    if (secondDigit !== Number(cpf[10])) return false;

    return true;
  };

  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formData.cpf) {
      newErrors.cpf = "O cpf é obrigatório.";
    } else if (!isValidCPF(formData.cpf)) {
      newErrors.cpf = "CPF inválido.";
    }
    if (!formData.email) newErrors.email = "O email é obrigatório.";
    if (!formData.senha) newErrors.senha = "A senha é obrigatória.";
    if (!formData.sobreNome) newErrors.sobreNome = "A sobrenome é obrigatória.";
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

    let dados = formData;

    if (dados.id_cliente === 0) {
      try {
        const resCliente = await apiGeral.createResource<any>(
          "/clientejangoadd",
          {
            cpf: (dados.cpf ?? "").replace(/\D/g, ""),
            nomeCompleto: dados.nomeCompleto,
            sobreNome: dados.sobreNome,
            telefone: (dados.telefone ?? "").replace(/\D/g, ""),
            email: dados.email,
          }
        );

        const cliente = resCliente.data;

        if (cliente) {
          dados = {
            ...dados,
            id_cliente: cliente.id_cliente,
          };
          setFormData({
            ...formData,
            id_cliente: cliente.id_cliente,
          });
        }
      } catch (error) {
        console.error("Network request failed:", error);
        setErrors({
          api: "Erro ao registrar usuário no Jango. Tente novamente mais tarde.",
        });
        setLoading(false);
      }
    }

    try {
      const endpoint = api.getBaseUrlSite();
      const response = await apiAuth.addlogin({
        ...dados,
        login: dados.email,
        endpoint: endpoint,
      });

      if (!response.success) {
        setErrors({
          api: response.message || "Erro desconhecido ao registrar usuário.",
        });
      } else {
        setFormData({
          ...response.data,
        });
        setMsg("Usuário cadastrado com sucesso!\n\n");
        setModalMsg(true);
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

  const formatCPF = (value: string) => {
    // Remove tudo que não for número
    const onlyNumbers = value.replace(/\D/g, "");

    // Aplica a máscara do CPF
    return onlyNumbers
      .replace(/^(\d{3})(\d)/, "$1.$2")
      .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3-$4")
      .slice(0, 14); // Garante que não passe de 14 caracteres (formato final)
  };

  const formatPhone = (value: string) => {
    const onlyNumbers = value.replace(/\D/g, "");

    if (onlyNumbers.length <= 10) {
      // Formato: (99) 9999-9999
      return onlyNumbers
        .replace(/^(\d{2})(\d)/, "($1) $2")
        .replace(/(\d{4})(\d)/, "$1-$2")
        .slice(0, 14);
    } else {
      // Formato: (99) 99999-9999
      return onlyNumbers
        .replace(/^(\d{2})(\d)/, "($1) $2")
        .replace(/(\d{5})(\d)/, "$1-$2")
        .slice(0, 15);
    }
  };

  const handleGetClienteJango = async (cpf: string) => {
    const resCliente = await apiGeral.createResource<any>("/clientejango", {
      cpf: cpf?.replace(/\D/g, "") ?? "",
    });

    const cliente = resCliente.data;

    if (cliente) {
      const nomePartes = cliente.nome.trim().split(" ");
      const primeiroNome = nomePartes[0];
      const sobrenome = nomePartes.slice(1).join(" "); // junta o restante como sobrenome

      setFormData({
        ...formData,
        nomeCompleto: primeiroNome,
        sobreNome: sobrenome,
        telefone: formatPhone(cliente.telefone_celular),
        email: cliente.email ? cliente.email : "",
        id_cliente: cliente.id_cliente,
      });
    }
  };

  return (
    <View style={{ backgroundColor: colors.zinc, flex: 1 }}>
      <StatusBarPage style="dark" />
      <BarMenu color={colors.line} />

      <View style={style.container}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "padding"}
        >
          <View style={style.header}>
            {/* <Text style={style.logoText}>
              Ticket<Text style={{ color: colors.laranjado }}>Jango</Text>
            </Text> */}
            <Text style={style.slogan}>Cadastrar conta</Text>
          </View>

          <ScrollView
            style={{
              flex: 1,
              backgroundColor: colors.white,
              borderRadius: 8,
            }}
          >
            <View style={style.form}>
              <View>
                <Text style={style.label}>CPF</Text>
                <TextInput
                  style={style.input}
                  placeholder="CPF..."
                  keyboardType="default"
                  value={formData.cpf}
                  onChangeText={(text) => {
                    const formatted = formatCPF(text);
                    handleChange("cpf", formatted);
                  }}
                  onBlur={() => {
                    if ((formData.cpf?.length ?? 0) === 14) {
                      handleGetClienteJango(formData.cpf ?? "");
                    }
                  }}
                ></TextInput>
                {errors.cpf && (
                  <Text style={style.labelError}>{errors.cpf}</Text>
                )}
              </View>

              <View>
                <Text style={style.label}>Nome</Text>
                <TextInput
                  style={style.input}
                  placeholder="Nome..."
                  keyboardType="default"
                  value={formData.nomeCompleto}
                  onChangeText={(text) =>
                    handleChange("nomeCompleto", text.toUpperCase())
                  }
                ></TextInput>
                {errors.nomeCompleto && (
                  <Text style={style.labelError}>{errors.nomeCompleto}</Text>
                )}
              </View>

              <View>
                <Text style={style.label}>Sobrenome</Text>
                <TextInput
                  style={style.input}
                  placeholder="Sobrenome..."
                  keyboardType="default"
                  value={formData.sobreNome}
                  onChangeText={(text) =>
                    handleChange("sobreNome", text.toUpperCase())
                  }
                ></TextInput>
                {errors.sobreNome && (
                  <Text style={style.labelError}>{errors.sobreNome}</Text>
                )}
              </View>

              <View>
                <Text style={style.label}>Email</Text>
                <TextInput
                  style={style.input}
                  placeholder="Digite seu email"
                  keyboardType="email-address"
                  value={formData.email}
                  autoCapitalize="none"
                  onChangeText={(text) => handleChange("email", text)}
                />
                {errors.email && (
                  <Text style={style.labelError}>{errors.email}</Text>
                )}
              </View>

              <View>
                <Text style={style.label}>Telefone</Text>
                <TextInput
                  style={style.input}
                  placeholder="Telefone..."
                  keyboardType="numeric"
                  value={formData.telefone}
                  onChangeText={(text) => {
                    const formatted = formatPhone(text);
                    handleChange("telefone", formatted);
                  }}
                />
                {errors.telefone && (
                  <Text style={style.labelError}>{errors.telefone}</Text>
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

              {errors.api && (
                <Text style={style.labelError}>
                  {errors.api}{" "}
                  {errors.api.includes("recuperar") && (
                    <TouchableOpacity
                      style={{
                        width: 150,
                        height: 20,
                        backgroundColor: colors.laranjado,
                        alignItems: "center",
                        borderRadius: 8,
                      }}
                      onPress={() =>
                        navigation.navigate("recuperarsenha", {
                          pemail: formData.email,
                        })
                      }
                    >
                      <Text style={style.buttonText}>Recuperar senha</Text>
                    </TouchableOpacity>
                  )}
                </Text>
              )}

              <Pressable style={style.button} onPress={handleSingUp}>
                <Text style={style.buttonText}>
                  {loading ? "Cadastrando..." : "Cadastrar"}
                </Text>
              </Pressable>

              <Modal visible={modalMsg} transparent animationType="fade">
                <ModalVerificacao
                  onClose={() => {
                    setModalMsg(false);
                    navigation.navigate("login");
                  }}
                  msg={msg}
                  user={formData}
                />
              </Modal>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
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
    backgroundColor: colors.zinc,
  },
  logoText: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.white,
    marginBottom: 8,
    borderRadius: 8,
  },
  slogan: {
    fontSize: 24,
    color: colors.white,
    marginBottom: 24,
    borderRadius: 8,
  },
  form: {
    flex: 1,
    backgroundColor: colors.white,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 24,
    paddingLeft: 14,
    paddingRight: 14,
    borderRadius: 8,
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
    fontSize: 16,
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
