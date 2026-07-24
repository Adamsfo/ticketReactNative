import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import colors from "@/src/constants/colors";
import formatCurrency from "@/src/components/FormatCurrency";
import {
  getReservaAdminDetalhe,
  ReservaAdminDetalhe,
} from "@/src/lib/hospedagemAdmin";
import {
  acoesSheetPorStatus,
  checkinDisponivelInfo,
  CORES_STATUS_OPERACIONAL,
  corStatusOperacionalPadrao,
  executarCheckinOperacional,
  executarCheckoutOperacional,
  formatDateTimeHospedagem,
  getStatusOperacionalSuite,
  labelStatusOperacionalPadrao,
  ReservaOperacaoRef,
} from "@/src/lib/hospedagemOperacao";
import { useHospedagemAdminRefresh } from "../contexts/HospedagemAdminRefreshContext";
import { useNovaReservaRecepcao } from "../contexts/NovaReservaRecepcaoContext";
import ResumoFinanceiroRecepcao from "./ResumoFinanceiroRecepcao";
import OrigemReservaIndicador from "./OrigemReservaIndicador";

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
 * Novas ações devem ser adicionadas aqui uma única vez.
 */
export default function ReservaOperacaoSheet({
  reserva,
  visible,
  onClose,
  dataReferencia,
}: Props) {
  const navigation = useNavigation() as any;
  const { notifyOperacaoConcluida } = useHospedagemAdminRefresh();
  const { openNovaReserva } = useNovaReservaRecepcao();
  const [detalhe, setDetalhe] = useState<ReservaAdminDetalhe | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirmMode, setConfirmMode] = useState<ConfirmMode>(null);
  const [executando, setExecutando] = useState(false);
  const [erroAcao, setErroAcao] = useState<string | null>(null);

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

    getReservaAdminDetalhe(reserva.idReservaHospedagem)
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
  }, [visible, reserva?.idReservaHospedagem]);

  const statusDb =
    detalhe?.status ?? reserva?.statusReserva ?? reserva?.status ?? "";
  const checkinIso = detalhe?.checkin ?? reserva?.inicio ?? "";
  const checkoutIso =
    detalhe?.dataHoraCheckoutRealizado ??
    detalhe?.checkout ??
    reserva?.fim ??
    "";
  const dataHoraCheckinReal =
    detalhe?.dataHoraCheckinReal ?? reserva?.dataHoraCheckinReal ?? null;

  const statusOp = useMemo(
    () =>
      getStatusOperacionalSuite({
        statusReserva: statusDb,
        statusOperacional:
          statusDb === "CheckOutRealizado" || statusDb === "CheckoutRealizado"
            ? "CHECKOUT_REALIZADO"
            : reserva?.status,
        checkin: checkinIso,
        checkout: checkoutIso,
        dataHoraCheckinReal,
        dataReferencia,
      }),
    [
      statusDb,
      reserva?.status,
      checkinIso,
      checkoutIso,
      dataHoraCheckinReal,
      dataReferencia,
    ],
  );

  const acoes = acoesSheetPorStatus(statusOp);
  const checkinInfo = useMemo(
    () =>
      checkinIso
        ? checkinDisponivelInfo(checkinIso)
        : { disponivel: false, labelDisponivelEm: null },
    [checkinIso],
  );
  const podeExecutarCheckin =
    acoes.realizarCheckin && checkinInfo.disponivel && !executando;
  const podeExecutarCheckout = acoes.realizarCheckout && !executando;

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
    const checkinDate =
      dataReferencia ||
      (() => {
        const hoje = new Date();
        const y = hoje.getFullYear();
        const m = String(hoje.getMonth() + 1).padStart(2, "0");
        const d = String(hoje.getDate()).padStart(2, "0");
        return `${y}-${m}-${d}`;
      })();
    openNovaReserva({
      idEvento: reserva.idEvento,
      idEventoSuite: reserva.idEventoSuite ?? undefined,
      checkinDate,
      checkinHora: "16:00",
    });
  };

  const confirmarOperacao = async () => {
    if (!reserva.idReservaHospedagem || !confirmMode) return;
    const mode = confirmMode;
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
      if (resp.data) setDetalhe(resp.data);
      setConfirmMode(null);
      notifyOperacaoConcluida();
      // Check-in: fecha o sheet; check-out: permanece com badge cinza
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
                {labelStatusOperacionalPadrao(statusOp).toUpperCase()}
              </Text>
            </View>

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
                    label="Hóspedes"
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
                <Campo
                  label="Status"
                  valor={labelStatusOperacionalPadrao(statusOp)}
                />
                <OrigemReservaIndicador
                  dados={detalhe ?? undefined}
                  variante="sheet"
                />
                <ResumoFinanceiroRecepcao
                  dados={detalhe}
                  mostrarReceberSaldo={Boolean(acoes.realizarCheckin)}
                />
              </View>
            )}

            {erroAcao ? <Text style={styles.erroAcao}>{erroAcao}</Text> : null}

            <Text style={styles.acoesTitulo}>Ações</Text>

            {acoes.realizarCheckin ? (
              <>
                <TouchableOpacity
                  style={[
                    styles.btnAcao,
                    { backgroundColor: CORES_STATUS_OPERACIONAL.livre },
                    !podeExecutarCheckin && styles.btnDesabilitado,
                  ]}
                  onPress={() => {
                    if (podeExecutarCheckin) setConfirmMode("checkin");
                  }}
                  disabled={!podeExecutarCheckin}
                  activeOpacity={0.85}
                >
                  <Text style={styles.btnAcaoTexto}>Realizar Check-in</Text>
                </TouchableOpacity>
                {!checkinInfo.disponivel && checkinInfo.labelDisponivelEm ? (
                  <Text style={styles.hintCheckin}>
                    Check-in disponível em {checkinInfo.labelDisponivelEm}
                  </Text>
                ) : null}
              </>
            ) : null}

            {acoes.verReserva &&
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

            {acoes.realizarCheckout ? (
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

            {acoes.verReserva &&
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

            {acoes.novaReserva ? (
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
