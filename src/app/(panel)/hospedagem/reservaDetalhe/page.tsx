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
  RefreshControl,
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
  corStatusReserva,
  getReservaAdminDetalhe,
  labelStatusReserva,
  postReenviarLinkPagamentoReserva,
  ReservaAdminDetalhe,
} from "@/src/lib/hospedagemAdmin";
import {
  deveExibirFinanceiroRecepcao,
  obterSaldoPendenteExibicao,
} from "@/src/lib/hospedagemPagamentoRecepcao";
import ResumoFinanceiroRecepcao from "../components/ResumoFinanceiroRecepcao";
import OrigemReservaIndicador from "../components/OrigemReservaIndicador";
import {
  ReceberSaldoHospedagemProvider,
  useReceberSaldoHospedagem,
} from "../contexts/ReceberSaldoHospedagemContext";
import ReceberSaldoHospedagemModal from "../components/ReceberSaldoHospedagemModal";

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

function labelTipoHospede(tipo: string): string {
  if (tipo === "Crianca" || tipo === "crianca") return "Criança";
  return "Adulto";
}

export default function HospedagemReservaDetalhePage() {
  return (
    <ReceberSaldoHospedagemProvider>
      <HospedagemReservaDetalheContent />
      <ReceberSaldoHospedagemModal />
    </ReceberSaldoHospedagemProvider>
  );
}

function HospedagemReservaDetalheContent() {
  const navigation = useNavigation() as any;
  const route = useRoute();
  const { openReceberSaldo } = useReceberSaldoHospedagem();
  const { idReserva } = (route.params || {}) as { idReserva?: number };
  const id = Number(idReserva);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [reserva, setReserva] = useState<ReservaAdminDetalhe | null>(null);
  const [reenviandoLink, setReenviandoLink] = useState(false);
  const [msgLink, setMsgLink] = useState<string | null>(null);

  const carregar = useCallback(
    async (isRefresh = false) => {
      if (!id || !Number.isFinite(id) || id <= 0) {
        setErro("Reserva não encontrada.");
        setReserva(null);
        setLoading(false);
        return;
      }

      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setErro(null);

      try {
        const response = await getReservaAdminDetalhe(id);
        if (!response.success || !response.data) {
          setReserva(null);
          setErro(response.message || "Reserva não encontrada.");
          return;
        }
        setReserva(response.data);
      } catch {
        setReserva(null);
        setErro("Erro ao carregar a reserva.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [id],
  );

  useFocusEffect(
    useCallback(() => {
      carregar(false);
    }, [carregar]),
  );

  const handleReenviarLink = async () => {
    if (!reserva?.id) return;
    setReenviandoLink(true);
    setMsgLink(null);
    try {
      const resp = await postReenviarLinkPagamentoReserva(reserva.id);
      if (!resp.success) {
        setMsgLink(resp.message || "Não foi possível reenviar o link.");
        return;
      }
      if (resp.data) setReserva(resp.data as ReservaAdminDetalhe);
      setMsgLink("Link reenviado ao cliente (WhatsApp/e-mail).");
    } catch {
      setMsgLink("Erro ao reenviar o link.");
    } finally {
      setReenviandoLink(false);
    }
  };

  const status = reserva?.status ?? "Confirmada";
  const cor = corStatusReserva(status);
  const podeReenviarLink =
    (reserva?.statusOriginal === "AguardandoPagamento" ||
      status === "AguardandoPagamento") &&
    Boolean(reserva?.tokenPagamento || reserva?.linkPagamento || reserva?.idTransacao);
  const pagamento = reserva?.pagamento ?? null;
  const totalDescontoReserva = (reserva?.suites ?? []).reduce((sum, suite) => {
    if (
      suite.valorOriginal != null &&
      suite.valorFinal != null &&
      suite.descontoValor != null &&
      suite.descontoValor > 0
    ) {
      return sum + (suite.valorOriginal - suite.valorFinal);
    }
    return sum;
  }, 0);
  const valorOriginalReserva = (reserva?.suites ?? []).reduce((sum, suite) => {
    if (suite.valorOriginal != null && suite.descontoValor != null && suite.descontoValor > 0) {
      return sum + suite.valorOriginal;
    }
    return sum + (suite.valorTotal ?? suite.preco ?? 0);
  }, 0);

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
                <Text style={styles.estadoTexto}>
                  Carregando detalhes da reserva...
                </Text>
              </View>
            ) : erro || !reserva ? (
              <View style={styles.card}>
                <Feather
                  name="alert-circle"
                  size={40}
                  color="#999"
                  style={{ alignSelf: "center", marginBottom: 10 }}
                />
                <Text style={styles.erro}>
                  {erro || "Reserva não encontrada."}
                </Text>
                <TouchableOpacity
                  style={styles.botaoSecundario}
                  onPress={() => navigation.goBack()}
                >
                  <Text style={styles.botaoSecundarioTexto}>Voltar</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <View style={styles.card}>
                  <Text style={styles.titulo}>
                    Reserva #{reserva.numeroReserva || reserva.id}
                  </Text>
                  <View style={[styles.statusBadge, { backgroundColor: cor }]}>
                    <Text style={styles.statusTexto}>
                      {labelStatusReserva(status)}
                    </Text>
                  </View>
                  {podeReenviarLink ? (
                    <TouchableOpacity
                      style={styles.botaoLink}
                      onPress={handleReenviarLink}
                      disabled={reenviandoLink}
                    >
                      {reenviandoLink ? (
                        <ActivityIndicator color={colors.branco} />
                      ) : (
                        <Text style={styles.botaoLinkTexto}>
                          Reenviar link de pagamento
                        </Text>
                      )}
                    </TouchableOpacity>
                  ) : null}
                  {msgLink ? (
                    <Text style={styles.msgLink}>{msgLink}</Text>
                  ) : null}
                  {reserva.linkPagamento ? (
                    <Text style={styles.meta} selectable>
                      {reserva.linkPagamento}
                    </Text>
                  ) : null}
                  {reserva.evento?.nome ? (
                    <Text style={styles.subtitulo}>{reserva.evento.nome}</Text>
                  ) : null}
                  <Text style={styles.responsavel}>
                    {reserva.nomeResponsavel || reserva.responsavel}
                  </Text>
                  {reserva.telefone ? (
                    <Text style={styles.meta}>{reserva.telefone}</Text>
                  ) : null}
                  {reserva.email ? (
                    <Text style={styles.meta}>{reserva.email}</Text>
                  ) : null}
                </View>

                <View style={styles.card}>
                  <Text style={styles.secaoTitulo}>ORIGEM</Text>
                  <OrigemReservaIndicador dados={reserva} variante="detalhe" />
                </View>

                <View style={styles.card}>
                  <Text style={styles.secaoTitulo}>PERÍODO</Text>
                  <Text style={styles.rotulo}>Check-in</Text>
                  <Text style={styles.valor}>
                    {formatDateTime(String(reserva.checkin))}
                  </Text>
                  <Text style={[styles.rotulo, { marginTop: 10 }]}>
                    Check-out
                  </Text>
                  <Text style={styles.valor}>
                    {formatDateTime(String(reserva.checkout))}
                  </Text>
                  <Text style={[styles.valor, { marginTop: 10 }]}>
                    {reserva.noites}{" "}
                    {reserva.noites === 1 ? "diária" : "diárias"}
                  </Text>
                </View>

                <View style={styles.card}>
                  <Text style={styles.secaoTitulo}>SUÍTES E HÓSPEDES</Text>
                  {(reserva.suites ?? []).map((suite) => (
                    <View
                      key={suite.idReservaSuite}
                      style={styles.suiteBlock}
                    >
                      <Text style={styles.suiteNome}>{suite.nome}</Text>
                      <Text style={styles.meta}>
                        {suite.adultos}{" "}
                        {suite.adultos === 1 ? "adulto" : "adultos"}
                        {suite.criancas > 0
                          ? ` · ${suite.criancas} ${
                              suite.criancas === 1 ? "criança" : "crianças"
                            }`
                          : ""}
                      </Text>
                      <Text style={[styles.rotulo, { marginTop: 10 }]}>
                        Hóspedes
                      </Text>
                      {(suite.hospedes ?? []).length === 0 ? (
                        <Text style={styles.valor}>
                          Nenhum hóspede cadastrado.
                        </Text>
                      ) : (
                        suite.hospedes.map((hospede, idx) => (
                          <View
                            key={`${suite.idReservaSuite}-${idx}`}
                            style={styles.hospedeItem}
                          >
                            <Text style={styles.hospedeTipo}>
                              {labelTipoHospede(hospede.tipo)}
                            </Text>
                            <Text style={styles.hospedeNome}>
                              {hospede.nome}
                            </Text>
                          </View>
                        ))
                      )}
                      {suite.valorOriginal != null &&
                      suite.valorFinal != null &&
                      suite.descontoValor != null &&
                      suite.descontoValor > 0 ? (
                        <>
                          <View style={styles.linhaResumo}>
                            <Text style={styles.meta}>Valor original</Text>
                            <Text style={styles.valor}>
                              {formatCurrency(suite.valorOriginal)}
                            </Text>
                          </View>
                          <View style={styles.linhaResumo}>
                            <Text style={styles.meta}>Desconto</Text>
                            <Text style={[styles.valor, { color: "#c0392b" }]}>
                              -
                              {formatCurrency(
                                suite.valorOriginal - (suite.valorFinal ?? 0),
                              )}
                            </Text>
                          </View>
                          <Text style={styles.suiteValor}>
                            Valor final:{" "}
                            {formatCurrency(suite.valorFinal ?? suite.valorTotal ?? suite.preco)}
                          </Text>
                        </>
                      ) : (
                        <Text style={styles.suiteValor}>
                          Valor da suíte:{" "}
                          {formatCurrency(suite.valorTotal ?? suite.preco)}
                        </Text>
                      )}
                    </View>
                  ))}
                </View>

                <View style={styles.card}>
                  <Text style={styles.secaoTitulo}>PAGAMENTO</Text>
                  {totalDescontoReserva > 0 ? (
                    <>
                      <View style={styles.linhaResumo}>
                        <Text style={styles.meta}>Valor original</Text>
                        <Text style={styles.valor}>
                          {formatCurrency(valorOriginalReserva)}
                        </Text>
                      </View>
                      <View style={styles.linhaResumo}>
                        <Text style={styles.meta}>Desconto</Text>
                        <Text style={[styles.valor, { color: "#c0392b" }]}>
                          -{formatCurrency(totalDescontoReserva)}
                        </Text>
                      </View>
                    </>
                  ) : null}
                  <View style={styles.linhaResumo}>
                    <Text style={styles.meta}>Valor da reserva</Text>
                    <Text style={styles.valor}>
                      {formatCurrency(reserva.valorTotal)}
                    </Text>
                  </View>
                  {deveExibirFinanceiroRecepcao(reserva) ? (
                    <ResumoFinanceiroRecepcao
                      dados={reserva}
                      mostrarReceberSaldo
                      onReceberSaldo={() => {
                        openReceberSaldo({
                          idReservaHospedagem: reserva.idReservaHospedagem,
                          saldoPendente: obterSaldoPendenteExibicao(reserva),
                          valorTotal: reserva.valorTotal,
                          valorPago: reserva.valorPago,
                          suiteNome: reserva.suites?.[0]?.nome,
                          responsavel:
                            reserva.responsavel || reserva.nomeResponsavel,
                          onSuccess: () => carregar(true),
                        });
                      }}
                    />
                  ) : null}
                  <View style={styles.linhaResumo}>
                    <Text style={styles.meta}>Subtotal</Text>
                    <Text style={styles.valor}>
                      {formatCurrency(reserva.preco)}
                    </Text>
                  </View>
                  <View style={styles.linhaResumo}>
                    <Text style={styles.meta}>Taxa de serviço</Text>
                    <Text style={styles.valor}>
                      {formatCurrency(reserva.taxaServico)}
                    </Text>
                  </View>
                  <View style={styles.linhaResumo}>
                    <Text style={styles.totalLabel}>Total</Text>
                    <Text style={styles.totalValor}>
                      {formatCurrency(reserva.valorTotal)}
                    </Text>
                  </View>
                  {pagamento ? (
                    <>
                      <Text style={[styles.rotulo, { marginTop: 12 }]}>
                        Status do pagamento
                      </Text>
                      <Text style={styles.valor}>{pagamento.status}</Text>
                      {pagamento.tipoPagamento ? (
                        <>
                          <Text style={[styles.rotulo, { marginTop: 8 }]}>
                            Forma
                          </Text>
                          <Text style={styles.valor}>
                            {pagamento.tipoPagamento}
                          </Text>
                        </>
                      ) : null}
                    </>
                  ) : (
                    <Text style={[styles.meta, { marginTop: 8 }]}>
                      Transação não vinculada.
                    </Text>
                  )}
                </View>

                <View style={styles.card}>
                  <Text style={styles.secaoTitulo}>TIMELINE</Text>
                  {(reserva.timeline ?? []).length === 0 ? (
                    <Text style={styles.valor}>
                      Nenhum histórico registrado.
                    </Text>
                  ) : (
                    (reserva.timeline ?? []).map((evento) => (
                      <View key={String(evento.id)} style={styles.timelineItem}>
                        <Text style={styles.timelineData}>
                          {formatDateTime(String(evento.data))}
                        </Text>
                        <Text style={styles.timelineDesc}>
                          {evento.descricao}
                        </Text>
                        {evento.usuario ? (
                          <Text style={styles.timelineUser}>
                            por {evento.usuario}
                          </Text>
                        ) : null}
                      </View>
                    ))
                  )}
                </View>

                <View style={{ height: 120 }} />
              </>
            )}
          </View>
        </ScrollView>

        {reserva && !loading ? (
          <View style={styles.footer}>
            <TouchableOpacity style={styles.botaoAcao} onPress={() => {}}>
              <Text style={styles.botaoAcaoTexto}>Editar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.botaoAcao, styles.botaoDanger]}
              onPress={() => {}}
            >
              <Text style={styles.botaoAcaoTexto}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.botaoAcao, styles.botaoSuccess]}
              onPress={() => {}}
            >
              <Text style={styles.botaoAcaoTexto}>Check-in</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.botaoAcao, styles.botaoNeutral]}
              onPress={() => {}}
            >
              <Text style={styles.botaoAcaoTexto}>Check-out</Text>
            </TouchableOpacity>
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
  subtitulo: {
    marginTop: 10,
    fontSize: 17,
    fontWeight: "700",
    color: colors.cinza,
  },
  responsavel: {
    marginTop: 6,
    fontSize: 16,
    fontWeight: "600",
    color: colors.cinza,
  },
  statusBadge: {
    alignSelf: "flex-start",
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusTexto: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 13,
  },
  botaoLink: {
    marginTop: 12,
    backgroundColor: colors.azul,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignSelf: "flex-start",
  },
  botaoLinkTexto: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 13,
  },
  msgLink: {
    marginTop: 8,
    fontSize: 13,
    color: colors.azul,
    fontWeight: "600",
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
  suiteBlock: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.line,
    paddingTop: 12,
    marginTop: 8,
  },
  suiteNome: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.cinza,
  },
  suiteValor: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: "600",
    color: colors.cinza,
  },
  hospedeItem: {
    marginTop: 8,
  },
  hospedeTipo: {
    fontSize: 12,
    fontWeight: "600",
    color: "#666",
  },
  hospedeNome: {
    fontSize: 15,
    color: colors.cinza,
  },
  meta: {
    fontSize: 14,
    color: "#555",
    marginTop: 4,
  },
  linhaResumo: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.cinza,
  },
  totalValor: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.cinza,
  },
  timelineItem: {
    borderLeftWidth: 3,
    borderLeftColor: colors.azul,
    paddingLeft: 10,
    marginBottom: 12,
  },
  timelineData: {
    fontSize: 12,
    color: "#777",
  },
  timelineDesc: {
    fontSize: 14,
    color: colors.cinza,
    marginTop: 2,
  },
  timelineUser: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
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
    textAlign: "center",
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
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: "rgba(255,255,255,0.96)",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.line,
  },
  botaoAcao: {
    flexGrow: 1,
    flexBasis: "46%",
    backgroundColor: colors.azul,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    minHeight: 48,
    justifyContent: "center",
  },
  botaoDanger: {
    backgroundColor: "#c0392b",
  },
  botaoSuccess: {
    backgroundColor: colors.greenEscuro,
  },
  botaoNeutral: {
    backgroundColor: "#6b7280",
  },
  botaoAcaoTexto: {
    color: colors.branco,
    fontWeight: "700",
    fontSize: 15,
  },
  botaoSecundario: {
    alignSelf: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: colors.azul,
  },
  botaoSecundarioTexto: {
    color: colors.branco,
    fontWeight: "700",
  },
});
