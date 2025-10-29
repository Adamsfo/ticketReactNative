import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Platform,
  TouchableWithoutFeedback,
  Linking,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import colors from "@/src/constants/colors";
import { apiAuth } from "@/src/lib/auth";
import { Usuario } from "@/src/types/geral";
import { ActivityIndicator } from "react-native-paper";
import { useFocusEffect } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "@/src/contexts_/AuthContext";
import { useNavigation } from "@react-navigation/native";

interface Props {
  onClose: () => void;
  user: Usuario;
}

export default function ModalVerificacaoLogin({ onClose, user }: Props) {
  const [selectedOption, setSelectedOption] = useState<
    "email" | "sms" | "whatsapp"
  >("email");
  const [step, setStep] = useState<1 | 2>(1);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuth();
  const navigation = useNavigation() as any;

  const enviarCodigo = async () => {
    if (!selectedOption) return;

    try {
      setLoading(true);
      let result: any;

      // Envia o código de ativação via API interna
      if (selectedOption === "email") {
        result = await apiAuth.geraCodigoLogin(
          user?.email ?? "",
          selectedOption,
          true
        );
      } else if (selectedOption === "whatsapp") {
        result = await apiAuth.geraCodigoLogin(
          user?.telefone ?? "",
          selectedOption
        );

        // === CONFIGURAÇÃO Z-API ===
        const instanceId = "3E893A152BA131DB903DFA5FB5498E95";
        const token = "9A4CDF91FE88589BDD9BA3FC";
        const clientToken = "F891e8c3d58d84a7eac82cf030ef273faS";

        const message = `🔐 Seu código para entrar no Jango Ingressos é: ${result.data.code}.
Não compartilhe com ninguém.`;

        const options = {
          method: "POST",
          headers: {
            "Client-Token": clientToken,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            phone: formatPhoneToE164(user?.telefone ?? ""),
            message,
          }),
        };

        const response = await fetch(
          `https://api.z-api.io/instances/${instanceId}/token/${token}/send-text`,
          options
        );

        const data = await response.json();
        console.log("📤 Retorno Z-API:", data);

        if (!response.ok) {
          throw new Error(
            data.message || "Erro ao enviar mensagem via WhatsApp"
          );
        }
      }

      setStep(2);
    } catch (err: any) {
      console.error(err);
      setError("Erro ao enviar mensagem: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setSelectedOption("email");
    }, [])
  );

  function formatPhoneToE164(phone: string): string {
    // Remove caracteres não numéricos
    const cleaned = phone.replace(/\D/g, "");
    // Adiciona o código do país se não estiver presente
    return cleaned.startsWith("55") ? `+${cleaned}` : `+55${cleaned}`;
  }

  const onVerify = async (code: string) => {
    console.log("code", code);

    const result = await apiAuth.loginCodigo(
      selectedOption === "email" ? user?.email ?? "" : user?.telefone ?? "",
      code,
      user?.id ?? 0
    );

    const error = result.data?.error as string;

    if (result.success) {
      const _token = result.data.data as string;

      if (_token) {
        if (Platform.OS === "web") {
          localStorage.setItem("token", _token);
        } else {
          await AsyncStorage.setItem("token", _token);
        }

        const vUserResponse = await apiAuth.getUsuario({
          filters: { token: _token },
        });
        const vUser: Usuario = vUserResponse.data[0];

        if (vUser) {
          if (vUser.ativo) {
            await AsyncStorage.setItem("usuario", JSON.stringify(vUser));
            await Promise.resolve(setAuth(vUser as unknown as Usuario));
          }
          navigation.navigate("home");
          onClose();
        } else {
          setAuth({} as Usuario);
        }
      } else {
        setError(error || "Código inválido");
        setAuth({} as Usuario);
        await AsyncStorage.removeItem("usuario");
      }
    } else {
      setError(result.message || "Erro desconhecido");
      setLoading(false);
    }
  };

  const enviarMsgWhatsapp = async () => {
    const numero = "5565993074619";
    const mensagem =
      "Olá! Não estou recebendo o código para login! Por favor, me ajude. email: " +
      user?.email;

    const url = `https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`;

    if (Platform.OS === "web") {
      window.location.href = url; // Abre diretamente na aba atual (evita tela branca)
    } else {
      Linking.openURL(url).catch((err) =>
        console.error("Erro ao abrir o WhatsApp", err)
      );
    }

    onClose();
  };

  return (
    <TouchableWithoutFeedback>
      <View style={styles.modalContainer}>
        <TouchableWithoutFeedback>
          <View style={styles.container}>
            <View style={styles.header}>
              <View />
              <Text style={styles.title}>Login com código</Text>
              <TouchableOpacity onPress={onClose}>
                <Feather name="x" size={28} color="#212743" />
              </TouchableOpacity>
            </View>

            <View style={styles.content}>
              {step === 1 ? (
                <>
                  <Text style={styles.subtitle}>
                    {
                      "Selecione um método para envio do código para entrar na conta:"
                    }
                  </Text>
                  <View style={styles.buttonGroup}>
                    {/* {["email", "sms", "whatsapp"].map((type) => ( */}
                    {["email", "whatsapp"].map((type) => (
                      <TouchableOpacity
                        key={type}
                        style={[
                          styles.optionButton,
                          selectedOption === type &&
                            styles.optionButtonSelected,
                        ]}
                        onPress={() => setSelectedOption(type as any)}
                      >
                        <Text
                          style={[
                            styles.optionText,
                            selectedOption === type &&
                              styles.optionTextSelected,
                          ]}
                        >
                          {type.toUpperCase()}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.sendButton,
                      !selectedOption && { opacity: 0.5 },
                      {
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "center",
                      },
                    ]}
                    onPress={enviarCodigo}
                    disabled={!selectedOption}
                  >
                    {loading && (
                      <ActivityIndicator
                        size="small"
                        color={colors.laranjado}
                        style={{ marginRight: 10 }}
                      />
                    )}
                    <Text style={styles.sendText}>Enviar Código</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <Text style={styles.subtitle}>
                    Digite o código de 4 dígitos:
                  </Text>
                  <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    maxLength={4}
                    value={code}
                    onChangeText={setCode}
                    placeholder="0000"
                  />
                  {error && <Text style={styles.labelError}>{error}</Text>}

                  <TouchableOpacity
                    style={[
                      styles.sendButton,
                      code.length !== 4 && { opacity: 0.5 },
                    ]}
                    onPress={() => onVerify(code)}
                    disabled={code.length !== 4}
                  >
                    <Text style={styles.sendText}>Entrar</Text>
                  </TouchableOpacity>

                  <TouchableOpacity onPress={enviarCodigo}>
                    <Text style={styles.resendText}>Reenviar código</Text>
                  </TouchableOpacity>
                </>
              )}
              <TouchableOpacity
                style={{
                  width: 150,
                  height: 20,
                  backgroundColor: colors.laranjado,
                  alignItems: "center",
                  borderRadius: 8,
                  marginTop: 8,
                }}
                onPress={enviarMsgWhatsapp}
              >
                <Text style={styles.buttonText}>Código não chegou</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    paddingHorizontal: "15%",
  },
  container: {
    // width: Platform.OS === "web" ? "40%" : "90%",
    width: "100%",

    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#212743",
  },
  content: {
    alignItems: "center",
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: "center",
  },
  buttonGroup: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 20,
    flexWrap: "wrap",
    gap: 10,
  },
  optionButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: "#E0E0E0",
    borderRadius: 8,
    marginHorizontal: 5,
  },
  optionButtonSelected: {
    backgroundColor: colors.azul,
  },
  optionText: {
    color: "#212743",
    fontWeight: "600",
  },
  optionTextSelected: {
    color: "#FFF",
  },
  sendButton: {
    backgroundColor: colors.azul,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 10,
    marginTop: 10,
  },
  sendText: {
    color: "#FFF",
    fontWeight: "600",
    fontSize: 16,
  },
  resendText: {
    marginTop: 15,
    color: "#007BFF",
    fontSize: 14,
  },
  input: {
    borderWidth: 1,
    borderColor: "#CCC",
    borderRadius: 8,
    width: "50%",
    textAlign: "center",
    fontSize: 20,
    padding: 10,
    marginBottom: 15,
  },
  labelError: {
    color: colors.red,
    marginTop: -12,
    marginBottom: 18,
  },
  buttonText: {
    color: colors.white,
    // fontSize: 14,
    fontWeight: "bold",
  },
});
