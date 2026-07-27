import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
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
import { fromZonedTime, formatInTimeZone } from "date-fns-tz";
import colors from "@/src/constants/colors";
import DatePickerComponente from "@/src/components/DatePickerComponente";
import TimePickerComponente from "@/src/components/TimePickerComponente";
import {
  getReservaAdminDetalhe,
  postAlterarPeriodoReserva,
  ReservaAdminDetalhe,
} from "@/src/lib/hospedagemAdmin";
import { formatDateTimeHospedagem } from "@/src/lib/hospedagemOperacao";
import { HOSPEDAGEM_TZ } from "@/src/lib/hospedagemStatusOperacional";
import { useHospedagemAdminRefresh } from "../contexts/HospedagemAdminRefreshContext";

const MOTIVOS_SUGESTAO = [
  "Prorrogação da hospedagem",
  "Saída antecipada",
  "Alteração solicitada pelo cliente",
  "Ajuste operacional",
  "Outro",
] as const;

const DIA_INICIO = (() => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
})();
const DIA_FIM = (() => {
  const d = new Date();
  d.setHours(23, 30, 0, 0);
  return d;
})();
const INTERVALO_SLOTS_MIN = 30;

type Step = "atual" | "editar" | "confirmar";

type Props = {
  visible: boolean;
  idReservaHospedagem: number | null;
  onClose: () => void;
  onSucesso?: () => void;
};

function isMesmaDataLocal(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function minutosDesdeMeiaNoite(d: Date): number {
  return d.getHours() * 60 + d.getMinutes();
}

function aplicarHorarioBase(h: number, m: number): Date {
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
}

function proximoSlotAposAgora(
  agora: Date,
  intervaloMinutos = INTERVALO_SLOTS_MIN,
): number {
  const minutos = minutosDesdeMeiaNoite(agora);
  return Math.ceil((minutos + 1) / intervaloMinutos) * intervaloMinutos;
}

/** Mesmas regras da Nova Reserva (recepção). */
function calcularMinCheckinRecepcao(dataCheckin: Date, agora: Date): Date {
  if (!isMesmaDataLocal(dataCheckin, agora)) {
    return aplicarHorarioBase(0, 0);
  }
  const aposAgora = proximoSlotAposAgora(agora);
  if (aposAgora > minutosDesdeMeiaNoite(DIA_FIM)) {
    return aplicarHorarioBase(24, 0);
  }
  return aplicarHorarioBase(Math.floor(aposAgora / 60), aposAgora % 60);
}

function haHorariosCheckinDisponiveis(dataCheckin: Date, agora: Date): boolean {
  if (!isMesmaDataLocal(dataCheckin, agora)) return true;
  const min = calcularMinCheckinRecepcao(dataCheckin, agora);
  return minutosDesdeMeiaNoite(min) <= minutosDesdeMeiaNoite(DIA_FIM);
}

function combineDateTime(date: Date, time: Date): Date {
  const wall = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    time.getHours(),
    time.getMinutes(),
    0,
    0,
  );
  return fromZonedTime(wall, HOSPEDAGEM_TZ);
}

function splitIsoToLocalDateTime(iso: string): { date: Date; time: Date } {
  try {
    const dataStr = formatInTimeZone(new Date(iso), HOSPEDAGEM_TZ, "yyyy-MM-dd");
    const horaStr = formatInTimeZone(new Date(iso), HOSPEDAGEM_TZ, "HH:mm");
    const [yy, mm, dd] = dataStr.split("-").map(Number);
    const [hh, mi] = horaStr.split(":").map(Number);
    const date = new Date(yy, (mm || 1) - 1, dd || 1);
    const time = new Date();
    time.setHours(hh || 0, mi || 0, 0, 0);
    return { date, time };
  } catch {
    const fallback = new Date(iso);
    return { date: fallback, time: new Date(fallback) };
  }
}

/**
 * Operação própria de Alterar Período (não é edição completa).
 * Pickers iguais à Nova Reserva; disponibilidade via SuiteDisponibilidadeService (API).
 */
export default function AlterarPeriodoModal({
  visible,
  idReservaHospedagem,
  onClose,
  onSucesso,
}: Props) {
  const { notifyOperacaoConcluida } = useHospedagemAdminRefresh();
  const [step, setStep] = useState<Step>("atual");
  const [loading, setLoading] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [detalhe, setDetalhe] = useState<ReservaAdminDetalhe | null>(null);
  const [checkinDate, setCheckinDate] = useState(new Date());
  const [checkinTime, setCheckinTime] = useState(() => {
    const d = new Date();
    d.setHours(16, 0, 0, 0);
    return d;
  });
  const [checkoutDate, setCheckoutDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d;
  });
  const [checkoutTime, setCheckoutTime] = useState(() => {
    const d = new Date();
    d.setHours(13, 0, 0, 0);
    return d;
  });
  const [motivo, setMotivo] = useState("");
  const [agoraTick, setAgoraTick] = useState(() => new Date());

  useEffect(() => {
    if (!visible) return;
    const id = setInterval(() => setAgoraTick(new Date()), 30_000);
    return () => clearInterval(id);
  }, [visible]);

  useEffect(() => {
    if (!visible || !idReservaHospedagem) {
      setStep("atual");
      setDetalhe(null);
      setMotivo("");
      setErro(null);
      setLoading(false);
      setEnviando(false);
      return;
    }

    let cancelado = false;
    setLoading(true);
    setErro(null);
    setStep("atual");
    setMotivo("");

    getReservaAdminDetalhe(idReservaHospedagem)
      .then((resp) => {
        if (cancelado) return;
        if (resp.success && resp.data) {
          setDetalhe(resp.data);
          const ci = splitIsoToLocalDateTime(String(resp.data.checkin));
          const co = splitIsoToLocalDateTime(String(resp.data.checkout));
          setCheckinDate(ci.date);
          setCheckinTime(ci.time);
          setCheckoutDate(co.date);
          setCheckoutTime(co.time);
        } else {
          setErro(resp.message || "Não foi possível carregar a reserva.");
        }
      })
      .catch(() => {
        if (!cancelado) setErro("Erro ao carregar a reserva.");
      })
      .finally(() => {
        if (!cancelado) setLoading(false);
      });

    return () => {
      cancelado = true;
    };
  }, [visible, idReservaHospedagem]);

  const checkinMinEfetivo = useMemo(
    () => calcularMinCheckinRecepcao(checkinDate, agoraTick),
    [checkinDate, agoraTick],
  );

  const checkinHojeSemHorarios = useMemo(
    () =>
      isMesmaDataLocal(checkinDate, agoraTick) &&
      !haHorariosCheckinDisponiveis(checkinDate, agoraTick),
    [checkinDate, agoraTick],
  );

  const checkinIsoNovo = useMemo(
    () => combineDateTime(checkinDate, checkinTime).toISOString(),
    [checkinDate, checkinTime],
  );
  const checkoutIsoNovo = useMemo(
    () => combineDateTime(checkoutDate, checkoutTime).toISOString(),
    [checkoutDate, checkoutTime],
  );

  const periodoInvalido = useMemo(() => {
    if (checkinHojeSemHorarios) {
      return "Não há mais horários disponíveis para check-in hoje.";
    }
    if (
      combineDateTime(checkoutDate, checkoutTime).getTime() <=
      combineDateTime(checkinDate, checkinTime).getTime()
    ) {
      return "O check-out deve ser posterior ao check-in.";
    }
    return null;
  }, [
    checkinDate,
    checkinTime,
    checkoutDate,
    checkoutTime,
    checkinHojeSemHorarios,
  ]);

  const confirmar = async () => {
    if (!idReservaHospedagem || periodoInvalido) return;
    setEnviando(true);
    setErro(null);
    try {
      const resp = await postAlterarPeriodoReserva(idReservaHospedagem, {
        checkin: checkinIsoNovo,
        checkout: checkoutIsoNovo,
        motivo: motivo.trim() || null,
      });
      if (!resp.success) {
        setErro(resp.message || "Não foi possível alterar o período.");
        return;
      }
      notifyOperacaoConcluida();
      onSucesso?.();
      onClose();
    } catch {
      setErro("Erro ao alterar o período.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={() => !enviando && onClose()}
    >
      <Pressable
        style={styles.backdrop}
        onPress={() => !enviando && onClose()}
      >
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />
          <View style={styles.headerRow}>
            <Text style={styles.titulo}>Alterar Período</Text>
            <TouchableOpacity
              onPress={() => !enviando && onClose()}
              hitSlop={12}
              disabled={enviando}
            >
              <Feather name="x" size={22} color={colors.cinza} />
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator
              size="small"
              color={colors.azul}
              style={{ marginVertical: 24 }}
            />
          ) : (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scroll}
              keyboardShouldPersistTaps="handled"
            >
              {erro ? <Text style={styles.erro}>{erro}</Text> : null}

              {step === "atual" && detalhe ? (
                <View style={styles.bloco}>
                  <Text style={styles.label}>Check-in</Text>
                  <Text style={styles.valorDestaque}>
                    {formatDateTimeHospedagem(detalhe.checkin)}
                  </Text>
                  <Text style={[styles.label, { marginTop: 14 }]}>
                    Check-out
                  </Text>
                  <Text style={styles.valorDestaque}>
                    {formatDateTimeHospedagem(detalhe.checkout)}
                  </Text>
                  <TouchableOpacity
                    style={styles.btnPrimario}
                    onPress={() => setStep("editar")}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.btnPrimarioTexto}>Alterar período</Text>
                  </TouchableOpacity>
                </View>
              ) : null}

              {step === "editar" ? (
                <View style={styles.bloco}>
                  <Text style={styles.subtitulo}>Novo período</Text>
                  <Text style={styles.hint}>Horário personalizado</Text>

                  <Text style={styles.label}>Check-in</Text>
                  <View style={styles.dateTimeRow}>
                    <View style={styles.dateField}>
                      <DatePickerComponente
                        value={checkinDate}
                        onChange={setCheckinDate}
                      />
                    </View>
                    <View style={styles.timeField}>
                      <TimePickerComponente
                        value={checkinTime}
                        onChange={setCheckinTime}
                        minTime={checkinMinEfetivo}
                        maxTime={DIA_FIM}
                      />
                    </View>
                  </View>

                  <Text style={[styles.label, { marginTop: 12 }]}>
                    Check-out
                  </Text>
                  <View style={styles.dateTimeRow}>
                    <View style={styles.dateField}>
                      <DatePickerComponente
                        value={checkoutDate}
                        onChange={setCheckoutDate}
                      />
                    </View>
                    <View style={styles.timeField}>
                      <TimePickerComponente
                        value={checkoutTime}
                        onChange={setCheckoutTime}
                        minTime={DIA_INICIO}
                        maxTime={DIA_FIM}
                      />
                    </View>
                  </View>

                  {periodoInvalido ? (
                    <Text style={styles.erro}>{periodoInvalido}</Text>
                  ) : null}

                  <View style={styles.confirmRow}>
                    <TouchableOpacity
                      style={styles.btnSecundarioFlex}
                      onPress={() => setStep("atual")}
                    >
                      <Text style={styles.btnSecundarioTexto}>Voltar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.btnPrimarioFlex,
                        Boolean(periodoInvalido) && styles.btnDesabilitado,
                      ]}
                      onPress={() => {
                        if (!periodoInvalido) setStep("confirmar");
                      }}
                      disabled={Boolean(periodoInvalido)}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.btnPrimarioTexto}>Continuar</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : null}

              {step === "confirmar" && detalhe ? (
                <View style={styles.bloco}>
                  <Text style={styles.subtitulo}>Confirmar alteração?</Text>
                  <Text style={styles.label}>Check-in</Text>
                  <Text style={styles.meta}>
                    {formatDateTimeHospedagem(detalhe.checkin)}
                  </Text>
                  <Text style={styles.seta}>↓</Text>
                  <Text style={styles.valorDestaque}>
                    {formatDateTimeHospedagem(checkinIsoNovo)}
                  </Text>

                  <Text style={[styles.label, { marginTop: 14 }]}>
                    Check-out
                  </Text>
                  <Text style={styles.meta}>
                    {formatDateTimeHospedagem(detalhe.checkout)}
                  </Text>
                  <Text style={styles.seta}>↓</Text>
                  <Text style={styles.valorDestaque}>
                    {formatDateTimeHospedagem(checkoutIsoNovo)}
                  </Text>

                  <Text style={styles.avisoFinanceiro}>
                    A alteração do período pode alterar o valor da hospedagem.
                    O ajuste financeiro deverá ser realizado separadamente.
                  </Text>

                  <Text style={[styles.label, { marginTop: 14 }]}>Motivo</Text>
                  <Text style={styles.hint}>(opcional)</Text>
                  <View style={styles.chips}>
                    {MOTIVOS_SUGESTAO.map((m) => {
                      const ativo = motivo === m;
                      return (
                        <TouchableOpacity
                          key={m}
                          style={[styles.chip, ativo && styles.chipAtivo]}
                          onPress={() => setMotivo(m)}
                        >
                          <Text
                            style={[
                              styles.chipTexto,
                              ativo && styles.chipTextoAtivo,
                            ]}
                          >
                            {m}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                  <TextInput
                    style={styles.input}
                    placeholder="Descreva o motivo (opcional)"
                    placeholderTextColor={colors.cinza}
                    value={motivo}
                    onChangeText={setMotivo}
                    editable={!enviando}
                  />

                  <View style={styles.confirmRow}>
                    <TouchableOpacity
                      style={styles.btnSecundarioFlex}
                      onPress={() => setStep("editar")}
                      disabled={enviando}
                    >
                      <Text style={styles.btnSecundarioTexto}>Voltar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.btnPrimarioFlex,
                        enviando && styles.btnDesabilitado,
                      ]}
                      onPress={confirmar}
                      disabled={enviando}
                      activeOpacity={0.85}
                    >
                      {enviando ? (
                        <ActivityIndicator color={colors.branco} />
                      ) : (
                        <Text style={styles.btnPrimarioTexto}>Confirmar</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              ) : null}
            </ScrollView>
          )}
        </Pressable>
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
  sheet: {
    backgroundColor: colors.branco,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 14,
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
    marginBottom: 8,
  },
  titulo: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.cinza,
  },
  scroll: { paddingBottom: 12 },
  bloco: { paddingTop: 4 },
  label: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.cinza,
    opacity: 0.7,
    textTransform: "uppercase",
  },
  valorDestaque: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.cinza,
    marginTop: 4,
  },
  meta: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  seta: {
    fontSize: 16,
    color: "#999",
    marginVertical: 4,
  },
  subtitulo: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.cinza,
    marginBottom: 8,
  },
  hint: {
    fontSize: 12,
    color: colors.cinza,
    opacity: 0.65,
    marginBottom: 8,
  },
  dateTimeRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 6,
  },
  dateField: { flex: 1.2 },
  timeField: { flex: 1 },
  avisoFinanceiro: {
    marginTop: 16,
    fontSize: 13,
    color: "#9a6700",
    backgroundColor: "#fff8e6",
    borderRadius: 10,
    padding: 10,
    lineHeight: 18,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8,
    marginBottom: 10,
  },
  chip: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  chipAtivo: {
    backgroundColor: colors.azul,
    borderColor: colors.azul,
  },
  chipTexto: {
    fontSize: 12,
    color: colors.cinza,
    fontWeight: "600",
  },
  chipTextoAtivo: { color: colors.branco },
  input: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === "ios" ? 12 : 8,
    fontSize: 15,
    color: colors.cinza,
  },
  confirmRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 18,
  },
  btnPrimario: {
    marginTop: 20,
    backgroundColor: colors.azul,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  btnPrimarioFlex: {
    flex: 1,
    backgroundColor: colors.azul,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  btnPrimarioTexto: {
    color: colors.branco,
    fontWeight: "700",
    fontSize: 15,
  },
  btnSecundarioFlex: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.line,
  },
  btnSecundarioTexto: {
    color: colors.cinza,
    fontWeight: "600",
    fontSize: 15,
  },
  erro: {
    color: colors.red,
    fontSize: 13,
    marginBottom: 10,
    marginTop: 8,
  },
  btnDesabilitado: { opacity: 0.55 },
});
