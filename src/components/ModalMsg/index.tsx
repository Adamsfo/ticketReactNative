import React from "react";
import {
  Text,
  TouchableOpacity,
  View,
  TouchableWithoutFeedback,
  StyleSheet,
} from "react-native";
import { Feather } from "@expo/vector-icons";

interface ModalMsgProps {
  onClose: () => void;
  msg?: string;
}

export default function ModalMsg({ onClose, msg }: ModalMsgProps) {
  return (
    <View style={styles.modalContainer}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={{ flex: 1 }}></View>
      </TouchableWithoutFeedback>
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
    </View>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: "#FFF",
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    padding: 15,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 1,
    paddingVertical: 8,
  },
  area: {
    flex: 1,
    alignItems: "center",
  },
  title: {
    fontSize: 33,
    fontWeight: "bold",
    color: "#212743",
  },
  mensagem: {
    fontSize: 17,
    color: "#1a7a7a7",
    marginBottom: 30,
    marginTop: 10,
  },
});
