import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
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
import colors from "@/src/constants/colors";
import { formatDateTimeHospedagem } from "@/src/lib/hospedagemStatusOperacional";
import {
  corProviderUiStatus,
  formatDurationMs,
  formatPtNumber,
  formatSuccessRate,
  getIntegrationsStatus,
  getSyncPendencias,
  IntegrationExecutionRow,
  IntegrationProviderStatus,
  labelExecutionStatus,
  labelProviderUiStatus,
  labelTriggerSource,
  listIntegrationExecutions,
  PendenciaItem,
  patchIntegrationConfig,
  reconcilePendencias,
  runEntitySyncBulk,
  runEntitySyncNow,
  runIntegrationNow,
  SyncSummaryCounts,
} from "@/src/lib/integrationsAdmin";
import { useHospedagemAdminRefresh } from "../contexts/HospedagemAdminRefreshContext";

type SubAba = "providers" | "pendencias";
type TriggerFiltro = "" | "SCHEDULER" | "MANUAL" | "API" | "WEBHOOK";

const TRIGGER_FILTROS: Array<{ key: TriggerFiltro; label: string }> = [
  { key: "", label: "Todos" },
  { key: "SCHEDULER", label: "Scheduler" },
  { key: "MANUAL", label: "Manual" },
  { key: "API", label: "API" },
  { key: "WEBHOOK", label: "Webhook" },
];

/**
 * Dashboard genérico de integrações + Pendências (reprocessamento).
 */
export default function TabIntegracoes() {
  const {
    refreshSyncSummary,
    abrirPendenciasPedido,
    limparAbrirPendenciasPedido,
  } = useHospedagemAdminRefresh();
  const [sub, setSub] = useState<SubAba>("providers");
  const [itens, setItens] = useState<IntegrationProviderStatus[]>([]);
  const [summary, setSummary] = useState<SyncSummaryCounts | null>(null);
  const [pendencias, setPendencias] = useState<PendenciaItem[]>([]);
  const [pendTotal, setPendTotal] = useState(0);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [runningProvider, setRunningProvider] = useState<string | null>(null);
  const [bulkRunning, setBulkRunning] = useState(false);
  const [reconciling, setReconciling] = useState(false);
  const [historicoProvider, setHistoricoProvider] = useState<string | null>(
    null,
  );
  const [historicoRows, setHistoricoRows] = useState<IntegrationExecutionRow[]>(
    [],
  );
  const [historicoLoading, setHistoricoLoading] = useState(false);
  const [historicoTrigger, setHistoricoTrigger] = useState<TriggerFiltro>("");
  const [detalheExec, setDetalheExec] =
    useState<IntegrationExecutionRow | null>(null);

  useEffect(() => {
    if (abrirPendenciasPedido) {
      setSub("pendencias");
      limparAbrirPendenciasPedido();
    }
  }, [abrirPendenciasPedido, limparAbrirPendenciasPedido]);

  const carregar = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setErro(null);
    try {
      const [st, pend] = await Promise.all([
        getIntegrationsStatus(),
        getSyncPendencias(),
      ]);
      if (st.success && st.data) {
        setItens(st.data.providers || []);
        setSummary(st.data.summary || null);
      }
      if (pend.success && pend.data) {
        setPendencias(pend.data.items || []);
        setPendTotal(pend.data.total || 0);
      }
      refreshSyncSummary();
    } catch {
      setErro("Erro ao carregar integrações.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [refreshSyncSummary]);

  useEffect(() => {
    void carregar();
    const t = setInterval(() => void carregar(true), 20_000);
    return () => clearInterval(t);
  }, [carregar]);

  const abrirHistorico = async (
    provider: string,
    trigger: TriggerFiltro = "",
  ) => {
    setHistoricoProvider(provider);
    setHistoricoTrigger(trigger);
    setDetalheExec(null);
    setHistoricoLoading(true);
    try {
      const resp = await listIntegrationExecutions({
        provider,
        trigger: trigger || undefined,
        limit: 50,
      });
      if (resp.success && Array.isArray(resp.data)) {
        setHistoricoRows(resp.data);
      } else {
        setHistoricoRows([]);
        setErro(resp.message || "Falha ao carregar histórico.");
      }
    } catch {
      setHistoricoRows([]);
      setErro("Falha ao carregar histórico.");
    } finally {
      setHistoricoLoading(false);
    }
  };

  const filtrarHistorico = (trigger: TriggerFiltro) => {
    if (!historicoProvider) return;
    void abrirHistorico(historicoProvider, trigger);
  };

  const executarAgora = async (provider: string) => {
    setRunningProvider(provider);
    setMensagem(null);
    try {
      const resp = await runIntegrationNow(provider);
      setMensagem(
        resp.success
          ? `${provider}: ciclo disparado.`
          : resp.message || "Falha ao executar.",
      );
      await carregar(true);
    } finally {
      setRunningProvider(null);
    }
  };

  const reprocessarSelecionadas = async () => {
    const ids = Object.keys(selected).filter((k) => selected[k]);
    if (ids.length === 0) return;
    const byProvider: Record<string, string[]> = {};
    for (const key of ids) {
      const [provider, externalId] = key.split("::");
      if (!byProvider[provider]) byProvider[provider] = [];
      byProvider[provider].push(externalId);
    }
    setBulkRunning(true);
    setMensagem(null);
    try {
      for (const [provider, externalIds] of Object.entries(byProvider)) {
        await runEntitySyncBulk(provider, externalIds);
      }
      setMensagem(`Reprocessadas ${ids.length} reserva(s).`);
      setSelected({});
      await carregar(true);
    } catch {
      setErro("Falha no reprocessamento em lote.");
    } finally {
      setBulkRunning(false);
    }
  };

  if (loading && itens.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.azul} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.wrap}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            void carregar(true);
          }}
        />
      }
    >
      <Text style={styles.titulo}>Integrações</Text>
      <Text style={styles.subtitulo}>
        Monitoramento, pendências e sincronização automática.
      </Text>

      <View style={styles.subAbas}>
        <TouchableOpacity
          style={[styles.subAba, sub === "providers" && styles.subAbaAtiva]}
          onPress={() => setSub("providers")}
        >
          <Text
            style={[
              styles.subAbaTexto,
              sub === "providers" && styles.subAbaTextoAtivo,
            ]}
          >
            Providers
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.subAba, sub === "pendencias" && styles.subAbaAtiva]}
          onPress={() => setSub("pendencias")}
        >
          <Text
            style={[
              styles.subAbaTexto,
              sub === "pendencias" && styles.subAbaTextoAtivo,
            ]}
          >
            Pendências{pendTotal > 0 ? ` (${pendTotal})` : ""}
          </Text>
        </TouchableOpacity>
      </View>

      {erro ? <Text style={styles.erro}>{erro}</Text> : null}
      {mensagem ? <Text style={styles.ok}>{mensagem}</Text> : null}

      <TouchableOpacity
        style={[
          styles.btn,
          styles.btnSec,
          reconciling && styles.btnOff,
          { alignSelf: "flex-start" },
        ]}
        disabled={reconciling}
        onPress={() => {
          setReconciling(true);
          setMensagem(null);
          void reconcilePendencias({ limit: 5000 })
            .then((resp) => {
              if (resp.success && resp.data) {
                setMensagem(
                  `Reconciliado: ${resp.data.ignored} ignoradas · ${resp.data.resolved} resolvidas · ${resp.data.keptOpen} ainda abertas (de ${resp.data.scanned} analisadas).`,
                );
              } else {
                setErro(resp.message || "Falha ao reconciliar.");
              }
              return carregar(true);
            })
            .finally(() => setReconciling(false));
        }}
      >
        <Text style={styles.btnSecTexto}>
          {reconciling ? "Reconciliando…" : "Reconciliar Pendências"}
        </Text>
      </TouchableOpacity>

      {summary ? (
        <View style={styles.summaryBox}>
          <Text style={styles.summaryTitulo}>Reservas (sync)</Text>

          {summary.saude ? (
            <View
              style={[
                styles.saudeBox,
                summary.saude.ativa ? styles.saudeOk : styles.saudeOff,
              ]}
            >
              <Text style={styles.saudeTitulo}>
                {summary.saude.ativa
                  ? "🟢 Integração ativa"
                  : summary.saude.execucoes > 0
                    ? "🟡 Sem execução recente"
                    : "⚪ Aguardando primeira sincronização"}
              </Text>
              <Text style={styles.saudeTexto}>{summary.saude.mensagem}</Text>
              {summary.saude.execucoes > 0 ? (
                <Text style={styles.saudeTexto}>
                  {formatPtNumber(summary.saude.execucoes)} execuções ·{" "}
                  {formatPtNumber(summary.saude.reservasSincronizadas)}{" "}
                  reservas sincronizadas
                </Text>
              ) : null}
            </View>
          ) : null}

          <Text style={styles.blocoTitulo}>Estado atual</Text>
          <View style={styles.summaryRow}>
            <Metric
              label="Erros"
              valor={
                summary.errosTotal ??
                summary.erros + (summary.errosSemReserva || 0)
              }
              destaque
            />
            <Metric label="Críticos" valor={summary.criticos} />
            <Metric label="Alertas" valor={summary.alertas} />
            <Metric label="Pendentes" valor={summary.pendentes} />
            <Metric label="Processando" valor={summary.processando} />
            <Metric label="Aguardando" valor={summary.aguardandoSync} />
          </View>
          {(summary.errosSemReserva || 0) > 0 ? (
            <Text style={styles.ultimoErro}>
              {summary.errosSemReserva} pendência
              {summary.errosSemReserva === 1 ? "" : "s"} sem reserva criada
              (veja a aba Pendências).
              {summary.erros > 0
                ? ` · ${summary.erros} com reserva na tela Reservas.`
                : ""}
            </Text>
          ) : null}
          {summary.ultimoErro ? (
            <Text style={styles.ultimoErro}>
              Último erro: {summary.ultimoErro}
            </Text>
          ) : null}

          {summary.lastExecution ? (
            <View style={styles.blocoMetricas}>
              <Text style={styles.blocoTitulo}>Última sincronização</Text>
              <Linha
                label="Data/hora"
                valor={
                  summary.lastExecution.startedAt
                    ? formatDateTimeHospedagem(summary.lastExecution.startedAt)
                    : "—"
                }
              />
              <Linha
                label="Trigger"
                valor={labelTriggerSource(summary.lastExecution.triggerSource)}
              />
              <Linha
                label="Tempo"
                valor={formatDurationMs(summary.lastExecution.durationMs)}
              />
              <Linha
                label="Resultado"
                valor={labelExecutionStatus(summary.lastExecution.status)}
              />
              <Linha
                label="Importadas"
                valor={formatPtNumber(summary.lastExecution.imported)}
              />
              <Linha
                label="Validadas"
                valor={formatPtNumber(summary.lastExecution.validated)}
              />
              <Linha
                label="CREATE"
                valor={formatPtNumber(summary.lastExecution.created)}
              />
              <Linha
                label="UPDATE"
                valor={formatPtNumber(summary.lastExecution.updated)}
              />
              <Linha
                label="CANCEL"
                valor={formatPtNumber(summary.lastExecution.cancelled)}
              />
              <Linha
                label="Ignoradas"
                valor={formatPtNumber(summary.lastExecution.ignored)}
              />
              <Linha
                label="Sem alterações"
                valor={formatPtNumber(summary.lastExecution.unchanged)}
              />
              <Linha
                label="Falhas"
                valor={formatPtNumber(summary.lastExecution.failed)}
              />
            </View>
          ) : null}

          {summary.acumulado && summary.acumulado.execucoes > 0 ? (
            <View style={styles.blocoMetricas}>
              <Text style={styles.blocoTitulo}>Resumo geral</Text>
              <Linha
                label="Execuções"
                valor={formatPtNumber(summary.acumulado.execucoes)}
              />
              <Linha
                label="Reservas importadas"
                valor={formatPtNumber(summary.acumulado.importadas)}
              />
              <Linha
                label="CREATE"
                valor={formatPtNumber(summary.acumulado.created)}
              />
              <Linha
                label="UPDATE"
                valor={formatPtNumber(summary.acumulado.updated)}
              />
              <Linha
                label="CANCEL"
                valor={formatPtNumber(summary.acumulado.cancelled)}
              />
              <Linha
                label="Falhas"
                valor={formatPtNumber(summary.acumulado.failed)}
              />
            </View>
          ) : null}
        </View>
      ) : null}

      {sub === "providers"
        ? itens.map((item) => {
            const cor = corProviderUiStatus(item.uiStatus);
            const busy =
              runningProvider === item.provider ||
              item.uiStatus === "executando";
            const stats = item.executionStats;
            const last = item.lastExecution;
            const ignoradas =
              Number(last?.validatedIgnored || 0) + Number(last?.skipped || 0);
            return (
              <View key={item.provider} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.nome}>{item.displayName}</Text>
                    <Text style={styles.providerId}>{item.provider}</Text>
                  </View>
                  <View style={[styles.badge, { backgroundColor: cor }]}>
                    <Text style={styles.badgeTexto}>
                      {labelProviderUiStatus(item.uiStatus)}
                    </Text>
                  </View>
                </View>

                <Linha
                  label="Habilitado"
                  valor={item.enabled ? "Sim" : "Não"}
                />
                <Linha
                  label="Intervalo"
                  valor={`${item.intervalMinutes} min`}
                />

                {stats ? (
                  <View style={styles.blocoMetricas}>
                    <Text style={styles.blocoTitulo}>Execuções</Text>
                    <Linha
                      label="Total"
                      valor={formatPtNumber(stats.total)}
                    />
                    <Linha
                      label="Sucesso"
                      valor={formatPtNumber(stats.success)}
                    />
                    <Linha
                      label="Falhas"
                      valor={formatPtNumber(stats.failed)}
                    />
                    <Linha
                      label="Taxa de sucesso"
                      valor={formatSuccessRate(stats.successRate)}
                    />
                    <Linha
                      label="Últimos 7 dias"
                      valor={formatPtNumber(stats.last7Days)}
                    />
                    <Linha
                      label="Últimos 30 dias"
                      valor={formatPtNumber(stats.last30Days)}
                    />
                    <Linha
                      label="Tempo médio"
                      valor={formatDurationMs(stats.avgDurationMs)}
                    />
                    <Linha
                      label="Tempo máx / mín"
                      valor={`${formatDurationMs(stats.maxDurationMs)} / ${formatDurationMs(stats.minDurationMs)}`}
                    />
                    <Linha
                      label="Média sync/execução"
                      valor={
                        stats.avgSyncedPerRun != null
                          ? formatPtNumber(stats.avgSyncedPerRun)
                          : "—"
                      }
                    />
                  </View>
                ) : null}

                {last ? (
                  <View style={styles.blocoMetricas}>
                    <Text style={styles.blocoTitulo}>Última execução</Text>
                    <Linha
                      label="Data/hora"
                      valor={
                        last.startedAt
                          ? formatDateTimeHospedagem(last.startedAt)
                          : "—"
                      }
                    />
                    <Linha
                      label="Duração"
                      valor={formatDurationMs(last.durationMs)}
                    />
                    <Linha
                      label="Trigger"
                      valor={labelTriggerSource(last.triggerSource)}
                    />
                    <Linha
                      label="Resultado"
                      valor={labelExecutionStatus(last.status)}
                    />
                    <Text style={[styles.blocoTitulo, { marginTop: 8 }]}>
                      Resumo
                    </Text>
                    <Linha
                      label="Import"
                      valor={formatPtNumber(last.imported)}
                    />
                    <Linha
                      label="CREATE"
                      valor={formatPtNumber(last.created)}
                    />
                    <Linha
                      label="UPDATE"
                      valor={formatPtNumber(last.updated)}
                    />
                    <Linha
                      label="CANCEL"
                      valor={formatPtNumber(last.cancelled)}
                    />
                    <Linha
                      label="Ignoradas"
                      valor={formatPtNumber(ignoradas)}
                    />
                    <Linha
                      label="Falhas"
                      valor={formatPtNumber(last.failed)}
                    />
                    {last.errorMessage ? (
                      <Text style={styles.ultimoErro}>{last.errorMessage}</Text>
                    ) : null}
                  </View>
                ) : (
                  <Text style={styles.meta}>Nenhuma execução registrada.</Text>
                )}

                <Linha
                  label="Próxima"
                  valor={
                    item.nextRunAt
                      ? formatDateTimeHospedagem(item.nextRunAt)
                      : "—"
                  }
                />

                <View style={styles.actions}>
                  <TouchableOpacity
                    style={[styles.btn, styles.btnPrim, busy && styles.btnOff]}
                    disabled={busy}
                    onPress={() => void executarAgora(item.provider)}
                  >
                    <Text style={styles.btnPrimTexto}>Executar agora</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.btn, styles.btnSec]}
                    onPress={() => void abrirHistorico(item.provider)}
                  >
                    <Text style={styles.btnSecTexto}>Histórico</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.btn, styles.btnSec]}
                    onPress={() =>
                      void patchIntegrationConfig(item.provider, {
                        enabled: !item.enabled,
                      }).then(() => carregar(true))
                    }
                  >
                    <Text style={styles.btnSecTexto}>
                      {item.enabled ? "Desabilitar" : "Habilitar"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        : null}

      {sub === "pendencias" ? (
        <View style={{ gap: 10 }}>
          <View style={styles.actions}>
            <TouchableOpacity
              style={[
                styles.btn,
                styles.btnPrim,
                (bulkRunning ||
                  Object.values(selected).every((v) => !v)) &&
                  styles.btnOff,
              ]}
              disabled={
                bulkRunning || Object.values(selected).every((v) => !v)
              }
              onPress={() => void reprocessarSelecionadas()}
            >
              <Text style={styles.btnPrimTexto}>
                Reprocessar selecionadas
              </Text>
            </TouchableOpacity>
          </View>
          {pendencias.length === 0 ? (
            <Text style={styles.vazio}>Nenhuma pendência de sincronização.</Text>
          ) : (
            pendencias.map((p) => {
              const key = `${p.provider}::${p.externalId}`;
              return (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.card,
                    selected[key] && styles.cardSelected,
                  ]}
                  onPress={() =>
                    setSelected((s) => ({ ...s, [key]: !s[key] }))
                  }
                  activeOpacity={0.85}
                >
                  <Text style={styles.nome}>
                    {p.provider} #{p.externalId}
                    {p.staging?.guestName ? ` · ${p.staging.guestName}` : ""}
                  </Text>
                  <Text style={styles.meta}>
                    {p.errorSeverityLabel || p.errorSeverity || "—"} ·{" "}
                    {p.errorCode || p.syncStatus}
                  </Text>
                  {p.lastError ? (
                    <Text style={styles.ultimoErro}>{p.lastError}</Text>
                  ) : null}
                  <TouchableOpacity
                    style={[styles.btn, styles.btnSec, { marginTop: 8 }]}
                    onPress={(e) => {
                      e.stopPropagation?.();
                      void runEntitySyncNow(p.provider, p.externalId, {
                        refreshImport: false,
                      }).then(() => carregar(true));
                    }}
                  >
                    <Text style={styles.btnSecTexto}>Reprocessar</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      ) : null}

      <Modal
        visible={Boolean(historicoProvider)}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setHistoricoProvider(null);
          setDetalheExec(null);
        }}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => {
            setHistoricoProvider(null);
            setDetalheExec(null);
          }}
        >
          <Pressable
            style={styles.modalCard}
            onPress={(e) => e.stopPropagation?.()}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitulo}>
                Histórico · {historicoProvider}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setHistoricoProvider(null);
                  setDetalheExec(null);
                }}
              >
                <Text style={styles.modalFechar}>Fechar</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginBottom: 10 }}
            >
              {TRIGGER_FILTROS.map((f) => (
                <TouchableOpacity
                  key={f.key || "all"}
                  style={[
                    styles.filtroChip,
                    historicoTrigger === f.key && styles.filtroChipOn,
                  ]}
                  onPress={() => filtrarHistorico(f.key)}
                >
                  <Text
                    style={[
                      styles.filtroTexto,
                      historicoTrigger === f.key && styles.filtroTextoOn,
                    ]}
                  >
                    {f.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {historicoLoading ? (
              <ActivityIndicator color={colors.azul} />
            ) : (
              <ScrollView style={{ maxHeight: Platform.OS === "web" ? 420 : 360 }}>
                <View style={styles.tableHead}>
                  <Text style={[styles.th, styles.colData]}>Data</Text>
                  <Text style={[styles.th, styles.colTrigger]}>Trigger</Text>
                  <Text style={[styles.th, styles.colTempo]}>Tempo</Text>
                  <Text style={[styles.th, styles.colResult]}>Resultado</Text>
                  <Text style={[styles.th, styles.colNum]}>Imp</Text>
                  <Text style={[styles.th, styles.colNum]}>C</Text>
                  <Text style={[styles.th, styles.colNum]}>U</Text>
                  <Text style={[styles.th, styles.colNum]}>X</Text>
                  <Text style={[styles.th, styles.colNum]}>Fail</Text>
                </View>
                {historicoRows.length === 0 ? (
                  <Text style={styles.vazio}>Nenhuma execução.</Text>
                ) : (
                  historicoRows.map((row) => (
                    <TouchableOpacity
                      key={row.id}
                      style={[
                        styles.tableRow,
                        detalheExec?.id === row.id && styles.tableRowOn,
                      ]}
                      onPress={() => setDetalheExec(row)}
                    >
                      <Text style={[styles.td, styles.colData]} numberOfLines={1}>
                        {row.startedAt
                          ? formatDateTimeHospedagem(String(row.startedAt))
                          : "—"}
                      </Text>
                      <Text style={[styles.td, styles.colTrigger]} numberOfLines={1}>
                        {labelTriggerSource(row.triggerSource)}
                      </Text>
                      <Text style={[styles.td, styles.colTempo]} numberOfLines={1}>
                        {formatDurationMs(row.durationMs)}
                      </Text>
                      <Text style={[styles.td, styles.colResult]} numberOfLines={1}>
                        {labelExecutionStatus(row.status)}
                      </Text>
                      <Text style={[styles.td, styles.colNum]}>
                        {row.imported ?? 0}
                      </Text>
                      <Text style={[styles.td, styles.colNum]}>
                        {row.created ?? 0}
                      </Text>
                      <Text style={[styles.td, styles.colNum]}>
                        {row.updated ?? 0}
                      </Text>
                      <Text style={[styles.td, styles.colNum]}>
                        {row.cancelled ?? 0}
                      </Text>
                      <Text style={[styles.td, styles.colNum]}>
                        {row.failed ?? 0}
                      </Text>
                    </TouchableOpacity>
                  ))
                )}
              </ScrollView>
            )}

            {detalheExec ? (
              <View style={styles.detalheBox}>
                <Text style={styles.blocoTitulo}>
                  Detalhe #{detalheExec.id}
                </Text>
                <Linha
                  label="Correlation"
                  valor={detalheExec.correlationId || "—"}
                />
                <Linha
                  label="Modo"
                  valor={detalheExec.mode || "—"}
                />
                <Linha
                  label="Início"
                  valor={
                    detalheExec.startedAt
                      ? formatDateTimeHospedagem(String(detalheExec.startedAt))
                      : "—"
                  }
                />
                <Linha
                  label="Fim"
                  valor={
                    detalheExec.finishedAt
                      ? formatDateTimeHospedagem(String(detalheExec.finishedAt))
                      : "—"
                  }
                />
                <Linha
                  label="Validated"
                  valor={formatPtNumber(detalheExec.validated)}
                />
                <Linha
                  label="Ready"
                  valor={formatPtNumber(detalheExec.validatedReady)}
                />
                <Linha
                  label="Ignoradas (validate)"
                  valor={formatPtNumber(detalheExec.validatedIgnored)}
                />
                <Linha
                  label="Skipped"
                  valor={formatPtNumber(detalheExec.skipped)}
                />
                <Linha
                  label="Unchanged"
                  valor={formatPtNumber(detalheExec.unchanged)}
                />
                {detalheExec.errorMessage ? (
                  <Text style={styles.ultimoErro}>
                    {detalheExec.errorMessage}
                  </Text>
                ) : null}
              </View>
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>
    </ScrollView>
  );
}

function Linha({ label, valor }: { label: string; valor: string }) {
  return (
    <View style={styles.linha}>
      <Text style={styles.linhaLabel}>{label}</Text>
      <Text style={styles.linhaValor}>{valor}</Text>
    </View>
  );
}

function Metric({
  label,
  valor,
  destaque,
}: {
  label: string;
  valor: number;
  destaque?: boolean;
}) {
  return (
    <View style={[styles.metric, destaque && styles.metricDestaque]}>
      <Text style={styles.metricValor}>{valor}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  content: { paddingBottom: 32, gap: 12 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  titulo: { fontSize: 18, fontWeight: "700", color: colors.cinza },
  subtitulo: { fontSize: 13, color: "#6b7280", marginBottom: 4 },
  subAbas: { flexDirection: "row", gap: 8 },
  subAba: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#f3f4f6",
  },
  subAbaAtiva: { backgroundColor: "rgba(0, 115, 230, 0.12)" },
  subAbaTexto: { fontSize: 13, fontWeight: "600", color: "#6b7280" },
  subAbaTextoAtivo: { color: "#0073E6", fontWeight: "700" },
  erro: { color: "#b91c1c", fontSize: 13, fontWeight: "600" },
  ok: { color: "#027a3a", fontSize: 13, fontWeight: "600" },
  vazio: { color: "#9ca3af", fontSize: 14 },
  summaryBox: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    padding: 12,
    gap: 8,
    backgroundColor: "#fff",
  },
  summaryTitulo: {
    fontSize: 12,
    fontWeight: "700",
    color: "#6b7280",
    textTransform: "uppercase",
  },
  saudeBox: {
    borderRadius: 10,
    padding: 10,
    gap: 2,
    marginBottom: 4,
  },
  saudeOk: {
    backgroundColor: "#ecfdf5",
    borderWidth: 1,
    borderColor: "#a7f3d0",
  },
  saudeOff: {
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  saudeTitulo: {
    fontSize: 14,
    fontWeight: "700",
    color: "#065f46",
  },
  saudeTexto: {
    fontSize: 12,
    color: "#047857",
    fontWeight: "500",
  },
  summaryRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  metric: {
    minWidth: 72,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    padding: 8,
    alignItems: "center",
  },
  metricDestaque: { borderColor: "#fecaca", backgroundColor: "#fef2f2" },
  metricValor: { fontSize: 16, fontWeight: "700", color: colors.cinza },
  metricLabel: { fontSize: 10, color: "#9ca3af", fontWeight: "600" },
  card: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 14,
    padding: 14,
    backgroundColor: "#fafbfc",
    gap: 6,
  },
  cardSelected: {
    borderColor: colors.azul,
    backgroundColor: "rgba(0,115,230,0.06)",
  },
  cardHeader: { flexDirection: "row", gap: 10, marginBottom: 4 },
  nome: { fontSize: 16, fontWeight: "700", color: colors.cinza },
  providerId: { fontSize: 12, color: "#9ca3af" },
  badge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  badgeTexto: { color: "#fff", fontSize: 11, fontWeight: "700" },
  linha: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  linhaLabel: { fontSize: 13, color: "#6b7280" },
  linhaValor: {
    fontSize: 13,
    fontWeight: "600",
    color: "#111827",
    textAlign: "right",
    flex: 1,
  },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 },
  btn: {
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    minHeight: 40,
    justifyContent: "center",
  },
  btnPrim: { backgroundColor: colors.azul },
  btnPrimTexto: { color: "#fff", fontWeight: "700", fontSize: 13 },
  btnSec: { borderWidth: 1, borderColor: colors.azul, backgroundColor: "#fff" },
  btnSecTexto: { color: colors.azul, fontWeight: "700", fontSize: 13 },
  btnOff: { opacity: 0.5 },
  ultimoErro: { fontSize: 12, color: "#b91c1c" },
  meta: { fontSize: 12, color: "#6b7280" },
  blocoMetricas: {
    marginTop: 6,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#e5e7eb",
    gap: 4,
  },
  blocoTitulo: {
    fontSize: 11,
    fontWeight: "700",
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    padding: 16,
  },
  modalCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    maxHeight: "92%",
    maxWidth: 960,
    width: "100%",
    alignSelf: "center",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  modalTitulo: { fontSize: 16, fontWeight: "700", color: colors.cinza },
  modalFechar: { color: colors.azul, fontWeight: "700", fontSize: 13 },
  filtroChip: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    backgroundColor: "#fff",
  },
  filtroChipOn: {
    borderColor: colors.azul,
    backgroundColor: "rgba(0,115,230,0.08)",
  },
  filtroTexto: { fontSize: 12, color: "#6b7280", fontWeight: "600" },
  filtroTextoOn: { color: colors.azul },
  tableHead: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    paddingBottom: 6,
    marginBottom: 4,
    minWidth: 720,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#f3f4f6",
    minWidth: 720,
  },
  tableRowOn: { backgroundColor: "rgba(0,115,230,0.06)" },
  th: { fontSize: 10, fontWeight: "700", color: "#9ca3af" },
  td: { fontSize: 11, color: "#374151" },
  colData: { width: 130 },
  colTrigger: { width: 80 },
  colTempo: { width: 70 },
  colResult: { width: 80 },
  colNum: { width: 42, textAlign: "right" },
  detalheBox: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    gap: 4,
  },
});
