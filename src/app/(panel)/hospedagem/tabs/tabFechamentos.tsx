import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { formatInTimeZone } from "date-fns-tz";
import colors from "@/src/constants/colors";
import DatePickerComponente from "@/src/components/DatePickerComponente";
import ModalMsg from "@/src/components/ModalMsg";
import {
  atualizarFechamentoExcepcionalAdmin,
  criarFechamentoExcepcionalAdmin,
  listarEventosPousadaAdmin,
  listarFechamentosExcepcionaisAdmin,
  type EventoPousadaAdmin,
  type FechamentoExcepcionalAdmin,
} from "@/src/lib/hospedagemFechamentos";
import { useHospedagemDesktopLayout } from "../useHospedagemDesktopLayout";

const TZ = "America/Cuiaba";

function formatarDataBr(iso: string): string {
  try {
    return formatInTimeZone(`${iso}T12:00:00`, TZ, "dd/MM/yyyy");
  } catch {
    return iso;
  }
}

function dataCivilFromDate(d: Date): string {
  return formatInTimeZone(d, TZ, "yyyy-MM-dd");
}

function mensagemErro(e: unknown, fallback: string): string {
  if (e instanceof Error && e.message.trim()) {
    return e.message;
  }
  return fallback;
}

export default function TabFechamentos() {
  const { isDesktop } = useHospedagemDesktopLayout();
  const [eventos, setEventos] = useState<EventoPousadaAdmin[]>([]);
  const [idEvento, setIdEvento] = useState<number>(0);
  const [lista, setLista] = useState<FechamentoExcepcionalAdmin[]>([]);
  const [incluirInativos, setIncluirInativos] = useState(true);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [salvando, setSalvando] = useState(false);

  const [dataInicio, setDataInicio] = useState(() => new Date());
  const [dataFim, setDataFim] = useState(() => new Date());
  const [motivo, setMotivo] = useState("");
  const [editando, setEditando] = useState<FechamentoExcepcionalAdmin | null>(
    null,
  );

  const [msg, setMsg] = useState<{ titulo: string; texto: string } | null>(
    null,
  );

  const carregarEventos = useCallback(async () => {
    try {
      const ev = await listarEventosPousadaAdmin();
      setEventos(ev);
      setIdEvento((atual) => {
        if (atual > 0 && ev.some((item) => item.id === atual)) {
          return atual;
        }
        return ev[0]?.id ?? 0;
      });
    } catch (e) {
      setMsg({
        titulo: "Erro",
        texto: mensagemErro(
          e,
          "Não foi possível carregar os eventos de pousada.",
        ),
      });
    }
  }, []);

  const carregarLista = useCallback(
    async (isRefresh = false) => {
      if (!idEvento) {
        setLista([]);
        setLoading(false);
        return;
      }
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      try {
        const rows = await listarFechamentosExcepcionaisAdmin({
          idEvento,
          incluirInativos,
        });
        setLista(rows);
      } catch (e) {
        setMsg({
          titulo: "Erro",
          texto: mensagemErro(
            e,
            "Não foi possível carregar os fechamentos.",
          ),
        });
        setLista([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [idEvento, incluirInativos],
  );

  useEffect(() => {
    carregarEventos();
  }, [carregarEventos]);

  useEffect(() => {
    carregarLista();
  }, [carregarLista]);

  const limparFormulario = () => {
    setEditando(null);
    setMotivo("");
    const hoje = new Date();
    setDataInicio(hoje);
    setDataFim(hoje);
  };

  const handleSalvar = async () => {
    if (!idEvento) {
      setMsg({
        titulo: "Pousada não disponível",
        texto:
          "Não foi possível identificar o evento da pousada. Aguarde o carregamento ou verifique seu acesso.",
      });
      return;
    }
    const di = dataCivilFromDate(dataInicio);
    const df = dataCivilFromDate(dataFim);
    if (df < di) {
      setMsg({
        titulo: "Datas inválidas",
        texto: "A data final deve ser igual ou posterior à inicial.",
      });
      return;
    }
    setSalvando(true);
    try {
      if (editando) {
        await atualizarFechamentoExcepcionalAdmin(editando.id, {
          dataInicio: di,
          dataFim: df,
          motivo: motivo.trim() || null,
        });
        setMsg({ titulo: "Sucesso", texto: "Fechamento atualizado." });
      } else {
        await criarFechamentoExcepcionalAdmin({
          idEvento,
          dataInicio: di,
          dataFim: df,
          motivo: motivo.trim() || null,
        });
        setMsg({ titulo: "Sucesso", texto: "Fechamento cadastrado." });
      }
      limparFormulario();
      await carregarLista(true);
    } catch (e: unknown) {
      setMsg({
        titulo: "Erro",
        texto: mensagemErro(e, "Não foi possível salvar o fechamento."),
      });
    } finally {
      setSalvando(false);
    }
  };

  const handleEditar = (item: FechamentoExcepcionalAdmin) => {
    setEditando(item);
    setMotivo(item.motivo ?? "");
    setDataInicio(new Date(`${item.dataInicio}T12:00:00`));
    setDataFim(new Date(`${item.dataFim}T12:00:00`));
  };

  const handleToggleAtivo = async (item: FechamentoExcepcionalAdmin) => {
    try {
      await atualizarFechamentoExcepcionalAdmin(item.id, {
        ativo: !item.ativo,
      });
      await carregarLista(true);
    } catch (e) {
      setMsg({
        titulo: "Erro",
        texto: mensagemErro(
          e,
          "Não foi possível alterar o status do fechamento.",
        ),
      });
    }
  };

  return (
    <View style={styles.wrap}>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => carregarLista(true)}
          />
        }
        contentContainerStyle={[
          styles.scroll,
          !isDesktop && styles.scrollMobile,
        ]}
      >
        <Text style={styles.intro}>
          Cadastre dias ou períodos em que a pousada não aceita novas reservas.
          Terças e quartas continuam fechadas automaticamente.
        </Text>

        {eventos.length > 1 ? (
          <View style={styles.eventoRow}>
            <Text style={styles.label}>Pousada (evento)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {eventos.map((ev) => (
                <TouchableOpacity
                  key={ev.id}
                  style={[
                    styles.chipEvento,
                    idEvento === ev.id && styles.chipEventoAtivo,
                  ]}
                  onPress={() => setIdEvento(ev.id)}
                >
                  <Text
                    style={[
                      styles.chipEventoTexto,
                      idEvento === ev.id && styles.chipEventoTextoAtivo,
                    ]}
                  >
                    {ev.nome}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        ) : null}

        <View style={styles.card}>
          <Text style={styles.cardTitulo}>
            {editando ? "Editar fechamento" : "Novo fechamento"}
          </Text>
          <View style={styles.rowDatas}>
            <View style={styles.colData}>
              <Text style={styles.label}>Data início</Text>
              <DatePickerComponente value={dataInicio} onChange={setDataInicio} />
            </View>
            <View style={styles.colData}>
              <Text style={styles.label}>Data fim (inclusiva)</Text>
              <DatePickerComponente value={dataFim} onChange={setDataFim} />
            </View>
          </View>
          <Text style={styles.label}>Motivo (opcional)</Text>
          <TextInput
            style={styles.input}
            value={motivo}
            onChangeText={setMotivo}
            placeholder="Ex.: manutenção, recesso…"
            placeholderTextColor={colors.cinza}
          />
          <View style={styles.acoesForm}>
            {editando ? (
              <TouchableOpacity onPress={limparFormulario} style={styles.btnSec}>
                <Text style={styles.btnSecTexto}>Cancelar edição</Text>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity
              onPress={handleSalvar}
              disabled={salvando || !idEvento}
              style={[styles.btnPrim, salvando && styles.btnDisabled]}
            >
              {salvando ? (
                <ActivityIndicator color={colors.branco} />
              ) : (
                <Text style={styles.btnPrimTexto}>
                  {editando ? "Salvar alterações" : "Cadastrar"}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.listaHeader}>
          <Text style={styles.cardTitulo}>Fechamentos cadastrados</Text>
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Incluir inativos</Text>
            <Switch
              value={incluirInativos}
              onValueChange={setIncluirInativos}
              trackColor={{ false: colors.line, true: colors.laranjado }}
            />
          </View>
        </View>

        {loading ? (
          <ActivityIndicator style={{ marginTop: 24 }} color={colors.laranjado} />
        ) : lista.length === 0 ? (
          <Text style={styles.vazio}>Nenhum fechamento excepcional cadastrado.</Text>
        ) : (
          lista.map((item) => (
            <View
              key={item.id}
              style={[styles.item, !item.ativo && styles.itemInativo]}
            >
              <View style={styles.itemCorpo}>
                <Text style={styles.itemDatas}>
                  {formatarDataBr(item.dataInicio)}
                  {item.dataFim !== item.dataInicio
                    ? ` — ${formatarDataBr(item.dataFim)}`
                    : ""}
                </Text>
                {item.motivo ? (
                  <Text style={styles.itemMotivo}>{item.motivo}</Text>
                ) : null}
                <Text style={styles.itemMeta}>
                  {item.ativo ? "Ativo" : "Inativo"} · atualizado{" "}
                  {formatInTimeZone(item.updatedAt, TZ, "dd/MM/yyyy HH:mm")}
                </Text>
              </View>
              <View style={styles.itemAcoes}>
                <TouchableOpacity onPress={() => handleEditar(item)}>
                  <Feather name="edit-2" size={20} color={colors.laranjado} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleToggleAtivo(item)}
                  style={styles.btnToggle}
                >
                  <Feather
                    name={item.ativo ? "eye-off" : "eye"}
                    size={20}
                    color={item.ativo ? colors.cinza : colors.green}
                  />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {msg ? (
        <ModalMsg
          onClose={() => setMsg(null)}
          msg={`${msg.titulo}\n\n${msg.texto}`}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 40 },
  scrollMobile: { paddingHorizontal: 12 },
  intro: {
    fontSize: 14,
    color: colors.cinza,
    marginBottom: 16,
    lineHeight: 20,
  },
  eventoRow: { marginBottom: 12 },
  chipEvento: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.branco,
    marginRight: 8,
    borderWidth: 1,
    borderColor: colors.line,
  },
  chipEventoAtivo: {
    backgroundColor: colors.laranjado,
    borderColor: colors.laranjado,
  },
  chipEventoTexto: { color: colors.cinza, fontSize: 13 },
  chipEventoTextoAtivo: { color: colors.branco, fontWeight: "600" },
  card: {
    backgroundColor: colors.branco,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    ...Platform.select({
      web: { boxShadow: "0 2px 8px rgba(0,0,0,0.08)" },
      default: {
        elevation: 2,
        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowRadius: 4,
      },
    }),
  },
  cardTitulo: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.black,
    marginBottom: 12,
  },
  label: {
    fontSize: 13,
    color: colors.cinza,
    marginBottom: 6,
  },
  rowDatas: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
    flexWrap: "wrap",
  },
  colData: { flex: 1, minWidth: 140 },
  input: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.black,
    marginBottom: 12,
  },
  acoesForm: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    alignItems: "center",
  },
  btnPrim: {
    backgroundColor: colors.laranjado,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 140,
    alignItems: "center",
  },
  btnDisabled: { opacity: 0.6 },
  btnPrimTexto: { color: colors.branco, fontWeight: "600" },
  btnSec: { padding: 8 },
  btnSecTexto: { color: colors.cinza },
  listaHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
    flexWrap: "wrap",
    gap: 8,
  },
  switchRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  switchLabel: { fontSize: 13, color: colors.cinza },
  vazio: { color: colors.cinza, fontStyle: "italic", marginTop: 8 },
  item: {
    flexDirection: "row",
    backgroundColor: colors.branco,
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: colors.laranjado,
  },
  itemInativo: {
    opacity: 0.65,
    borderLeftColor: colors.cinza,
  },
  itemCorpo: { flex: 1 },
  itemDatas: { fontWeight: "600", fontSize: 15, color: colors.black },
  itemMotivo: { fontSize: 13, color: colors.cinza, marginTop: 4 },
  itemMeta: { fontSize: 11, color: colors.cinza, marginTop: 6 },
  itemAcoes: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingLeft: 8,
  },
  btnToggle: { padding: 4 },
});
