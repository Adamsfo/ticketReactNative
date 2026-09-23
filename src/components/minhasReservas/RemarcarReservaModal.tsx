import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { parseISO } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { initMercadoPago, Payment } from "@mercadopago/sdk-react";
import DatePickerComponente from "@/src/components/DatePickerComponente";
import TimePickerComponente from "@/src/components/TimePickerComponente";
import formatCurrency from "@/src/components/FormatCurrency";
import colors from "@/src/constants/colors";
import { useAuth } from "@/src/contexts_/AuthContext";
import {
  consultarPagamentoRemarcacaoMinhaReserva,
  criarPixRemarcacaoMinhaReserva,
  obterPixPendenteRemarcacaoMinhaReserva,
  pagarCartaoRemarcacaoMinhaReserva,
  remarcarMinhaReserva,
  type MinhaReservaDetalhe,
  type RemarcacaoClienteInfo,
  type ResultadoRemarcacaoMinhaReserva,
} from "@/src/lib/reservaSuite";
import DeviceIdWeb from "@/src/components/DeviceIdWeb";
import * as Device from "expo-device";
import * as Application from "expo-application";
import { TAXA_REMARCACAO_CLIENTE } from "@/src/lib/remarcacaoClienteConfig";
import { calcularNoitesHotelaria } from "@/src/lib/reservaSuitePricing";

const MP_PUBLIC_KEY = process.env.EXPO_PUBLIC_MP_PUBLIC_KEY || "";

type Props = {
  visible: boolean;
  reserva: MinhaReservaDetalhe;
  onClose: () => void;
  onSucesso: (resultado: ResultadoRemarcacaoMinhaReserva) => void;
};

function combineDateTime(date: Date, time: Date): Date {
  const result = new Date(date);
  result.setHours(time.getHours(), time.getMinutes(), 0, 0);
  return result;
}

function formatarDataHora(valor: string): string {
  try {
    return formatInTimeZone(
      parseISO(valor),
      "America/Cuiaba",
      "dd/MM/yyyy 'às' HH:mm",
    );
  } catch {
    return valor;
  }
}

function extrairQrPix(pointOfInteraction: unknown): string | null {
  const poi = pointOfInteraction as {
    transaction_data?: { qr_code_base64?: string; qr_code?: string };
  };
  return poi?.transaction_data?.qr_code_base64 ?? null;
}

function montarResultadoSucesso(
  reserva: MinhaReservaDetalhe,
  remarcacao: RemarcacaoClienteInfo,
  resultadoAtual: ResultadoRemarcacaoMinhaReserva | null,
  resp?: {
    checkin?: string;
    checkout?: string;
    valorPago?: number;
    saldoPendente?: number;
  },
): ResultadoRemarcacaoMinhaReserva {
  const dataCheckInNova =
    resp?.checkin ??
    resultadoAtual?.dataCheckInNova ??
    remarcacao.remarcacaoPendente?.dataCheckInNova ??
    reserva.checkin;
  const dataCheckOutNova =
    resp?.checkout ??
    resultadoAtual?.dataCheckOutNova ??
    remarcacao.remarcacaoPendente?.dataCheckOutNova ??
    reserva.checkout;

  return {
    reservaId: reserva.id,
    remarcada: true,
    aguardandoPagamento: false,
    taxa: resultadoAtual?.taxa ?? remarcacao.taxaRemarcacao ?? TAXA_REMARCACAO_CLIENTE,
    valorPagamento: resultadoAtual?.valorPagamento ?? TAXA_REMARCACAO_CLIENTE,
    valorPago: Number(resp?.valorPago ?? resultadoAtual?.valorPago ?? reserva.financeiro.valorPago),
    saldoPendente: Number(
      resp?.saldoPendente ?? resultadoAtual?.saldoPendente ?? reserva.financeiro.saldoPendente,
    ),
    dataCheckInAnterior:
      resultadoAtual?.dataCheckInAnterior ?? reserva.checkin,
    dataCheckOutAnterior:
      resultadoAtual?.dataCheckOutAnterior ?? reserva.checkout,
    dataCheckInNova,
    dataCheckOutNova,
    idTaxa:
      resultadoAtual?.idTaxa ?? remarcacao.remarcacaoPendente?.idTaxa,
    idTransacao: resultadoAtual?.idTransacao,
  };
}

export default function RemarcarReservaModal({
  visible,
  reserva,
  onClose,
  onSucesso,
}: Props) {
  const { user } = useAuth();
  const remarcacao: RemarcacaoClienteInfo = reserva.remarcacao;

  const checkinAtual = useMemo(() => parseISO(reserva.checkin), [reserva.checkin]);
  const checkoutAtual = useMemo(
    () => parseISO(reserva.checkout),
    [reserva.checkout],
  );

  const [checkinDate, setCheckinDate] = useState(checkinAtual);
  const [checkinTime, setCheckinTime] = useState(checkinAtual);
  const [checkoutDate, setCheckoutDate] = useState(checkoutAtual);
  const [checkoutTime, setCheckoutTime] = useState(checkoutAtual);
  const [etapa, setEtapa] = useState<"datas" | "pagamento" | "sucesso">("datas");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [resultado, setResultado] = useState<ResultadoRemarcacaoMinhaReserva | null>(
    null,
  );
  const [paymentId, setPaymentId] = useState<string>("");
  const [qrBase64, setQrBase64] = useState<string | null>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [pollingPix, setPollingPix] = useState(false);
  const [pixJaGerado, setPixJaGerado] = useState(false);
  const [carregandoPix, setCarregandoPix] = useState(false);
  const pixCarregadoRef = useRef(false);

  useEffect(() => {
    initMercadoPago(MP_PUBLIC_KEY, { locale: "pt-BR" });
  }, []);

  useEffect(() => {
    if (!visible) return;
    setCheckinDate(checkinAtual);
    setCheckinTime(checkinAtual);
    setCheckoutDate(checkoutAtual);
    setCheckoutTime(checkoutAtual);
    setEtapa(remarcacao.remarcacaoPendente ? "pagamento" : "datas");
    setErro(null);
    setResultado(null);
    setPaymentId("");
    setQrBase64(null);
    setPollingPix(false);
    setPixJaGerado(false);
    setCarregandoPix(false);
    pixCarregadoRef.current = false;
  }, [visible, checkinAtual, checkoutAtual, remarcacao.remarcacaoPendente]);

  useEffect(() => {
    async function obterDeviceId() {
      if (Platform.OS === "web") return;
      try {
        const id =
          Application.applicationId ??
          Device.modelName ??
          `${Platform.OS}-${Date.now()}`;
        setDeviceId(String(id));
      } catch {
        setDeviceId(`${Platform.OS}-${Date.now()}`);
      }
    }
    obterDeviceId();
  }, []);

  const concluirSucesso = useCallback(
    (
      resp?: {
        checkin?: string;
        checkout?: string;
        valorPago?: number;
        saldoPendente?: number;
      },
    ) => {
      const novoResultado = montarResultadoSucesso(
        reserva,
        remarcacao,
        resultado,
        resp,
      );
      setResultado(novoResultado);
      setEtapa("sucesso");
      setPollingPix(false);
      onSucesso(novoResultado);
    },
    [onSucesso, remarcacao, reserva, resultado],
  );

  const aplicarDadosPix = useCallback(
    (dados: {
      id?: string | number;
      paymentId?: string;
      point_of_interaction?: unknown;
      reutilizado?: boolean;
    }) => {
      const id = String(dados.paymentId ?? dados.id ?? "");
      if (!id) return false;

      setPaymentId(id);
      setQrBase64(extrairQrPix(dados.point_of_interaction));
      setPixJaGerado(true);
      setPollingPix(true);
      return true;
    },
    [],
  );

  const carregarPixExistente = useCallback(async () => {
    if (pixCarregadoRef.current || carregandoPix) return;
    pixCarregadoRef.current = true;
    setCarregandoPix(true);
    setErro(null);

    try {
      const pixPendente = remarcacao.remarcacaoPendente?.pixPendente;
      if (pixPendente?.paymentId) {
        const resp = await obterPixPendenteRemarcacaoMinhaReserva(reserva.id);
        if (resp.success && resp.data) {
          aplicarDadosPix({
            paymentId: resp.data.paymentId,
            point_of_interaction: resp.data.point_of_interaction,
            reutilizado: true,
          });
          return;
        }
      }

      const resp = await obterPixPendenteRemarcacaoMinhaReserva(reserva.id);
      if (resp.success && resp.data?.paymentId) {
        aplicarDadosPix(resp.data);
      }
    } catch {
      // mantém opção de gerar manualmente se falhar
    } finally {
      setCarregandoPix(false);
    }
  }, [aplicarDadosPix, carregandoPix, remarcacao.remarcacaoPendente?.pixPendente, reserva.id]);

  useEffect(() => {
    if (!visible || etapa !== "pagamento") return;
    carregarPixExistente();
  }, [visible, etapa, carregarPixExistente]);

  useEffect(() => {
    if (!pollingPix || !paymentId) return;
    const interval = setInterval(async () => {
      try {
        const resp = await consultarPagamentoRemarcacaoMinhaReserva(
          reserva.id,
          paymentId,
        );
        if (resp.success && resp.data?.remarcada) {
          concluirSucesso(resp.data.reserva);
        } else if (resp.success && resp.data?.erroAplicacao) {
          setErro(
            `${resp.data.erroAplicacao} O pagamento foi registrado e será reprocessado automaticamente.`,
          );
        }
      } catch {
        // mantém polling
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [pollingPix, paymentId, reserva.id, concluirSucesso]);

  const taxa = remarcacao.taxaRemarcacao ?? 0;
  const gratuita = taxa === 0;

  const validarDatas = (): string | null => {
    const checkin = combineDateTime(checkinDate, checkinTime);
    const checkout = combineDateTime(checkoutDate, checkoutTime);
    if (checkout <= checkin) {
      return "O check-out deve ser posterior ao check-in.";
    }
    const noitesNovas = calcularNoitesHotelaria(checkin, checkout);
    const noitesOriginais = reserva.noites;
    if (noitesNovas !== noitesOriginais) {
      const sufixo = noitesOriginais === 1 ? "noite" : "noites";
      return `A remarcação deve manter a mesma quantidade de noites da reserva: ${noitesOriginais} ${sufixo}.`;
    }
    return null;
  };

  const handleConfirmarDatas = async () => {
    setErro(null);
    const erroDatas = validarDatas();
    if (erroDatas) {
      setErro(erroDatas);
      return;
    }

    const checkinIso = combineDateTime(checkinDate, checkinTime).toISOString();
    const checkoutIso = combineDateTime(checkoutDate, checkoutTime).toISOString();

    setLoading(true);
    try {
      const resp = await remarcarMinhaReserva(reserva.id, {
        dataCheckIn: checkinIso,
        dataCheckOut: checkoutIso,
      });

      if (!resp.success || !resp.data) {
        setErro(resp.message || "Não foi possível solicitar a remarcação.");
        return;
      }

      setResultado(resp.data);
      if (resp.data.remarcada) {
        concluirSucesso({
          checkin: resp.data.dataCheckInNova,
          checkout: resp.data.dataCheckOutNova,
          valorPago: resp.data.valorPago,
          saldoPendente: resp.data.saldoPendente,
        });
        return;
      }

      if (resp.data.aguardandoPagamento) {
        pixCarregadoRef.current = false;
        setPixJaGerado(false);
        setPaymentId("");
        setQrBase64(null);
        setEtapa("pagamento");
      }
    } catch {
      setErro("Erro ao solicitar remarcação. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleGerarPix = async () => {
    if (loading || pixJaGerado) return;
    setErro(null);
    const email = user?.email;
    if (!email) {
      setErro("E-mail do usuário não encontrado para pagamento.");
      return;
    }

    setLoading(true);
    try {
      const resp = await criarPixRemarcacaoMinhaReserva(reserva.id, email);
      if (!resp.success || !resp.data?.id) {
        setErro(resp.message || "Não foi possível gerar o PIX.");
        return;
      }

      if (resp.data.remarcada) {
        concluirSucesso();
        return;
      }

      aplicarDadosPix({
        id: resp.data.id,
        point_of_interaction: resp.data.point_of_interaction,
        reutilizado: resp.data.reutilizado,
      });
    } catch {
      setErro("Erro ao gerar pagamento PIX.");
    } finally {
      setLoading(false);
    }
  };

  const handlePagamentoCartao = async ({
    formData,
  }: {
    formData: Record<string, unknown>;
  }) => {
    setErro(null);
    setLoading(true);
    try {
      const resp = await pagarCartaoRemarcacaoMinhaReserva(reserva.id, {
        ...formData,
        deviceId,
        payer: {
          ...(formData.payer as object),
          email: user?.email,
        },
      });

      if (!resp.success) {
        setErro(resp.message || "Pagamento recusado.");
        return;
      }

      if (resp.data?.remarcada || resp.data?.status === "approved") {
        concluirSucesso();
        return;
      }

      if (resp.data?.id) {
        setPaymentId(String(resp.data.id));
        setPollingPix(true);
      }
    } catch {
      setErro("Erro ao processar pagamento com cartão.");
    } finally {
      setLoading(false);
    }
  };

  const valorPagamento =
    resultado?.valorPagamento ??
    remarcacao.remarcacaoPendente?.valorPagamento ??
    taxa;

  const novasDatasPagamento = resultado
    ? `${formatarDataHora(resultado.dataCheckInNova)} → ${formatarDataHora(resultado.dataCheckOutNova)}`
    : remarcacao.remarcacaoPendente
      ? `${formatarDataHora(remarcacao.remarcacaoPendente.dataCheckInNova)} → ${formatarDataHora(remarcacao.remarcacaoPendente.dataCheckOutNova)}`
      : null;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <ScrollView contentContainerStyle={styles.scroll}>
            <Text style={styles.titulo}>Remarcar reserva</Text>

            <Text style={styles.subtitulo}>Período atual</Text>
            <Text style={styles.texto}>
              Check-in: {formatarDataHora(reserva.checkin)}
            </Text>
            <Text style={styles.texto}>
              Check-out: {formatarDataHora(reserva.checkout)}
            </Text>

            {etapa === "datas" && (
              <>
                <Text style={styles.subtitulo}>Novo período</Text>
                <Text style={styles.label}>Novo check-in</Text>
                <DatePickerComponente value={checkinDate} onChange={setCheckinDate} />
                <TimePickerComponente value={checkinTime} onChange={setCheckinTime} />
                <Text style={styles.label}>Novo check-out</Text>
                <DatePickerComponente value={checkoutDate} onChange={setCheckoutDate} />
                <TimePickerComponente value={checkoutTime} onChange={setCheckoutTime} />

                <View style={styles.taxaBox}>
                  {gratuita ? (
                    <>
                      <Text style={styles.taxaTitulo}>Remarcação gratuita</Text>
                      <Text style={styles.texto}>Taxa: {formatCurrency(0)}</Text>
                    </>
                  ) : (
                    <>
                      <Text style={styles.taxaTitulo}>Taxa de remarcação</Text>
                      <Text style={styles.texto}>
                        {formatCurrency(taxa)}
                      </Text>
                    </>
                  )}
                </View>

                <TouchableOpacity
                  style={styles.btnPrimario}
                  onPress={handleConfirmarDatas}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.btnPrimarioTexto}>
                      {gratuita ? "Confirmar remarcação" : "Continuar para pagamento"}
                    </Text>
                  )}
                </TouchableOpacity>
              </>
            )}

            {etapa === "pagamento" && (
              <>
                <Text style={styles.subtitulo}>Pagamento da taxa</Text>
                <Text style={styles.texto}>
                  Taxa de remarcação: {formatCurrency(valorPagamento)}
                </Text>
                {novasDatasPagamento ? (
                  <Text style={styles.textoMuted}>
                    Novo período: {novasDatasPagamento}
                  </Text>
                ) : null}

                {carregandoPix ? (
                  <View style={styles.pollingRow}>
                    <ActivityIndicator color={colors.azul} />
                    <Text style={styles.textoMuted}>Carregando PIX...</Text>
                  </View>
                ) : null}

                {pixJaGerado ? (
                  <View style={styles.taxaBox}>
                    <Text style={styles.taxaTitulo}>PIX já gerado</Text>
                    <Text style={styles.textoMuted}>
                      Aguardando pagamento.
                    </Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.btnSecundario}
                    onPress={handleGerarPix}
                    disabled={loading || carregandoPix}
                  >
                    <Text style={styles.btnSecundarioTexto}>Pagar com PIX</Text>
                  </TouchableOpacity>
                )}

                {qrBase64 ? (
                  <Image
                    source={{ uri: `data:image/png;base64,${qrBase64}` }}
                    style={styles.qr}
                    resizeMode="contain"
                  />
                ) : null}

                {pollingPix ? (
                  <View style={styles.pollingRow}>
                    <ActivityIndicator color={colors.azul} />
                    <Text style={styles.textoMuted}>
                      Aguardando confirmação do pagamento...
                    </Text>
                  </View>
                ) : null}

                {Platform.OS === "web" && deviceId === null ? (
                  <DeviceIdWeb setDeviceId={setDeviceId} />
                ) : null}

                {Platform.OS === "web" && deviceId ? (
                  <View style={styles.mpContainer}>
                    <Payment
                      initialization={{
                        amount: Number(valorPagamento),
                        payer: { email: user?.email ?? "" },
                      }}
                      customization={{
                        visual: { hideFormTitle: true },
                        paymentMethods: {
                          creditCard: "all",
                          prepaidCard: ["all"],
                        },
                      }}
                      onSubmit={handlePagamentoCartao}
                    />
                  </View>
                ) : null}
              </>
            )}

            {etapa === "sucesso" && (
              <>
                <Text style={styles.sucessoTitulo}>
                  Remarcação realizada com sucesso.
                </Text>
                <Text style={styles.texto}>
                  Novo check-in:{" "}
                  {formatarDataHora(
                    resultado?.dataCheckInNova ??
                      remarcacao.remarcacaoPendente?.dataCheckInNova ??
                      reserva.checkin,
                  )}
                </Text>
                <Text style={styles.texto}>
                  Novo check-out:{" "}
                  {formatarDataHora(
                    resultado?.dataCheckOutNova ??
                      remarcacao.remarcacaoPendente?.dataCheckOutNova ??
                      reserva.checkout,
                  )}
                </Text>
              </>
            )}

            {erro ? <Text style={styles.erro}>{erro}</Text> : null}

            <TouchableOpacity style={styles.btnFechar} onPress={onClose}>
              <Text style={styles.btnFecharTexto}>
                {etapa === "sucesso" ? "Fechar" : "Cancelar"}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    padding: 16,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    maxHeight: "92%",
    padding: 16,
  },
  scroll: { paddingBottom: 12 },
  titulo: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.cinza,
    marginBottom: 12,
  },
  subtitulo: {
    fontSize: 15,
    fontWeight: "700",
    color: "#334155",
    marginTop: 12,
    marginBottom: 6,
  },
  label: {
    fontSize: 13,
    color: "#667085",
    marginTop: 8,
    marginBottom: 4,
  },
  texto: { fontSize: 14, color: "#475467", marginBottom: 4 },
  textoMuted: { fontSize: 13, color: "#667085", marginBottom: 2 },
  taxaBox: {
    marginTop: 16,
    padding: 12,
    borderRadius: 10,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E4E7EC",
  },
  taxaTitulo: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.cinza,
    marginBottom: 6,
  },
  btnPrimario: {
    marginTop: 16,
    backgroundColor: colors.azul,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  btnPrimarioTexto: { color: "#fff", fontWeight: "700", fontSize: 15 },
  btnSecundario: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: colors.azul,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  btnSecundarioTexto: { color: colors.azul, fontWeight: "700" },
  btnFechar: {
    marginTop: 16,
    alignItems: "center",
    paddingVertical: 10,
  },
  btnFecharTexto: { color: "#667085", fontWeight: "600" },
  erro: { color: colors.red, marginTop: 12 },
  sucessoTitulo: {
    fontSize: 16,
    fontWeight: "700",
    color: "#067647",
    marginBottom: 8,
  },
  qr: { width: 220, height: 220, alignSelf: "center", marginTop: 12 },
  pollingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
  },
  mpContainer: { marginTop: 16, minHeight: 280 },
});
