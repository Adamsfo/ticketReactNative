import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  Button,
  StyleSheet,
  Clipboard,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
} from "react-native";
import { api } from "@/src/lib/api";
import { apiGeral } from "@/src/lib/geral";
import { QueryParams } from "@/src/types/geral";
import colors from "@/src/constants/colors";
import ModalMsg from "../ModalMsg";

type Props = {
  valor: number;
  email: string;
  idTransacao?: number;
  setPaymentStatusId: (id: string) => void;
};

export default function PaymentPix({
  valor,
  email,
  idTransacao,
  setPaymentStatusId,
}: Props) {
  const [qrCodeBase64, setQrCodeBase64] = useState<string>("");
  const [copyPasteCode, setCopyPasteCode] = useState<string>("");
  const [loading, setloading] = useState(false);
  const [modalMsg, setModalMsg] = useState(false);
  const [msg, setMsg] = useState("");

  const fetchPixPayment = async () => {
    try {
      setloading(true);
      const response = await fetch(api.getBaseApi() + "/pagamentopix", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          valorTotal: Number(valor),
          email: email,
          descricao: "Ingressos",
          idTransacao: idTransacao,
        }), // Adicione o ID do usuário aqui
      });

      console.log("response", response);
      const responseData = await response.json();
      const pixData = responseData.point_of_interaction.transaction_data;
      setQrCodeBase64(pixData.qr_code_base64);
      setCopyPasteCode(pixData.qr_code);
      setPaymentStatusId(responseData.id);
      setloading(false);
    } catch (error) {
      console.error("Erro ao gerar Pix:", error);
      setloading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Escaneie o QR Code ou copie o código Pix:
      </Text>

      {/* <TouchableOpacity
        onPress={() => {
          setIdPagamento("107841609777");
          setIsPolling(true);
        }}
      >
        <Text>consulta pagamento teste</Text>
      </TouchableOpacity> */}

      <TouchableOpacity
        style={[styles.button, styles.buttonSave]}
        onPress={() => fetchPixPayment()}
        disabled={loading}
      >
        <View style={styles.buttonContent}>
          {loading && (
            <ActivityIndicator
              size="small"
              color={colors.laranjado}
              style={{ marginRight: 10 }}
            />
          )}
          <Text style={styles.buttonText}>Gerar Pix</Text>
        </View>
      </TouchableOpacity>

      {qrCodeBase64 && (
        <Image
          style={styles.qr}
          source={{ uri: `data:image/png;base64,${qrCodeBase64}` }}
        />
      )}
      {/* <Text selectable style={styles.code}>
        {copyPasteCode}
      </Text> */}
      {copyPasteCode && (
        <Button
          title="Copiar código Pix"
          onPress={() => {
            Clipboard.setString(copyPasteCode);
            setMsg("Código Pix copiado para a área de transferência!");
            setModalMsg(true);
          }}
        />
      )}
      <Modal visible={modalMsg} transparent animationType="fade">
        <ModalMsg
          onClose={() => {
            setModalMsg(false);
          }}
          msg={msg}
        />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, alignItems: "center" },
  title: { fontSize: 18, marginBottom: 10, fontWeight: "bold" },
  qr: { width: 200, height: 200, marginBottom: 10 },
  code: { textAlign: "center", marginVertical: 10 },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    marginLeft: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonSave: {
    backgroundColor: colors.azul,
  },
  buttonText: {
    color: "#FFF",
    fontWeight: "bold",
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
});
