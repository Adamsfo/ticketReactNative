import React, { useCallback, useState } from "react";
import {
  Text,
  StyleSheet,
  Modal,
  Platform,
  View,
  Image,
  FlatList,
  useWindowDimensions,
} from "react-native";
import ModalMsg from "@/src/components/ModalMsg";
import { useNavigation, useRoute } from "@react-navigation/native";
import PublicShopLayout from "@/src/components/public/PublicShopLayout";
import PublicShopSection from "@/src/components/public/PublicShopSection";
import PublicShopStickyCta from "@/src/components/public/PublicShopStickyCta";
import { publicTheme } from "@/src/constants/publicTheme";
import { Calendar, MapPin } from "lucide-react-native";
import { useFocusEffect } from "expo-router";
import { apiGeral } from "@/src/lib/geral";
import { Evento, Produtor } from "@/src/types/geral";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { api } from "@/src/lib/api";
import WebView, { WebViewMessageEvent } from "react-native-webview";
import { useAuth } from "@/src/contexts_/AuthContext";

export default function Index() {
  const { width } = useWindowDimensions();
  const horizontalPad = width >= 768 ? 20 : 12;
  const endpointApi = "/evento";
  const route = useRoute();
  const { isPDV } = useAuth();
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

  const ctaLabel = isPDV
    ? "Vender Ingressos"
    : formData.tipo === "Pousada"
      ? "Faça sua reserva"
      : "Comprar Ingressos";

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
        data.idProdutor,
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
    }, [id]),
  );

  const data = [
    { key: "header", type: "header" },
    { key: "descricao", type: "descricao" },
    { key: "mapa", type: "mapa" },
    { key: "produtor", type: "produtor" },
    { key: "cancelamento", type: "cancelamento" },
  ];

  const renderItem = ({ item }: { item: { key: string; type: string } }) => {
    if (item.type === "header") {
      return (
        <>
          <PublicShopSection noPadding style={styles.heroSection}>
            <Image
              source={{
                uri: api.getBaseApi() + "/uploads/" + formData.imagem,
              }}
              style={styles.imagem}
            />
          </PublicShopSection>

          <PublicShopSection>
            <Text style={styles.eventTitle}>{formData.nome}</Text>
            <View style={styles.metaRow}>
              <MapPin size={18} color={publicTheme.textSecondary} />
              <Text style={styles.metaText}>{formData.endereco}</Text>
            </View>
            <View style={styles.metaRow}>
              <Calendar size={18} color={publicTheme.textSecondary} />
              <Text style={styles.metaText}>
                {format(
                  parseISO(formData.data_hora_inicio.toISOString()),
                  "'Início 'dd 'de' MMMM 'de' yyyy 'às' HH:mm",
                  { locale: ptBR },
                )}{" "}
                até{" "}
                {format(
                  parseISO(formData.data_hora_fim.toISOString()),
                  "dd 'de' MMMM 'de' yyyy 'às' HH:mm",
                  { locale: ptBR },
                )}
              </Text>
            </View>
          </PublicShopSection>
        </>
      );
    } else if (item.type === "mapa") {
      return (
        <PublicShopSection title="Mapa do Evento" noPadding>
          <Image
            source={{ uri: api.getBaseApi() + "/uploads/" + formData.mapa }}
            style={styles.imagemMapa}
          />
        </PublicShopSection>
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
        <PublicShopSection title="Produtor">
          <View style={styles.produtorHeader}>
            <Text style={styles.produtorNome}>{produtor.nome}</Text>
            <Image
              source={{ uri: api.getBaseApi() + "/uploads/" + produtor.logo }}
              style={styles.imagemCabecalho}
            />
          </View>
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
        </PublicShopSection>
      );
    } else if (item.type === "descricao") {
      const htmlContent = `
        <html>
          <head>
            <style>
              body {
                background-color: transparent;
                color: black;
                font-size: 16px;
                line-height: 1.1; /* <= ajusta o espaçamento entre linhas */
                margin: 0;
                padding: 0;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              }
              p, li, div {
                margin: 0 0 8px 0;
              }
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
        <PublicShopSection title="Informações do Evento">
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
        </PublicShopSection>
      );
    } else if (item.type === "cancelamento") {
      return (
        <PublicShopSection title="Política de Cancelamento">
          <Text style={styles.subtitulo}>
            {`${
              formData.id != 1
                ? "* Cancelamentos de pedidos serão aceitos até 7 dias após a compra, desde que a solicitação seja enviada até 48 horas antes do início do evento.\n"
                : "* Cancelamentos de pedidos serão aceitos até 7 dias após a compra.\n"
            }`}
            * O cancelamento é definitivo. Após confirmado, a compra não pode
            ser reativada. {"\n"}* Não é possível cancelar somente um ingresso
            de um pedido com vários; todos serão cancelados juntos.
            {"\n"}* Assim que o cancelamento é efetivado, o processo de
            devolução do dinheiro é iniciado.
          </Text>
        </PublicShopSection>
      );
    }
    return null;
  };

  return (
    <PublicShopLayout>
      <View style={[styles.page, { paddingHorizontal: horizontalPad }]}>
        <FlatList
          data={data}
          keyExtractor={(item) => item.key}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
        <PublicShopStickyCta
          label={ctaLabel}
          onPress={() =>
            navigation.navigate(
              formData.tipo === "Ingresso" ? "ingressos" : "pousada",
              { id: id },
            )
          }
        />
      </View>

      <Modal visible={visibleMsg} transparent animationType="slide">
        <ModalMsg onClose={() => setVisibleMsg(false)} />
      </Modal>
    </PublicShopLayout>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    paddingTop: 12,
  },
  listContent: {
    paddingBottom: 120,
    paddingTop: 4,
  },
  heroSection: {
    marginBottom: 16,
  },
  eventTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: publicTheme.textPrimary,
    marginBottom: 14,
    lineHeight: 32,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 10,
  },
  metaText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    color: publicTheme.textSecondary,
  },
  imagem: {
    width: "100%",
    aspectRatio: 16 / 9,
    resizeMode: "cover",
  },
  imagemMapa: {
    width: "100%",
    aspectRatio: 16 / 9,
    resizeMode: "cover",
  },
  produtorHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  produtorNome: {
    fontSize: 18,
    fontWeight: "700",
    color: publicTheme.textPrimary,
    flex: 1,
    paddingRight: 12,
  },
  imagemCabecalho: {
    width: 64,
    height: 44,
    resizeMode: "contain",
    borderRadius: publicTheme.radiusSm,
    backgroundColor: publicTheme.background,
  },
  subtitulo: {
    fontSize: 15,
    lineHeight: 24,
    color: publicTheme.textSecondary,
  },
});
