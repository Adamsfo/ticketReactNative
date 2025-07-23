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
      "Olá! Preciso de uma ajuda. Se tiver outra sugestão, me manda aqui também! 😊"
    );

    const urlMobile = `whatsapp://send?phone=${phoneNumber}&text=${message}`;
    const urlWeb = `https://wa.me/${phoneNumber}?text=${message}`;

    if (Platform.OS === "web") {
      // Substitui a aba atual, mais compatível com web mobile
      window.location.href = urlWeb;
    } else {
      Linking.openURL(urlMobile).catch((err) =>
        console.error("Erro ao abrir o WhatsApp", err)
      );
    }
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
