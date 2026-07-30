import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { formatInTimeZone } from "date-fns-tz";
import colors from "@/src/constants/colors";
import { useAuth } from "@/src/contexts_/AuthContext";
import {
  getSuitesOperacionais,
  SuiteOperacionalCard,
} from "@/src/lib/hospedagemAdmin";
import {
  activateHospedinSuiteMapping,
  createHospedinSuiteMapping,
  deactivateHospedinSuiteMapping,
  HospedinImportResult,
  HospedinSuiteMapping,
  HospedinUnmappedPlace,
  ignoreHospedinSuiteMapping,
  importHospedinPlaceTypes,
  importHospedinPlaces,
  listHospedinSuiteMappings,
  listHospedinUnmappedPlaces,
  resolveHospedinPlaceSuite,
  unignoreHospedinSuiteMapping,
  updateHospedinSuiteMapping,
} from "@/src/lib/hospedinMapping";
import { useHospedagemDesktopLayout } from "../useHospedagemDesktopLayout";
import ModalEventoSuite from "@/src/components/ModalEventoSuite";
import { EventoSuitePrefill } from "@/src/lib/eventoSuite";
import { EventoSuite } from "@/src/types/geral";

const TZ = "America/Cuiaba";
const LAST_IMPORT_KEY = "hospedin_last_places_import_at";

type FiltroLista = "todos" | "vinculados" | "sem_vinculo" | "ignoradas";

function isIgnoredMapping(m: HospedinSuiteMapping): boolean {
  return (
    m.ativo &&
    String(m.mapping_status || "").toUpperCase() === "IGNORED"
  );
}

function isLinkedMapping(m: HospedinSuiteMapping): boolean {
  return (
    m.ativo &&
    String(m.mapping_status || "LINKED").toUpperCase() === "LINKED" &&
    m.id_evento_suite != null
  );
}

type VinculoDraft = {
  mode: "create" | "edit";
  placeId: number;
  placeNome: string;
  mappingId?: number;
  idEventoSuiteAtual?: number;
  suggestionId?: number | null;
};

function alertMsg(title: string, message: string) {
  if (Platform.OS === "web") {
    window.alert(`${title}\n\n${message}`);
    return;
  }
  Alert.alert(title, message);
}

function confirmAsync(title: string, message: string): Promise<boolean> {
  if (Platform.OS === "web") {
    return Promise.resolve(window.confirm(`${title}\n\n${message}`));
  }
  return new Promise((resolve) => {
    Alert.alert(title, message, [
      { text: "Cancelar", style: "cancel", onPress: () => resolve(false) },
      { text: "Confirmar", style: "destructive", onPress: () => resolve(true) },
    ]);
  });
}

function formatDuration(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) return "—";
  if (ms < 1000) return `${ms} ms`;
  return `${(ms / 1000).toFixed(1)} s`;
}

function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  try {
    return formatInTimeZone(new Date(iso), TZ, "dd/MM/yyyy HH:mm");
  } catch {
    return iso;
  }
}

function resumoImportacao(
  titulo: string,
  result: HospedinImportResult,
): string {
  return [
    titulo,
    "",
    `Obtidos na Hospedin: ${result.fetched}`,
    `Gravados no staging (novos + atualizados): ${result.upserted}`,
    `Tempo: ${formatDuration(result.durationMs)}`,
    result.accountId ? `Conta: ${result.accountId}` : null,
  ]
    .filter(Boolean)
    .join("\n");
}

export default function TabHospedinMapeamento() {
  const { isAdministrador, isProdutor } = useAuth();
  const { isDesktop, suiteColumns } = useHospedagemDesktopLayout();
  /** admGeral OU Administrador do produtor (mesmo critério do menu Hospedagem). */
  const podeMapaHospedin = isAdministrador || isProdutor;
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [importingTypes, setImportingTypes] = useState(false);
  const [importingPlaces, setImportingPlaces] = useState(false);
  const [filtro, setFiltro] = useState<FiltroLista>("todos");
  const [mappings, setMappings] = useState<HospedinSuiteMapping[]>([]);
  const [unmapped, setUnmapped] = useState<HospedinUnmappedPlace[]>([]);
  const [suitesJango, setSuitesJango] = useState<SuiteOperacionalCard[]>([]);
  const [draft, setDraft] = useState<VinculoDraft | null>(null);
  const [suitePick, setSuitePick] = useState<number | null>(null);
  const [lastResolve, setLastResolve] = useState<string | null>(null);
  const [lastImportAt, setLastImportAt] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [suiteFormVisible, setSuiteFormVisible] = useState(false);
  const [suiteFormPlace, setSuiteFormPlace] =
    useState<HospedinUnmappedPlace | null>(null);
  const [suiteFormPrefill, setSuiteFormPrefill] =
    useState<EventoSuitePrefill | null>(null);
  const [suiteFormIdEvento, setSuiteFormIdEvento] = useState(0);
  const [vinculoSucesso, setVinculoSucesso] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setErro(null);
    try {
      const [mapResp, unmappedResp, suitesResp, storedImport] =
        await Promise.all([
          listHospedinSuiteMappings({ limit: 500 }),
          listHospedinUnmappedPlaces({ limit: 500 }),
          getSuitesOperacionais({ filtro: "todas" }),
          AsyncStorage.getItem(LAST_IMPORT_KEY),
        ]);
      setMappings(mapResp.items || []);
      setUnmapped(unmappedResp.items || []);
      setSuitesJango(Array.isArray(suitesResp?.data) ? suitesResp.data : []);
      if (storedImport) setLastImportAt(storedImport);
    } catch (e: any) {
      setErro(e?.message || "Falha ao carregar mapeamentos Hospedin.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (!podeMapaHospedin) {
        setLoading(false);
        return;
      }
      setLoading(true);
      carregar();
    }, [carregar, podeMapaHospedin]),
  );

  const indicadores = useMemo(() => {
    const vinculadas = mappings.filter(isLinkedMapping).length;
    const ignoradas = mappings.filter(isIgnoredMapping).length;
    const semVinculo = unmapped.length;
    return {
      total: vinculadas + semVinculo + ignoradas,
      vinculadas,
      semVinculo,
      ignoradas,
    };
  }, [mappings, unmapped]);

  const mappedPlaceIds = useMemo(
    () =>
      new Set(
        mappings
          .filter((m) => m.ativo)
          .map((m) => Number(m.place_id)),
      ),
    [mappings],
  );

  const suitesOcupadas = useMemo(() => {
    const set = new Set<number>();
    for (const m of mappings) {
      if (!isLinkedMapping(m)) continue;
      if (draft?.mode === "edit" && m.id === draft.mappingId) continue;
      if (m.id_evento_suite == null) continue;
      set.add(Number(m.id_evento_suite));
    }
    return set;
  }, [mappings, draft]);

  const suitesDisponiveis = useMemo(() => {
    return suitesJango.filter((s) => {
      const id = Number(s.idEventoSuite || s.id);
      if (!Number.isFinite(id)) return false;
      if (draft?.mode === "edit" && id === draft.idEventoSuiteAtual) return true;
      return !suitesOcupadas.has(id);
    });
  }, [suitesJango, suitesOcupadas, draft]);

  const linhas = useMemo(() => {
    type Linha =
      | { key: string; tipo: "vinculado"; mapping: HospedinSuiteMapping }
      | { key: string; tipo: "ignorado"; mapping: HospedinSuiteMapping }
      | { key: string; tipo: "livre"; place: HospedinUnmappedPlace };

    const out: Linha[] = [];
    if (filtro === "todos" || filtro === "vinculados") {
      for (const m of mappings) {
        if (isIgnoredMapping(m)) continue;
        // Após unignore: linha inativa IGNORED não aparece (place volta a Sem vínculo).
        if (
          !m.ativo &&
          String(m.mapping_status || "").toUpperCase() === "IGNORED"
        ) {
          continue;
        }
        if (filtro === "vinculados" && !isLinkedMapping(m) && m.ativo) continue;
        if (filtro === "vinculados" && !m.ativo) continue;
        out.push({ key: `m-${m.id}`, tipo: "vinculado", mapping: m });
      }
    }
    if (filtro === "todos" || filtro === "ignoradas") {
      for (const m of mappings) {
        if (!isIgnoredMapping(m)) continue;
        out.push({ key: `i-${m.id}`, tipo: "ignorado", mapping: m });
      }
    }
    if (filtro === "todos" || filtro === "sem_vinculo") {
      for (const p of unmapped) {
        if (mappedPlaceIds.has(Number(p.placeId))) continue;
        out.push({ key: `u-${p.placeId}`, tipo: "livre", place: p });
      }
    }
    return out;
  }, [filtro, mappings, unmapped, mappedPlaceIds]);

  const onImportPlaceTypes = async () => {
    setImportingTypes(true);
    try {
      const result = await importHospedinPlaceTypes();
      alertMsg(
        "Importação de tipos",
        resumoImportacao("Tipos de suíte (place-types)", result),
      );
    } catch (e: any) {
      alertMsg("Erro", e?.message || "Falha ao importar tipos.");
    } finally {
      setImportingTypes(false);
    }
  };

  const onImportPlaces = async () => {
    setImportingPlaces(true);
    try {
      const result = await importHospedinPlaces();
      const agora = new Date().toISOString();
      await AsyncStorage.setItem(LAST_IMPORT_KEY, agora);
      setLastImportAt(agora);
      await carregar();
      alertMsg(
        "Importação de suítes",
        resumoImportacao("Suítes Hospedin (places)", result),
      );
    } catch (e: any) {
      alertMsg("Erro", e?.message || "Falha ao importar suítes.");
    } finally {
      setImportingPlaces(false);
    }
  };

  const abrirCriar = (place: HospedinUnmappedPlace) => {
    setDraft({
      mode: "create",
      placeId: place.placeId,
      placeNome: place.nome,
      suggestionId: place.suggestion?.idEventoSuite ?? null,
    });
    setSuitePick(place.suggestion?.idEventoSuite ?? null);
    setLastResolve(null);
  };

  const abrirCadastroSuite = (place: HospedinUnmappedPlace) => {
    const idEvento =
      place.suggestion?.idEvento ||
      suitesJango.find((s) => Number(s.idEvento) > 0)?.idEvento ||
      0;

    if (!idEvento) {
      alertMsg(
        "Evento não encontrado",
        "Não há evento Pousada disponível para cadastrar a suíte. Cadastre/ative um evento do tipo Pousada e tente novamente.",
      );
      return;
    }

    const capacidade =
      place.capacidade != null && Number(place.capacidade) > 0
        ? Number(place.capacidade)
        : 1;

    setSuiteFormPlace(place);
    setSuiteFormIdEvento(Number(idEvento));
    // Prefill sem `valor`: ModalEventoSuite aplica suiteValorCalculator
    // (mesma regra de nova suíte / edição).
    setSuiteFormPrefill({
      nome: place.nome || "",
      descricao: place.placeTypeId
        ? `Importado da Hospedin (place_id ${place.placeId}, tipo ${place.placeTypeId})`
        : `Importado da Hospedin (place_id ${place.placeId})`,
      qtdeMinimaPessoas: 1,
      qtdeMaximaPessoas: capacidade,
      status: "Ativo",
      preco: 0,
      taxaServico: 0,
    });
    setVinculoSucesso(null);
    setSuiteFormVisible(true);
  };

  const onSuiteCadastradaPeloMapa = async (suite: EventoSuite) => {
    if (!suiteFormPlace) return;
    const placeId = suiteFormPlace.placeId;
    const idEventoSuite = Number(suite.id);
    try {
      const resp = await createHospedinSuiteMapping({
        placeId,
        idEventoSuite,
      });
      const ok = await validarResolver(placeId, idEventoSuite);
      await carregar();
      setVinculoSucesso(
        ok
          ? `Suíte "${suite.nome}" cadastrada e vinculada com sucesso (place_id ${placeId} → EventoSuite #${idEventoSuite}${resp?.id ? `, map #${resp.id}` : ""}).`
          : `Suíte cadastrada e vínculo gravado, mas o resolver não confirmou place_id ${placeId}.`,
      );
      setLastResolve(
        ok
          ? `Resolver OK: place_id=${placeId} → EventoSuite.id=${idEventoSuite}`
          : `Resolver com aviso após cadastro automático (place ${placeId}).`,
      );
    } catch (e: any) {
      alertMsg(
        "Suíte criada, vínculo pendente",
        e?.message ||
          "A suíte foi salva, mas o vínculo Hospedin não foi criado automaticamente. Vincule manualmente.",
      );
      await carregar();
    } finally {
      setSuiteFormPlace(null);
      setSuiteFormPrefill(null);
    }
  };

  const abrirEditar = (m: HospedinSuiteMapping) => {
    setDraft({
      mode: "edit",
      placeId: Number(m.place_id),
      placeNome: m.place_nome || `Place #${m.place_id}`,
      mappingId: m.id,
      idEventoSuiteAtual: Number(m.id_evento_suite),
    });
    setSuitePick(Number(m.id_evento_suite));
    setLastResolve(null);
  };

  const validarResolver = async (placeId: number, expectedSuiteId: number) => {
    const resolved = await resolveHospedinPlaceSuite(placeId);
    if (!resolved?.found) {
      setLastResolve(
        `Resolver: vínculo ativo NÃO encontrado para place_id=${placeId}. ${resolved?.message || ""}`,
      );
      return false;
    }
    const ok = Number(resolved.idEventoSuite) === Number(expectedSuiteId);
    setLastResolve(
      ok
        ? `Resolver OK: place_id=${resolved.placeId} → EventoSuite.id=${resolved.idEventoSuite} (map #${resolved.mapId})`
        : `Resolver divergente: esperado suite ${expectedSuiteId}, obtido ${resolved.idEventoSuite}`,
    );
    return ok;
  };

  const salvarVinculo = async () => {
    if (!draft || !suitePick) {
      alertMsg("Atenção", "Selecione uma suíte do Jango.");
      return;
    }
    setSaving(true);
    setLastResolve(null);
    try {
      let mappingId = draft.mappingId;
      if (draft.mode === "create") {
        const resp = await createHospedinSuiteMapping({
          placeId: draft.placeId,
          idEventoSuite: suitePick,
        });
        mappingId = resp.id;
      } else if (draft.mappingId) {
        await updateHospedinSuiteMapping(draft.mappingId, {
          idEventoSuite: suitePick,
        });
      }

      const ok = await validarResolver(draft.placeId, suitePick);
      await carregar();
      if (ok) {
        alertMsg(
          "Vínculo salvo",
          `Hospedin place ${draft.placeId} vinculado à suíte Jango #${suitePick}.${mappingId ? ` (map #${mappingId})` : ""}`,
        );
        setDraft(null);
      } else {
        alertMsg(
          "Vínculo gravado com aviso",
          "O registro foi salvo, mas a validação do PlaceSuiteResolver não confirmou a suíte esperada.",
        );
      }
    } catch (e: any) {
      alertMsg("Erro", e?.message || "Falha ao salvar vínculo.");
    } finally {
      setSaving(false);
    }
  };

  const removerVinculo = async (m: HospedinSuiteMapping) => {
    const ok = await confirmAsync(
      "Remover vínculo",
      `Desativar mapeamento de ${m.place_nome || `place #${m.place_id}`} → ${m.suite_nome || `suite #${m.id_evento_suite}`}?`,
    );
    if (!ok) return;
    setSaving(true);
    try {
      await deactivateHospedinSuiteMapping(m.id);
      const resolved = await resolveHospedinPlaceSuite(Number(m.place_id));
      setLastResolve(
        resolved?.found
          ? `Atenção: resolver ainda encontrou mapa ativo para place ${m.place_id}.`
          : `Resolver OK: place_id=${m.place_id} sem mapa ativo.`,
      );
      await carregar();
    } catch (e: any) {
      alertMsg("Erro", e?.message || "Falha ao desativar vínculo.");
    } finally {
      setSaving(false);
    }
  };

  const reativarVinculo = async (m: HospedinSuiteMapping) => {
    setSaving(true);
    try {
      await activateHospedinSuiteMapping(m.id);
      await validarResolver(Number(m.place_id), Number(m.id_evento_suite));
      await carregar();
    } catch (e: any) {
      alertMsg("Erro", e?.message || "Falha ao reativar vínculo.");
    } finally {
      setSaving(false);
    }
  };

  const ignorarSuite = async (place: HospedinUnmappedPlace) => {
    const ok = await confirmAsync(
      "Ignorar suíte",
      `Ignorar "${place.nome}" (place_id ${place.placeId})?\n\nReservas dessa suíte não gerarão pendências nem erros de sincronização.`,
    );
    if (!ok) return;
    setSaving(true);
    try {
      await ignoreHospedinSuiteMapping({ placeId: place.placeId });
      await carregar();
    } catch (e: any) {
      alertMsg("Erro", e?.message || "Falha ao ignorar suíte.");
    } finally {
      setSaving(false);
    }
  };

  const reativarIgnorada = async (m: HospedinSuiteMapping) => {
    const ok = await confirmAsync(
      "Reativar suíte",
      `Reativar "${m.place_nome || `place #${m.place_id}`}"?\n\nEla voltará a aparecer como Sem vínculo e exigirá mapeamento.`,
    );
    if (!ok) return;
    setSaving(true);
    try {
      await unignoreHospedinSuiteMapping(m.id);
      await carregar();
    } catch (e: any) {
      alertMsg("Erro", e?.message || "Falha ao reativar suíte.");
    } finally {
      setSaving(false);
    }
  };

  if (!podeMapaHospedin) {
    return (
      <View style={styles.center}>
        <Feather name="lock" size={28} color={colors.cinza} />
        <Text style={styles.muted}>
          Integração Hospedin disponível apenas para administradores.
        </Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.laranjado} />
        <Text style={styles.muted}>Carregando painel Hospedin…</Text>
      </View>
    );
  }

  const busy = importingTypes || importingPlaces || saving;

  const header = (
    <View>
      <Text style={styles.subtitle}>
        Painel administrativo da integração Hospedin: importar, vincular e
        gerenciar suítes (1:1).
      </Text>

      <View style={styles.actionBar}>
        <TouchableOpacity
          style={[styles.actionBtn, importingTypes && styles.actionBtnDisabled]}
          onPress={onImportPlaceTypes}
          disabled={busy}
        >
          {importingTypes ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Feather name="layers" size={14} color="#fff" />
          )}
          <Text style={styles.actionBtnText}>Importar Tipos</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, importingPlaces && styles.actionBtnDisabled]}
          onPress={onImportPlaces}
          disabled={busy}
        >
          {importingPlaces ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Feather name="download" size={14} color="#fff" />
          )}
          <Text style={styles.actionBtnText}>Importar Suítes</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtnSec, refreshing && styles.actionBtnDisabled]}
          onPress={() => {
            setRefreshing(true);
            carregar();
          }}
          disabled={busy}
        >
          <Feather name="refresh-cw" size={14} color={colors.laranjado} />
          <Text style={styles.actionBtnSecText}>Atualizar Lista</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.indicators, isDesktop && styles.indicatorsDesktop]}>
        <View style={[styles.indCard, isDesktop && styles.indCardDesktop]}>
          <Text style={[styles.indValue, isDesktop && styles.indValueDesktop]}>
            {indicadores.total}
          </Text>
          <Text style={styles.indLabel}>Importadas</Text>
        </View>
        <View style={[styles.indCard, isDesktop && styles.indCardDesktop]}>
          <Text style={[styles.indValue, isDesktop && styles.indValueDesktop]}>
            {indicadores.vinculadas}
          </Text>
          <Text style={styles.indLabel}>Vinculadas</Text>
        </View>
        <View style={[styles.indCard, isDesktop && styles.indCardDesktop]}>
          <Text style={[styles.indValue, isDesktop && styles.indValueDesktop]}>
            {indicadores.semVinculo}
          </Text>
          <Text style={styles.indLabel}>Sem vínculo</Text>
        </View>
        <View style={[styles.indCard, isDesktop && styles.indCardDesktop]}>
          <Text style={[styles.indValue, isDesktop && styles.indValueDesktop]}>
            {indicadores.ignoradas}
          </Text>
          <Text style={styles.indLabel}>Ignoradas</Text>
        </View>
        <View
          style={[
            styles.indCard,
            styles.indCardWide,
            isDesktop && styles.indCardDesktop,
            isDesktop && styles.indCardWideDesktop,
          ]}
        >
          <Text
            style={[styles.indValueSm, isDesktop && styles.indValueSmDesktop]}
          >
            {formatDateTime(lastImportAt)}
          </Text>
          <Text style={styles.indLabel}>Última importação (suítes)</Text>
        </View>
      </View>

      <View style={styles.filtros}>
        {(
          [
            ["todos", "Todos"],
            ["vinculados", "Vinculados"],
            ["sem_vinculo", "Sem vínculo"],
            ["ignoradas", "Ignoradas"],
          ] as const
        ).map(([key, label]) => (
          <TouchableOpacity
            key={key}
            style={[styles.filtroChip, filtro === key && styles.filtroChipOn]}
            onPress={() => setFiltro(key)}
          >
            <Text
              style={[
                styles.filtroTexto,
                filtro === key && styles.filtroTextoOn,
              ]}
            >
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {erro ? <Text style={styles.erro}>{erro}</Text> : null}
      {vinculoSucesso ? (
        <Text style={styles.sucessoBox}>{vinculoSucesso}</Text>
      ) : null}
      {lastResolve ? (
        <Text style={styles.resolveBox}>{lastResolve}</Text>
      ) : null}
    </View>
  );

  return (
    <View style={styles.root}>
      <FlatList
        key={`mapa-cols-${suiteColumns}`}
        data={linhas}
        keyExtractor={(item) => item.key}
        numColumns={suiteColumns}
        columnWrapperStyle={
          suiteColumns > 1 ? styles.columnWrapper : undefined
        }
        ListHeaderComponent={header}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              carregar();
            }}
            colors={[colors.laranjado]}
          />
        }
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <Text style={styles.muted}>
            Nenhuma suíte nesta filtro. Use &quot;Importar Suítes&quot; e atualize
            a lista.
          </Text>
        }
        renderItem={({ item }) => {
          if (item.tipo === "ignorado") {
            const m = item.mapping;
            return (
              <View style={suiteColumns > 1 ? styles.gridItem : undefined}>
                <View
                  style={[
                    styles.card,
                    isDesktop && styles.cardDesktop,
                    styles.cardIgnorado,
                  ]}
                >
                  <View style={styles.cardHead}>
                    <Text style={styles.badgeIgnorado}>Ignorada</Text>
                    <Text style={styles.meta}>map #{m.id}</Text>
                  </View>
                  <Text style={styles.title}>
                    {m.place_nome || `Hospedin place #${m.place_id}`}
                  </Text>
                  <Text style={styles.meta}>place_id: {m.place_id}</Text>
                  <Text style={styles.metaMuted}>
                    Fora da operação Jango — sem pendências de sync.
                  </Text>
                  {m.mapped_at ? (
                    <Text style={styles.meta}>
                      Ignorada em {formatDateTime(m.mapped_at)}
                      {m.mapped_by != null ? ` · usuário #${m.mapped_by}` : ""}
                    </Text>
                  ) : null}
                  <View
                    style={[
                      styles.actions,
                      isDesktop && styles.actionsDesktop,
                    ]}
                  >
                    <TouchableOpacity
                      style={[styles.btnPrim, isDesktop && styles.btnDesktop]}
                      onPress={() => reativarIgnorada(m)}
                      disabled={busy}
                    >
                      <Text style={styles.btnPrimText}>Reativar</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          }

          if (item.tipo === "vinculado") {
            const m = item.mapping;
            return (
              <View style={suiteColumns > 1 ? styles.gridItem : undefined}>
                <View
                  style={[
                    styles.card,
                    isDesktop && styles.cardDesktop,
                    !m.ativo && styles.cardInativo,
                  ]}
                >
                  <View style={styles.cardHead}>
                    <Text style={styles.badgeOk}>
                      {m.ativo ? "Vinculado" : "Inativo"}
                    </Text>
                    <Text style={styles.meta}>map #{m.id}</Text>
                  </View>
                  {isDesktop ? (
                    <View style={styles.cardGridDesktop}>
                      <View style={styles.cardColDesktop}>
                        <Text style={styles.fieldLabelDesktop}>Hospedin</Text>
                        <Text style={styles.title} numberOfLines={2}>
                          {m.place_nome || `Hospedin place #${m.place_id}`}
                        </Text>
                        <Text style={styles.meta}>place_id: {m.place_id}</Text>
                      </View>
                      <View style={styles.cardColDesktop}>
                        <Text style={styles.fieldLabelDesktop}>
                          Suíte Jango
                        </Text>
                        <Text style={styles.title} numberOfLines={2}>
                          {m.suite_nome || `EventoSuite #${m.id_evento_suite}`}
                        </Text>
                        <Text style={styles.meta}>
                          idEventoSuite: {m.id_evento_suite}
                          {m.id_evento != null
                            ? ` · evento ${m.id_evento}`
                            : ""}
                        </Text>
                      </View>
                    </View>
                  ) : (
                    <>
                      <Text style={styles.title}>
                        {m.place_nome || `Hospedin place #${m.place_id}`}
                      </Text>
                      <Text style={styles.meta}>place_id: {m.place_id}</Text>
                      <Text style={styles.arrow}>↓</Text>
                      <Text style={styles.title}>
                        {m.suite_nome || `EventoSuite #${m.id_evento_suite}`}
                      </Text>
                      <Text style={styles.meta}>
                        idEventoSuite: {m.id_evento_suite}
                        {m.id_evento != null ? ` · evento ${m.id_evento}` : ""}
                      </Text>
                    </>
                  )}
                  <View
                    style={[
                      styles.actions,
                      isDesktop && styles.actionsDesktop,
                    ]}
                  >
                    {m.ativo ? (
                      <>
                        <TouchableOpacity
                          style={[
                            styles.btnSec,
                            isDesktop && styles.btnDesktop,
                          ]}
                          onPress={() => abrirEditar(m)}
                          disabled={busy}
                        >
                          <Text style={styles.btnSecText}>Alterar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            styles.btnDanger,
                            isDesktop && styles.btnDesktop,
                          ]}
                          onPress={() => removerVinculo(m)}
                          disabled={busy}
                        >
                          <Text style={styles.btnDangerText}>Remover</Text>
                        </TouchableOpacity>
                      </>
                    ) : (
                      <TouchableOpacity
                        style={[
                          styles.btnPrim,
                          isDesktop && styles.btnDesktop,
                        ]}
                        onPress={() => reativarVinculo(m)}
                        disabled={busy}
                      >
                        <Text style={styles.btnPrimText}>Reativar</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>
            );
          }

          const p = item.place;
          return (
            <View style={suiteColumns > 1 ? styles.gridItem : undefined}>
              <View style={[styles.card, isDesktop && styles.cardDesktop]}>
                <View style={styles.cardHead}>
                  <Text style={styles.badgeWarn}>Sem vínculo</Text>
                  <Text style={styles.meta}>place_id: {p.placeId}</Text>
                </View>
                <Text style={styles.title}>{p.nome}</Text>
                {isDesktop ? (
                  <View style={styles.cardGridDesktop}>
                    <View style={styles.cardColDesktop}>
                      <Text style={styles.fieldLabelDesktop}>Capacidade</Text>
                      <Text style={styles.metaInlineDesktop}>
                        {p.capacidade != null ? p.capacidade : "—"}
                      </Text>
                    </View>
                    <View style={styles.cardColDesktopFlex}>
                      <Text style={styles.fieldLabelDesktop}>Sugestão</Text>
                      <Text style={styles.metaInlineDesktop} numberOfLines={2}>
                        {p.suggestion
                          ? `${p.suggestion.nome} (#${p.suggestion.idEventoSuite}, score ${p.suggestion.score})`
                          : "—"}
                      </Text>
                    </View>
                  </View>
                ) : (
                  <>
                    {p.capacidade != null ? (
                      <Text style={styles.meta}>
                        Capacidade: {p.capacidade}
                      </Text>
                    ) : null}
                    {p.suggestion ? (
                      <Text style={styles.sugestao}>
                        Sugestão: {p.suggestion.nome} (suite #
                        {p.suggestion.idEventoSuite}, score{" "}
                        {p.suggestion.score}) — somente auxílio.
                      </Text>
                    ) : null}
                  </>
                )}
                <View
                  style={[styles.actions, isDesktop && styles.actionsDesktop]}
                >
                  <TouchableOpacity
                    style={[styles.btnPrim, isDesktop && styles.btnDesktop]}
                    onPress={() => abrirCadastroSuite(p)}
                    disabled={busy}
                  >
                    <Text style={styles.btnPrimText}>Cadastrar Suíte</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.btnSec, isDesktop && styles.btnDesktop]}
                    onPress={() => abrirCriar(p)}
                    disabled={busy}
                  >
                    <Text style={styles.btnSecText}>Vincular existente</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.btnMuted, isDesktop && styles.btnDesktop]}
                    onPress={() => ignorarSuite(p)}
                    disabled={busy}
                  >
                    <Text style={styles.btnMutedText}>Ignorar suíte</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          );
        }}
      />

      <Modal
        visible={!!draft}
        transparent
        animationType="fade"
        onRequestClose={() => !saving && setDraft(null)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => !saving && setDraft(null)}
        >
          <Pressable
            style={styles.modalCard}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={styles.modalTitle}>
              {draft?.mode === "edit" ? "Alterar vínculo" : "Novo vínculo"}
            </Text>
            <Text style={styles.meta}>
              Hospedin: {draft?.placeNome} (place_id {draft?.placeId})
            </Text>
            <Text style={[styles.meta, { marginTop: 12, marginBottom: 8 }]}>
              Suíte do Jango
            </Text>
            <ScrollView style={styles.suiteList}>
              {suitesDisponiveis.length === 0 ? (
                <Text style={styles.muted}>
                  Nenhuma suíte Jango disponível (todas já vinculadas 1:1).
                </Text>
              ) : (
                suitesDisponiveis.map((s) => {
                  const id = Number(s.idEventoSuite || s.id);
                  const on = suitePick === id;
                  return (
                    <TouchableOpacity
                      key={id}
                      style={[styles.suiteOpt, on && styles.suiteOptOn]}
                      onPress={() => setSuitePick(id)}
                    >
                      <Text
                        style={[
                          styles.suiteOptText,
                          on && styles.suiteOptTextOn,
                        ]}
                      >
                        {s.nome || `Suíte #${id}`}
                      </Text>
                      <Text style={styles.meta}>idEventoSuite: {id}</Text>
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>
            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.btnSec}
                onPress={() => setDraft(null)}
                disabled={saving}
              >
                <Text style={styles.btnSecText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btnPrim, saving && { opacity: 0.6 }]}
                onPress={salvarVinculo}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.btnPrimText}>Salvar e validar</Text>
                )}
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <ModalEventoSuite
        id={0}
        idEvento={suiteFormIdEvento}
        visible={suiteFormVisible}
        prefill={suiteFormPrefill}
        title="Cadastro Oficial de Suíte"
        onSaved={onSuiteCadastradaPeloMapa}
        onClose={() => {
          setSuiteFormVisible(false);
          setSuiteFormPlace(null);
          setSuiteFormPrefill(null);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 24,
  },
  subtitle: {
    color: colors.cinza,
    fontSize: 13,
    marginBottom: 10,
    lineHeight: 18,
  },
  actionBar: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.laranjado,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
  },
  actionBtnSec: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: colors.laranjado,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
  },
  actionBtnDisabled: { opacity: 0.55 },
  actionBtnText: { color: "#fff", fontWeight: "700", fontSize: 12 },
  actionBtnSecText: {
    color: colors.laranjado,
    fontWeight: "700",
    fontSize: 12,
  },
  indicators: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  indicatorsDesktop: {
    flexWrap: "nowrap",
    gap: 10,
    marginBottom: 10,
  },
  indCard: {
    minWidth: 88,
    flexGrow: 1,
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#eee",
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  indCardDesktop: {
    minWidth: 0,
    flex: 1,
    flexGrow: 1,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  indCardWide: { minWidth: 160 },
  indCardWideDesktop: {
    flex: 1.35,
    minWidth: 0,
  },
  indValue: {
    fontSize: 20,
    fontWeight: "800",
    color: "#222",
  },
  indValueDesktop: {
    fontSize: 18,
  },
  indValueSm: {
    fontSize: 13,
    fontWeight: "700",
    color: "#222",
  },
  indValueSmDesktop: {
    fontSize: 12,
  },
  indLabel: {
    marginTop: 2,
    fontSize: 11,
    color: colors.cinza,
    fontWeight: "600",
  },
  filtros: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  filtroChip: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "#fff",
  },
  filtroChipOn: {
    borderColor: colors.laranjado,
    backgroundColor: "#FFF4EC",
  },
  filtroTexto: { fontSize: 12, color: colors.cinza, fontWeight: "600" },
  filtroTextoOn: { color: colors.laranjado },
  listContent: { paddingBottom: 40 },
  columnWrapper: {
    gap: 10,
  },
  gridItem: {
    flex: 1,
    minWidth: 0,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: "#eee",
    marginBottom: 10,
  },
  cardDesktop: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  cardGridDesktop: {
    flexDirection: "row",
    gap: 12,
    marginTop: 4,
  },
  cardColDesktop: {
    flex: 1,
    minWidth: 0,
  },
  cardColDesktopFlex: {
    flex: 1.6,
    minWidth: 0,
  },
  fieldLabelDesktop: {
    fontSize: 10,
    fontWeight: "700",
    color: "#9ca3af",
    textTransform: "uppercase",
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  metaInlineDesktop: {
    fontSize: 12,
    color: colors.cinza,
    fontWeight: "600",
  },
  cardInativo: { opacity: 0.75, backgroundColor: "#fafafa" },
  cardHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  badgeOk: {
    fontSize: 11,
    fontWeight: "700",
    color: "#1B7A3D",
    backgroundColor: "#E6F6EC",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: "hidden",
  },
  badgeWarn: {
    fontSize: 11,
    fontWeight: "700",
    color: "#9A6700",
    backgroundColor: "#FFF6DD",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: "hidden",
  },
  badgeIgnorado: {
    fontSize: 11,
    fontWeight: "700",
    color: "#475467",
    backgroundColor: "#F2F4F7",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: "hidden",
  },
  cardIgnorado: {
    backgroundColor: "#F9FAFB",
    borderColor: "#E4E7EC",
  },
  title: { fontSize: 15, fontWeight: "700", color: "#222" },
  meta: { fontSize: 12, color: colors.cinza, marginTop: 2 },
  metaMuted: {
    fontSize: 12,
    color: "#667085",
    marginTop: 6,
    lineHeight: 16,
  },
  arrow: { marginVertical: 4, color: colors.laranjado, fontWeight: "700" },
  sugestao: {
    marginTop: 8,
    fontSize: 12,
    color: "#555",
    lineHeight: 17,
    fontStyle: "italic",
  },
  actions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
    flexWrap: "wrap",
  },
  actionsDesktop: {
    marginTop: 8,
  },
  btnDesktop: {
    paddingVertical: 7,
    paddingHorizontal: 12,
  },
  btnPrim: {
    backgroundColor: colors.laranjado,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
  },
  btnPrimText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  btnSec: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
  },
  btnSecText: { color: "#333", fontWeight: "600", fontSize: 13 },
  btnDanger: {
    backgroundColor: "#FDECEC",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
  },
  btnDangerText: { color: "#B42318", fontWeight: "700", fontSize: 13 },
  btnMuted: {
    backgroundColor: "#F2F4F7",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
  },
  btnMutedText: { color: "#475467", fontWeight: "600", fontSize: 13 },
  muted: { color: colors.cinza, fontSize: 13, textAlign: "center" },
  erro: { color: "#B42318", marginBottom: 8, fontSize: 13 },
  sucessoBox: {
    backgroundColor: "#E6F6EC",
    borderColor: "#A7E0B8",
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    fontSize: 12,
    color: "#1B7A3D",
    lineHeight: 17,
    fontWeight: "600",
  },
  resolveBox: {
    backgroundColor: "#F3F7FF",
    borderColor: "#C9D7F5",
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    fontSize: 12,
    color: "#243B6B",
    lineHeight: 17,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    padding: 20,
  },
  modalCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    maxHeight: "85%",
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#222",
    marginBottom: 6,
  },
  suiteList: { maxHeight: 320, marginBottom: 8 },
  suiteOpt: {
    borderWidth: 1,
    borderColor: "#e5e5e5",
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  suiteOptOn: {
    borderColor: colors.laranjado,
    backgroundColor: "#FFF4EC",
  },
  suiteOptText: { fontWeight: "600", color: "#333" },
  suiteOptTextOn: { color: colors.laranjado },
});
