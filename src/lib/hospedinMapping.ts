import { api } from "./api";

export type HospedinImportResult = {
  operacao: string;
  fetched: number;
  upserted: number;
  accountId: string | null;
  durationMs: number;
  sucesso: boolean;
  erro?: string | null;
};

export type HospedinSuiteMapping = {
  id: number;
  provider: string;
  place_id: number;
  id_evento_suite: number | null;
  id_evento: number | null;
  ativo: boolean;
  /** LINKED | IGNORED — UNMAPPED = sem linha ativa */
  mapping_status?: string | null;
  notes: string | null;
  mapped_at: string;
  mapped_by: number | null;
  created_at: string;
  updated_at: string;
  place_nome?: string | null;
  suite_nome?: string | null;
};

export type HospedinUnmappedPlace = {
  placeId: number;
  nome: string;
  placeTypeId: number | null;
  capacidade: number | null;
  suggestion: {
    idEventoSuite: number;
    nome: string;
    idEvento: number;
    score: number;
  } | null;
};

export type PlaceSuiteResolved =
  | {
      found: true;
      status?: "LINKED";
      placeId: number;
      idEventoSuite: number;
      idEvento: number | null;
      mapId: number;
      mappedAt: string;
      mappedBy: number | null;
    }
  | {
      found: false;
      status?: "IGNORED" | "UNMAPPED";
      placeId: number | null;
      reason: string;
      message: string;
      mapId?: number;
      mappedAt?: string;
      mappedBy?: number | null;
    };

export async function listHospedinSuiteMappings(params?: {
  ativo?: boolean;
  idEvento?: number;
  limit?: number;
}): Promise<{ total: number; items: HospedinSuiteMapping[] }> {
  const query: Record<string, string> = {};
  if (params?.ativo !== undefined) query.ativo = String(params.ativo);
  if (params?.idEvento != null) query.idEvento = String(params.idEvento);
  if (params?.limit != null) query.limit = String(params.limit);

  const resp = await api.request<{ total: number; items: HospedinSuiteMapping[] }>(
    "/api/integrations/hospedin/mappings/suites",
    "GET",
    null,
    Object.keys(query).length ? query : undefined,
  );

  if (resp?.success === false) {
    throw new Error(resp.message || "Falha ao listar mapeamentos.");
  }

  const body = resp?.data;
  return {
    total: Number(body?.total ?? 0),
    items: Array.isArray(body?.items) ? body.items : [],
  };
}

export async function listHospedinUnmappedPlaces(params?: {
  idEvento?: number;
  limit?: number;
}): Promise<{ total: number; items: HospedinUnmappedPlace[]; note?: string }> {
  const query: Record<string, string> = {};
  if (params?.idEvento != null) query.idEvento = String(params.idEvento);
  if (params?.limit != null) query.limit = String(params.limit);

  const resp = await api.request<{
    total: number;
    items: HospedinUnmappedPlace[];
    note?: string;
  }>(
    "/api/integrations/hospedin/mappings/suites/unmapped",
    "GET",
    null,
    Object.keys(query).length ? query : undefined,
  );

  if (resp?.success === false) {
    throw new Error(resp.message || "Falha ao listar places sem vínculo.");
  }

  const body = resp?.data;
  return {
    total: Number(body?.total ?? 0),
    note: body?.note,
    items: Array.isArray(body?.items) ? body.items : [],
  };
}

/** Valida PlaceSuiteResolver via GET /mappings/suites?resolvePlaceId= */
export async function resolveHospedinPlaceSuite(
  placeId: number,
): Promise<PlaceSuiteResolved> {
  const resp = await api.request<{ resolved: PlaceSuiteResolved }>(
    "/api/integrations/hospedin/mappings/suites",
    "GET",
    null,
    { resolvePlaceId: String(placeId) },
  );
  if (resp?.success === false) {
    throw new Error(resp.message || "Falha ao resolver place_id.");
  }
  return resp.data!.resolved;
}

export async function createHospedinSuiteMapping(input: {
  placeId: number;
  idEventoSuite: number;
  notes?: string | null;
}): Promise<HospedinSuiteMapping> {
  const resp = await api.request<HospedinSuiteMapping>(
    "/api/integrations/hospedin/mappings/suites",
    "POST",
    {
      placeId: input.placeId,
      idEventoSuite: input.idEventoSuite,
      notes: input.notes ?? null,
    },
  );
  if (resp?.success === false) {
    throw new Error(resp.message || "Falha ao criar vínculo.");
  }
  const row = unwrapMappingResponse(resp.data ?? resp);
  if (!row) throw new Error("Resposta inválida ao criar vínculo.");
  return row;
}

export async function updateHospedinSuiteMapping(
  id: number,
  input: { idEventoSuite?: number; notes?: string | null },
): Promise<HospedinSuiteMapping> {
  const resp = await api.request<HospedinSuiteMapping>(
    `/api/integrations/hospedin/mappings/suites/${id}`,
    "PUT",
    input,
  );
  if (resp?.success === false) {
    throw new Error(resp.message || "Falha ao atualizar vínculo.");
  }
  const row = unwrapMappingResponse(resp.data ?? resp);
  if (!row) throw new Error("Resposta inválida ao atualizar vínculo.");
  return row;
}

export async function deactivateHospedinSuiteMapping(
  id: number,
): Promise<HospedinSuiteMapping> {
  const resp = await api.request<HospedinSuiteMapping>(
    `/api/integrations/hospedin/mappings/suites/${id}/deactivate`,
    "POST",
    {},
  );
  if (resp?.success === false) {
    throw new Error(resp.message || "Falha ao desativar vínculo.");
  }
  const row = unwrapMappingResponse(resp.data ?? resp);
  if (!row) throw new Error("Resposta inválida ao desativar vínculo.");
  return row;
}

export async function activateHospedinSuiteMapping(
  id: number,
): Promise<HospedinSuiteMapping> {
  const resp = await api.request<HospedinSuiteMapping>(
    `/api/integrations/hospedin/mappings/suites/${id}/activate`,
    "POST",
    {},
  );
  if (resp?.success === false) {
    throw new Error(resp.message || "Falha ao reativar vínculo.");
  }
  const row = unwrapMappingResponse(resp.data ?? resp);
  if (!row) throw new Error("Resposta inválida ao reativar vínculo.");
  return row;
}

export async function ignoreHospedinSuiteMapping(input: {
  placeId: number;
  notes?: string | null;
}): Promise<HospedinSuiteMapping> {
  const resp = await api.request<HospedinSuiteMapping>(
    "/api/integrations/hospedin/mappings/suites/ignore",
    "POST",
    {
      placeId: input.placeId,
      notes: input.notes ?? null,
    },
  );
  if (resp?.success === false) {
    throw new Error(resp.message || "Falha ao ignorar suíte.");
  }
  const row = unwrapMappingResponse(resp.data ?? resp);
  if (!row) throw new Error("Resposta inválida ao ignorar suíte.");
  return row;
}

export async function unignoreHospedinSuiteMapping(
  id: number,
): Promise<HospedinSuiteMapping> {
  const resp = await api.request<HospedinSuiteMapping>(
    `/api/integrations/hospedin/mappings/suites/${id}/unignore`,
    "POST",
    {},
  );
  if (resp?.success === false) {
    throw new Error(resp.message || "Falha ao reativar suíte ignorada.");
  }
  const row = unwrapMappingResponse(resp.data ?? resp);
  if (!row) throw new Error("Resposta inválida ao reativar suíte.");
  return row;
}

export function unwrapMappingResponse(
  resp: any,
): HospedinSuiteMapping | null {
  if (!resp) return null;
  if (resp.id && resp.place_id != null) return resp as HospedinSuiteMapping;
  if (resp.data?.id) return resp.data as HospedinSuiteMapping;
  return null;
}

function unwrapImportResult(resp: any): HospedinImportResult {
  if (resp?.success === false) {
    throw new Error(resp.message || "Falha na importação Hospedin.");
  }
  const body = (resp?.data ?? resp) as HospedinImportResult;
  if (!body || typeof body.sucesso === "undefined") {
    // POST devolve o JSON inteiro em data
    if (body && typeof (body as any).fetched === "number") {
      return body as HospedinImportResult;
    }
    throw new Error("Resposta inválida da importação.");
  }
  if (body.sucesso === false) {
    throw new Error(body.erro || "Importação concluída com erro.");
  }
  return body;
}

export async function importHospedinPlaceTypes(): Promise<HospedinImportResult> {
  const resp = await api.request<HospedinImportResult>(
    "/api/integrations/hospedin/import/place-types",
    "POST",
    {},
  );
  return unwrapImportResult(resp);
}

export async function importHospedinPlaces(): Promise<HospedinImportResult> {
  const resp = await api.request<HospedinImportResult>(
    "/api/integrations/hospedin/import/places",
    "POST",
    {},
  );
  return unwrapImportResult(resp);
}
