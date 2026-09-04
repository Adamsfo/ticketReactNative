import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  RefreshControl,
  Modal,
  TouchableWithoutFeedback,
} from "react-native";
import CadastroClienteRapido from "../components/CadastroClienteRapido";
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
  atualizarUsuarioReserva,
  corStatusReserva,
  getReservaAdminDetalhe,
  labelStatusReserva,
  postCancelarReservaHospedagem,
  postReenviarLinkPagamentoReserva,
  podeExibirCancelamentoReservaAdmin,
  ReservaAdminDetalhe,
} from "@/src/lib/hospedagemAdmin";
import { Usuario } from "@/src/types/geral";
import ResumoFinanceiroRecepcao from "../components/ResumoFinanceiroRecepcao";
import OrigemReservaIndicador from "../components/OrigemReservaIndicador";
import AlertaPossivelPagamentoOta from "../components/AlertaPossivelPagamentoOta";
import {
  ReceberSaldoHospedagemProvider,
  useReceberSaldoHospedagem,
} from "../contexts/ReceberSaldoHospedagemContext";
import ReceberSaldoHospedagemModal from "../components/ReceberSaldoHospedagemModal";
import { isHospedeSemCpf, textoObservacoesReserva } from "@/src/lib/hospedagemHospedes";
import { HospedagemAdminRefreshProvider, useHospedagemAdminRefresh } from "../contexts/HospedagemAdminRefreshContext";

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
    <HospedagemAdminRefreshProvider>
      <ReceberSaldoHospedagemProvider>
        <HospedagemReservaDetalheContent />
        <ReceberSaldoHospedagemModal />
      </ReceberSaldoHospedagemProvider>
    </HospedagemAdminRefreshProvider>
  );
}

function HospedagemReservaDetalheContent() {
  const navigation = useNavigation() as any;
  const route = useRoute();
  const { openReceberSaldo } = useReceberSaldoHospedagem();
  const { notifyOperacaoConcluida } = useHospedagemAdminRefresh();
  const { idReserva } = (route.params || {}) as { idReserva?: number };
  const id = Number(idReserva);

  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalCancelarOpen, setModalCancelarOpen] = useState(false);
  const [motivoCancelamento, setMotivoCancelamento] = useState("");
  const [cancelandoReserva, setCancelandoReserva] = useState(false);
  const [erroCancelamento, setErroCancelamento] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [reserva, setReserva] = useState<ReservaAdminDetalhe | null>(null);
  const [reenviandoLink, setReenviandoLink] = useState(false);
  const [msgLink, setMsgLink] = useState<string | null>(null);
  const [erroCadastroCliente, setErroCadastroCliente] = useState<string | null>(
    null,
  );
  const [vinculandoCliente, setVinculandoCliente] = useState(false);

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

  const handleOnCadastrado = async (usuario: Usuario) => {
    const idCliente = Number(usuario.id_cliente);
    if (!reserva?.id || !Number.isFinite(idCliente) || idCliente <= 0) {
      setErroCadastroCliente(
        "Cliente cadastrado, mas sem id_cliente para vincular à reserva.",
      );
      return;
    }
    setVinculandoCliente(true);
    setErroCadastroCliente(null);
    try {
      const resp = await atualizarUsuarioReserva(reserva.id, idCliente);
      if (!resp.success) {
        setErroCadastroCliente(
          resp.message || "Não foi possível vincular o cliente à reserva.",
        );
        return;
      }
      setModalOpen(false);
      await carregar(true);
    } catch {
      setErroCadastroCliente("Erro ao vincular o cliente à reserva.");
    } finally {
      setVinculandoCliente(false);
    }
  };

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

  const abrirModalCancelar = () => {
    setMotivoCancelamento("");
    setErroCancelamento(null);
    setModalCancelarOpen(true);
  };

  const handleConfirmarCancelamento = async () => {
    if (!reserva?.id) return;
    const motivo = motivoCancelamento.trim();
    if (!motivo) {
      setErroCancelamento("Informe o motivo do cancelamento.");
      return;
    }

    setCancelandoReserva(true);
    setErroCancelamento(null);
    try {
      const resp = await postCancelarReservaHospedagem(reserva.id, motivo);
      if (!resp.success || !resp.data) {
        setErroCancelamento(resp.message || "Não foi possível cancelar a reserva.");
        return;
      }
      setReserva(resp.data);
      setModalCancelarOpen(false);
      setMotivoCancelamento("");
      notifyOperacaoConcluida();
    } catch {
      setErroCancelamento("Erro ao cancelar a reserva.");
    } finally {
      setCancelandoReserva(false);
    }
  };

  const status = reserva?.status ?? "Confirmada";
  const cor = corStatusReserva(status);
  const podeReenviarLink =
    (reserva?.statusOriginal === "AguardandoPagamento" ||
      status === "AguardandoPagamento") &&
    Boolean(
      reserva?.tokenPagamento ||
        reserva?.linkPagamento ||
        reserva?.idTransacao,
    );
  const pagamento = reserva?.pagamento ?? null;
  const nomeResponsavel =
    reserva?.nomeResponsavel || reserva?.responsavel || "";
  const mostrarCadastrarCliente = isHospedeSemCpf(nomeResponsavel);
  const observacoesReservaCadastro = textoObservacoesReserva(reserva);
  const exibirBotaoCancelar = podeExibirCancelamentoReservaAdmin(reserva);
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
    if (
      suite.valorOriginal != null &&
      suite.descontoValor != null &&
      suite.descontoValor > 0
    ) {
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
                  <Text style={styles.responsavel}>{nomeResponsavel}</Text>
                  {reserva.telefone ? (
                    <Text style={styles.meta}>{reserva.telefone}</Text>
                  ) : null}
                  {reserva.email ? (
                    <Text style={styles.meta}>{reserva.email}</Text>
                  ) : null}

                  {mostrarCadastrarCliente ? (
                    <TouchableOpacity
                      style={styles.botaoCadastrarCliente}
                      onPress={() => {
                        setErroCadastroCliente(null);
                        setModalOpen(true);
                      }}
                      activeOpacity={0.85}
                    >
                      <Feather
                        name="user-plus"
                        size={16}
                        color={colors.branco}
                      />
                      <Text style={styles.botaoCadastrarClienteTexto}>
                        Cadastrar cliente
                      </Text>
                    </TouchableOpacity>
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
                            {formatCurrency(
                              suite.valorFinal ??
                                suite.valorTotal ??
                                suite.preco,
                            )}
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
                  <ResumoFinanceiroRecepcao
                    dados={reserva}
                    mostrarReceberSaldo
                    onReceberSaldo={() => {
                      openReceberSaldo({
                        idReservaHospedagem: reserva.idReservaHospedagem,
                        saldoPendente: Number(reserva.saldoPendente ?? 0),
                        valorTotal: reserva.valorTotal,
                        valorPago: reserva.valorPago,
                        suiteNome: reserva.suites?.[0]?.nome,
                        responsavel:
                          reserva.responsavel || reserva.nomeResponsavel,
                        onSuccess: () => carregar(true),
                        possivelPagamentoOta: Boolean(
                          reserva.possivelPagamentoOta,
                        ),
                        possivelPagamentoOtaTrecho:
                          reserva.possivelPagamentoOtaTrecho ?? null,
                        canalVendaLabel:
                          reserva.canalVendaLabel ||
                          reserva.canalVenda ||
                          null,
                      });
                    }}
                  />
                  {reserva.possivelPagamentoOta ? (
                    <View style={{ marginTop: 10 }}>
                      <AlertaPossivelPagamentoOta
                        canalLabel={
                          reserva.canalVendaLabel || reserva.canalVenda
                        }
                        trecho={reserva.possivelPagamentoOtaTrecho}
                      />
                    </View>
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
            {exibirBotaoCancelar ? (
              <TouchableOpacity
                style={[styles.botaoAcao, styles.botaoDanger]}
                onPress={abrirModalCancelar}
              >
                <Text style={styles.botaoAcaoTexto}>Cancelar</Text>
              </TouchableOpacity>
            ) : null}
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

      <Modal
        visible={modalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!vinculandoCliente) setModalOpen(false);
        }}
      >
        <View style={styles.modalContainer}>
          <TouchableWithoutFeedback
            onPress={() => {
              if (!vinculandoCliente) setModalOpen(false);
            }}
          >
            <View style={styles.overlay} />
          </TouchableWithoutFeedback>
          <View
            style={[
              styles.modalContent,
              observacoesReservaCadastro.length > 0 && styles.modalContentLargo,
            ]}
          >
            {vinculandoCliente ? (
              <View style={styles.vinculandoBox}>
                <ActivityIndicator size="large" color={colors.azul} />
                <Text style={styles.estadoTexto}>
                  Vinculando cliente à reserva...
                </Text>
              </View>
            ) : (
              <>
                <CadastroClienteRapido
                  onCadastrado={handleOnCadastrado}
                  onCancelar={() => setModalOpen(false)}
                  observacoesReserva={observacoesReservaCadastro}
                  cadastroSomenteMysql={true}
                />
                {erroCadastroCliente ? (
                  <Text style={styles.erroCadastro}>{erroCadastroCliente}</Text>
                ) : null}
              </>
            )}
          </View>
        </View>
      </Modal>

      <Modal
        visible={modalCancelarOpen}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!cancelandoReserva) setModalCancelarOpen(false);
        }}
      >
        <View style={styles.modalContainer}>
          <TouchableWithoutFeedback
            onPress={() => {
              if (!cancelandoReserva) setModalCancelarOpen(false);
            }}
          >
            <View style={styles.overlay} />
          </TouchableWithoutFeedback>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitulo}>Cancelar reserva</Text>
            <Text style={styles.modalSubtitulo}>
              Esta ação altera o status para Cancelada. Informe o motivo.
            </Text>
            <TextInput
              style={styles.inputMotivo}
              value={motivoCancelamento}
              onChangeText={setMotivoCancelamento}
              placeholder="Motivo do cancelamento"
              placeholderTextColor="#9ca3af"
              multiline
              editable={!cancelandoReserva}
            />
            {erroCancelamento ? (
              <Text style={styles.erroCadastro}>{erroCancelamento}</Text>
            ) : null}
            <View style={styles.modalAcoes}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnSec]}
                onPress={() => setModalCancelarOpen(false)}
                disabled={cancelandoReserva}
              >
                <Text style={styles.modalBtnSecTexto}>Voltar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnDanger]}
                onPress={handleConfirmarCancelamento}
                disabled={cancelandoReserva}
              >
                {cancelandoReserva ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.modalBtnDangerTexto}>Confirmar cancelamento</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  botaoCadastrarCliente: {
    marginTop: 14,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.azul,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  botaoCadastrarClienteTexto: {
    color: colors.branco,
    fontWeight: "700",
    fontSize: 14,
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
  erroCadastro: {
    marginTop: 10,
    fontSize: 13,
    color: colors.red,
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
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    width: "90%",
    maxWidth: 480,
    maxHeight: "90%",
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
  },
  modalContentLargo: {
    maxWidth: 920,
  },
  vinculandoBox: {
    paddingVertical: 28,
    alignItems: "center",
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
  modalTitulo: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.cinza,
    marginBottom: 8,
  },
  modalSubtitulo: {
    fontSize: 14,
    color: colors.cinza,
    marginBottom: 12,
  },
  inputMotivo: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 88,
    textAlignVertical: "top",
    fontSize: 15,
    color: colors.cinza,
  },
  modalAcoes: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
  },
  modalBtnSec: {
    backgroundColor: "#e5e7eb",
  },
  modalBtnSecTexto: {
    color: colors.cinza,
    fontWeight: "700",
  },
  modalBtnDanger: {
    backgroundColor: "#c0392b",
  },
  modalBtnDangerTexto: {
    color: colors.branco,
    fontWeight: "700",
  },
});
