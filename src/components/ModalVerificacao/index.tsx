import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Platform,
  TouchableWithoutFeedback,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import colors from "@/src/constants/colors";
import { apiAuth } from "@/src/lib/auth";
import { Usuario } from "@/src/types/geral";
import { ActivityIndicator } from "react-native-paper";
import { useFocusEffect } from "expo-router";

interface Props {
  onClose: () => void;
  msg?: string;
  user: Usuario;
}

export default function ModalVerificacao({ onClose, msg, user }: Props) {
  const [selectedOption, setSelectedOption] = useState<
    "email" | "sms" | "whatsapp"
  >("email");
  const [step, setStep] = useState<1 | 2>(1);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const enviarCodigo = async () => {
    if (selectedOption) {
      setLoading(true);
      if (selectedOption === "email") {
        const result = await apiAuth.enviaCodigoAtivacao(
          selectedOption === "email" ? user?.email ?? "" : user?.telefone ?? "",
          selectedOption
        );
      }
      if (selectedOption === "whatsapp") {
        const result = await apiAuth.enviaCodigoAtivacao(
          selectedOption === "whatsapp"
            ? user?.email ?? ""
            : user?.telefone ?? "",
          selectedOption
        );

        const options = {
          method: "POST",
          headers: {
            accept: "application/json",
            "content-type": "application/json",
            Authorization: "d597037283078574746e95b4e78ddd52",
          },
          body: JSON.stringify({
            number: formatPhoneToE164(user?.telefone ?? ""),
            message: `Seu código de verificação no Jango Ingressos é: ${result.data.code}. Não compartilhe com ninguém.`,
          }),
        };

        fetch(
          "https://v5.chatpro.com.br/chatpro-4p8b76i8oq/api/v1/send_message",
          options
        )
          .then((res) => res.json())
          .then((res) => console.log(res))
          .catch((err) =>
            setError("Erro ao enviar mensagem via WhatsApp: " + err)
          );
      }
      setStep(2);
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
    const result = await apiAuth.varificaAtivarConta(
      user?.email ?? "",
      code,
      user?.id ?? 0
    );
    const data = result.data;
    if (data.error) {
      setError(data.error);
    } else {
      onClose();
    }
  };

  return (
    <TouchableWithoutFeedback>
      <View style={styles.modalContainer}>
        <TouchableWithoutFeedback>
          <View style={styles.container}>
            <View style={styles.header}>
              <View />
              <Text style={styles.title}>Ativar Conta</Text>
              <TouchableOpacity onPress={onClose}>
                <Feather name="x" size={28} color="#212743" />
              </TouchableOpacity>
            </View>

            <View style={styles.content}>
              {step === 1 ? (
                <>
                  <Text style={styles.subtitle}>
                    {msg +
                      "Selecione um método para envio do código para ativar conta:"}
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
                    <Text style={styles.sendText}>Verificar</Text>
                  </TouchableOpacity>

                  <TouchableOpacity onPress={enviarCodigo}>
                    <Text style={styles.resendText}>Reenviar código</Text>
                  </TouchableOpacity>
                </>
              )}
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
});
