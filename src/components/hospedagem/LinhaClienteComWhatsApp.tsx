import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import WhatsAppClienteIcon from "./WhatsAppClienteIcon";

type Props = {
  nome: string;
  telefone?: string | null;
  strong?: boolean;
};

export default function LinhaClienteComWhatsApp({
  nome,
  telefone,
  strong = false,
}: Props) {
  const nomeExibicao = nome?.trim() || "Hóspede";

  return (
    <View style={styles.linha}>
      <Feather name="user" size={13} color="#667085" style={styles.icon} />
      <View style={styles.conteudo}>
        <Text
          style={[styles.texto, strong && styles.textoStrong]}
          numberOfLines={1}
        >
          {nomeExibicao}
        </Text>
        <WhatsAppClienteIcon telefone={telefone} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  linha: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  icon: {
    marginRight: 6,
  },
  conteudo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    minWidth: 0,
  },
  texto: {
    flexShrink: 1,
    color: "#667085",
    fontSize: 13,
  },
  textoStrong: {
    color: "#212743",
    fontWeight: "600",
  },
});
