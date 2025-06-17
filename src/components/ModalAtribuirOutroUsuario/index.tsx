import React, { useState } from "react";
import {
  Text,
  TouchableOpacity,
  View,
  TouchableWithoutFeedback,
  StyleSheet,
  Platform,
  TextInput,
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

export default function ModalAtribuirOutroUsuario({
  onClose,
  item,
}: ModalMsgProps) {
  const [NomeUsuarioNovo, setNomeUsuarioNovo] = useState("");
  const [idUsuarioNovo, setidUsuarioNovo] = useState("");
  const [msg, setMsg] = useState("");
  const { user } = useAuth();
  const [email, setEmail] = useState("");

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

  return (
    <TouchableWithoutFeedback onPress={onClose}>
      <View style={styles.modalContainer}>
        <TouchableWithoutFeedback>
          <View style={styles.container}>
            <View style={styles.header}>
              <TouchableOpacity>
                {/* <Feather name="share" size={30} color="#212743" /> */}
              </TouchableOpacity>
              <Text style={styles.title}>Atribui Ingresso a outro Usuário</Text>
              <TouchableOpacity onPress={onClose}>
                <Feather name="x" size={30} color="#212743" />
              </TouchableOpacity>
            </View>

            <View>
              <Text style={styles.mensagem}>
                Ao atribuir este ingresso a outro usuário, ele deixará de
                aparecer na sua lista, passando a ser de propriedade do novo
                usuário, com um novo QR Code gerado.
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
              <Text
                style={{
                  color: NomeUsuarioNovo.length > 0 ? colors.azul : "red",
                }}
              >
                {NomeUsuarioNovo.length > 0
                  ? NomeUsuarioNovo
                  : "Novo usuário não encontrado, digite o email para atribuir."}
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
                <Text style={styles.buttonText}>Salvar</Text>
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
    width: Platform.OS === "web" ? "40%" : "90%", // Largura do modal
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
