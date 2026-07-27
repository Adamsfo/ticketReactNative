import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import { parseISO } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import colors from "@/src/constants/colors";
import formatCurrency from "@/src/components/FormatCurrency";
import {
  getReservaAdminDetalhe,
  ReservaAdminDetalhe,
} from "@/src/lib/hospedagemAdmin";
import {
  CORES_STATUS_OPERACIONAL,
  corStatusOperacionalPadrao,
  executarCheckinOperacional,
  executarCheckoutOperacional,
  formatDateTimeHospedagem,
  labelStatusOperacionalPadrao,
  ReservaOperacaoRef,
} from "@/src/lib/hospedagemOperacao";
import {
  calcularIdadeEmAnos,
  formatarIdadeAnos,
} from "@/src/lib/hospedagemHospedes";
import { HOSPEDAGEM_TZ } from "@/src/lib/hospedagemStatusOperacional";
import { useHospedagemAdminRefresh } from "../contexts/HospedagemAdminRefreshContext";
import { useNovaReservaRecepcao } from "../contexts/NovaReservaRecepcaoContext";
import { useReceberSaldoHospedagem } from "../contexts/ReceberSaldoHospedagemContext";
import {
  bloqueiaCheckinPorSaldoPendente,
  MSG_CHECKIN_BLOQUEADO_SALDO,
  obterSaldoPendenteExibicao,
} from "@/src/lib/hospedagemPagamentoRecepcao";
import ResumoFinanceiroRecepcao from "./ResumoFinanceiroRecepcao";
import OrigemReservaIndicador from "./OrigemReservaIndicador";

type HospedeConferencia = {
  key: string;
  nome: string;
  rotulo: string;
  emoji: string;
  isCrianca: boolean;
  dataNascimento?: string | null;
};

type Props = {
  reserva: ReservaOperacaoRef | null;
  visible: boolean;
  onClose: () => void;
  /** YYYY-MM-DD da operação (Agenda/Suítes). Default = hoje. */
  dataReferencia?: string | null;
};

type ConfirmMode = "checkin" | "checkout" | null;

/**
 * Sheet operacional compartilhado (Agenda + Suítes).
 * Parte 7: estado/ações via SuiteDisponibilidadeService (`detalhe.disponibilidade`).
 * Sem regras locais de disponibilidade — apenas renderiza o retorno da API.
 */
export default function ReservaOperacaoSheet({
  reserva,
  visible,
  onClose,
  dataReferencia,
}: Props) {
  const navigation = useNavigation() as any;
  const { notifyOperacaoConcluida, refreshVersion } =
    useHospedagemAdminRefresh();
  const { openNovaReserva } = useNovaReservaRecepcao();
  const { openReceberSaldo } = useReceberSaldoHospedagem();
  const [detalhe, setDetalhe] = useState<ReservaAdminDetalhe | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirmMode, setConfirmMode] = useState<ConfirmMode>(null);
  const [executando, setExecutando] = useState(false);
  const [erroAcao, setErroAcao] = useState<string | null>(null);

  const hojeOperacao = useMemo(
    () => formatInTimeZone(new Date(), HOSPEDAGEM_TZ, "yyyy-MM-dd"),
    [],
  );
  const dataSelecionada = dataReferencia || hojeOperacao;

  useEffect(() => {
    if (!visible || !reserva?.idReservaHospedagem) {
      setDetalhe(null);
      setConfirmMode(null);
      setErroAcao(null);
      return;
    }

    let cancelado = false;
    setLoading(true);
    setErroAcao(null);

    getReservaAdminDetalhe(reserva.idReservaHospedagem, dataSelecionada)
      .then((resp) => {
        if (!cancelado && resp.success && resp.data) {
          setDetalhe(resp.data);
        }
      })
      .finally(() => {
        if (!cancelado) setLoading(false);
      });

    return () => {
      cancelado = true;
    };
  }, [
    visible,
    reserva?.idReservaHospedagem,
    dataSelecionada,
    refreshVersion,
  ]);

  const statusDb =
    detalhe?.status ?? reserva?.statusReserva ?? reserva?.status ?? "";
  const checkinIso = detalhe?.checkin ?? reserva?.inicio ?? "";
  const checkoutIso =
    detalhe?.dataHoraCheckoutRealizado ??
    detalhe?.checkout ??
    reserva?.fim ??
    "";

  /** Lista plana na ordem de cadastro (suítes → hóspedes por id). */
  const hospedesConferencia = useMemo((): HospedeConferencia[] => {
    const suites = detalhe?.suites ?? [];
    const lista: HospedeConferencia[] = [];
    let nAdulto = 0;
    let nCrianca = 0;
    suites.forEach((suite) => {
      (suite.hospedes ?? []).forEach((h, hIdx) => {
        const tipo = String(h.tipo || "").toLowerCase();
        const isCrianca =
          tipo === "crianca" || tipo === "criança" || tipo.includes("crianc");
        if (isCrianca) {
          nCrianca += 1;
          lista.push({
            key: `${suite.idReservaSuite}-${h.id ?? hIdx}-c`,
            nome: h.nome,
            rotulo: `Criança ${nCrianca}`,
            emoji: "🧒",
            isCrianca: true,
            dataNascimento: h.dataNascimento,
          });
        } else {
          nAdulto += 1;
          lista.push({
            key: `${suite.idReservaSuite}-${h.id ?? hIdx}-a`,
            nome: h.nome,
            rotulo: `Adulto ${nAdulto}`,
            emoji: "👤",
            isCrianca: false,
            dataNascimento: h.dataNascimento,
          });
        }
      });
    });
    return lista;
  }, [detalhe?.suites]);

  const referenciaIdade = useMemo(() => {
    if (checkinIso) {
      try {
        return parseISO(String(checkinIso));
      } catch {
        /* fallthrough */
      }
    }
    return new Date();
  }, [checkinIso]);

  const disp = detalhe?.disponibilidade ?? null;

  // Status de exibição: serviço para operação; terminais da reserva (histórico).
  const statusOp = useMemo(() => {
    if (
      statusDb === "CheckOutRealizado" ||
      statusDb === "CheckoutRealizado"
    ) {
      return "CHECKOUT_REALIZADO";
    }
    if (statusDb === "Cancelada") return "CANCELADA";
    if (statusDb === "Expirada") return "EXPIRADA";
    return (disp?.badge || "LIVRE").toUpperCase();
  }, [statusDb, disp?.badge]);

  const badgeLabel =
    statusOp === "CHECKOUT_REALIZADO"
      ? "Check-out realizado"
      : statusOp === "CANCELADA"
        ? "Cancelada"
        : statusOp === "EXPIRADA"
          ? "Expirada"
          : disp?.badgeLabel || labelStatusOperacionalPadrao(statusOp);

  const mensagemOp = disp?.mensagem ?? null;
  const mensagemOpSec = disp?.mensagemSecundaria ?? null;

  // podeCheckin/podeCheckout do serviço já exigem dataSelecionada === hoje (§7).
  const mostrarBotaoCheckin = Boolean(disp?.podeCheckin);
  const mostrarBotaoCheckout = Boolean(disp?.podeCheckout);
  const mostrarNovaReserva = disp?.botaoPrincipal === "nova_reserva";
  const mostrarVerReserva = Boolean(reserva?.idReservaHospedagem);

  const dadosFinanceirosCheckin = detalhe ?? {
    valorTotal: reserva?.valorTotal,
    valorPago: reserva?.valorPago,
    saldoPendente: reserva?.saldoPendente,
  };
  const bloqueadoPorSaldo = bloqueiaCheckinPorSaldoPendente(
    dadosFinanceirosCheckin,
  );

  const podeExecutarCheckin =
    mostrarBotaoCheckin &&
    !bloqueadoPorSaldo &&
    !executando &&
    !loading;
  const podeExecutarCheckout = mostrarBotaoCheckout && !executando;

  if (!reserva) return null;

  const corStatus = corStatusOperacionalPadrao(statusOp);
  const adultos = detalhe?.suites?.[0]?.adultos ?? reserva.adultos ?? 0;
  const criancas = detalhe?.suites?.[0]?.criancas ?? reserva.criancas ?? 0;
  const valor = detalhe?.valorTotal ?? reserva.valorTotal;
  const responsavel =
    detalhe?.responsavel ??
    detalhe?.nomeResponsavel ??
    reserva.responsavel;

  const abrirReserva = () => {
    onClose();
    navigation.navigate("hospedagemReservaDetalhe", {
      idReserva: reserva.idReservaHospedagem,
    });
  };

  const abrirNovaReserva = () => {
    if (!reserva.idEvento) {
      onClose();
      return;
    }
    onClose();
    openNovaReserva({
      idEvento: reserva.idEvento,
      idEventoSuite: reserva.idEventoSuite ?? undefined,
      checkinDate: dataSelecionada,
    });
  };

  const confirmarOperacao = async () => {
    if (!reserva.idReservaHospedagem || !confirmMode) return;
    const mode = confirmMode;
    if (mode === "checkin" && bloqueadoPorSaldo) {
      setConfirmMode(null);
      setErroAcao(MSG_CHECKIN_BLOQUEADO_SALDO);
      return;
    }
    setExecutando(true);
    setErroAcao(null);
    try {
      const resp =
        mode === "checkin"
          ? await executarCheckinOperacional(reserva.idReservaHospedagem)
          : await executarCheckoutOperacional(reserva.idReservaHospedagem);

      if (!resp.success) {
        setErroAcao(
          resp.message ||
            (mode === "checkin"
              ? "Não foi possível realizar o check-in."
              : "Não foi possível realizar o check-out."),
        );
        setConfirmMode(null);
        return;
      }
      if (resp.data) {
        // Reconsulta com dataSelecionada para atualizar disponibilidade do serviço.
        const refreshed = await getReservaAdminDetalhe(
          reserva.idReservaHospedagem,
          dataSelecionada,
        );
        if (refreshed.success && refreshed.data) {
          setDetalhe(refreshed.data);
        } else {
          setDetalhe(resp.data);
        }
      }
      setConfirmMode(null);
      notifyOperacaoConcluida();
      if (mode === "checkin") {
        onClose();
      }
    } catch {
      setErroAcao(
        mode === "checkin"
          ? "Erro ao realizar check-in."
          : "Erro ao realizar check-out.",
      );
      setConfirmMode(null);
    } finally {
      setExecutando(false);
    }
  };

  const confirmTitulo =
    confirmMode === "checkout"
      ? "Confirmar o check-out desta hospedagem?"
      : "Confirmar entrada do hóspede?";
  const confirmSub =
    confirmMode === "checkout"
      ? "Após confirmar, a suíte ficará disponível para novas reservas."
      : "O status passará de Confirmada para Hospedada.";
  const confirmBtnLabel =
    confirmMode === "checkout" ? "Confirmar Check-out" : "Confirmar Check-in";

  return (
    <>
      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={onClose}
      >
        <Pressable style={styles.backdrop} onPress={onClose}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.handle} />

            <View style={styles.headerRow}>
              <Text style={styles.titulo}>{reserva.suiteNome}</Text>
              <TouchableOpacity onPress={onClose} hitSlop={12}>
                <Feather name="x" size={22} color={colors.cinza} />
              </TouchableOpacity>
            </View>

            <View style={[styles.statusBadge, { backgroundColor: corStatus }]}>
              <Text style={styles.statusTexto}>
                {badgeLabel.toUpperCase()}
              </Text>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
            >
              {loading ? (
                <ActivityIndicator
                  size="small"
                  color={colors.azul}
                  style={styles.loader}
                />
              ) : (
                <View style={styles.campos}>
                  {responsavel ? (
                    <Campo label="Responsável" valor={responsavel} />
                  ) : null}
                  {(adultos > 0 || criancas > 0) && (
                    <Campo
                      label="Resumo"
                      valor={`${adultos} ${adultos === 1 ? "adulto" : "adultos"}${
                        criancas > 0
                          ? ` · ${criancas} ${criancas === 1 ? "criança" : "crianças"}`
                          : ""
                      }`}
                    />
                  )}
                  {checkinIso ? (
                    <Campo
                      label="Check-in"
                      valor={formatDateTimeHospedagem(checkinIso)}
                    />
                  ) : null}
                  {checkoutIso ? (
                    <Campo
                      label="Check-out"
                      valor={formatDateTimeHospedagem(checkoutIso)}
                    />
                  ) : null}
                  {valor != null ? (
                    <Campo
                      label="Valor"
                      valor={formatCurrency(Number(valor))}
                    />
                  ) : null}
                  <Campo label="Status" valor={badgeLabel} />
                  {mensagemOp ? (
                    <Campo label="Situação" valor={mensagemOp} />
                  ) : null}
                  {mensagemOpSec ? (
                    <Text style={styles.hintCheckin}>{mensagemOpSec}</Text>
                  ) : null}
                  <OrigemReservaIndicador
                    dados={detalhe ?? undefined}
                    variante="sheet"
                  />
                  <ResumoFinanceiroRecepcao
                    dados={detalhe}
                    mostrarReceberSaldo={Boolean(mostrarBotaoCheckin)}
                    onReceberSaldo={() => {
                      if (!reserva.idReservaHospedagem) return;
                      const dados = {
                        valorTotal: detalhe?.valorTotal ?? reserva.valorTotal,
                        valorPago: detalhe?.valorPago ?? reserva.valorPago,
                        saldoPendente:
                          detalhe?.saldoPendente ?? reserva.saldoPendente,
                      };
                      openReceberSaldo({
                        idReservaHospedagem: reserva.idReservaHospedagem,
                        saldoPendente: obterSaldoPendenteExibicao(dados),
                        valorTotal: dados.valorTotal,
                        valorPago: dados.valorPago,
                        suiteNome: reserva.suiteNome,
                        responsavel:
                          detalhe?.responsavel ??
                          detalhe?.nomeResponsavel ??
                          reserva.responsavel,
                      });
                    }}
                  />

                  <View style={styles.hospedesSecao}>
                    <Text style={styles.hospedesTitulo}>Hóspedes</Text>
                    {hospedesConferencia.length === 0 ? (
                      <Text style={styles.hospedeVazio}>
                        Nenhum hóspede cadastrado nesta reserva.
                      </Text>
                    ) : (
                      hospedesConferencia.map((h) => (
                        <View key={h.key} style={styles.hospedeItem}>
                          <Text style={styles.hospedeRotulo}>
                            {h.emoji} {h.rotulo}
                          </Text>
                          <Text style={styles.hospedeNome}>{h.nome}</Text>
                          {h.isCrianca ? (
                            <HospedeCriancaDetalhe
                              dataNascimento={h.dataNascimento}
                              referenciaIdade={referenciaIdade}
                            />
                          ) : null}
                        </View>
                      ))
                    )}
                  </View>
                </View>
              )}

              {erroAcao ? (
                <Text style={styles.erroAcao}>{erroAcao}</Text>
              ) : null}

              <Text style={styles.acoesTitulo}>Ações</Text>

              {mostrarBotaoCheckin ? (
                <>
                  <TouchableOpacity
                    style={[
                      styles.btnAcao,
                      { backgroundColor: CORES_STATUS_OPERACIONAL.livre },
                      (!podeExecutarCheckin || bloqueadoPorSaldo) &&
                        styles.btnDesabilitado,
                    ]}
                    onPress={() => {
                      if (bloqueadoPorSaldo) {
                        setErroAcao(MSG_CHECKIN_BLOQUEADO_SALDO);
                        return;
                      }
                      if (podeExecutarCheckin) setConfirmMode("checkin");
                    }}
                    disabled={executando || loading || bloqueadoPorSaldo}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.btnAcaoTexto}>Realizar Check-in</Text>
                  </TouchableOpacity>
                  {bloqueadoPorSaldo ? (
                    <Text style={styles.hintCheckin}>
                      {MSG_CHECKIN_BLOQUEADO_SALDO}
                    </Text>
                  ) : null}
                </>
              ) : null}

              {mostrarVerReserva &&
              (statusOp === "HOSPEDADA" || statusOp === "CHECKOUT_HOJE") ? (
                <TouchableOpacity
                  style={[
                    styles.btnAcao,
                    { backgroundColor: CORES_STATUS_OPERACIONAL.hospedada },
                  ]}
                  onPress={abrirReserva}
                >
                  <Text style={styles.btnAcaoTexto}>Ver Reserva</Text>
                </TouchableOpacity>
              ) : null}

              {mostrarBotaoCheckout ? (
                <TouchableOpacity
                  style={[
                    styles.btnAcao,
                    {
                      backgroundColor: CORES_STATUS_OPERACIONAL.aguardandoAcao,
                    },
                    !podeExecutarCheckout && styles.btnDesabilitado,
                  ]}
                  onPress={() => {
                    if (podeExecutarCheckout) setConfirmMode("checkout");
                  }}
                  disabled={!podeExecutarCheckout}
                  activeOpacity={0.85}
                >
                  <Text style={styles.btnAcaoTexto}>Realizar Check-out</Text>
                </TouchableOpacity>
              ) : null}

              {mostrarVerReserva &&
              statusOp !== "HOSPEDADA" &&
              statusOp !== "CHECKOUT_HOJE" ? (
                <TouchableOpacity
                  style={[
                    styles.btnAcao,
                    {
                      backgroundColor:
                        statusOp === "CHECKOUT_REALIZADO"
                          ? CORES_STATUS_OPERACIONAL.encerrada
                          : CORES_STATUS_OPERACIONAL.hospedada,
                    },
                  ]}
                  onPress={abrirReserva}
                >
                  <Text style={styles.btnAcaoTexto}>Ver Reserva</Text>
                </TouchableOpacity>
              ) : null}

              {mostrarNovaReserva ? (
                <TouchableOpacity
                  style={[
                    styles.btnAcao,
                    { backgroundColor: CORES_STATUS_OPERACIONAL.livre },
                  ]}
                  onPress={abrirNovaReserva}
                >
                  <Text style={styles.btnAcaoTexto}>Nova Reserva</Text>
                </TouchableOpacity>
              ) : null}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={confirmMode != null}
        transparent
        animationType="fade"
        onRequestClose={() => !executando && setConfirmMode(null)}
      >
        <View style={styles.confirmBackdrop}>
          <View style={styles.confirmBox}>
            <Text style={styles.confirmTitulo}>{confirmTitulo}</Text>
            <Text style={styles.confirmSub}>{confirmSub}</Text>
            <View style={styles.confirmBtns}>
              <TouchableOpacity
                style={styles.btnCancelar}
                onPress={() => setConfirmMode(null)}
                disabled={executando}
              >
                <Text style={styles.btnCancelarTexto}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.btnConfirmar,
                  confirmMode === "checkout" && {
                    backgroundColor: CORES_STATUS_OPERACIONAL.aguardandoAcao,
                  },
                ]}
                onPress={confirmarOperacao}
                disabled={executando}
              >
                {executando ? (
                  <ActivityIndicator color={colors.branco} />
                ) : (
                  <Text style={styles.btnConfirmarTexto}>{confirmBtnLabel}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

function Campo({ label, valor }: { label: string; valor: string }) {
  return (
    <View style={styles.campo}>
      <Text style={styles.campoLabel}>{label}</Text>
      <Text style={styles.campoValor}>{valor}</Text>
    </View>
  );
}

function formatNascimentoHospede(iso?: string | null): string | null {
  if (!iso) return null;
  try {
    return formatInTimeZone(
      parseISO(String(iso).slice(0, 10) + "T12:00:00"),
      HOSPEDAGEM_TZ,
      "dd/MM/yyyy",
    );
  } catch {
    return String(iso);
  }
}

function parseDataNascimentoHospede(iso?: string | null): Date | null {
  if (!iso) return null;
  try {
    const raw = String(iso).slice(0, 10);
    const [y, m, d] = raw.split("-").map(Number);
    if (!y || !m || !d) return parseISO(String(iso));
    return new Date(y, m - 1, d);
  } catch {
    return null;
  }
}

function HospedeCriancaDetalhe({
  dataNascimento,
  referenciaIdade,
}: {
  dataNascimento?: string | null;
  referenciaIdade: Date;
}) {
  const nascLabel = formatNascimentoHospede(dataNascimento);
  const nascDate = parseDataNascimentoHospede(dataNascimento);
  const idade =
    nascDate != null
      ? calcularIdadeEmAnos(nascDate, referenciaIdade)
      : null;

  return (
    <View style={styles.criancaMeta}>
      {nascLabel ? (
        <Text style={styles.criancaMetaTexto}>Nascimento: {nascLabel}</Text>
      ) : (
        <Text style={styles.criancaMetaTexto}>Nascimento: não informado</Text>
      )}
      {idade != null ? (
        <Text style={styles.criancaMetaTexto}>
          Idade: {formatarIdadeAnos(idade)}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: colors.branco,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 12,
    paddingBottom: Platform.OS === "ios" ? 32 : 24,
    paddingTop: 8,
    maxHeight: "90%",
  },
  handle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.line,
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  titulo: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.cinza,
    flex: 1,
    paddingRight: 12,
  },
  statusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    marginBottom: 16,
  },
  statusTexto: {
    color: colors.branco,
    fontWeight: "700",
    fontSize: 11,
    letterSpacing: 0.4,
  },
  loader: {
    marginVertical: 24,
  },
  scrollContent: {
    paddingBottom: 8,
  },
  campos: {
    gap: 14,
    marginBottom: 16,
  },
  campo: {
    gap: 2,
  },
  campoLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#777",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  campoValor: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.cinza,
  },
  hospedesSecao: {
    marginTop: 4,
    gap: 10,
  },
  hospedesTitulo: {
    fontSize: 12,
    fontWeight: "700",
    color: "#777",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  hospedeVazio: {
    fontSize: 14,
    color: "#888",
  },
  hospedeItem: {
    backgroundColor: "#f7f8fa",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 2,
  },
  hospedeRotulo: {
    fontSize: 12,
    fontWeight: "700",
    color: "#666",
  },
  hospedeNome: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.cinza,
  },
  criancaMeta: {
    marginTop: 4,
    gap: 2,
  },
  criancaMetaTexto: {
    fontSize: 13,
    color: "#666",
  },
  acoesTitulo: {
    fontSize: 13,
    fontWeight: "700",
    color: "#777",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: 10,
    marginTop: 4,
  },
  btnAcao: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    minHeight: 48,
    justifyContent: "center",
    marginBottom: 8,
  },
  btnDesabilitado: {
    opacity: 0.45,
  },
  btnAcaoTexto: {
    color: colors.branco,
    fontWeight: "700",
    fontSize: 15,
  },
  hintCheckin: {
    fontSize: 13,
    color: "#777",
    marginBottom: 10,
    textAlign: "center",
  },
  erroAcao: {
    color: CORES_STATUS_OPERACIONAL.alerta,
    fontSize: 13,
    marginBottom: 8,
  },
  confirmBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  confirmBox: {
    backgroundColor: colors.branco,
    borderRadius: 16,
    padding: 16,
  },
  confirmTitulo: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.cinza,
    marginBottom: 8,
  },
  confirmSub: {
    fontSize: 14,
    color: "#666",
    marginBottom: 20,
  },
  confirmBtns: {
    flexDirection: "row",
    gap: 10,
  },
  btnCancelar: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.line,
    paddingVertical: 12,
    alignItems: "center",
  },
  btnCancelarTexto: {
    fontWeight: "600",
    color: colors.cinza,
  },
  btnConfirmar: {
    flex: 1.2,
    borderRadius: 12,
    backgroundColor: CORES_STATUS_OPERACIONAL.livre,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 46,
  },
  btnConfirmarTexto: {
    fontWeight: "700",
    color: colors.branco,
  },
});
