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
import { useNavigation } from "@react-navigation/native";

interface ModalMsgProps {
  onClose: () => void;
  idEvento: number;
}

export default function ModalCondicoesCompra({
  onClose,
  idEvento,
}: ModalMsgProps) {
  const navigation = useNavigation() as any;

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
                <View
                  style={{
                    backgroundColor: "#fff",
                    padding: 20,
                    borderRadius: 10,
                  }}
                >
                  <Text>
                    Ao aceitar as condições de compra, você concorda com
                    os&nbsp;
                    <Text
                      style={{ color: "blue" }}
                      onPress={() => {
                        navigation.navigate("evento", {
                          id: idEvento,
                        });
                        onClose();
                      }}
                    >
                      termos e condições do evento
                    </Text>
                    , incluindo políticas de reembolso e cancelamento, que estão
                    nas informações do evento.
                  </Text>
                  {/* <View style={[styles.footer, { paddingTop: 10 }]}>
                    <TouchableOpacity
                      onPress={() => onClose()}
                      style={[styles.button, styles.buttonClose]}
                    >
                      <Text style={{ color: "red", marginTop: 15 }}>
                        Fechar
                      </Text>
                    </TouchableOpacity>
                  </View> */}
                </View>
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
    // width: Platform.OS === "web" ? "50%" : "90%", // Largura do modal
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
  button: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    marginLeft: 10,
  },
  buttonClose: {
    backgroundColor: "rgb(211, 211, 211)",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    borderRadius: 8,
    paddingHorizontal: 10,
    // marginTop: 10,
  },
});
