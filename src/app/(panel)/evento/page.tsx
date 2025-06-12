import React, { useCallback, useState } from "react";
import {
  Text,
  StyleSheet,
  Modal,
  Platform,
  Dimensions,
  View,
  Image,
  TouchableOpacity,
  FlatList,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import StatusBarPage from "@/src/components/StatusBarPage";
import ModalMsg from "@/src/components/ModalMsg";
import colors from "@/src/constants/colors";
import BarMenu from "@/src/components/BarMenu";
import { Feather } from "@expo/vector-icons";
import CounterTicket from "@/src/components/CounterTicket";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useFocusEffect } from "expo-router";
import { apiGeral } from "@/src/lib/geral";
import { Evento, Produtor } from "@/src/types/geral";
import MapViewer from "@/src/components/MapViewer";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { api } from "@/src/lib/api";
import WebView, { WebViewMessageEvent } from "react-native-webview";

const { width } = Dimensions.get("window");

export default function Index() {
  const endpointApi = "/evento";
  const route = useRoute();
  const [visibleMsg, setVisibleMsg] = useState(false);
  const navigation = useNavigation() as any;
  const { id } = route.params as { id: number };
  const [formData, setFormData] = useState<Evento>({
    id: 0,
    nome: "",
    descricao: "",
    imagem: "",
    data_hora_inicio: new Date(),
    data_hora_fim: new Date(),
    endereco: "",
    idUsuario: 0,
    idProdutor: 0,
  });
  const [produtor, setProdutor] = useState<Produtor>({
    id: 0,
    nome: "",
    descricao: "",
    logo: "",
  }); // Estado para o produtor

  const [iframeHeight, setIframeHeight] = useState(200); // Estado para a altura do iframe
  const [iframeHeightProdutor, setIframeHeightProdutor] = useState(200); // Estado para a altura do iframe
  const [webViewHeight, setWebViewHeight] = useState(200); // Estado para a altura do WebView
  const [webViewHeightProdutor, setWebViewHeightProdutor] = useState(200); // Estado para a altura do WebView

  const widthCardItem = 460;

  const getRegistros = async (id: number) => {
    if (id > 0) {
      const response = await apiGeral.getResourceById<Evento>(endpointApi, id);

      let data = response as unknown as Evento;
      data.data_hora_inicio = new Date(data.data_hora_inicio.toString());
      data.data_hora_fim = new Date(data.data_hora_fim.toString());
      // getRegistrosIngressos({ filters: { idEvento: id } });
      setFormData(data as Evento);
      const respProdutor = await apiGeral.getResourceById<Produtor>(
        "/produtor",
        data.idProdutor
      );
      setProdutor(respProdutor as Produtor);
    } else {
      formData.id = 0;
      formData.nome = "";
      formData.descricao = "";
      formData.imagem = "";
      formData.data_hora_inicio = new Date();
      formData.data_hora_fim = new Date();
      formData.endereco = "";
      formData.idUsuario = 0;
      formData.idProdutor = 0;
      formData.mapa = "";
    }
  };

  useFocusEffect(
    useCallback(() => {
      const fetchData = async () => {
        // setRegistrosEventoIngressos([]);
        await getRegistros(id);
      };
      fetchData();
    }, [id])
  );

  const data = [
    { key: "header", type: "header" },
    { key: "descricao", type: "descricao" },
    { key: "mapa", type: "mapa" },
    { key: "produtor", type: "produtor" },
  ];

  const renderItem = ({ item }: { item: { key: string; type: string } }) => {
    if (item.type === "header") {
      return (
        <>
          <View style={styles.containerImagem}>
            <Image
              source={{ uri: api.getBaseApi() + "/uploads/" + formData.imagem }}
              style={styles.imagem}
            />
          </View>

          <View style={styles.dadosBasicos}>
            <Text style={styles.titulo}>{formData.nome}</Text>
            <View style={{ flexDirection: "row", padding: 7 }}>
              <Text
                style={{ fontWeight: "normal", paddingLeft: 5, marginRight: 5 }}
              >
                {formData.endereco}
              </Text>

              <Feather name="map-pin" size={20}></Feather>
            </View>

            <View style={{ flexDirection: "row", padding: 7 }}>
              <Text style={{ fontWeight: "normal", paddingLeft: 5 }}>
                {format(
                  parseISO(formData.data_hora_inicio.toISOString()),
                  "'Inicio 'dd 'de' MMMM 'de' yyyy 'às' HH:mm 'hs'",
                  { locale: ptBR }
                )}{" "}
                até{" "}
                {format(
                  parseISO(formData.data_hora_fim.toISOString()),
                  "dd 'de' MMMM 'de' yyyy 'às' HH:mm 'hs'",
                  { locale: ptBR }
                )}
              </Text>
            </View>
            {formData.latitude && formData.longitude && (
              <MapViewer
                location={{
                  latitude: Number(formData.latitude),
                  longitude: Number(formData.longitude),
                }}
                setLocation={(location) => console.log(location)}
              />
            )}
          </View>
        </>
      );
    } else if (item.type === "mapa") {
      return (
        <View style={styles.dadosBasicos}>
          <Text style={styles.titulo}>Mapa do Evento</Text>
          <View style={styles.containerImagem}>
            <Image
              source={{ uri: api.getBaseApi() + "/uploads/" + formData.mapa }}
              style={styles.imagem}
            />
          </View>
        </View>
      );
    } else if (item.type === "produtor") {
      const htmlContent = `
        <html>
          <head>
            <style>
              body { background-color: transparent; color: black; }
            </style>
          </head>
          <body>
            ${produtor.descricao}
          </body>
        </html>
      `;

      // Ajuste da altura do iframe conforme o conteúdo
      const onIframeLoad = (event: React.SyntheticEvent<HTMLIFrameElement>) => {
        const iframe = event.target as HTMLIFrameElement;
        const iframeDocument =
          iframe.contentDocument || iframe.contentWindow?.document;
        if (iframeDocument) {
          setIframeHeightProdutor(iframeDocument.body.scrollHeight + 50);
        }
      };

      // Ajuste da altura do WebView conforme o conteúdo
      const onWebViewMessage = (event: WebViewMessageEvent) => {
        setWebViewHeightProdutor(Number(event.nativeEvent.data));
      };

      return (
        <View style={styles.dadosBasicos}>
          <View
            style={{ flexDirection: "row", justifyContent: "space-between" }}
          >
            <Text style={styles.titulo}>Produtor</Text>
            <Image
              source={{ uri: api.getBaseApi() + "/uploads/" + produtor.logo }}
              style={styles.imagemCabecalho}
            />
          </View>
          <Text style={styles.titulo}>{produtor.nome}</Text>
          {Platform.OS === "web" ? (
            <iframe
              srcDoc={htmlContent}
              onLoad={onIframeLoad}
              style={{
                width: "100%",
                height: iframeHeightProdutor,
                borderWidth: 0,
                backgroundColor: "transparent",
              }}
            />
          ) : (
            <WebView
              originWhitelist={["*"]}
              source={{ html: produtor.descricao || "" }}
              style={{
                height: webViewHeightProdutor,
                width: "100%",
                backgroundColor: "transparent",
              }}
              scalesPageToFit={false}
              onMessage={onWebViewMessage}
              injectedJavaScript={`window.ReactNativeWebView.postMessage(document.body.scrollHeight)`}
            />
          )}
        </View>
      );
    } else if (item.type === "descricao") {
      const htmlContent = `
        <html>
          <head>
            <style>
              body { background-color: transparent; color: black; }
            </style>
          </head>
          <body>
            ${formData.descricao}
          </body>
        </html>
      `;

      // Ajuste da altura do iframe conforme o conteúdo
      const onIframeLoad = (event: React.SyntheticEvent<HTMLIFrameElement>) => {
        const iframe = event.target as HTMLIFrameElement;
        const iframeDocument =
          iframe.contentDocument || iframe.contentWindow?.document;
        if (iframeDocument) {
          setIframeHeight(iframeDocument.body.scrollHeight + 60);
        }
      };

      // Ajuste da altura do WebView conforme o conteúdo
      const onWebViewMessage = (event: WebViewMessageEvent) => {
        setWebViewHeight(Number(event.nativeEvent.data));
      };

      return (
        <View style={styles.dadosBasicos}>
          <Text style={styles.titulo}>Informações do Evento</Text>
          {Platform.OS === "web" ? (
            <iframe
              srcDoc={htmlContent}
              onLoad={onIframeLoad}
              style={{
                width: "100%",
                height: iframeHeight,
                borderWidth: 0,
                backgroundColor: "transparent",
              }}
            />
          ) : (
            <WebView
              originWhitelist={["*"]}
              source={{ html: formData.descricao }}
              style={{
                height: webViewHeight,
                width: "100%",
                backgroundColor: "transparent",
              }}
              scalesPageToFit={false}
              onMessage={onWebViewMessage}
              injectedJavaScript={`window.ReactNativeWebView.postMessage(document.body.scrollHeight)`}
            />
          )}
        </View>
      );
    }
    return null;
  };

  return (
    <LinearGradient
      colors={[colors.white, colors.laranjado]}
      style={{ flex: 1, justifyContent: "center" }}
    >
      <StatusBarPage style="dark" />
      <BarMenu />

      <View style={styles.container}>
        <FlatList
          data={data}
          keyExtractor={(item) => item.key}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
        />
      </View>

      <TouchableOpacity
        style={styles.floatingButton}
        onPress={() => navigation.navigate("ingressos", { id: id })}
      >
        <Text style={styles.floatingButtonText}>Comprar Ingressos</Text>
      </TouchableOpacity>

      <Modal visible={visibleMsg} transparent animationType="slide">
        <ModalMsg onClose={() => setVisibleMsg(false)} />
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: Platform.OS === "web" ? 80 : 120,
    // marginRight: Platform.OS === "web" ? (width <= 1000 ? 5 : "10%") : 20,
    // marginLeft: Platform.OS === "web" ? (width <= 1000 ? 5 : "10%") : 20,
    // marginBottom: 20,
  },
  titulo: {
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 10,
    marginBottom: 3,
  },
  containerImagem: {
    alignItems: "center",
  },
  imagem: {
    width: Platform.OS === "web" ? (width <= 1000 ? "100%" : "60%") : "100%",
    height: Platform.OS === "web" ? (width <= 1000 ? 300 : 500) : 300,
    resizeMode: "cover",
    borderRadius: 20,
  },
  dadosBasicos: {
    backgroundColor: "rgba(255,255,255, 0.21)",
    marginTop: 7,
    paddingRight: 25,
    paddingLeft: 25,
    marginRight: Platform.OS === "web" ? (width <= 1000 ? 5 : "20%") : 0,
    marginLeft: Platform.OS === "web" ? (width <= 1000 ? 5 : "20%") : 0,
    paddingBottom: 25,
    borderRadius: 20,
  },
  floatingButton: {
    position: "absolute",
    bottom: 15,
    left: "50%",
    transform: [
      {
        translateX:
          Platform.OS === "web" ? (width <= 1000 ? -175 : -135) : -175,
      },
    ], // Centraliza o botão
    backgroundColor: "rgb(0, 146, 250)",
    borderRadius: 20,
    padding: 15,
    alignItems: "center",
    width: 350, // Largura do botão
  },
  floatingButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  imagemCabecalho: {
    width: Platform.OS === "web" ? 70 : 60, // 100% para web, largura da tela para mobile
    height: 45,
    resizeMode: "cover", // Ajuste o modo de redimensionamento conforme necessário
    marginTop: 10,
  },
});
