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
import colors from "@/src/constants/colors";
import formatCurrency from "../FormatCurrency";

interface ModalResumoIngressoProps {
  onClose: () => void;
}

export default function ModalResumoIngresso({
  onClose,
}: ModalResumoIngressoProps) {
  return (
    <View style={styles.modal}>
      <View style={styles.modalContainer}>
        <TouchableWithoutFeedback>
          <View style={{ flex: 1 }}></View>
        </TouchableWithoutFeedback>
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity>
              {/* <Feather name="share" size={30} color="#212743" /> */}
            </TouchableOpacity>
            {/* <TouchableOpacity onPress={onClose}>
            <Feather name="x" size={30} color="#212743" />
          </TouchableOpacity> */}
          </View>

          <View style={styles.area}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                // width: "100%",
                paddingHorizontal: 30,
              }}
            >
              <Text style={styles.title}>
                Total: {formatCurrency(500.12)} + taxas
              </Text>
              <Feather
                style={{ paddingLeft: 20 }}
                name="arrow-up-circle"
                size={30}
                color={colors.azul}
              />
            </View>
          </View>
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.button, styles.buttonClose]}
              // onPress={onClose}
            >
              <Text style={styles.buttonText}>Voltar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.buttonSave]}
              // onPress={handleSave}
            >
              <Text style={styles.buttonText}>Proximo</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    width: "100%",
  },
  container: {
    flex: 1,
    backgroundColor: "#FFF",
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    paddingBottom: 5,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3,
  },
  area: {
    flex: 1,
    alignItems: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.cinza,
  },
  mensagem: {
    fontSize: 17,
    color: "#1a7a7a7",
    // marginBottom: 30,
    // marginTop: 10,
  },
  modal: {
    position: "absolute",
    left: Platform.OS === "web" ? "35%" : "10%", // Centraliza horizontalmente
    bottom: 0,
    justifyContent: "flex-end",
    alignItems: "center",
    backgroundColor: "transparent",
    width: Platform.OS === "web" ? 500 : "80%",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingTop: 10,
    borderRadius: 8,
    paddingHorizontal: 10,
    // marginTop: 10,
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
