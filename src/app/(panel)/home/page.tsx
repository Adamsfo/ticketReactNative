import React, { useState, useCallback } from "react";
import {
  Text,
  StyleSheet,
  Modal,
  Platform,
  View,
  Image,
  useWindowDimensions,
  ActivityIndicator,
} from "react-native";
import ModalMsg from "@/src/components/ModalMsg";
import CardEvento from "@/src/components/CardEvento";
import { FlatList } from "react-native-gesture-handler";
import colors from "@/src/constants/colors";
import { useNavigation } from "@react-navigation/native";
import { apiGeral } from "@/src/lib/geral";
import {
  Evento,
  EventoIngresso,
  QueryParams,
  TipoEvento,
} from "@/src/types/geral";
import { useFocusEffect } from "expo-router";
import CardParceiro from "@/src/components/CardParceiro";
import { getMenorValorFinalIngressos } from "@/src/lib/ingressoPricing";
import { getMenorValorPousadaHome } from "@/src/lib/reservaSuite";
import PublicShopLayout from "@/src/components/public/PublicShopLayout";
import PublicShopFooter from "@/src/components/public/PublicShopFooter";
import { publicTheme } from "@/src/constants/publicTheme";

export default function Index() {
  const endpointApi = "/evento";
  const endpointApiIngressos = "/eventoingresso";
  const [visibleMsg, setVisibleMsg] = useState(false);
  const navigation = useNavigation() as any;
  const [registros, setRegistros] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);
  const { width } = useWindowDimensions();

  const horizontalPadding = width >= 768 ? 24 : 12;
  const isMobileHome = width < 768;
  const listPaddingX = isMobileHome
    ? horizontalPadding
    : horizontalPadding - 8;
  const numColumns = width >= 1200 ? 3 : width >= 700 ? 2 : 1;
  const cardGutter = 16;
  const cardWidth = Math.min(
    380,
    isMobileHome && numColumns === 1
      ? width - horizontalPadding * 2 - cardGutter
      : (width - horizontalPadding * 2 - 16 * numColumns) / numColumns,
  );

  const getRegistros = async (params: QueryParams) => {
    setLoading(true);
    const response = await apiGeral.getResource<Evento>(endpointApi, {
      ...params,
      pageSize: 200,
    });
    const registrosData = response.data ?? [];

    for (let i = 0; i < registrosData.length; i++) {
      const evento = registrosData[i];

      try {
        if (evento.tipo === TipoEvento.Pousada) {
          evento.MenorValor = await getMenorValorPousadaHome(evento.id);
        } else {
          evento.MenorValor = await getMenorValor({
            filters: { idEvento: evento.id, status: "Ativo" },
          });
        }
      } catch (error) {
        console.error(
          `Erro ao obter menor valor do evento ${evento.id}:`,
          error,
        );
      }
    }

    setRegistros(registrosData);
    setLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      getRegistros({ filters: { status: "Ativo" } });
    }, []),
  );

  const getMenorValor = async (params: QueryParams) => {
    const response = await apiGeral.getResource<EventoIngresso>(
      endpointApiIngressos,
      { ...params, pageSize: 200 },
    );
    const registrosData = response.data ?? [];
    return getMenorValorFinalIngressos(registrosData);
  };

  const registrosParceiros = [
    {
      id: 2,
      imagem: require("../../../assets/JangoAventura.png"),
      link: "https://jangoaventura.com.br/",
      nome: "Jango Aventura",
    },
  ];

  const renderEventCard = (item: Evento) => (
    <CardEvento
      data={item}
      onPress={() => {
        navigation.navigate("evento", { id: item.id });
      }}
      widthCardItem={cardWidth}
      centeredOnNarrowScreen={isMobileHome}
      uniformDesktop={!isMobileHome}
    />
  );

  const renderDesktopEvents = () => (
    <View
      style={[styles.desktopEventRow, { paddingHorizontal: listPaddingX }]}
    >
      {registros.map((item) => (
        <View
          key={item.id.toString()}
          style={[styles.desktopEventItem, { width: cardWidth + cardGutter }]}
        >
          {renderEventCard(item)}
        </View>
      ))}
    </View>
  );

  const renderListHeader = () => (
  <>
      {renderHero()}
      {!isMobileHome && registros.length > 0 ? renderDesktopEvents() : null}
      {!isMobileHome && !loading && registros.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>Nenhum evento encontrado</Text>
          <Text style={styles.emptyText}>
            Não há eventos ativos no momento.
          </Text>
        </View>
      ) : null}
  </>
  );

  const renderHero = () => (
    <View style={styles.heroSection}>
      <View style={[styles.bannerWrap, { paddingHorizontal: horizontalPadding }]}>
        <View style={styles.bannerContainer}>
          <Image
            source={require("../../../assets/banners/BannerEditado2.png")}
            style={styles.bannerImage}
          />
        </View>
        <View
          style={[
            styles.heroIntroCard,
            { marginHorizontal: horizontalPadding > 12 ? 8 : 0 },
          ]}
        >
          <Text style={styles.heroTitle}>Encontre seu próximo evento</Text>
          <Text style={styles.heroSubtitle}>
            Ingressos e hospedagem em um só lugar — tudo pelo Jango.
          </Text>
        </View>
      </View>

      <View style={[styles.sectionHeader, { paddingHorizontal: horizontalPadding }]}>
        <Text style={styles.sectionTitle}>Eventos em destaque</Text>
        {loading ? (
          <Text style={styles.sectionMeta}>Carregando…</Text>
        ) : null}
      </View>
    </View>
  );

  return (
    <PublicShopLayout>
      <View style={styles.listWrap}>
        {loading && registros.length === 0 ? (
          <View style={styles.loadingBox}>
            {renderHero()}
            <ActivityIndicator size="large" color={colors.laranjado} />
          </View>
        ) : (
          <FlatList
            data={isMobileHome ? registros : []}
            key={isMobileHome ? `cols-${numColumns}` : "home-desktop"}
            keyExtractor={(item) => item.id.toString()}
            numColumns={isMobileHome ? numColumns : 1}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingBottom: 32,
              paddingHorizontal: isMobileHome ? listPaddingX : 0,
            }}
            columnWrapperStyle={
              isMobileHome && numColumns > 1 ? styles.columnWrapper : undefined
            }
            ListHeaderComponent={renderListHeader}
            ListEmptyComponent={
              isMobileHome && !loading ? (
                <View style={styles.empty}>
                  <Text style={styles.emptyTitle}>Nenhum evento encontrado</Text>
                  <Text style={styles.emptyText}>
                    Não há eventos ativos no momento.
                  </Text>
                </View>
              ) : null
            }
            ListFooterComponent={
              <>
                <View
                  style={[
                    styles.sectionHeader,
                    { paddingHorizontal: listPaddingX },
                  ]}
                >
                  <Text style={styles.sectionTitle}>Parceiros</Text>
                </View>
                <View
                  style={[
                    styles.partnersRow,
                    numColumns > 1 && styles.columnWrapper,
                    { paddingHorizontal: listPaddingX },
                  ]}
                >
                  {registrosParceiros.map((item) => (
                    <CardParceiro
                      key={item.id}
                      imagem={item.imagem}
                      widthCardItem={cardWidth}
                      nome={item.nome}
                      link={item.link}
                    />
                  ))}
                </View>
                <PublicShopFooter variant="brand" />
              </>
            }
            renderItem={({ item }) => {
              const card = renderEventCard(item);
              if (numColumns === 1) {
                return <View style={styles.eventItemCentered}>{card}</View>;
              }
              return <View style={styles.eventItemGrid}>{card}</View>;
            }}
          />
        )}
      </View>

      <Modal visible={visibleMsg} transparent animationType="slide">
        <ModalMsg onClose={() => setVisibleMsg(false)} />
      </Modal>
    </PublicShopLayout>
  );
}

const styles = StyleSheet.create({
  listWrap: {
    flex: 1,
  },
  loadingBox: {
    flex: 1,
    paddingBottom: 48,
  },
  heroSection: {
    marginBottom: 8,
  },
  bannerWrap: {
    marginBottom: 8,
  },
  bannerContainer: {
    width: "100%",
    height: Platform.OS === "web" ? 340 : 230,
    overflow: "hidden",
    borderRadius: publicTheme.radiusXl,
    backgroundColor: colors.zinc,
    ...Platform.select({
      web: {
        shadowColor: publicTheme.shadow,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 1,
        shadowRadius: 20,
      },
      default: { elevation: 4 },
    }),
  },
  bannerImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  heroIntroCard: {
    marginTop: -20,
    backgroundColor: publicTheme.surface,
    borderRadius: publicTheme.radiusLg,
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderWidth: 1,
    borderColor: publicTheme.border,
    ...Platform.select({
      web: {
        shadowColor: publicTheme.shadow,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 1,
        shadowRadius: 16,
      },
      default: { elevation: 3 },
    }),
  },
  heroTitle: {
    fontSize: Platform.OS === "web" ? 28 : 22,
    fontWeight: "800",
    color: colors.zinc,
    marginBottom: 6,
  },
  heroSubtitle: {
    fontSize: 15,
    color: publicTheme.textSecondary,
    fontWeight: "500",
    lineHeight: 22,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    marginBottom: 8,
    flexWrap: "wrap",
    gap: 8,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.zinc,
  },
  sectionMeta: {
    fontSize: 14,
    color: colors.cinza,
    fontWeight: "600",
  },
  eventItemCentered: {
    width: "100%",
    alignItems: "center",
  },
  eventItemGrid: {
    flex: 1,
    alignItems: "center",
  },
  desktopEventRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "stretch",
    gap: 16,
    width: "100%",
    maxWidth: publicTheme.contentMaxWidth,
    alignSelf: "center",
    marginBottom: 8,
  },
  desktopEventItem: {
    alignSelf: "stretch",
  },
  columnWrapper: {
    justifyContent: "center",
    gap: 0,
    width: "100%",
  },
  partnersRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
  },
  empty: {
    paddingVertical: 40,
    paddingHorizontal: 24,
    alignItems: "center",
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.zinc,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: colors.cinza,
    textAlign: "center",
  },
});
