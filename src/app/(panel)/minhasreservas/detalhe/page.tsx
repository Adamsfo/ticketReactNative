import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "expo-router";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import { parseISO } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import StatusBarPage from "@/src/components/StatusBarPage";
import BarMenu from "@/src/components/BarMenu";
import Footer from "@/src/components/Footer";
import colors from "@/src/constants/colors";
import formatCurrency from "@/src/components/FormatCurrency";
import {
  corStatusReserva,
  labelStatusReserva,
} from "@/src/lib/hospedagemAdmin";
import {
  calcularIdadeEmAnos,
  formatarIdadeAnos,
} from "@/src/lib/hospedagemHospedes";
import {
  getMinhaReservaDetalhe,
  MinhaReservaDetalhe,
} from "@/src/lib/reservaSuite";
import { api } from "@/src/lib/api";

const { width } = Dimensions.get("window");

function toIsoString(valor: string | Date): string {
  if (valor instanceof Date) return valor.toISOString();
  return String(valor);
}

function formatarDataHora(valor: string | Date | null | undefined): string {
  if (!valor) return "—";
  try {
    return formatInTimeZone(
      parseISO(toIsoString(valor)),
      "America/Cuiaba",
      "dd/MM/yyyy 'às' HH:mm",
    );
  } catch {
    return String(valor);
  }
}

function labelTipoHospede(tipo: string): string {
  if (tipo === "Crianca" || tipo === "crianca") return "Criança";
  return "Adulto";
}

function labelSituacaoFinanceira(
  situacao: MinhaReservaDetalhe["financeiro"]["situacaoFinanceira"],
): string {
  switch (situacao) {
    case "Quitada":
      return "Quitada";
    case "Parcial":
      return "Pagamento parcial";
    default:
      return "Pagamento pendente";
  }
}

function resolverUrlImagemEvento(imagem?: string | null): string | null {
  const raw = String(imagem ?? "").trim();
  if (!raw) return null;
  if (/^https?:\/\//i.test(raw)) return raw;
  const base = api.getBaseApi().replace(/\/$/, "");
  const path = raw.startsWith("/") ? raw : `/${raw}`;
  return `${base}${path}`;
}

export default function MinhasReservaDetalhePage() {
  const navigation = useNavigation() as any;
  const route = useRoute();
  const { idReserva } = (route.params || {}) as { idReserva?: number };
  const reservaId = Number(idReserva);

  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [dados, setDados] = useState<MinhaReservaDetalhe | null>(null);

  const carregar = useCallback(async () => {
    if (!Number.isFinite(reservaId) || reservaId <= 0) {
      setDados(null);
      setErro("Reserva não encontrada.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setErro(null);
    setDados(null);

    try {
      const response = await getMinhaReservaDetalhe(reservaId);
      if (!response.success || !response.data) {
        throw new Error(
          response.message || "Não foi possível carregar os detalhes da reserva.",
        );
      }
      setDados(response.data);
    } catch {
      setDados(null);
      setErro("Não foi possível carregar os detalhes da reserva.");
    } finally {
      setLoading(false);
    }
  }, [reservaId]);

  useFocusEffect(
    useCallback(() => {
      carregar();
    }, [carregar]),
  );

  const referenciaIdade = dados?.checkin
    ? (() => {
        try {
          return parseISO(toIsoString(dados.checkin));
        } catch {
          return new Date();
        }
      })()
    : new Date();

  const imagemEvento = resolverUrlImagemEvento(dados?.evento?.imagem);
  const corStatus = dados ? corStatusReserva(dados.status) : colors.cinza;

  const continuarPagamento = () => {
    if (!dados?.tokenPagamento) return;
    navigation.navigate("reserva", { token: dados.tokenPagamento });
  };

  const voltar = () => {
    navigation.navigate("minhasreservas");
  };

  return (
    <LinearGradient
      colors={[colors.white, colors.laranjado]}
      style={{ flex: 1 }}
    >
      <StatusBarPage style="dark" />
      <BarMenu />
      <View style={styles.container}>
        <TouchableOpacity style={styles.voltarBtn} onPress={voltar}>
          <Feather name="arrow-left" size={18} color={colors.azul} />
          <Text style={styles.voltarTexto}>Minhas Reservas</Text>
        </TouchableOpacity>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.content}>
            {loading ? (
              <View style={styles.estadoBox}>
                <ActivityIndicator size="large" color={colors.azul} />
                <Text style={styles.estadoTexto}>
                  Carregando detalhes da reserva...
                </Text>
              </View>
            ) : erro || !dados ? (
              <View style={styles.estadoBox}>
                <Feather name="alert-circle" size={40} color={colors.laranjado} />
                <Text style={styles.estadoTexto}>
                  {erro || "Reserva não encontrada."}
                </Text>
                <TouchableOpacity style={styles.retryBtn} onPress={carregar}>
                  <Text style={styles.retryTexto}>Tentar novamente</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <View style={styles.secao}>
                  <View style={styles.headerRow}>
                    <Text style={styles.tituloReserva}>
                      Reserva #{dados.numeroReserva}
                    </Text>
                    <View
                      style={[styles.statusBadge, { backgroundColor: corStatus }]}
                    >
                      <Text style={styles.statusTexto}>
                        {labelStatusReserva(dados.status)}
                      </Text>
                    </View>
                  </View>
                  {dados.status === "Cancelada" ? (
                    <Text style={styles.avisoCancelada}>
                      Esta reserva foi cancelada.
                    </Text>
                  ) : null}
                  <Text style={styles.metaLinha}>
                    Criada em: {formatarDataHora(dados.dataCriacao)}
                  </Text>
                  {dados.dataConfirmacao ? (
                    <Text style={styles.metaLinha}>
                      Confirmada em:{" "}
                      {formatarDataHora(dados.dataConfirmacao)}
                    </Text>
                  ) : null}
                </View>

                <View style={styles.secao}>
                  <Text style={styles.secaoTitulo}>PERÍODO</Text>
                  <Text style={styles.rotulo}>Check-in</Text>
                  <Text style={styles.valor}>
                    {formatarDataHora(dados.checkin)}
                  </Text>
                  <Text style={[styles.rotulo, { marginTop: 10 }]}>
                    Check-out
                  </Text>
                  <Text style={styles.valor}>
                    {formatarDataHora(dados.checkout)}
                  </Text>
                  <Text style={[styles.valor, { marginTop: 10 }]}>
                    {dados.noites}{" "}
                    {dados.noites === 1 ? "noite" : "noites"}
                  </Text>
                </View>

                <View style={styles.secao}>
                  <Text style={styles.secaoTitulo}>HOSPEDAGEM</Text>
                  {imagemEvento ? (
                    <Image
                      source={{ uri: imagemEvento }}
                      style={styles.imagemEvento}
                      resizeMode="cover"
                    />
                  ) : null}
                  <Text style={styles.eventoNome}>{dados.evento.nome}</Text>
                </View>

                <View style={styles.secao}>
                  <Text style={styles.secaoTitulo}>SUÍTES E HÓSPEDES</Text>
                  {dados.suites.map((suite) => (
                    <View
                      key={suite.idReservaSuite}
                      style={styles.cardSuite}
                    >
                      <Text style={styles.suiteNome}>{suite.nome}</Text>
                      <Text style={styles.suiteMeta}>
                        Código suíte: {suite.idEventoSuite || "—"}
                      </Text>
                      <Text style={styles.suiteMeta}>
                        {suite.adultos}{" "}
                        {suite.adultos === 1 ? "adulto" : "adultos"}
                        {suite.criancas > 0
                          ? ` · ${suite.criancas} ${
                              suite.criancas === 1 ? "criança" : "crianças"
                            }`
                          : ""}
                      </Text>

                      {suite.hospedes.length > 0 ? (
                        <>
                          <Text style={styles.hospedesTitulo}>Hóspedes</Text>
                          {suite.hospedes.map((hospede, index) => {
                            const isCrianca =
                              hospede.tipo === "Crianca" ||
                              hospede.tipo === "crianca";
                            let idadeLabel = "";
                            if (isCrianca && hospede.dataNascimento) {
                              try {
                                const nascimento = parseISO(
                                  toIsoString(hospede.dataNascimento).slice(
                                    0,
                                    10,
                                  ),
                                );
                                idadeLabel = formatarIdadeAnos(
                                  calcularIdadeEmAnos(
                                    nascimento,
                                    referenciaIdade,
                                  ),
                                );
                              } catch {
                                idadeLabel = "";
                              }
                            }

                            return (
                              <View
                                key={`${suite.idReservaSuite}-${index}`}
                                style={styles.hospedeItem}
                              >
                                <Text style={styles.hospedeTipo}>
                                  {labelTipoHospede(hospede.tipo)}
                                </Text>
                                <Text style={styles.hospedeNome}>
                                  {hospede.nome}
                                </Text>
                                {idadeLabel ? (
                                  <Text style={styles.hospedeIdade}>
                                    {idadeLabel}
                                  </Text>
                                ) : null}
                              </View>
                            );
                          })}
                        </>
                      ) : null}
                    </View>
                  ))}
                </View>

                <View style={styles.secao}>
                  <Text style={styles.secaoTitulo}>FINANCEIRO</Text>
                  <View style={styles.linhaResumo}>
                    <Text style={styles.resumoLabel}>Subtotal:</Text>
                    <Text style={styles.resumoValor}>
                      {formatCurrency(dados.preco)}
                    </Text>
                  </View>
                  <View style={styles.linhaResumo}>
                    <Text style={styles.resumoLabel}>Taxa de serviço:</Text>
                    <Text style={styles.resumoValor}>
                      {formatCurrency(dados.taxaServico)}
                    </Text>
                  </View>
                  <View style={styles.linhaResumo}>
                    <Text style={styles.resumoLabel}>Valor total:</Text>
                    <Text style={styles.resumoValor}>
                      {formatCurrency(dados.financeiro.valorTotal)}
                    </Text>
                  </View>
                  <View style={styles.linhaResumo}>
                    <Text style={styles.resumoLabel}>Valor pago:</Text>
                    <Text style={styles.resumoValor}>
                      {formatCurrency(dados.financeiro.valorPago)}
                    </Text>
                  </View>
                  <View style={[styles.linhaResumo, styles.linhaTotal]}>
                    <Text style={styles.totalLabel}>Saldo pendente:</Text>
                    <Text style={styles.totalValor}>
                      {formatCurrency(dados.financeiro.saldoPendente)}
                    </Text>
                  </View>
                  <Text style={[styles.rotulo, { marginTop: 12 }]}>
                    Situação:
                  </Text>
                  <Text style={styles.valor}>
                    {labelSituacaoFinanceira(
                      dados.financeiro.situacaoFinanceira,
                    )}
                  </Text>
                </View>

                {dados.podeContinuarPagamento && dados.tokenPagamento ? (
                  <TouchableOpacity
                    style={styles.btnPagamento}
                    onPress={continuarPagamento}
                  >
                    <Text style={styles.btnPagamentoTexto}>
                      Continuar pagamento
                    </Text>
                  </TouchableOpacity>
                ) : null}

                <View style={styles.acoesFuturas} />
              </>
            )}
          </View>
        </ScrollView>
      </View>
      <Footer />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: Platform.OS === "web" ? 80 : 120,
    paddingHorizontal: Platform.OS === "web" ? (width <= 1000 ? 12 : 24) : 12,
  },
  voltarBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
    alignSelf: "flex-start",
  },
  voltarTexto: {
    color: colors.azul,
    fontWeight: "600",
    fontSize: 15,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 24,
    alignItems: "center",
  },
  content: {
    width: "100%",
    maxWidth: 560,
  },
  estadoBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
    gap: 12,
  },
  estadoTexto: {
    fontSize: 15,
    color: colors.cinza,
    textAlign: "center",
    paddingHorizontal: 16,
  },
  retryBtn: {
    marginTop: 4,
    backgroundColor: colors.azul,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryTexto: {
    color: "#fff",
    fontWeight: "600",
  },
  secao: {
    backgroundColor: "rgba(255,255,255,0.92)",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 18,
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 8,
  },
  tituloReserva: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.cinza,
    flex: 1,
  },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusTexto: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  avisoCancelada: {
    marginTop: 4,
    color: colors.red,
    fontWeight: "600",
  },
  metaLinha: {
    fontSize: 13,
    color: "#667085",
    marginTop: 4,
  },
  secaoTitulo: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.6,
    color: colors.cinza,
    marginBottom: 12,
  },
  rotulo: {
    fontSize: 13,
    color: colors.cinza,
    fontWeight: "600",
  },
  valor: {
    fontSize: 15,
    color: colors.cinza,
    marginTop: 2,
  },
  imagemEvento: {
    width: "100%",
    height: 160,
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: "#e5e7eb",
  },
  eventoNome: {
    fontSize: 17,
    fontWeight: "600",
    color: colors.cinza,
  },
  cardSuite: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#d0d5dd",
    paddingTop: 12,
    marginTop: 12,
  },
  suiteNome: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.cinza,
  },
  suiteMeta: {
    fontSize: 13,
    color: "#667085",
    marginTop: 4,
  },
  hospedesTitulo: {
    marginTop: 10,
    fontSize: 13,
    fontWeight: "700",
    color: colors.cinza,
  },
  hospedeItem: {
    marginTop: 8,
    paddingLeft: 4,
  },
  hospedeTipo: {
    fontSize: 12,
    color: "#667085",
    fontWeight: "600",
  },
  hospedeNome: {
    fontSize: 15,
    color: colors.cinza,
  },
  hospedeIdade: {
    fontSize: 13,
    color: "#667085",
  },
  linhaResumo: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  resumoLabel: {
    fontSize: 14,
    color: "#667085",
  },
  resumoValor: {
    fontSize: 14,
    color: colors.cinza,
    fontWeight: "600",
  },
  linhaTotal: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#d0d5dd",
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.cinza,
  },
  totalValor: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.cinza,
  },
  btnPagamento: {
    backgroundColor: colors.azul,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 12,
  },
  btnPagamentoTexto: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  acoesFuturas: {
    minHeight: 8,
    marginBottom: 16,
  },
});
