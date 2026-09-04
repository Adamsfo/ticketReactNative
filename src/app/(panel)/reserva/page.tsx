import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useFocusEffect } from "expo-router";
import { parseISO } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import StatusBarPage from "@/src/components/StatusBarPage";
import BarMenu from "@/src/components/BarMenu";
import colors from "@/src/constants/colors";
import formatCurrency from "@/src/components/FormatCurrency";
import StepIndicatorHospedagem from "@/src/components/StepIndicatorHospedagem";
import { getReservaPublicaPorToken } from "@/src/lib/hospedagemAdmin";
import {
  corStatusReserva,
  labelStatusReserva,
} from "@/src/lib/hospedagemAdmin";
import { useAuth } from "@/src/contexts_/AuthContext";
import { useCart } from "@/src/contexts_/CartContext";
import { apiAuth } from "@/src/lib/auth";
import { Transacao, Usuario } from "@/src/types/geral";

const { width } = Dimensions.get("window");

function formatDateTime(iso: string): string {
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

/**
 * Página pública /reserva/TOKEN — resume a reserva, magic login e pagamento.
 */
export default function ReservaPublicaPage() {
  const navigation = useNavigation() as any;
  const route = useRoute();
  const { user, setAuth } = useAuth();
  const { dispatch: dispatchCart } = useCart();
  const params = (route.params || {}) as { token?: string };

  const tokenFromUrl = (() => {
    if (Platform.OS === "web" && typeof window !== "undefined") {
      const match = window.location.pathname.match(/\/reserva\/([^/?#]+)/i);
      if (match?.[1]) return match[1];
    }
    return "";
  })();

  const token = String(params.token || tokenFromUrl || "").trim();

  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [conflitoConta, setConflitoConta] = useState<string | null>(null);
  const [avisoAutenticacao, setAvisoAutenticacao] = useState<string | null>(
    null,
  );
  const [magicLoginOk, setMagicLoginOk] = useState(false);
  const [data, setData] = useState<any | null>(null);

  const resolverUsuarioSessao = useCallback(async (): Promise<Usuario | null> => {
    if (user?.id) {
      return user;
    }
    return apiAuth.carregarUsuarioDaSessaoArmazenada();
  }, [user]);

  const tentarMagicLogin = useCallback(
    async (reservaData: any) => {
      setConflitoConta(null);
      setAvisoAutenticacao(null);
      setMagicLoginOk(false);

      const idUsuarioReserva = Number(reservaData?.cliente?.idUsuario);
      const usuarioAtual = await resolverUsuarioSessao();

      if (
        usuarioAtual?.id &&
        Number.isFinite(idUsuarioReserva) &&
        idUsuarioReserva > 0 &&
        Number(usuarioAtual.id) !== idUsuarioReserva
      ) {
        setConflitoConta(
          "Este link pertence a outra conta. Para pagar com segurança, saia da conta atual e abra o link novamente, ou entre com a conta correta.",
        );
        return;
      }

      if (
        usuarioAtual?.id &&
        Number.isFinite(idUsuarioReserva) &&
        idUsuarioReserva > 0 &&
        Number(usuarioAtual.id) === idUsuarioReserva
      ) {
        setAuth(usuarioAtual);
        setMagicLoginOk(true);
        return;
      }

      const authResp = await apiAuth.autenticarReservaPublica(token);
      if (!authResp.success) {
        setAvisoAutenticacao(
          authResp.message ||
            "Não foi possível iniciar sua sessão para pagamento.",
        );
        return;
      }

      const usuario = await apiAuth.carregarUsuarioDaSessaoArmazenada();
      if (!usuario?.id || !usuario.ativo) {
        setAvisoAutenticacao(
          "Não foi possível recuperar sua conta para pagamento.",
        );
        return;
      }

      setAuth(usuario);
      setMagicLoginOk(true);
    },
    [token, resolverUsuarioSessao, setAuth],
  );

  const carregar = useCallback(async () => {
    if (!token) {
      setErro("Link inválido.");
      setData(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setErro(null);
    setConflitoConta(null);
    setAvisoAutenticacao(null);
    try {
      const resp = await getReservaPublicaPorToken(token);
      if (!resp.success || !resp.data) {
        setErro(resp.message || "Reserva não encontrada.");
        setData(null);
        return;
      }
      setData(resp.data);
      await tentarMagicLogin(resp.data);
    } catch {
      setErro("Erro ao carregar a reserva.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [token, tentarMagicLogin]);

  useFocusEffect(
    useCallback(() => {
      carregar();
    }, [carregar]),
  );

  const handlePagar = () => {
    if (conflitoConta || !magicLoginOk) {
      return;
    }
    if (data?.expirada || data?.status === "Expirada" || !data?.podePagar) {
      return;
    }
    const registroApi = data?.pagamento?.registroTransacao;
    const idTransacao = Number(registroApi?.id);
    if (!Number.isFinite(idTransacao) || idTransacao <= 0) {
      return;
    }
    if (!data?.pagamento?.idEvento) {
      return;
    }

    if (registroApi && typeof registroApi === "object") {
      const transacao: Transacao = {
        ...(registroApi as Transacao),
        id: idTransacao,
      };
      dispatchCart({ type: "ADD_TRANSACAO", transacao });
    }

    navigation.navigate("pagamento", {
      idEvento: Number(data.pagamento.idEvento),
      registroTransacao: idTransacao,
      tipoCompra: "hospedagem",
    });
  };

  const status = data?.status || "AguardandoPagamento";
  const cor = corStatusReserva(status);
  const podeIrPagamento =
    !!data?.podePagar && magicLoginOk && !conflitoConta && !avisoAutenticacao;

  return (
    <LinearGradient
      colors={[colors.branco, colors.laranjado]}
      style={{ flex: 1 }}
    >
      <StatusBarPage style="dark" />
      <BarMenu />

      <View style={styles.container}>
        <StepIndicatorHospedagem currentStep={3} />
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
        >
          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color={colors.azul} />
              <Text style={styles.centerText}>Carregando reserva...</Text>
            </View>
          ) : erro || !data ? (
            <View style={styles.card}>
              <Text style={styles.erro}>{erro || "Reserva não encontrada."}</Text>
            </View>
          ) : (
            <>
              {conflitoConta ? (
                <View style={styles.card}>
                  <Text style={styles.erro}>{conflitoConta}</Text>
                </View>
              ) : null}
              {avisoAutenticacao ? (
                <View style={styles.card}>
                  <Text style={styles.erro}>{avisoAutenticacao}</Text>
                </View>
              ) : null}

              <View style={styles.card}>
                <Text style={styles.titulo}>
                  {data.evento?.nome || "Pousada"}
                </Text>
                <View style={[styles.badge, { backgroundColor: cor }]}>
                  <Text style={styles.badgeText}>
                    {labelStatusReserva(status)}
                  </Text>
                </View>
                <Text style={styles.label}>Cliente</Text>
                <Text style={styles.valor}>{data.cliente?.nome || "—"}</Text>
              </View>

              <View style={styles.card}>
                <Text style={styles.secao}>Período</Text>
                <Text style={styles.label}>Check-in</Text>
                <Text style={styles.valor}>
                  {formatDateTime(String(data.periodo?.checkin))}
                </Text>
                <Text style={[styles.label, { marginTop: 8 }]}>Check-out</Text>
                <Text style={styles.valor}>
                  {formatDateTime(String(data.periodo?.checkout))}
                </Text>
                <Text style={[styles.valor, { marginTop: 8 }]}>
                  {data.periodo?.noites}{" "}
                  {data.periodo?.noites === 1 ? "diária" : "diárias"}
                </Text>
              </View>

              <View style={styles.card}>
                <Text style={styles.secao}>Suíte e hóspedes</Text>
                {(data.suites || []).map((suite: any, idx: number) => (
                  <View key={`${suite.nome}-${idx}`} style={{ marginBottom: 10 }}>
                    <Text style={styles.valor}>{suite.nome}</Text>
                    <Text style={styles.meta}>
                      {suite.adultos} adulto(s)
                      {suite.criancas > 0
                        ? ` · ${suite.criancas} criança(s)`
                        : ""}
                    </Text>
                  </View>
                ))}
                <Text style={styles.meta}>
                  Total: {data.hospedes?.adultos || 0} adulto(s)
                  {(data.hospedes?.criancas || 0) > 0
                    ? `, ${data.hospedes.criancas} criança(s)`
                    : ""}
                </Text>
              </View>

              <View style={styles.card}>
                <Text style={styles.secao}>Valores</Text>
                <View style={styles.row}>
                  <Text style={styles.meta}>Valor da hospedagem</Text>
                  <Text style={styles.valor}>
                    {formatCurrency(Number(data.valores?.preco ?? 0))}
                  </Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.meta}>Taxa de serviço</Text>
                  <Text style={styles.valor}>
                    {formatCurrency(Number(data.valores?.taxaServico ?? 0))}
                  </Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.label}>Total</Text>
                  <Text style={[styles.valor, { color: colors.azul }]}>
                    {formatCurrency(Number(data.valores?.valorTotal ?? 0))}
                  </Text>
                </View>
              </View>

              {podeIrPagamento ? (
                <TouchableOpacity style={styles.btnPri} onPress={handlePagar}>
                  <Text style={styles.btnPriText}>Ir para o pagamento</Text>
                </TouchableOpacity>
              ) : data.podePagar ? (
                <View style={styles.card}>
                  <Text style={styles.meta}>
                    {loading
                      ? "Preparando pagamento..."
                      : "Aguardando autenticação para prosseguir ao pagamento."}
                  </Text>
                </View>
              ) : (
                <View style={styles.card}>
                  {data.expirada || status === "Expirada" ? (
                    <>
                      <Text style={styles.expiradaTitulo}>
                        Esta reserva expirou por falta de pagamento.
                      </Text>
                      <Text style={[styles.meta, { marginTop: 8 }]}>
                        A suíte já foi liberada para novas reservas.
                      </Text>
                      <Text style={[styles.meta, { marginTop: 8 }]}>
                        Caso ainda tenha interesse, faça uma nova reserva.
                      </Text>
                    </>
                  ) : (
                    <Text style={styles.meta}>
                      {status === "Confirmada"
                        ? "Esta reserva já foi confirmada."
                        : "Esta reserva não está disponível para pagamento."}
                    </Text>
                  )}
                </View>
              )}
            </>
          )}
          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: Platform.OS === "web" ? 80 : 120,
    marginHorizontal: Platform.OS === "web" ? (width <= 1000 ? 8 : "10%") : 8,
  },
  scroll: { paddingBottom: 24 },
  center: { alignItems: "center", marginTop: 40, gap: 12 },
  centerText: { color: colors.cinza },
  card: {
    backgroundColor: "rgba(255,255,255,0.92)",
    borderRadius: 16,
    padding: 16,
    marginTop: 12,
  },
  titulo: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.azul,
    marginBottom: 8,
  },
  badge: {
    alignSelf: "flex-start",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 10,
  },
  badgeText: { color: "#fff", fontWeight: "700", fontSize: 12 },
  secao: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.cinza,
    marginBottom: 8,
    letterSpacing: 0.4,
  },
  label: { fontSize: 13, fontWeight: "700", color: colors.cinza },
  valor: { fontSize: 16, fontWeight: "600", color: "#222" },
  meta: { fontSize: 14, color: colors.cinza },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 6,
  },
  erro: { color: colors.red, textAlign: "center" },
  expiradaTitulo: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.red,
    textAlign: "center",
  },
  btnPri: {
    marginTop: 16,
    backgroundColor: colors.azul,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  btnPriText: { color: "#fff", fontWeight: "800", fontSize: 16 },
});
