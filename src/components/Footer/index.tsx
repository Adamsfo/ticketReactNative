import { Feather } from "@expo/vector-icons";
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Linking,
  TouchableOpacity,
  Image,
} from "react-native";

const Footer = () => {
  return (
    <View style={styles.footerContainer}>
      <View style={styles.logoSection}>
        <Text style={styles.slogan}>Diversão, lazer e música!</Text>
      </View>

      <View style={styles.linksSection}>
        <TouchableOpacity onPress={() => Linking.openURL("#")}>
          <Text style={styles.linkText}>Eventos</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => Linking.openURL("#")}>
          <Text style={styles.linkText}>Sobre</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => Linking.openURL("https://wa.me/5565993074619")}
        >
          <Text style={styles.linkText}>Contato</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.socialSection}>
        <TouchableOpacity
          onPress={() => Linking.openURL("https://facebook.com")}
        >
          <Feather name="facebook" size={24} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => Linking.openURL("https://instagram.com")}
        >
          <Feather name="instagram" size={24} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => Linking.openURL("https://wa.me/5565993074619")}
        >
          <Feather name="message-circle" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <Image
        source={require("../../assets/logotanz.png")} // Substitua pelo caminho correto
        style={styles.logo}
        resizeMode="contain"
      />
      <Text style={styles.copy}>
        © {new Date().getFullYear()} Tanz Tecnologia Ltda. Todos os direitos
        reservados.
      </Text>
      <Text style={styles.copy}>
        cnpj: 50.626.772/0001-01 - Av. A, 670 - Cuiabá - MT
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  footerContainer: {
    backgroundColor: "#FF9E1B",
    padding: 20,
    alignItems: "center",
    // flexDirection: "row",
  },
  logoSection: {
    alignItems: "center",
    marginBottom: 16,
    flexDirection: "row",
  },
  logo: {
    width: 120,
    height: 40,
    marginBottom: 6,
  },
  slogan: {
    fontSize: 14,
    color: "#fff",
    fontWeight: "500",
    marginLeft: 10,
  },
  linksSection: {
    flexDirection: "row",
    gap: 20,
    marginBottom: 12,
  },
  linkText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  socialSection: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 16,
  },
  copy: {
    fontSize: 12,
    color: "#fff",
    textAlign: "center",
  },
});

export default Footer;
