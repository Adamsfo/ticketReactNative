import React from "react";
import {
  Text,
  TouchableOpacity,
  View,
  TouchableWithoutFeedback,
  StyleSheet,
  Platform,
} from "react-native";
import { Feather } from "@expo/vector-icons";

interface ModalMsgProps {
  onClose: () => void;
  msg?: string;
}

export default function ModalMsg({ onClose, msg }: ModalMsgProps) {
  return (
    <TouchableWithoutFeedback onPress={onClose}>
      <View style={styles.modalContainer}>
        <TouchableWithoutFeedback>
          <View style={styles.container}>
            <View style={styles.header}>
              <TouchableOpacity>
                {/* <Feather name="share" size={30} color="#212743" /> */}
              </TouchableOpacity>
              <Text style={styles.title}>Informação</Text>
              <TouchableOpacity onPress={onClose}>
                <Feather name="x" size={30} color="#212743" />
              </TouchableOpacity>
            </View>

            <View style={styles.area}>
              <Text style={styles.mensagem}>
                <Text>{msg}</Text>
              </Text>
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
    width: Platform.OS === "web" ? "50%" : "90%", // Largura do modal
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
});
