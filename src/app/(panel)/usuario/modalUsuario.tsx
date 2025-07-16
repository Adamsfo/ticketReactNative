import React, { useCallback, useState } from "react";
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  TextInput,
  Modal,
  Dimensions,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { View, TouchableWithoutFeedback, ScrollView } from "react-native";
import colors from "@/src/constants/colors";
import { apiGeral } from "@/src/lib/geral";
import { Produtor, Usuario } from "@/src/types/geral";
import { useFocusEffect } from "expo-router";
import ImageUploader from "@/src/components/ImageUploader";
import { SafeAreaView } from "react-native-safe-area-context";
import QuillEditorWeb from "@/src/components/QuillEditorWeb";
import QuillEditorMobile from "@/src/components/QuillEditorMobile";
import { Badge } from "@/src/components/Badge";

const { width } = Dimensions.get("window");

interface ModalMsgProps {
  id: number;
  visible: boolean;
  onClose: () => void;
}

export default function ModalUsuario({ id, visible, onClose }: ModalMsgProps) {
  const endpointApi = "/usuario";
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // const [count, setCount] = useState(1);
  const [formData, setFormData] = useState<Usuario>({
    id: 0,
    email: "",
    nomeCompleto: "",
    sobreNome: "",
    cpf: "",
    telefone: "",
    ativo: true,
    login: "", // Adiciona a propriedade obrigatória 'login'
  });

  const handleChange = (field: any, value: string | number | boolean) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSave = async () => {
    setErrors({});
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    if (id > 0) {
      await apiGeral.updateResorce<Usuario>(endpointApi, formData);
    } else {
      await apiGeral.createResource<Usuario>(endpointApi, formData);
    }

    onClose();
  };

  const validate = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.nomeCompleto)
      newErrors.nomeCompleto = "Nome completo é obrigatório.";
    if (!formData.email) newErrors.email = "Email é obrigatório.";
    if (!formData.sobreNome) newErrors.sobreNome = "Sobrenome é obrigatório.";
    if (!formData.cpf) newErrors.cpf = "CPF é obrigatório.";
    if (!formData.telefone) newErrors.telefone = "Telefone é obrigatório.";
    if (formData.ativo === undefined) newErrors.ativo = "Ativo é obrigatório.";
    if (!formData.login) newErrors.login = "Login é obrigatório.";

    return newErrors;
  };

  const getRegistros = async () => {
    const response = await apiGeral.getResourceById<Usuario>(endpointApi, id);

    setFormData(response as Usuario);
  };

  useFocusEffect(
    useCallback(() => {
      if (visible) {
        if (id > 0) {
          getRegistros();
        }
      }
    }, [visible])
  );

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

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalContainer}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.overlay} />
        </TouchableWithoutFeedback>
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity></TouchableOpacity>
            <TouchableOpacity onPress={onClose}>
              <Feather name="x" size={30} color="#212743" />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.content}>
            <Text style={styles.title}>Informações do Usuário</Text>

            <View
              style={{
                flexDirection: "row",
                gap: 8,
                marginBottom: 16,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <TouchableOpacity
                onPress={() => {
                  handleChange("ativo", true);
                }}
              >
                <Badge variant={formData.ativo ? "default" : "secondary"}>
                  Ativo
                </Badge>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  handleChange("ativo", false);
                }}
              >
                <Badge variant={!formData.ativo ? "default" : "secondary"}>
                  Não Ativo
                </Badge>
              </TouchableOpacity>
            </View>

            <View>
              <Text style={styles.label}>CPF</Text>
              <TextInput
                style={styles.input}
                placeholder="CPF..."
                keyboardType="numeric"
                value={formData.cpf}
                onChangeText={(text) => {
                  const formatted = formatCPF(text);
                  handleChange("cpf", formatted);
                }}
              ></TextInput>
              {errors.cpf && (
                <Text style={styles.labelError}>{errors.cpf}</Text>
              )}
            </View>

            <View>
              <Text style={styles.label}>Nome</Text>
              <TextInput
                style={styles.input}
                placeholder="Nome..."
                keyboardType="default"
                value={formData.nomeCompleto}
                onChangeText={(text) => handleChange("nomeCompleto", text)}
              ></TextInput>
              {errors.nomeCompleto && (
                <Text style={styles.labelError}>{errors.nomeCompleto}</Text>
              )}
            </View>

            <View>
              <Text style={styles.label}>Sobrenome</Text>
              <TextInput
                style={styles.input}
                placeholder="Sobrenome..."
                keyboardType="default"
                value={formData.sobreNome}
                onChangeText={(text) => handleChange("sobreNome", text)}
              ></TextInput>
              {errors.sobreNome && (
                <Text style={styles.labelError}>{errors.sobreNome}</Text>
              )}
            </View>

            <View>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="Digite seu email"
                keyboardType="email-address"
                value={formData.email}
                autoCapitalize="none"
                onChangeText={(text) => {
                  handleChange("email", text);
                  handleChange("login", text);
                }}
              />
              {errors.email && (
                <Text style={styles.labelError}>{errors.email}</Text>
              )}
            </View>

            <View>
              <Text style={styles.label}>Telefone</Text>
              <TextInput
                style={styles.input}
                placeholder="Telefone..."
                keyboardType="numeric"
                value={formData.telefone}
                onChangeText={(text) => {
                  const formatted = formatPhone(text);
                  handleChange("telefone", formatted);
                }}
              />
              {errors.telefone && (
                <Text style={styles.labelError}>{errors.telefone}</Text>
              )}
            </View>
          </ScrollView>

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
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  container: {
    width: Platform.OS === "web" ? (width > 1000 ? "40%" : "95%") : "100%",
    backgroundColor: "#FFF",
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 20,
    maxHeight: "90%",
    alignSelf: "center",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  content: {
    flexGrow: 1,
  },
  area: {
    flex: 1,
    alignItems: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#212743",
    marginBottom: 15,
  },
  label: {
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
