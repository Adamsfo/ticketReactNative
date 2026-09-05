import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import colors from "@/src/constants/colors";
import formatCurrency from "@/src/components/FormatCurrency";
import {
  getConsultarTefHospedagem,
  getReservaAdminDetalhe,
  postCancelarTefHospedagem,
  postIniciarTefHospedagem,
  postReceberSaldoDinheiroHospedagem,
  postReceberSaldoManualHospedagem,
  ReservaAdminDetalhe,
} from "@/src/lib/hospedagemAdmin";
import {
  FormaPagamentoRecepcao,
  MSG_VALOR_MAIOR_QUE_SALDO,
  obterSaldoPendenteExibicao,
} from "@/src/lib/hospedagemPagamentoRecepcao";
import {
  digitosCentavosParaNumero,
  digitosParaExibicaoMoeda,
  roundMoney,
  valorParaDigitosCentavos,
} from "@/src/lib/mascaraMoeda";
import { useAuth } from "@/src/contexts_/AuthContext";
import { useHospedagemAdminRefresh } from "../contexts/HospedagemAdminRefreshContext";
import { useReceberSaldoHospedagem } from "../contexts/ReceberSaldoHospedagemContext";
import ComprovanteUploader from "./ComprovanteUploader";
import AlertaPossivelPagamentoOta from "./AlertaPossivelPagamentoOta";

const FORMAS_TEF: FormaPagamentoRecepcao[] = [
  "CartaoCredito",
  "CartaoDebito",
  "PIX",
];

/** Seleção da tela Receber Saldo (atendente) — demais formas permanecem no sistema/outras telas. */
const FORMAS_PAGAMENTO_RECEBER_SALDO: Array<{
  value: FormaPagamentoRecepcao;
  label: string;
}> = [
  { value: "PIX", label: "PIX" },
  { value: "Dinheiro", label: "Dinheiro" },
  { value: "CartaoCredito", label: "Cartão Crédito" },
  { value: "CartaoDebito", label: "Cartão Débito" },
  { value: "Antecipado", label: "Antecipado" },
];

/** Mesmo mapeamento do PagamentoPDV (crédito=2, débito=1, pix=3). */
function transactionTypeDaForma(forma: FormaPagamentoRecepcao): number {
  if (forma === "PIX") return 3;
  if (forma === "CartaoCredito") return 2;
  return 1;
}

/**
 * Modal Receber Saldo — mesma sequência SuperTEF do PagamentoPDV,
 * com persistência exclusiva em PagamentoHospedagem / ReservaHospedagem.
 */
export default function ReceberSaldoHospedagemModal() {
  const { visible, target, closeReceberSaldo } = useReceberSaldoHospedagem();
  const { notifyOperacaoConcluida } = useHospedagemAdminRefresh();
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [detalhe, setDetalhe] = useState<ReservaAdminDetalhe | null>(null);
  const [digitosValor, setDigitosValor] = useState("0");
  const [formaPagamento, setFormaPagamento] =
    useState<FormaPagamentoRecepcao | null>(null);
  const [comprovante, setComprovante] = useState<string | null>(null);
  const [observacao, setObservacao] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  /** Mesmo estado do PDV: payment_uniqueid + flag de polling. */
  const [payment_uniqueid, setPaymentUniqueId] = useState("");
  const [consultaPagamento, setConsultaPagamento] = useState(false);
  const [dadosDePagamento, setDadosDePagamento] = useState<any>({});
  const [statusTefMsg, setStatusTefMsg] = useState<string | null>(null);

  /** Mesma base financeira da agenda + detalhe da mesma reserva. */
  const dadosFinanceiros = useMemo(() => {
    const valorTotal = roundMoney(
      Number(detalhe?.valorTotal ?? target?.valorTotal ?? 0),
    );
    const valorPago = roundMoney(
      Number(detalhe?.valorPago ?? target?.valorPago ?? 0),
    );
    const saldoBruto =
      detalhe?.saldoPendente != null
        ? detalhe.saldoPendente
        : target?.saldoPendente;
    return {
      valorTotal,
      valorPago,
      saldoPendente: saldoBruto,
    };
  }, [
    detalhe?.valorTotal,
    detalhe?.valorPago,
    detalhe?.saldoPendente,
    target?.valorTotal,
    target?.valorPago,
    target?.saldoPendente,
  ]);

  const valorTotal = dadosFinanceiros.valorTotal;
  const valorPagoAtual = dadosFinanceiros.valorPago;
  const saldoPendente = useMemo(
    () => obterSaldoPendenteExibicao(dadosFinanceiros),
    [dadosFinanceiros],
  );

  const valorReceber = digitosCentavosParaNumero(digitosValor);
  const saldoApos = roundMoney(Math.max(0, saldoPendente - valorReceber));

  useEffect(() => {
    if (!visible || !target?.idReservaHospedagem) {
      setDetalhe(null);
      setErro(null);
      setFormaPagamento(null);
      setComprovante(null);
      setObservacao("");
      setDigitosValor("0");
      setPaymentUniqueId("");
      setConsultaPagamento(false);
      setDadosDePagamento({});
      setStatusTefMsg(null);
      setEnviando(false);
      return;
    }

    // Prefill imediato com os valores da agenda (evita iniciar em R$ 0,00).
    const saldoInicial = obterSaldoPendenteExibicao({
      valorTotal: target.valorTotal,
      valorPago: target.valorPago,
      saldoPendente: target.saldoPendente,
    });
    setDigitosValor(valorParaDigitosCentavos(saldoInicial));
    setDetalhe(null);
    setErro(null);
    setFormaPagamento(null);
    setComprovante(null);
    setObservacao("");
    setPaymentUniqueId("");
    setConsultaPagamento(false);
    setDadosDePagamento({});
    setStatusTefMsg(null);

    let cancelado = false;
    setLoading(true);

    getReservaAdminDetalhe(target.idReservaHospedagem)
      .then((resp) => {
        if (cancelado) return;
        if (!resp.success || !resp.data) {
          setErro(
            resp.message || "Não foi possível carregar o saldo da reserva.",
          );
          return;
        }
        // Mesma reserva da agenda — sobrescreve com financeiro atualizado do backend.
        if (
          Number(resp.data.idReservaHospedagem) !==
          Number(target.idReservaHospedagem)
        ) {
          setErro("Reserva carregada não corresponde à selecionada.");
          return;
        }
        setDetalhe(resp.data);
        const saldo = obterSaldoPendenteExibicao({
          valorTotal: resp.data.valorTotal,
          valorPago: resp.data.valorPago,
          saldoPendente: resp.data.saldoPendente,
        });
        setDigitosValor(valorParaDigitosCentavos(saldo));
      })
      .catch(() => {
        if (!cancelado) {
          setErro("Não foi possível carregar o saldo da reserva.");
          const saldoFallback = obterSaldoPendenteExibicao({
            valorTotal: target.valorTotal,
            valorPago: target.valorPago,
            saldoPendente: target.saldoPendente,
          });
          setDigitosValor(valorParaDigitosCentavos(saldoFallback));
        }
      })
      .finally(() => {
        if (!cancelado) setLoading(false);
      });

    return () => {
      cancelado = true;
    };
  }, [visible, target?.idReservaHospedagem]);

  const onChangeValor = (texto: string) => {
    const only = texto.replace(/\D/g, "").slice(0, 12);
    setDigitosValor(only || "0");
    setErro(null);
  };

  const validar = (): boolean => {
    if (valorReceber <= 0) {
      setErro("Informe um valor maior que zero.");
      return false;
    }
    if (valorReceber > saldoPendente + 0.009) {
      setErro(MSG_VALOR_MAIOR_QUE_SALDO);
      return false;
    }
    if (!formaPagamento) {
      setErro("Selecione a forma de pagamento.");
      return false;
    }
    return true;
  };

  const concluirSucesso = () => {
    setConsultaPagamento(false);
    setPaymentUniqueId("");
    target?.onSuccess?.();
    notifyOperacaoConcluida();
    closeReceberSaldo();
  };

  /** Espelho de verificarStatusPagamentoPos do PDV. */
  const verificarStatusPagamentoPos = async () => {
    if (!consultaPagamento || !target?.idReservaHospedagem) return;
    if (!payment_uniqueid) return;

    try {
      const response = await getConsultarTefHospedagem(
        target.idReservaHospedagem,
        payment_uniqueid,
      );
      const dados: { payment_message?: string } = Array.isArray(response?.data)
        ? { payment_message: "" }
        : (response?.data ?? { payment_message: "" });

      setDadosDePagamento(response.data);
      const msg = String(dados.payment_message || "");
      setStatusTefMsg(msg || "Aguardando aprovação no pinpad...");

      if (msg === "Pago") {
        setConsultaPagamento(false);
        concluirSucesso();
        return;
      }
      if (msg === "Cancelado/erro" || msg === "Parcial") {
        setConsultaPagamento(false);
        setEnviando(false);
        if (msg === "Parcial") {
          // PDV também encerra o poll em Parcial; aqui atualiza a reserva e fecha.
          concluirSucesso();
          return;
        }
        setErro("Pagamento cancelado ou recusado no pinpad.");
      }
    } catch (error) {
      console.log("Erro ao verificar status do pagamento POS:", error);
    }
  };

  /** Polling idêntico ao PDV (2s). */
  useEffect(() => {
    if (payment_uniqueid === "" || !consultaPagamento) return;

    const interval = setInterval(() => {
      verificarStatusPagamentoPos();
    }, 2000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payment_uniqueid, consultaPagamento]);

  /** Espelho de fetchPagamentoPos do PDV (inclui idUsuarioPDV). */
  const fetchPagamentoPos = async () => {
    if (!target?.idReservaHospedagem || !formaPagamento) return;
    if (!user?.id) {
      setEnviando(false);
      setErro(
        "Usuário PDV não identificado. Faça login com o mesmo usuário do PagamentoPDV.",
      );
      return;
    }
    try {
      const response = await postIniciarTefHospedagem(
        target.idReservaHospedagem,
        {
          valorTotal: digitosCentavosParaNumero(digitosValor),
          transaction_type: transactionTypeDaForma(formaPagamento),
          // Mesmo campo/valor do PagamentoPDV → mesma linha em ProdutorAcesso.
          idUsuarioPDV: Number(user.id),
          observacao: observacao.trim() || null,
        },
      );

      const id = response?.id ?? "";
      if (!id) {
        setConsultaPagamento(false);
        setEnviando(false);
        setErro(
          response?.error ||
            response?.message ||
            "Não foi possível iniciar o pagamento no pinpad.",
        );
        return;
      }

      // Igual ao PDV: só inicia polling após receber payment_uniqueid.
      setConsultaPagamento(true);
      setPaymentUniqueId(String(id));
      setStatusTefMsg("Aguardando aprovação no pinpad...");
      setErro(null);
    } catch (error) {
      console.error("Erro ao gerar pagamento POS hospedagem:", error);
      setConsultaPagamento(false);
      setEnviando(false);
      setErro("Erro ao iniciar pagamento no pinpad.");
    }
  };

  /**
   * Espelho de CancelaPagamentoPos do PDV:
   * interrompe polling → cancela no SuperTEF → libera novo pagamento.
   */
  const CancelaPagamentoPos = async () => {
    // Interrompe o polling imediatamente (igual ao PDV ao setar consultaPagamento=false).
    setConsultaPagamento(false);

    if (!target?.idReservaHospedagem || !payment_uniqueid) {
      setPaymentUniqueId("");
      setStatusTefMsg(null);
      setEnviando(false);
      return;
    }

    const uniqueId = payment_uniqueid;
    try {
      const response = await postCancelarTefHospedagem(
        target.idReservaHospedagem,
        uniqueId,
      );
      setDadosDePagamento(response.data);
    } catch (error) {
      console.log("Erro ao cancelar pagamento POS:", error);
    }

    setPaymentUniqueId("");
    setStatusTefMsg(null);
    setEnviando(false);
    setErro(null);
  };

  const confirmarManualOuDinheiro = async () => {
    if (!target?.idReservaHospedagem || !formaPagamento) return;

    if (formaPagamento === "Dinheiro") {
      const resp = await postReceberSaldoDinheiroHospedagem(
        target.idReservaHospedagem,
        {
          valorTotal: digitosCentavosParaNumero(digitosValor),
          observacao: observacao.trim() || null,
        },
      );
      if (!resp.success) {
        setErro(resp.message || "Não foi possível registrar o recebimento.");
        return;
      }
      setDadosDePagamento(
        (resp.data as { data?: unknown })?.data ?? resp.data,
      );
      concluirSucesso();
      return;
    }

    const resp = await postReceberSaldoManualHospedagem(
      target.idReservaHospedagem,
      {
        valor: digitosCentavosParaNumero(digitosValor),
        formaPagamento,
        comprovante,
        observacao: observacao.trim() || null,
      },
    );
    if (!resp.success) {
      setErro(resp.message || "Não foi possível registrar o recebimento.");
      return;
    }
    concluirSucesso();
  };

  const confirmar = async () => {
    if (!target?.idReservaHospedagem || !validar() || !formaPagamento) return;
    if (consultaPagamento) return;

    setEnviando(true);
    setErro(null);
    try {
      if (FORMAS_TEF.includes(formaPagamento)) {
        await fetchPagamentoPos();
        return;
      }
      await confirmarManualOuDinheiro();
    } catch {
      setErro("Erro ao registrar o recebimento. Tente novamente.");
      setEnviando(false);
    } finally {
      if (!FORMAS_TEF.includes(formaPagamento)) {
        setEnviando(false);
      }
    }
  };

  if (!target) return null;

  const tituloSuite =
    target.suiteNome ||
    detalhe?.suites?.[0]?.nome ||
    `Reserva #${target.idReservaHospedagem}`;
  const responsavel =
    target.responsavel ||
    detalhe?.responsavel ||
    detalhe?.nomeResponsavel ||
    null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={closeReceberSaldo}
    >
      <Pressable style={styles.backdrop} onPress={closeReceberSaldo}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.kav}
        >
          <Pressable
            style={styles.sheet}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.handle} />

            <View style={styles.headerRow}>
              <Text style={styles.titulo}>Receber Saldo</Text>
              <TouchableOpacity onPress={closeReceberSaldo} hitSlop={12}>
                <Feather name="x" size={22} color={colors.cinza} />
              </TouchableOpacity>
            </View>

            <Text style={styles.subtitulo}>{tituloSuite}</Text>
            {responsavel ? (
              <Text style={styles.meta}>Responsável: {responsavel}</Text>
            ) : null}

            {loading ? (
              <ActivityIndicator
                size="small"
                color={colors.azul}
                style={{ marginVertical: 8 }}
              />
            ) : null}

              <ScrollView
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
              >
                <View style={styles.resumoBox}>
                  <View style={styles.row}>
                    <Text style={styles.labelMuted}>Valor da reserva</Text>
                    <Text style={styles.valor}>
                      {formatCurrency(valorTotal)}
                    </Text>
                  </View>
                  <View style={styles.row}>
                    <Text style={styles.labelMuted}>Já recebido</Text>
                    <Text style={styles.valor}>
                      {formatCurrency(valorPagoAtual)}
                    </Text>
                  </View>
                  <View style={styles.row}>
                    <Text style={styles.labelSaldo}>Saldo pendente</Text>
                    <Text style={styles.valorSaldo}>
                      {formatCurrency(saldoPendente)}
                    </Text>
                  </View>
                </View>

                <Text style={styles.label}>Valor a receber agora</Text>
                <Text style={styles.hint}>
                  Prefill com o saldo. Pode reduzir para pagamento parcial.
                </Text>
                <TextInput
                  style={styles.input}
                  value={digitosParaExibicaoMoeda(digitosValor)}
                  onChangeText={onChangeValor}
                  keyboardType="number-pad"
                  editable={!enviando}
                />

                <Text style={[styles.label, { marginTop: 12 }]}>
                  Forma de pagamento
                </Text>
                {(target.possivelPagamentoOta ||
                  detalhe?.possivelPagamentoOta) && (
                  <View style={{ marginBottom: 8 }}>
                    <AlertaPossivelPagamentoOta
                      compact
                      canalLabel={
                        target.canalVendaLabel ||
                        detalhe?.canalVendaLabel ||
                        detalhe?.canalVenda
                      }
                      trecho={
                        target.possivelPagamentoOtaTrecho ||
                        detalhe?.possivelPagamentoOtaTrecho
                      }
                    />
                    <Text style={styles.hintOta}>
                      Se o pagamento foi pela plataforma, use{" "}
                      <Text style={styles.hintOtaBold}>Recebido pela OTA</Text>{" "}
                      — o valor não entra no caixa.
                    </Text>
                  </View>
                )}
                <View style={styles.formasWrap}>
                  {FORMAS_PAGAMENTO_RECEBER_SALDO.map((f) => {
                    const ativo = formaPagamento === f.value;
                    return (
                      <TouchableOpacity
                        key={f.value}
                        style={[
                          styles.formaChip,
                          ativo && styles.formaChipAtivo,
                        ]}
                        onPress={() => {
                          setFormaPagamento(f.value);
                          setErro(null);
                        }}
                        disabled={enviando || consultaPagamento}
                      >
                        <Text
                          style={[
                            styles.formaChipText,
                            ativo && styles.formaChipTextAtivo,
                          ]}
                        >
                          {f.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <Text style={[styles.label, { marginTop: 12 }]}>
                  Comprovante
                </Text>
                <ComprovanteUploader
                  value={comprovante}
                  onChange={setComprovante}
                />

                <Text style={[styles.label, { marginTop: 12 }]}>
                  Observação
                </Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={observacao}
                  onChangeText={setObservacao}
                  placeholder="Opcional"
                  multiline
                  numberOfLines={2}
                  editable={!enviando}
                />

                <View style={styles.aposBox}>
                  <View style={styles.row}>
                    <Text style={styles.labelMuted}>Recebendo agora</Text>
                    <Text style={styles.valor}>
                      {formatCurrency(valorReceber)}
                    </Text>
                  </View>
                  <View style={styles.row}>
                    <Text style={styles.labelSaldo}>Saldo após recebimento</Text>
                    <Text
                      style={[
                        styles.valorSaldo,
                        saldoApos <= 0.009 && styles.valorQuitado,
                      ]}
                    >
                      {formatCurrency(saldoApos)}
                    </Text>
                  </View>
                  {saldoApos <= 0.009 ? (
                    <Text style={styles.quitadaTexto}>
                      ✓ Reserva será quitada. Check-in liberado.
                    </Text>
                  ) : (
                    <Text style={styles.parcialTexto}>
                      Pagamento parcial: check-in permanece bloqueado.
                    </Text>
                  )}
                </View>

                {formaPagamento && FORMAS_TEF.includes(formaPagamento) ? (
                  <Text style={styles.hintTef}>
                    Cartão e PIX são processados no pinpad SuperTEF. O
                    pagamento só é gravado na reserva após aprovação.
                  </Text>
                ) : null}

                {statusTefMsg ? (
                  <View style={styles.tefBox}>
                    <ActivityIndicator
                      size="small"
                      color={colors.azul}
                      style={{ marginBottom: 6 }}
                    />
                    <Text style={styles.tefTexto}>{statusTefMsg}</Text>
                    {payment_uniqueid ? (
                      <Text style={styles.tefId}>
                        ID: {payment_uniqueid}
                      </Text>
                    ) : null}
                    {dadosDePagamento?.payment_status != null ? (
                      <Text style={styles.tefId}>
                        Status: {String(dadosDePagamento.payment_status)}
                      </Text>
                    ) : null}
                  </View>
                ) : null}

                {erro ? <Text style={styles.erro}>{erro}</Text> : null}

                {consultaPagamento ? (
                  <TouchableOpacity
                    style={[styles.btnConfirmar, styles.btnCancelarTef]}
                    onPress={CancelaPagamentoPos}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.btnConfirmarTexto}>
                      Cancelar operação
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={[
                      styles.btnConfirmar,
                      enviando && styles.btnDisabled,
                    ]}
                    onPress={confirmar}
                    disabled={enviando || saldoPendente <= 0.009}
                    activeOpacity={0.85}
                  >
                    {enviando ? (
                      <ActivityIndicator color={colors.branco} />
                    ) : (
                      <Text style={styles.btnConfirmarTexto}>
                        {formaPagamento && FORMAS_TEF.includes(formaPagamento)
                          ? "Enviar Pagamento para a Máquina"
                          : "Confirmar Recebimento"}
                      </Text>
                    )}
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={styles.btnCancelar}
                  onPress={() => {
                    if (consultaPagamento) {
                      CancelaPagamentoPos();
                      return;
                    }
                    closeReceberSaldo();
                  }}
                  disabled={enviando && !consultaPagamento}
                >
                  <Text style={styles.btnCancelarTexto}>Fechar</Text>
                </TouchableOpacity>
              </ScrollView>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  kav: {
    maxHeight: "92%",
  },
  sheet: {
    backgroundColor: colors.branco,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 18,
    paddingBottom: Platform.OS === "ios" ? 28 : 18,
    maxHeight: "92%",
  },
  handle: {
    alignSelf: "center",
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#ddd",
    marginTop: 10,
    marginBottom: 8,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  titulo: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.cinza,
  },
  subtitulo: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.cinza,
  },
  meta: {
    fontSize: 13,
    color: "#666",
    marginBottom: 8,
  },
  scrollContent: {
    paddingBottom: 12,
  },
  resumoBox: {
    marginTop: 8,
    marginBottom: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#F5F8FC",
    gap: 6,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  labelMuted: {
    fontSize: 13,
    color: "#777",
  },
  valor: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.cinza,
  },
  labelSaldo: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.cinza,
  },
  valorSaldo: {
    fontSize: 16,
    fontWeight: "800",
    color: "#e67e22",
  },
  valorQuitado: {
    color: "#027a3a",
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.cinza,
    marginBottom: 4,
  },
  hint: {
    fontSize: 12,
    color: "#888",
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    fontWeight: "600",
    color: colors.cinza,
    backgroundColor: colors.branco,
  },
  textArea: {
    minHeight: 64,
    textAlignVertical: "top",
  },
  formasWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 4,
  },
  formaChip: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.branco,
  },
  formaChipAtivo: {
    backgroundColor: colors.azul,
    borderColor: colors.azul,
  },
  formaChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.cinza,
  },
  formaChipTextAtivo: {
    color: colors.branco,
  },
  hintOta: {
    fontSize: 12,
    lineHeight: 17,
    color: "#6b5500",
    marginBottom: 4,
  },
  hintOtaBold: {
    fontWeight: "800",
    color: "#5c4500",
  },
  aposBox: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    gap: 6,
  },
  quitadaTexto: {
    marginTop: 4,
    color: "#027a3a",
    fontWeight: "700",
    fontSize: 13,
  },
  parcialTexto: {
    marginTop: 4,
    color: "#e67e22",
    fontWeight: "600",
    fontSize: 13,
  },
  erro: {
    marginTop: 10,
    color: "#c0392b",
    fontWeight: "600",
    fontSize: 13,
  },
  hintTef: {
    marginTop: 10,
    fontSize: 12,
    color: "#666",
    lineHeight: 17,
  },
  tefBox: {
    marginTop: 12,
    padding: 12,
    borderRadius: 10,
    backgroundColor: "#EEF5FF",
    alignItems: "center",
  },
  tefTexto: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.cinza,
    textAlign: "center",
  },
  tefId: {
    marginTop: 4,
    fontSize: 11,
    color: "#888",
  },
  btnCancelarTef: {
    backgroundColor: "#c0392b",
  },
  btnConfirmar: {
    marginTop: 16,
    backgroundColor: colors.azul,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    minHeight: 48,
    justifyContent: "center",
  },
  btnDisabled: {
    opacity: 0.6,
  },
  btnConfirmarTexto: {
    color: colors.branco,
    fontWeight: "800",
    fontSize: 15,
  },
  btnCancelar: {
    marginTop: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  btnCancelarTexto: {
    color: "#666",
    fontWeight: "600",
    fontSize: 14,
  },
});
