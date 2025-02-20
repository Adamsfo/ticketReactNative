import React, { useEffect, useState, useRef } from "react";
import { WebView } from "react-native-webview";
import { StyleSheet, View, Text } from "react-native";
import { Asset } from "expo-asset";
import colors from "@/src/constants/colors";

interface QuillEditorMobileProps {
  value: string;
  onChange: (value: string) => void;
}

const QuillEditorMobile: React.FC<QuillEditorMobileProps> = ({
  value,
  onChange,
}) => {
  const [htmlUri, setHtmlUri] = useState<string | null>(null);
  const webViewRef = useRef<WebView | null>(null);

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
    console.log(value);
  }, []);

  useEffect(() => {
    if (webViewRef.current && htmlUri) {
      webViewRef.current.injectJavaScript(`
        (function() {
          if (window.editor) {
            window.editor.root.innerHTML = ${JSON.stringify(value)};
          }
        })();
      `);
    }
  }, [htmlUri, value]);

  const onMessage = (event: any) => {
    const data = event.nativeEvent.data;
    onChange(data);
  };

  if (!htmlUri) {
    return <Text style={styles.loadingText}>Carregando Editor...</Text>;
  }

  return (
    <View style={styles.container}>
      <Text style={{ color: colors.red, fontSize: 12 }}>
        Recomendado editar na plataforma Web
      </Text>
      {/* <WebView
        ref={webViewRef}
        originWhitelist={["*"]}
        source={{ uri: htmlUri }}
        allowFileAccess={true}
        allowUniversalAccessFromFileURLs={true}
        mixedContentMode="always"
        style={styles.webview}
        onMessage={onMessage}
        injectedJavaScript={`
          (function() {
            document.addEventListener('message', function(event) {
              if (window.editor) {
                window.editor.root.innerHTML = event.data;
              }
            });
            window.ReactNativeWebView.postMessage(window.editor.root.innerHTML);
          })();
        `}
      /> */}
    </View>
  );
};

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

export default QuillEditorMobile;
