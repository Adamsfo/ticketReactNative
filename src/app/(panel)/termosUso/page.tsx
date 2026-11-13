import React from "react";
import { StyleSheet, View, Dimensions, Platform } from "react-native";
import PublicShopLayout from "@/src/components/public/PublicShopLayout";
import termoUso from "../../../assets/termoUso";
import { publicTheme } from "@/src/constants/publicTheme";

const { width, height } = Dimensions.get("window");

export default function TermosUso() {
  return (
    <PublicShopLayout>
      <View style={styles.container}>
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
    </PublicShopLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 12,
    paddingHorizontal: 12,
    marginBottom: 20,
    maxWidth: publicTheme.contentMaxWidth,
    width: "100%",
    alignSelf: "center",
  },
  iframeWrapper: {
    flex: 1,
    width: "100%",
    height: Platform.OS === "web" ? height - 140 : height - 200,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: publicTheme.border,
  },
});
