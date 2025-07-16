import React from "react";
import {
  Linking,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { FontAwesome } from "@expo/vector-icons";

const phoneNumber = "65993074619"; // Ex: 5599999999999

export default function FloatingWhatsAppButton() {
  const openWhatsApp = () => {
    const message = encodeURIComponent(
      "Olá! Preciso de uma ajuda. Se tiver outra sugestão, me manda aqui também!"
    );

    const url =
      Platform.OS === "ios"
        ? `whatsapp://send?phone=${phoneNumber}&text=${message}`
        : `https://wa.me/${phoneNumber}?text=${message}`;

    Linking.openURL(url).catch((err) =>
      console.error("Erro ao abrir o WhatsApp", err)
    );
  };

  return (
    <TouchableOpacity style={styles.floatingButton} onPress={openWhatsApp}>
      <View style={styles.iconContainer}>
        <FontAwesome name="whatsapp" size={28} color="#fff" />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  floatingButton: {
    position: "absolute",
    bottom: 5,
    left: 5,
    zIndex: 999,
  },
  iconContainer: {
    backgroundColor: "#25D366",
    width: 45,
    height: 45,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5, // Android
    shadowColor: "#000", // iOS
    shadowOffset: { width: 0, height: 2 }, // iOS
    shadowOpacity: 0.3, // iOS
    shadowRadius: 3, // iOS
  },
});
