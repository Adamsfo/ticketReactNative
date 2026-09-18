import React from "react";
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import colors from "@/src/constants/colors";

type Props = {
  visible: boolean;
  titulo: string;
  mensagem: string;
  onClose: () => void;
};

export default function AcaoIndisponivelModal({
  visible,
  titulo,
  mensagem,
  onClose,
}: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.card}>
              <View style={styles.header}>
                <Text style={styles.titulo}>{titulo}</Text>
                <TouchableOpacity onPress={onClose} hitSlop={8}>
                  <Feather name="x" size={24} color="#212743" />
                </TouchableOpacity>
              </View>
              <Text style={styles.mensagem}>{mensagem}</Text>
              <TouchableOpacity style={styles.btn} onPress={onClose}>
                <Text style={styles.btnTexto}>Entendi</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    paddingHorizontal: 20,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 12,
  },
  titulo: {
    flex: 1,
    fontSize: 20,
    fontWeight: "700",
    color: "#212743",
  },
  mensagem: {
    fontSize: 15,
    lineHeight: 22,
    color: "#475467",
    marginBottom: 20,
  },
  btn: {
    backgroundColor: colors.azul,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  btnTexto: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
});
