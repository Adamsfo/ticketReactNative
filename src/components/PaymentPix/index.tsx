import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  Clipboard,
  TouchableOpacity,
  Modal,
} from "react-native";
import { api } from "@/src/lib/api";
import { apiGeral } from "@/src/lib/geral";
import { QueryParams } from "@/src/types/geral";
import ModalMsg from "../ModalMsg";
import { publicTheme } from "@/src/constants/publicTheme";
import PublicPrimaryButton from "../public/PublicPrimaryButton";
import formatCurrency from "../FormatCurrency";

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
      <Text style={styles.title}>Pagamento via Pix</Text>
      <Text style={styles.subtitle}>
        Valor: {formatCurrency(valor)}
      </Text>
      <Text style={styles.hint}>
        Gere o QR Code ou copie o código Pix para concluir o pagamento.
      </Text>

      {/* <TouchableOpacity
        onPress={() => {
          setIdPagamento("107841609777");
          setIsPolling(true);
        }}
      >
        <Text>consulta pagamento teste</Text>
      </TouchableOpacity> */}

      <PublicPrimaryButton
        label={loading ? "Gerando Pix…" : "Gerar Pix"}
        onPress={() => fetchPixPayment()}
        disabled={loading}
        loading={loading}
        style={styles.generateBtn}
      />

      {qrCodeBase64 ? (
        <View style={styles.qrWrap}>
          <Image
            style={styles.qr}
            source={{ uri: `data:image/png;base64,${qrCodeBase64}` }}
          />
        </View>
      ) : null}
      {/* <Text selectable style={styles.code}>
        {copyPasteCode}
      </Text> */}
      {copyPasteCode ? (
        <PublicPrimaryButton
          label="Copiar código Pix"
          onPress={() => {
            Clipboard.setString(copyPasteCode);
            setMsg("Código Pix copiado para a área de transferência!");
            setModalMsg(true);
          }}
          variant="secondary"
          style={styles.copyBtn}
        />
      ) : null}
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
  container: {
    padding: 8,
    alignItems: "stretch",
    width: "100%",
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    color: publicTheme.textPrimary,
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 22,
    fontWeight: "800",
    color: publicTheme.primary,
    textAlign: "center",
    marginBottom: 8,
  },
  hint: {
    fontSize: 14,
    color: publicTheme.textSecondary,
    textAlign: "center",
    marginBottom: 16,
    lineHeight: 20,
  },
  generateBtn: {
    marginBottom: 16,
  },
  copyBtn: {
    marginTop: 12,
  },
  qrWrap: {
    alignSelf: "center",
    padding: 12,
    backgroundColor: publicTheme.surface,
    borderRadius: publicTheme.radiusMd,
    borderWidth: 1,
    borderColor: publicTheme.border,
    marginBottom: 8,
  },
  qr: { width: 220, height: 220 },
  code: { textAlign: "center", marginVertical: 10 },
});
