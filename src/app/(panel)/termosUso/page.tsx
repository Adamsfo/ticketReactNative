import React from "react";
import { Text, StyleSheet, View, Dimensions, Platform } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import StatusBarPage from "@/src/components/StatusBarPage";
import BarMenu from "@/src/components/BarMenu";
import colors from "@/src/constants/colors";
import termoUso from "../../../assets/termoUso";

const { width, height } = Dimensions.get("window");

export default function TermosUso() {
  return (
    <LinearGradient
      colors={[colors.branco, colors.laranjado]}
      style={{ flex: 1 }}
    >
      <StatusBarPage style="dark" />
      <BarMenu />

      <View style={styles.container}>
        {/* <Text style={styles.titulo}>Termos de Serviço</Text> */}

        <View style={styles.iframeWrapper}>
          <iframe
            srcDoc={termoUso}
            style={{
              width: "100%",
              height: "100%",
              border: "none",
              borderRadius: 12,
              backgroundColor: "white",
            }}
            title="Termos de Serviço"
          />
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: Platform.OS === "web" ? 80 : 120,
    marginBottom: 20,
    paddingHorizontal:
      Platform.OS === "web" ? (width <= 1000 ? 10 : "10%") : 20,
  },
  titulo: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  iframeWrapper: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.85)",
    borderRadius: 12,
    overflow: "hidden",
  },
});
