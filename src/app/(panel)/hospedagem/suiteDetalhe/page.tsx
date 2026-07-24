import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useFocusEffect } from "expo-router";
import { parseISO } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { Feather } from "@expo/vector-icons";
import StatusBarPage from "@/src/components/StatusBarPage";
import BarMenu from "@/src/components/BarMenu";
import colors from "@/src/constants/colors";
import formatCurrency from "@/src/components/FormatCurrency";
import {
  corStatusSuiteOperacional,
  getSuiteOperacionalDetalhe,
  labelStatusSuiteOperacional,
  SuiteOperacionalCard,
} from "@/src/lib/hospedagemAdmin";

const { width } = Dimensions.get("window");

function formatDateTime(iso?: string | null): string {
  if (!iso) return "—";
  try {
    return formatInTimeZone(
      parseISO(String(iso)),
      "America/Cuiaba",
      "dd/MM/yyyy 'às' HH:mm",
    );
  } catch {
    return String(iso);
  }
}

export default function HospedagemSuiteDetalhePage() {
  const navigation = useNavigation() as any;
  const route = useRoute();
  const { idEventoSuite, dataReferencia } = (route.params || {}) as {
    idEventoSuite?: number;
    dataReferencia?: string;
  };
  const id = Number(idEventoSuite);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [suite, setSuite] = useState<SuiteOperacionalCard | null>(null);

  const carregar = useCallback(
    async (isRefresh = false) => {
      if (!id || !Number.isFinite(id) || id <= 0) {
        setErro("Suíte não encontrada.");
        setSuite(null);
        setLoading(false);
        return;
      }

      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setErro(null);

      try {
        const response = await getSuiteOperacionalDetalhe(
          id,
          dataReferencia || undefined,
        );
        if (!response.success || !response.data) {
          setSuite(null);
          setErro(response.message || "Suíte não encontrada.");
          return;
        }
        setSuite(response.data);
      } catch {
        setSuite(null);
        setErro("Erro ao carregar a suíte.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [id, dataReferencia],
  );

  useFocusEffect(
    useCallback(() => {
      carregar(false);
    }, [carregar]),
  );

  const cor = suite ? corStatusSuiteOperacional(suite.status) : colors.cinza;

  return (
    <LinearGradient
      colors={[colors.branco, colors.laranjado]}
      style={{ flex: 1 }}
    >
      <StatusBarPage style="dark" />
      <BarMenu />

      <View style={styles.container}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => carregar(true)}
            />
          }
        >
          <View style={styles.content}>
            {loading ? (
              <View style={styles.estadoBox}>
                <ActivityIndicator size="large" color={colors.azul} />
                <Text style={styles.estadoTexto}>Carregando suíte...</Text>
              </View>
            ) : erro || !suite ? (
              <View style={styles.card}>
                <Feather
                  name="alert-circle"
                  size={40}
                  color="#999"
                  style={{ alignSelf: "center", marginBottom: 10 }}
                />
                <Text style={styles.erro}>{erro || "Suíte não encontrada."}</Text>
                <TouchableOpacity
                  style={styles.botaoPrimario}
                  onPress={() => navigation.goBack()}
                >
                  <Text style={styles.botaoTexto}>Voltar</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <View style={styles.card}>
                  <Text style={styles.titulo}>{suite.nome}</Text>
                  <View style={[styles.badge, { backgroundColor: cor }]}>
                    <Text style={styles.badgeTexto}>
                      {labelStatusSuiteOperacional(suite.status)}
                    </Text>
                  </View>
                  {suite.eventoNome ? (
                    <Text style={styles.meta}>{suite.eventoNome}</Text>
                  ) : null}
                </View>

                <View style={styles.card}>
                  <Text style={styles.secaoTitulo}>RESUMO</Text>
                  <Text style={styles.rotulo}>Responsável</Text>
                  <Text style={styles.valor}>
                    {suite.responsavel || "—"}
                  </Text>

                  <Text style={[styles.rotulo, { marginTop: 10 }]}>
                    Check-in
                  </Text>
                  <Text style={styles.valor}>
                    {formatDateTime(suite.checkin)}
                  </Text>

                  <Text style={[styles.rotulo, { marginTop: 10 }]}>
                    Check-out
                  </Text>
                  <Text style={styles.valor}>
                    {formatDateTime(suite.checkout)}
                  </Text>

                  <Text style={[styles.rotulo, { marginTop: 10 }]}>
                    Hóspedes
                  </Text>
                  <Text style={styles.valor}>
                    {suite.adultos}{" "}
                    {suite.adultos === 1 ? "adulto" : "adultos"}
                    {suite.criancas > 0
                      ? ` · ${suite.criancas} ${
                          suite.criancas === 1 ? "criança" : "crianças"
                        }`
                      : ""}
                  </Text>

                  <Text style={[styles.rotulo, { marginTop: 10 }]}>Valor</Text>
                  <Text style={styles.valor}>
                    {suite.valorHospedagem != null
                      ? formatCurrency(Number(suite.valorHospedagem))
                      : "—"}
                  </Text>

                  {suite.numeroReserva ? (
                    <>
                      <Text style={[styles.rotulo, { marginTop: 10 }]}>
                        Reserva vinculada
                      </Text>
                      <Text style={styles.valor}>#{suite.numeroReserva}</Text>
                    </>
                  ) : null}
                </View>

                {/* Preparado para ações futuras — não implementadas */}
                <View style={styles.card}>
                  <Text style={styles.secaoTitulo}>AÇÕES (EM BREVE)</Text>
                  <Text style={styles.meta}>
                    Check-in, check-out, limpeza, manutenção, bloqueio e
                    calendário serão adicionados nas próximas etapas.
                  </Text>
                </View>

                <View style={{ height: 120 }} />
              </>
            )}
          </View>
        </ScrollView>

        {suite && !loading ? (
          <View style={styles.footer}>
            {suite.idReservaHospedagem ? (
              <TouchableOpacity
                style={styles.botaoPrimarioFooter}
                onPress={() =>
                  navigation.navigate("hospedagemReservaDetalhe", {
                    idReserva: suite.idReservaHospedagem,
                  })
                }
              >
                <Text style={styles.botaoTexto}>Ver reserva</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.botaoPrimarioFooter, styles.botaoSecundario]}
                onPress={() => navigation.goBack()}
              >
                <Text style={styles.botaoTexto}>Voltar</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : null}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: Platform.OS === "web" ? 80 : 120,
  },
  scrollContent: {
    paddingHorizontal: 12,
    alignItems: "center",
    paddingBottom: 24,
  },
  content: {
    width: "100%",
    maxWidth: 560,
  },
  card: {
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  titulo: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.cinza,
  },
  badge: {
    alignSelf: "flex-start",
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  badgeTexto: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 13,
  },
  secaoTitulo: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.6,
    color: colors.cinza,
    marginBottom: 10,
  },
  rotulo: {
    fontSize: 13,
    fontWeight: "600",
    color: "#666",
  },
  valor: {
    fontSize: 15,
    color: colors.cinza,
    marginTop: 2,
  },
  meta: {
    marginTop: 8,
    fontSize: 14,
    color: "#555",
  },
  estadoBox: {
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 16,
    padding: 28,
    alignItems: "center",
    minHeight: 160,
    justifyContent: "center",
  },
  estadoTexto: {
    marginTop: 12,
    fontSize: 15,
    color: colors.cinza,
  },
  erro: {
    textAlign: "center",
    fontSize: 15,
    color: colors.cinza,
    marginBottom: 16,
  },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: "rgba(255,255,255,0.96)",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.line,
  },
  botaoPrimario: {
    alignSelf: "center",
    backgroundColor: colors.azul,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    minHeight: 48,
    justifyContent: "center",
  },
  botaoPrimarioFooter: {
    backgroundColor: colors.azul,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    minHeight: 48,
    justifyContent: "center",
  },
  botaoSecundario: {
    backgroundColor: colors.cinza,
  },
  botaoTexto: {
    color: colors.branco,
    fontWeight: "700",
    fontSize: 15,
  },
});
