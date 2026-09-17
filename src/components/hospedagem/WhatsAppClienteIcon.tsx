import React from "react";
import {
  GestureResponderEvent,
  Platform,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import {
  abrirWhatsAppCliente,
  normalizarTelefoneWhatsAppLink,
} from "@/src/lib/telefoneWhatsApp";

type Props = {
  telefone?: string | null;
};

export default function WhatsAppClienteIcon({ telefone }: Props) {
  const numeroValido = normalizarTelefoneWhatsAppLink(telefone);
  if (!numeroValido) return null;

  const handlePress = (event: GestureResponderEvent) => {
    event.stopPropagation?.();
    abrirWhatsAppCliente(telefone);
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel="Abrir WhatsApp"
      {...(Platform.OS === "web"
        ? ({ title: "Abrir WhatsApp" } as object)
        : {})}
      style={styles.button}
    >
      <FontAwesome name="whatsapp" size={20} color="#25D366" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 40,
    height: 40,
    marginLeft: 4,
    marginVertical: -10,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
});
