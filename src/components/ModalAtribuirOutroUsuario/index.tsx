import React, { useState } from "react";
import {
  Text,
  TouchableOpacity,
  View,
  TouchableWithoutFeedback,
  StyleSheet,
  Platform,
  TextInput,
  Dimensions,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import colors from "@/src/constants/colors";
import { Ingresso, Usuario } from "@/src/types/geral";
import { apiGeral } from "@/src/lib/geral";
import { useAuth } from "@/src/contexts_/AuthContext";

interface ModalMsgProps {
  onClose: () => void;
  item: Ingresso;
}

const { width } = Dimensions.get("window");

export default function ModalAtribuirOutroUsuario({
  onClose,
  item,
}: ModalMsgProps) {
  const [NomeUsuarioNovo, setNomeUsuarioNovo] = useState("");
  const [idUsuarioNovo, setidUsuarioNovo] = useState("");
  const [msg, setMsg] = useState("");
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [cpf, setCpf] = useState("");

  const handleSave = async () => {
    console.log("idUsuarioNovo", idUsuarioNovo);
    if (idUsuarioNovo === "") {
      setMsg("Usuario não encontrado, não permitido salvar.");
      return;
    }

    await apiGeral.updateResorce<Ingresso>("/atribuiroutrousuario", {
      id: item.id,
      idUsuario: user?.id,
      NomeUsuarioNovo: NomeUsuarioNovo,
      idUsuarioNovo: idUsuarioNovo,
    });

    onClose();
  };

  const handleEmailChange = async (input: string) => {
    setEmail(input);
    setMsg("");

    // Verifica se o e-mail tem pelo menos um "@" e não é vazio
    if (input.includes("@") && input.includes(".") && input.trim().length > 0) {
      try {
        const response = await apiGeral.getResource<Usuario>("/usuario", {
          filters: { email: input },
        });

        const usuario = Array.isArray(response.data) ? response.data[0] : null;

        if (usuario) {
          setNomeUsuarioNovo(usuario.nomeCompleto || "");
          setidUsuarioNovo(usuario.id?.toString() || "");
        } else {
          setNomeUsuarioNovo("");
          setidUsuarioNovo("");
        }
      } catch (error) {
        console.error("Erro ao buscar usuário:", error);
        setNomeUsuarioNovo("");
        setidUsuarioNovo("");
      }
    } else {
      setNomeUsuarioNovo("");
      setidUsuarioNovo("");
    }
  };

  const handleBuscaCPF = async () => {
    setMsg("");

    // Verifica se o e-mail tem pelo menos um "@" e não é vazio
    if (isValidCPF(cpf)) {
      try {
        const response = await apiGeral.getResource<Usuario>("/usuario", {
          filters: { cpf: cpf },
        });

        const usuario = Array.isArray(response.data) ? response.data[0] : null;

        if (usuario) {
          setNomeUsuarioNovo(
            usuario.nomeCompleto + " " + usuario.sobreNome || ""
          );
          setidUsuarioNovo(usuario.id?.toString() || "");
        } else {
          setNomeUsuarioNovo("");
          setidUsuarioNovo("");
        }
      } catch (error) {
        console.error("Erro ao buscar usuário:", error);
        setNomeUsuarioNovo("");
        setidUsuarioNovo("");
      }
    } else {
      setNomeUsuarioNovo("");
      setidUsuarioNovo("");
    }
  };

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

  return (
    <TouchableWithoutFeedback onPress={onClose}>
      <View style={styles.modalContainer}>
        <TouchableWithoutFeedback>
          <View style={styles.container}>
            <View style={styles.header}>
              <TouchableOpacity>
                {/* <Feather name="share" size={30} color="#212743" /> */}
              </TouchableOpacity>
              <Text style={styles.title}>
                Transferir Ingresso a outro Usuário
              </Text>
              <TouchableOpacity onPress={onClose}>
                <Feather name="x" size={30} color="#212743" />
              </TouchableOpacity>
            </View>

            <View>
              <Text style={styles.mensagem}>
                Ao transferir este ingresso a outro usuário, ele deixará de
                aparecer na sua lista, passando a ser de propriedade do novo
                usuário, com um novo QR Code gerado. Necessário ter cadastro no
                sistema para transferir o ingresso.
              </Text>
              <View>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Digite email do usuário"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={handleEmailChange}
                />
              </View>
              <Text style={styles.label}>ou</Text>
              <View>
                <TextInput
                  style={styles.input}
                  placeholder="CPF..."
                  keyboardType="numeric"
                  value={cpf}
                  onChangeText={(text) => {
                    const formatted = formatCPF(text);
                    setCpf(formatted);
                  }}
                  onBlur={() => {
                    if ((cpf?.length ?? 0) === 14) {
                      handleBuscaCPF();
                    }
                  }}
                ></TextInput>
                <TouchableOpacity
                  style={{
                    position: "absolute",
                    right: 10,
                    top: 12,
                  }}
                  onPress={handleBuscaCPF}
                >
                  <Feather name="search" size={24} color="#212743" />
                </TouchableOpacity>
              </View>
              <Text
                style={{
                  color: NomeUsuarioNovo.length > 0 ? colors.azul : "red",
                }}
              >
                {NomeUsuarioNovo.length > 0
                  ? NomeUsuarioNovo
                  : "Novo usuário não encontrado, digite o email para transferir."}
              </Text>
              <Text style={[styles.mensagem, { color: "red" }]}>{msg}</Text>
            </View>
            <View style={styles.footer}>
              <TouchableOpacity
                style={[styles.button, styles.buttonClose]}
                onPress={onClose}
              >
                <Text style={styles.buttonText}>Fechar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.buttonSave]}
                onPress={handleSave}
              >
                <Text style={styles.buttonText}>Transferir</Text>
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
    backgroundColor: "rgba(0, 0, 0, 0.5)", // Fundo semi-transparente
  },
  container: {
    width: Platform.OS === "web" ? (width <= 1000 ? "90%" : "60%") : "90%",
    backgroundColor: "#FFF",
    borderRadius: 10,
    padding: 15,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 1,
    paddingVertical: 8,
  },
  area: {
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#212743",
  },
  mensagem: {
    fontSize: 16,
    color: "#1a7a7a7",
    marginBottom: 30,
    marginTop: 10,
  },
  label: {
    color: colors.zinc,
    marginBottom: 4,
    fontWeight: "bold",
    fontSize: 16,
  },
  labelData: {
    color: colors.zinc,
    marginBottom: 4,
    width: 75,
    textAlign: "right",
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
  labelError: {
    color: colors.red,
    marginTop: -18,
    marginBottom: 18,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingVertical: 10,
    borderRadius: 8,
    paddingHorizontal: 10,
    marginTop: 10,
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    marginLeft: 10,
  },
  buttonClose: {
    backgroundColor: "rgb(211, 211, 211)",
  },
  buttonSave: {
    backgroundColor: colors.azul,
  },
  buttonText: {
    color: "#FFF",
    fontWeight: "bold",
  },
});
