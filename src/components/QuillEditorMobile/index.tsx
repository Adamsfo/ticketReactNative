import React, { useEffect, useState } from "react";
import { WebView } from "react-native-webview";
import { StyleSheet, View, Text, TouchableOpacity } from "react-native";
import { Asset } from "expo-asset";
import colors from "@/src/constants/colors";

export default function QuillEditorMobile() {
  const [htmlUri, setHtmlUri] = useState<string | null>(null);

  const loadHtml = async () => {
    try {
      console.log("Carregando o arquivo HTML...");
      const htmlAsset = Asset.fromModule(require("../../../assets/quill.html"));
      await htmlAsset.downloadAsync();

      if (htmlAsset.localUri) {
        console.log("Arquivo HTML carregado:", htmlAsset.localUri);
        setHtmlUri(htmlAsset.localUri);
      }
    } catch (error) {
      console.error("Erro ao carregar o arquivo HTML:", error);
    }
  };

  useEffect(() => {
    loadHtml();
  }, []);

  // Se o arquivo ainda não carregou, exibir apenas um texto
  if (!htmlUri) {
    return <Text style={styles.loadingText}>Carregando Editor...</Text>;
  }

  return (
    <View style={styles.container}>
      <Text style={{ color: colors.red, fontSize: 12 }}>
        Recomendado editar na plataforma Web
      </Text>
      <WebView
        originWhitelist={["*"]}
        source={{ uri: htmlUri }}
        allowFileAccess={true}
        allowUniversalAccessFromFileURLs={true}
        mixedContentMode="always"
        style={styles.webview}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 10,
  },
  webview: {
    flex: 1,
  },
  loadingText: {
    textAlign: "center",
    marginTop: 50,
    fontSize: 16,
    color: "gray",
  },
});
