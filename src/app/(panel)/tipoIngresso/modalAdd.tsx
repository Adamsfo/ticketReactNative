import React, { useState } from "react";
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  TextInput,
  Modal,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { View, TouchableWithoutFeedback, ScrollView } from "react-native";
import colors from "@/src/constants/colors";

interface ModalMsgProps {
  visible: boolean;
  onClose: () => void;
}

export default function ModalAddTipoIngresso({
  visible,
  onClose,
}: ModalMsgProps) {
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const [count, setCount] = useState(1);
  const [formData, setFormData] = useState({
    nome: "",
    descricao: "",
  });

  const handleChange = (field: any, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSave = () => {
    // Implementar lógica de salvar
    console.log("Salvar", formData);
    onClose();
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
            <Text style={styles.title}>Informações Tipo do Ingresso</Text>
            <View>
              <View>
                <Text style={styles.label}>
                  Descrição{" "}
                  <Text
                    style={{ fontSize: 10, color: colors.red, marginLeft: 8 }}
                  >
                    Informação: Ingresso Individual, Bistro, Camarote
                  </Text>
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ingresso Individual..."
                  keyboardType="default"
                  value={formData.nome}
                  onChangeText={(text) => handleChange("nome", text)}
                ></TextInput>
                {errors.nome && (
                  <Text style={styles.labelError}>{errors.nome}</Text>
                )}
              </View>

              <View style={{ alignContent: "flex-start" }}>
                <Text style={styles.label}>
                  Quantidade de Ingressos{" "}
                  <Text
                    style={{ fontSize: 10, color: colors.red, marginLeft: 8 }}
                  >
                    Informação: Ingresso Individual quantidade 1, caso bistro ou
                    camarote informe a quantidade correspondente
                  </Text>
                </Text>
                <View style={{ marginLeft: 10 }}>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <TouchableOpacity
                      style={{
                        backgroundColor: "rgb(0, 146, 250)",
                        borderRadius: 5,
                      }}
                      onPress={() => setCount(count + 1)}
                    >
                      <Feather name="plus" size={28} color="white"></Feather>
                    </TouchableOpacity>
                    <Text style={{ fontSize: 18, marginHorizontal: 5 }}>
                      {count}
                    </Text>
                    <TouchableOpacity
                      style={{
                        backgroundColor: "rgb(0, 146, 250)",
                        borderRadius: 5,
                      }}
                      onPress={() => setCount(count - 1)}
                    >
                      <Feather name="minus" size={28} color="white"></Feather>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
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
    width: Platform.OS === "web" ? "60%" : "90%",
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
