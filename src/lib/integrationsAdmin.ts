import { api } from "@/src/lib/api";
import { ApiResponse } from "@/src/types/geral";

export type SyncUiStatus =
  | "SINCRONIZADA"
  | "PENDENTE"
  | "PROCESSANDO"
  | "ERRO"
  | "IGNORADA";

export type SyncIntegracaoResumo = {
  uiStatus?: SyncUiStatus | null;
  syncStatus?: string | null;
  syncAction?: string | null;
  lastError?: string | null;
  errorCode?: string | null;
  errorSeverity?: string | null;
  errorSeverityLabel?: string | null;
  lastSyncAt?: string | null;
  lastSuccessAt?: string | null;
  retryCount?: number;
  provider?: string;
  externalId?: string;
  nextRetryAt?: string | null;
  validationStatus?: string | null;
};

export type SyncSummaryCounts = {
  /** OPEN com ReservaHospedagem — mesma regra do filtro "Falhas sync". */
  erros: number;
  /** OPEN sem reserva (internal_entity_id NULL) — só em Pendências. */
  errosSemReserva?: number;
  /** erros + errosSemReserva. */
  errosTotal?: number;
  criticos: number;
  alertas: number;
  informativos: number;
  pendentes: number;
  processando: number;
  sincronizadas: number;
  ignoradas: number;
  aguardandoSync: number;
  ultimoErro: string | null;
  ultimaSincronizacaoSucesso: string | null;
  lastExecution?: {
    id: number;
    provider: string;
    status: string;
    triggerSource: string;
    startedAt: string;
    finishedAt: string | null;
    durationMs: number | null;
    imported: number | null;
    validated: number | null;
    validatedReady: number | null;
    validatedIgnored: number | null;
    created: number | null;
    updated: number | null;
    cancelled: number | null;
    failed: number | null;
    skipped: number | null;
    unchanged: number | null;
    ignored: number | null;
    errorMessage: string | null;
  } | null;
  acumulado?: {
    execucoes: number;
    importadas: number;
    validadas: number;
    created: number;
    updated: number;
    cancelled: number;
    failed: number;
    ignored: number;
    unchanged: number;
    reservasSincronizadas: number;
  } | null;
  saude?: {
    ativa: boolean;
    ultimaExecucaoAt: string | null;
    ultimaExecucaoHaMs: number | null;
    execucoes: number;
    reservasSincronizadas: number;
    mensagem: string;
  } | null;
};

export type IntegrationExecutionRow = {
  id: number;
  provider?: string;
  triggerSource: string;
  mode?: string | null;
  correlationId?: string;
  startedAt: string;
  finishedAt: string | null;
  durationMs: number | null;
  status: string;
  imported: number | null;
  validated: number | null;
  validatedReady: number | null;
  validatedIgnored: number | null;
  created: number | null;
  updated: number | null;
  cancelled: number | null;
  failed: number | null;
  skipped: number | null;
  unchanged: number | null;
  errorMessage: string | null;
  summaryJson?: unknown;
};

export type ProviderExecutionStats = {
  total: number;
  success: number;
  failed: number;
  partial: number;
  skipped: number;
  running: number;
  successRate: number;
  last7Days: number;
  last30Days: number;
  avgDurationMs: number | null;
  maxDurationMs: number | null;
  minDurationMs: number | null;
  avgSyncedPerRun: number | null;
};

export type IntegrationProviderStatus = {
  provider: string;
  displayName: string;
  enabled: boolean;
  intervalMinutes: number;
  mode: string;
  syncLimit: number;
  priority: number;
  maxRetries: number;
  backoffBaseSeconds: number;
  webhookEnabled: boolean;
  status: string;
  uiStatus: "executando" | "aguardando" | "erro" | "desabilitado" | "retry";
  lastStartedAt: string | null;
  lastFinishedAt: string | null;
  lastSuccessAt: string | null;
  lastErrorAt: string | null;
  lastErrorMessage: string | null;
  nextRunAt: string | null;
  lastDurationMs: number | null;
  consecutiveFailures: number;
  lastExecution: IntegrationExecutionRow | null;
  executionStats: ProviderExecutionStats | null;
  registered: boolean;
};

export type PendenciaItem = {
  provider: string;
  externalId: string;
  internalEntityId: string | null;
  syncStatus: string;
  uiStatus: SyncUiStatus | null;
  syncAction: string | null;
  errorCode: string | null;
  errorSeverity: string | null;
  errorSeverityLabel: string | null;
  lastError: string | null;
  retryCount: number;
  lastSyncAt: string | null;
  nextRetryAt: string | null;
  staging?: {
    searchableCode?: string | null;
    checkin?: string | null;
    checkout?: string | null;
    status?: string | null;
    guestName?: string | null;
  } | null;
};

export type EntitySyncEvent = {
  id: number;
  provider: string;
  externalId: string;
  internalEntityId?: string | null;
  operation: string;
  result: string;
  errorCode?: string | null;
  errorSeverity?: string | null;
  message?: string | null;
  durationMs?: number | null;
  createdAt: string;
};

export async function getIntegrationsStatus(): Promise<
  ApiResponse<{
    providers: IntegrationProviderStatus[];
    summary: SyncSummaryCounts;
  }>
> {
  return api.request("/api/integrations/status", "GET");
}

export async function listIntegrationExecutions(params?: {
  provider?: string;
  trigger?: string;
  status?: string;
  limit?: number;
  offset?: number;
}): Promise<ApiResponse<IntegrationExecutionRow[]>> {
  return api.request("/api/integrations/executions", "GET", null, {
    provider: params?.provider || "",
    trigger: params?.trigger || "",
    status: params?.status || "",
    limit: String(params?.limit ?? 50),
    offset: String(params?.offset ?? 0),
  });
}

export async function getIntegrationExecution(
  id: number,
): Promise<ApiResponse<IntegrationExecutionRow>> {
  return api.request(`/api/integrations/executions/${id}`, "GET");
}

export async function getProviderExecutionStatsApi(
  provider: string,
): Promise<ApiResponse<ProviderExecutionStats>> {
  return api.request(
    `/api/integrations/${encodeURIComponent(provider)}/execution-stats`,
    "GET",
  );
}

export function labelTriggerSource(trigger?: string | null): string {
  const t = String(trigger || "").toUpperCase();
  if (t === "SCHEDULER") return "Scheduler";
  if (t === "MANUAL") return "Manual";
  if (t === "API") return "API";
  if (t === "WEBHOOK") return "Webhook";
  if (t === "RETRY") return "Retry";
  return trigger || "—";
}

export function labelExecutionStatus(status?: string | null): string {
  const s = String(status || "").toUpperCase();
  if (s === "SUCCESS") return "Sucesso";
  if (s === "PARTIAL") return "Parcial";
  if (s === "FAILED") return "Erro";
  if (s === "SKIPPED") return "Ignorada";
  if (s === "RUNNING") return "Executando";
  return status || "—";
}

export function formatDurationMs(ms?: number | null): string {
  if (ms == null || !Number.isFinite(ms)) return "—";
  if (ms < 1000) return `${Math.round(ms)} ms`;
  const sec = ms / 1000;
  if (sec < 60) return `${sec.toFixed(sec < 10 ? 1 : 0)} s`;
  const min = Math.floor(sec / 60);
  const rem = Math.round(sec % 60);
  return `${min}m ${rem}s`;
}

export function formatPtNumber(n?: number | null): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return Number(n).toLocaleString("pt-BR");
}

export function formatSuccessRate(rate?: number | null): string {
  if (rate == null || !Number.isFinite(rate)) return "—";
  return `${Number(rate).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}%`;
}

export async function getSyncSummary(): Promise<
  ApiResponse<SyncSummaryCounts>
> {
  return api.request("/api/integrations/sync-summary", "GET");
}

export async function getSyncPendencias(params?: {
  provider?: string;
  severity?: string;
}): Promise<ApiResponse<{ total: number; items: PendenciaItem[] }>> {
  return api.request("/api/integrations/pendencias", "GET", null, {
    provider: params?.provider || "",
    severity: params?.severity || "",
  });
}

export async function runIntegrationNow(
  provider: string,
  body?: { mode?: string; syncLimit?: number },
): Promise<ApiResponse<Record<string, unknown>>> {
  return api.request(
    `/api/integrations/${encodeURIComponent(provider)}/run`,
    "POST",
    body ?? {},
  );
}

export async function runEntitySyncNow(
  provider: string,
  externalId: string,
  body?: { refreshImport?: boolean },
): Promise<ApiResponse<Record<string, unknown>>> {
  return api.request(
    `/api/integrations/${encodeURIComponent(provider)}/entities/${encodeURIComponent(externalId)}/run`,
    "POST",
    body ?? {},
  );
}

export async function runEntitySyncBulk(
  provider: string,
  externalIds: string[],
): Promise<ApiResponse<{ total: number; ok: number; failed: number }>> {
  return api.request(
    `/api/integrations/${encodeURIComponent(provider)}/entities/run-bulk`,
    "POST",
    { externalIds },
  );
}

export async function reconcilePendencias(body?: {
  provider?: string;
  limit?: number;
}): Promise<
  ApiResponse<{
    scanned: number;
    ignored: number;
    resolved: number;
    keptOpen: number;
  }>
> {
  return api.request(
    "/api/integrations/pendencias/reconcile",
    "POST",
    body ?? {},
  );
}

export async function getEntitySyncEvents(params: {
  provider?: string;
  externalId?: string;
  internalEntityId?: string;
  limit?: number;
}): Promise<ApiResponse<EntitySyncEvent[]>> {
  return api.request("/api/integrations/entity-events", "GET", null, {
    provider: params.provider || "",
    externalId: params.externalId || "",
    internalEntityId: params.internalEntityId || "",
    limit: String(params.limit || 20),
  });
}

export async function patchIntegrationConfig(
  provider: string,
  patch: Partial<{
    enabled: boolean;
    intervalMinutes: number;
    mode: string;
    syncLimit: number;
  }>,
): Promise<ApiResponse<Record<string, unknown>>> {
  return api.request(
    `/api/integrations/${encodeURIComponent(provider)}/config`,
    "PATCH",
    patch,
  );
}

export function labelUiStatus(ui?: SyncUiStatus | null): string {
  switch (ui) {
    case "SINCRONIZADA":
      return "Sincronizada";
    case "PENDENTE":
      return "Pendente";
    case "PROCESSANDO":
      return "Processando";
    case "ERRO":
      return "Erro";
    case "IGNORADA":
      return "Ignorada";
    default:
      return "";
  }
}

export function emojiUiStatus(ui?: SyncUiStatus | null): string {
  switch (ui) {
    case "SINCRONIZADA":
      return "🟢";
    case "PENDENTE":
      return "🟡";
    case "PROCESSANDO":
      return "🔵";
    case "ERRO":
      return "🔴";
    case "IGNORADA":
      return "⚪";
    default:
      return "";
  }
}

export function labelProviderUiStatus(
  ui: IntegrationProviderStatus["uiStatus"],
): string {
  switch (ui) {
    case "executando":
      return "Executando";
    case "aguardando":
      return "Aguardando";
    case "erro":
      return "Erro";
    case "desabilitado":
      return "Desabilitado";
    case "retry":
      return "Aguardando retry";
    default:
      return ui;
  }
}

export function corProviderUiStatus(
  ui: IntegrationProviderStatus["uiStatus"],
): string {
  switch (ui) {
    case "executando":
      return "#0073E6";
    case "aguardando":
      return "#027a3a";
    case "erro":
      return "#b91c1c";
    case "desabilitado":
      return "#6b7280";
    case "retry":
      return "#b45309";
    default:
      return "#6b7280";
  }
}
