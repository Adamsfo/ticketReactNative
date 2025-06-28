import React, { useState } from "react";
import {
  Text,
  TouchableOpacity,
  View,
  TouchableWithoutFeedback,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import colors from "@/src/constants/colors";

interface ModalMsgProps {
  onClose: () => void;
  msg?: string;
  onConfirm?: () => Promise<void>; // método async
}

export default function ModalMsgSimNao({
  onClose,
  msg,
  onConfirm,
}: ModalMsgProps) {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    try {
      if (onConfirm) {
        setLoading(true);
        await onConfirm(); // aguarda o método async
        setLoading(false);
      }
    } catch (error) {
      console.error("Erro ao confirmar:", error);
    } finally {
      onClose(); // sempre fecha o modal
    }
  };

  return (
    <TouchableWithoutFeedback onPress={onClose}>
      <View style={styles.modalContainer}>
        <TouchableWithoutFeedback>
          <View style={styles.container}>
            <View style={styles.header}>
              <Text style={styles.title}>Confirmação</Text>
              <TouchableOpacity onPress={onClose}>
                <Feather name="x" size={30} color="#212743" />
              </TouchableOpacity>
            </View>

            <View style={styles.area}>
              <Text style={styles.mensagem}>{msg || "Deseja continuar?"}</Text>

              <View style={styles.buttonRow}>
                <TouchableOpacity style={styles.buttonNo} onPress={onClose}>
                  <Text style={styles.buttonText}>Não</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.buttonYes}
                  onPress={handleConfirm}
                >
                  <Text style={styles.buttonText}>
                    {loading ? (
                      <ActivityIndicator
                        size="small"
                        color={colors.laranjado}
                      />
                    ) : (
                      ""
                    )}
                    Sim
                  </Text>
                </TouchableOpacity>
              </View>
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
  },
  container: {
    marginHorizontal: 20,
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
    maxWidth: 400,
    width: "90%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 1,
    paddingVertical: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#212743",
  },
  area: {
    alignItems: "center",
    marginTop: 10,
  },
  mensagem: {
    fontSize: 16,
    color: "#333",
    marginBottom: 30,
    textAlign: "center",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
  },
  buttonYes: {
    backgroundColor: colors.azul,
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 5,
    marginHorizontal: 10,
  },
  buttonNo: {
    backgroundColor: "#dc3545",
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 5,
    marginHorizontal: 10,
  },
  buttonText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 16,
  },
});
