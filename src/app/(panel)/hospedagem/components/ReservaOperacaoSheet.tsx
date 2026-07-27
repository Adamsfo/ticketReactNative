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
import { Feather } from "@expo/vector-icons";
import { parseISO } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import colors from "@/src/constants/colors";
import formatCurrency from "@/src/components/FormatCurrency";
import {
  getReservaAdminDetalhe,
  ReservaAdminDetalhe,
  ReservaTimelineEvento,
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
  COR_RECEBIDO,
  COR_SALDO_PENDENTE,
  MSG_CHECKIN_BLOQUEADO_SALDO,
  obterSaldoPendenteExibicao,
} from "@/src/lib/hospedagemPagamentoRecepcao";
import OrigemReservaIndicador, {
  labelChipOrigemReserva,
} from "./OrigemReservaIndicador";
import TrocaSuiteModal from "./TrocaSuiteModal";
import AlterarPeriodoModal from "./AlterarPeriodoModal";

type HospedeConferencia = {
  key: string;
  nome: string;
  rotulo: string;
  emoji: string;
  isCrianca: boolean;
  isResponsavel: boolean;
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
 * Central operacional da hospedagem (Agenda + Suítes).
 * Um único GET de detalhe alimenta resumo, financeiro, hóspedes, histórico e ações.
 */
export default function ReservaOperacaoSheet({
  reserva,
  visible,
  onClose,
  dataReferencia,
}: Props) {
  const { notifyOperacaoConcluida, refreshVersion } =
    useHospedagemAdminRefresh();
  const { openNovaReserva } = useNovaReservaRecepcao();
  const { openReceberSaldo } = useReceberSaldoHospedagem();
  const [detalhe, setDetalhe] = useState<ReservaAdminDetalhe | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirmMode, setConfirmMode] = useState<ConfirmMode>(null);
  const [executando, setExecutando] = useState(false);
  const [erroAcao, setErroAcao] = useState<string | null>(null);
  const [trocaSuiteVisible, setTrocaSuiteVisible] = useState(false);
  const [alterarPeriodoVisible, setAlterarPeriodoVisible] = useState(false);

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
      setTrocaSuiteVisible(false);
      setAlterarPeriodoVisible(false);
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
  const checkoutIso = detalhe?.checkout ?? reserva?.fim ?? "";

  const responsavel =
    detalhe?.responsavel ??
    detalhe?.nomeResponsavel ??
    reserva?.responsavel ??
    "";

  const hospedesConferencia = useMemo((): HospedeConferencia[] => {
    const suites = detalhe?.suites ?? [];
    const lista: HospedeConferencia[] = [];
    let nAdulto = 0;
    let nCrianca = 0;
    const nomeResp = normalizarNome(responsavel);
    let responsavelMarcado = false;

    suites.forEach((suite) => {
      (suite.hospedes ?? []).forEach((h, hIdx) => {
        const tipo = String(h.tipo || "").toLowerCase();
        const isCrianca =
          tipo === "crianca" || tipo === "criança" || tipo.includes("crianc");
        const matchResp =
          !responsavelMarcado &&
          !isCrianca &&
          nomeResp.length > 0 &&
          normalizarNome(h.nome) === nomeResp;
        if (matchResp) responsavelMarcado = true;

        if (isCrianca) {
          nCrianca += 1;
          lista.push({
            key: `${suite.idReservaSuite}-${h.id ?? hIdx}-c`,
            nome: h.nome,
            rotulo: `Criança ${nCrianca}`,
            emoji: "🧒",
            isCrianca: true,
            isResponsavel: false,
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
            isResponsavel: matchResp,
            dataNascimento: h.dataNascimento,
          });
        }
      });
    });

    if (!responsavelMarcado && lista.length > 0) {
      const primeiroAdulto = lista.find((h) => !h.isCrianca);
      if (primeiroAdulto) primeiroAdulto.isResponsavel = true;
    }
    return lista;
  }, [detalhe?.suites, responsavel]);

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

  const mostrarBotaoCheckin = Boolean(disp?.podeCheckin);
  const mostrarBotaoCheckout = Boolean(disp?.podeCheckout);
  const mostrarNovaReserva = disp?.botaoPrincipal === "nova_reserva";

  const statusParaTroca = detalhe?.statusOriginal ?? statusDb;
  const mostrarTrocarSuite =
    statusParaTroca === "Confirmada" || statusParaTroca === "Hospedada";
  const mostrarAlterarPeriodo = mostrarTrocarSuite;
  const idReservaSuiteTroca = detalhe?.suites?.[0]?.idReservaSuite ?? null;

  const dadosFinanceirosCheckin = detalhe ?? {
    valorTotal: reserva?.valorTotal,
    valorPago: reserva?.valorPago,
    saldoPendente: reserva?.saldoPendente,
  };
  const bloqueadoPorSaldo = bloqueiaCheckinPorSaldoPendente(
    dadosFinanceirosCheckin,
  );

  const podeExecutarCheckin =
    mostrarBotaoCheckin && !bloqueadoPorSaldo && !executando && !loading;
  const podeExecutarCheckout = mostrarBotaoCheckout && !executando;

  const adultos = detalhe?.suites?.[0]?.adultos ?? reserva?.adultos ?? 0;
  const criancas = detalhe?.suites?.[0]?.criancas ?? reserva?.criancas ?? 0;
  const noites = Number(detalhe?.noites ?? 0);
  const valorTotal = Number(detalhe?.valorTotal ?? reserva?.valorTotal ?? 0);
  const valorPago = Number(detalhe?.valorPago ?? reserva?.valorPago ?? 0);
  const saldoPendente = obterSaldoPendenteExibicao(
    detalhe ?? {
      valorTotal: reserva?.valorTotal,
      valorPago: reserva?.valorPago,
      saldoPendente: reserva?.saldoPendente,
    },
  );
  const situacaoFinanceira =
    detalhe?.situacaoFinanceira ??
    (saldoPendente <= 0.009
      ? "Quitada"
      : valorPago > 0.009
        ? "Parcial"
        : "Pendente");

  const pagamentos = detalhe?.pagamentos ?? [];
  const movimentacoes = detalhe?.movimentacoesSuite ?? [];
  const timeline = detalhe?.timeline ?? [];
  const proximaReserva = disp?.proximaReservaResumo ?? null;
  const mostrarProximaReserva =
    Boolean(proximaReserva) &&
    (statusOp === "CHECKOUT_HOJE" || Boolean(disp?.checkoutHoje));

  const suiteNomeExibicao =
    detalhe?.suites?.[0]?.nome ?? reserva?.suiteNome ?? "Suíte";

  if (!reserva) return null;

  const corStatus = corStatusOperacionalPadrao(statusOp);

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
              <Text style={styles.titulo}>{suiteNomeExibicao}</Text>
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
                <View style={styles.blocos}>
                  {/* Resumo */}
                  <Secao titulo="Resumo">
                    {responsavel ? (
                      <Linha label="Responsável" valor={responsavel} />
                    ) : null}
                    {(adultos > 0 || criancas > 0) && (
                      <Linha
                        label="Ocupantes"
                        valor={`${adultos} ${adultos === 1 ? "adulto" : "adultos"}${
                          criancas > 0
                            ? ` · ${criancas} ${criancas === 1 ? "criança" : "crianças"}`
                            : ""
                        }`}
                      />
                    )}
                    <Linha label="Status" valor={badgeLabel} />
                    {mensagemOp ? (
                      <Linha label="Situação" valor={mensagemOp} />
                    ) : null}
                    {mensagemOpSec ? (
                      <Text style={styles.hint}>{mensagemOpSec}</Text>
                    ) : null}
                  </Secao>

                  {/* Período */}
                  <Secao titulo="Período">
                    <Text style={styles.periodoLabel}>Check-in</Text>
                    <Text style={styles.periodoValor}>
                      {checkinIso
                        ? formatDateTimeHospedagem(checkinIso)
                        : "—"}
                    </Text>
                    <Text style={styles.seta}>↓</Text>
                    <Text style={styles.periodoLabel}>Check-out</Text>
                    <Text style={styles.periodoValor}>
                      {checkoutIso
                        ? formatDateTimeHospedagem(checkoutIso)
                        : "—"}
                    </Text>
                    {noites > 0 ? (
                      <Text style={styles.diarias}>
                        {noites === 1 ? "1 diária" : `${noites} diárias`}
                      </Text>
                    ) : null}
                  </Secao>

                  {/* Financeiro */}
                  <Secao titulo="Financeiro">
                    <Linha
                      label="Total"
                      valor={formatCurrency(valorTotal)}
                    />
                    <Linha
                      label="Recebido"
                      valor={formatCurrency(valorPago)}
                      valorStyle={{ color: COR_RECEBIDO }}
                    />
                    <Linha
                      label="Saldo"
                      valor={formatCurrency(saldoPendente)}
                      valorStyle={{
                        color:
                          saldoPendente > 0.009
                            ? COR_SALDO_PENDENTE
                            : COR_RECEBIDO,
                      }}
                    />
                    <Linha
                      label="Situação"
                      valor={situacaoFinanceira}
                    />
                    {mostrarBotaoCheckin && saldoPendente > 0.009 ? (
                      <TouchableOpacity
                        style={styles.btnReceberSaldo}
                        onPress={() => {
                          if (!reserva.idReservaHospedagem) return;
                          openReceberSaldo({
                            idReservaHospedagem: reserva.idReservaHospedagem,
                            saldoPendente,
                            valorTotal,
                            valorPago,
                            suiteNome: suiteNomeExibicao,
                            responsavel: responsavel || undefined,
                          });
                        }}
                        activeOpacity={0.85}
                      >
                        <Text style={styles.btnReceberSaldoTexto}>
                          Receber Saldo
                        </Text>
                      </TouchableOpacity>
                    ) : null}
                  </Secao>

                  {/* Origem */}
                  <Secao titulo="Origem">
                    <OrigemReservaIndicador
                      dados={detalhe ?? undefined}
                      variante="sheet"
                    />
                  </Secao>

                  {/* Próxima reserva */}
                  {mostrarProximaReserva && proximaReserva ? (
                    <Secao titulo="Próxima reserva">
                      <ProximaReservaBloco resumo={proximaReserva} />
                    </Secao>
                  ) : null}

                  {/* Hóspedes */}
                  <Secao titulo="Hóspedes">
                    {hospedesConferencia.length === 0 ? (
                      <Text style={styles.vazio}>
                        Nenhum hóspede cadastrado nesta reserva.
                      </Text>
                    ) : (
                      hospedesConferencia.map((h) => (
                        <View key={h.key} style={styles.hospedeItem}>
                          <Text style={styles.hospedeRotulo}>
                            {h.emoji} {h.rotulo}
                            {h.isResponsavel ? " · Responsável" : ""}
                          </Text>
                          <Text style={styles.hospedeNome}>{h.nome}</Text>
                          <HospedeMeta
                            dataNascimento={h.dataNascimento}
                            referenciaIdade={referenciaIdade}
                            mostrarIdade={h.isCrianca}
                          />
                        </View>
                      ))
                    )}
                  </Secao>

                  {/* Pagamentos */}
                  {pagamentos.length > 0 ? (
                    <Secao titulo="Pagamentos">
                      {pagamentos.map((p, idx) => (
                        <View key={p.id}>
                          {idx > 0 ? (
                            <Text style={styles.setaCentro}>↓</Text>
                          ) : null}
                          <Text style={styles.pagForma}>
                            {p.formaPagamentoLabel || p.formaPagamento}
                          </Text>
                          <Text style={styles.pagValor}>
                            {formatCurrency(Number(p.valor))}
                          </Text>
                          <Text style={styles.pagHora}>
                            {formatHoraCurta(p.dataPagamento)}
                          </Text>
                        </View>
                      ))}
                    </Secao>
                  ) : null}

                  {/* Trocas de suíte */}
                  {movimentacoes.length > 0 ? (
                    <Secao titulo="Trocas de suíte">
                      {movimentacoes.map((m, idx) => (
                        <View key={m.id} style={styles.trocaItem}>
                          {idx > 0 ? (
                            <Text style={styles.setaCentro}>↓</Text>
                          ) : null}
                          <Text style={styles.trocaSuite}>
                            {m.suiteOrigem.nome}
                          </Text>
                          <Text style={styles.setaCentro}>↓</Text>
                          <Text style={styles.trocaSuite}>
                            {m.suiteDestino.nome}
                          </Text>
                          <Text style={styles.metaSuave}>
                            {formatDateTimeHospedagem(m.dataHora)}
                          </Text>
                          {m.usuario ? (
                            <Text style={styles.metaSuave}>
                              por {m.usuario}
                            </Text>
                          ) : null}
                          {m.motivo?.trim() ? (
                            <>
                              <Text style={styles.motivoLabel}>Motivo</Text>
                              <Text style={styles.motivoValor}>
                                {m.motivo.trim()}
                              </Text>
                            </>
                          ) : null}
                        </View>
                      ))}
                    </Secao>
                  ) : null}

                  {/* Histórico */}
                  <Secao titulo="Histórico">
                    {timeline.length === 0 ? (
                      <Text style={styles.vazio}>
                        Nenhum histórico registrado.
                      </Text>
                    ) : (
                      timeline.map((evento, idx) => (
                        <View key={String(evento.id)}>
                          {idx > 0 ? (
                            <Text style={styles.setaCentro}>↓</Text>
                          ) : null}
                          <HistoricoItem evento={evento} />
                        </View>
                      ))
                    )}
                  </Secao>
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
                    <Text style={styles.hint}>{MSG_CHECKIN_BLOQUEADO_SALDO}</Text>
                  ) : null}
                </>
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

              {mostrarTrocarSuite ? (
                <TouchableOpacity
                  style={[styles.btnAcao, { backgroundColor: colors.azul }]}
                  onPress={() => setTrocaSuiteVisible(true)}
                  disabled={loading || executando}
                  activeOpacity={0.85}
                >
                  <Text style={styles.btnAcaoTexto}>Trocar Suíte</Text>
                </TouchableOpacity>
              ) : null}

              {mostrarAlterarPeriodo ? (
                <TouchableOpacity
                  style={[
                    styles.btnAcao,
                    { backgroundColor: colors.greenEscuro },
                  ]}
                  onPress={() => setAlterarPeriodoVisible(true)}
                  disabled={loading || executando}
                  activeOpacity={0.85}
                >
                  <Text style={styles.btnAcaoTexto}>Alterar Período</Text>
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

      <TrocaSuiteModal
        visible={trocaSuiteVisible}
        idReservaHospedagem={reserva.idReservaHospedagem}
        idReservaSuite={idReservaSuiteTroca}
        onClose={() => setTrocaSuiteVisible(false)}
        onSucesso={() => {
          setTrocaSuiteVisible(false);
          onClose();
        }}
      />

      <AlterarPeriodoModal
        visible={alterarPeriodoVisible}
        idReservaHospedagem={reserva.idReservaHospedagem}
        onClose={() => setAlterarPeriodoVisible(false)}
        onSucesso={() => {
          setAlterarPeriodoVisible(false);
          onClose();
        }}
      />
    </>
  );
}

function Secao({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.secao}>
      <Text style={styles.secaoTitulo}>{titulo}</Text>
      <View style={styles.secaoCorpo}>{children}</View>
    </View>
  );
}

function Linha({
  label,
  valor,
  valorStyle,
}: {
  label: string;
  valor: string;
  valorStyle?: object;
}) {
  return (
    <View style={styles.linha}>
      <Text style={styles.linhaLabel}>{label}</Text>
      <Text style={[styles.linhaValor, valorStyle]}>{valor}</Text>
    </View>
  );
}

function ProximaReservaBloco({
  resumo,
}: {
  resumo: NonNullable<
    NonNullable<ReservaAdminDetalhe["disponibilidade"]>["proximaReservaResumo"]
  >;
}) {
  const chip = labelChipOrigemReserva({
    origemReserva: resumo.origemReserva,
    idUsuarioCriacao: resumo.idUsuarioCriacao,
    nomeUsuarioCriacao: resumo.nomeUsuarioCriacao,
  });
  return (
    <View style={styles.proximaBox}>
      <Text style={styles.proximaNome}>
        {resumo.responsavel?.trim() || "Hóspede"}
      </Text>
      <Text style={styles.metaSuave}>
        Check-in {formatHoraCurta(resumo.checkin)}
      </Text>
      {chip ? <Text style={styles.metaSuave}>{chip.texto}</Text> : null}
    </View>
  );
}

function HistoricoItem({ evento }: { evento: ReservaTimelineEvento }) {
  const titulo = evento.titulo || evento.descricao;
  return (
    <View style={styles.histItem}>
      <Text style={styles.histData}>{formatDataCurta(evento.data)}</Text>
      <Text style={styles.histTitulo}>{titulo}</Text>
      {evento.tipo === "troca_suite" ? (
        <>
          {evento.suiteOrigem ? (
            <Text style={styles.histDetalhe}>{evento.suiteOrigem}</Text>
          ) : null}
          <Text style={styles.setaCentro}>↓</Text>
          {evento.suiteDestino ? (
            <Text style={styles.histDetalhe}>{evento.suiteDestino}</Text>
          ) : null}
          {evento.motivo?.trim() ? (
            <Text style={styles.metaSuave}>Motivo: {evento.motivo.trim()}</Text>
          ) : null}
        </>
      ) : null}
      {evento.tipo === "alteracao_periodo" ? (
        <>
          <Text style={styles.metaSuave}>Check-in</Text>
          <Text style={styles.histDetalhe}>
            {formatDateTimeHospedagem(evento.checkinAnterior || "")}
          </Text>
          <Text style={styles.setaCentro}>↓</Text>
          <Text style={styles.histDetalhe}>
            {formatDateTimeHospedagem(evento.checkinNovo || "")}
          </Text>
          <Text style={[styles.metaSuave, { marginTop: 6 }]}>Check-out</Text>
          <Text style={styles.histDetalhe}>
            {formatDateTimeHospedagem(evento.checkoutAnterior || "")}
          </Text>
          <Text style={styles.setaCentro}>↓</Text>
          <Text style={styles.histDetalhe}>
            {formatDateTimeHospedagem(evento.checkoutNovo || "")}
          </Text>
          {evento.motivo?.trim() ? (
            <Text style={styles.metaSuave}>Motivo: {evento.motivo.trim()}</Text>
          ) : null}
        </>
      ) : null}
      {evento.tipo === "pagamento" ? (
        <>
          {evento.formaPagamento ? (
            <Text style={styles.histDetalhe}>{evento.formaPagamento}</Text>
          ) : null}
          {evento.valor != null ? (
            <Text style={styles.histDetalhe}>
              {formatCurrency(Number(evento.valor))}
            </Text>
          ) : null}
          <Text style={styles.metaSuave}>{formatHoraCurta(evento.data)}</Text>
        </>
      ) : null}
      {evento.tipo === "checkin" || evento.tipo === "checkout" ? (
        <Text style={styles.metaSuave}>{formatHoraCurta(evento.data)}</Text>
      ) : null}
      {evento.usuario ? (
        <Text style={styles.metaSuave}>{evento.usuario}</Text>
      ) : null}
    </View>
  );
}

function HospedeMeta({
  dataNascimento,
  referenciaIdade,
  mostrarIdade,
}: {
  dataNascimento?: string | null;
  referenciaIdade: Date;
  mostrarIdade: boolean;
}) {
  const nascLabel = formatNascimentoHospede(dataNascimento);
  const nascDate = parseDataNascimentoHospede(dataNascimento);
  const idade =
    mostrarIdade && nascDate != null
      ? calcularIdadeEmAnos(nascDate, referenciaIdade)
      : null;

  if (!nascLabel && idade == null) return null;

  return (
    <View style={styles.criancaMeta}>
      {nascLabel ? (
        <Text style={styles.criancaMetaTexto}>Nascimento: {nascLabel}</Text>
      ) : null}
      {idade != null ? (
        <Text style={styles.criancaMetaTexto}>
          Idade: {formatarIdadeAnos(idade)}
        </Text>
      ) : null}
    </View>
  );
}

function normalizarNome(nome?: string | null): string {
  return String(nome || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function formatDataCurta(iso?: string | Date | null): string {
  if (!iso) return "—";
  try {
    return formatInTimeZone(new Date(iso), HOSPEDAGEM_TZ, "dd/MM");
  } catch {
    return "—";
  }
}

function formatHoraCurta(iso?: string | Date | null): string {
  if (!iso) return "--:--";
  try {
    return formatInTimeZone(new Date(iso), HOSPEDAGEM_TZ, "HH:mm");
  } catch {
    return "--:--";
  }
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
    maxHeight: "92%",
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
    marginBottom: 12,
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
  blocos: {
    gap: 12,
    marginBottom: 16,
  },
  secao: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: "#fafbfc",
  },
  secaoTitulo: {
    fontSize: 12,
    fontWeight: "700",
    color: "#777",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: 10,
  },
  secaoCorpo: {
    gap: 8,
  },
  linha: {
    gap: 2,
  },
  linhaLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#777",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  linhaValor: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.cinza,
  },
  periodoLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#777",
    textTransform: "uppercase",
  },
  periodoValor: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.cinza,
    marginTop: 2,
  },
  seta: {
    fontSize: 16,
    color: "#999",
    marginVertical: 2,
  },
  setaCentro: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    marginVertical: 4,
  },
  diarias: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: "600",
    color: colors.cinza,
  },
  hint: {
    fontSize: 13,
    color: "#777",
    marginTop: 2,
  },
  btnReceberSaldo: {
    marginTop: 6,
    alignSelf: "flex-start",
    backgroundColor: COR_SALDO_PENDENTE,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  btnReceberSaldoTexto: {
    color: colors.branco,
    fontWeight: "700",
    fontSize: 13,
  },
  vazio: {
    fontSize: 14,
    color: "#888",
  },
  hospedeItem: {
    backgroundColor: colors.branco,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 2,
    borderWidth: 1,
    borderColor: colors.line,
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
  pagForma: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.cinza,
  },
  pagValor: {
    fontSize: 16,
    fontWeight: "600",
    color: COR_RECEBIDO,
  },
  pagHora: {
    fontSize: 13,
    color: "#777",
  },
  trocaItem: {
    gap: 2,
  },
  trocaSuite: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.cinza,
  },
  metaSuave: {
    fontSize: 13,
    color: "#777",
  },
  motivoLabel: {
    marginTop: 6,
    fontSize: 11,
    fontWeight: "700",
    color: "#777",
    textTransform: "uppercase",
  },
  motivoValor: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.cinza,
  },
  histItem: {
    gap: 2,
  },
  histData: {
    fontSize: 12,
    fontWeight: "700",
    color: "#777",
  },
  histTitulo: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.cinza,
  },
  histDetalhe: {
    fontSize: 14,
    color: colors.cinza,
  },
  proximaBox: {
    gap: 4,
  },
  proximaNome: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.cinza,
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
