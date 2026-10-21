import { api } from "@/src/lib/api";
import { ApiResponse } from "@/src/types/geral";
import {
  criarVerificadorFechamentosExcepcionais,
  type IntervaloFechamentoExcepcional,
  type VerificadorFechamentoExcepcional,
} from "@/src/lib/hospedagemDiasFechados";

export type FechamentoExcepcionalPublico = {
  dataInicio: string;
  dataFim: string;
  motivo: string | null;
};

export type FechamentoExcepcionalAdmin = {
  id: number;
  idEvento: number;
  dataInicio: string;
  dataFim: string;
  motivo: string | null;
  ativo: boolean;
  idUsuarioCriacao: number | null;
  idUsuarioAtualizacao: number | null;
  createdAt: string;
  updatedAt: string;
};

export type EventoPousadaAdmin = {
  id: number;
  nome: string;
  idProdutor: number;
};

function erroRequisicao(resp: ApiResponse<unknown>): Error {
  return new Error(resp.message || "Erro na requisição.");
}

/** POST/PATCH: api.request devolve o body JSON completo em `data` ({ data: T }). */
function extrairPayloadMutation<T>(payload: unknown): T {
  if (payload && typeof payload === "object" && "data" in payload) {
    const nested = (payload as { data?: T }).data;
    if (nested !== undefined && nested !== null) {
      return nested;
    }
  }
  return payload as T;
}

async function apiGet<T>(
  endpoint: string,
  params?: Record<string, string>,
): Promise<T> {
  const resp = await api.request<T>(endpoint, "GET", null, params);
  if (!resp.success) {
    throw erroRequisicao(resp);
  }
  return resp.data as T;
}

async function apiPost<T>(endpoint: string, body: unknown): Promise<T> {
  const resp = await api.request<T>(endpoint, "POST", body);
  if (!resp.success) {
    throw erroRequisicao(resp);
  }
  return extrairPayloadMutation<T>(resp.data);
}

async function apiPatch<T>(endpoint: string, body: unknown): Promise<T> {
  const resp = await api.request<T>(endpoint, "PATCH", body);
  if (!resp.success) {
    throw erroRequisicao(resp);
  }
  return extrairPayloadMutation<T>(resp.data);
}

export async function fetchFechamentosExcepcionaisPublicos(params: {
  idEvento: number;
  de: string;
  ate: string;
}): Promise<FechamentoExcepcionalPublico[]> {
  const rows = await apiGet<FechamentoExcepcionalPublico[]>(
    "/reservasuite/fechamentos-excepcionais",
    {
      idEvento: String(params.idEvento),
      de: params.de,
      ate: params.ate,
    },
  );
  return rows ?? [];
}

export function intervalosAtivosFromPublicos(
  lista: FechamentoExcepcionalPublico[],
): IntervaloFechamentoExcepcional[] {
  return lista.map((f) => ({
    inicio: f.dataInicio,
    fim: f.dataFim,
  }));
}

export function criarVerificadorFromPublicos(
  lista: FechamentoExcepcionalPublico[],
): VerificadorFechamentoExcepcional {
  return criarVerificadorFechamentosExcepcionais(intervalosAtivosFromPublicos(lista));
}

export async function listarEventosPousadaAdmin(): Promise<EventoPousadaAdmin[]> {
  const rows = await apiGet<EventoPousadaAdmin[]>(
    "/hospedagem/eventos-pousada",
  );
  return rows ?? [];
}

export async function listarFechamentosExcepcionaisAdmin(params: {
  idEvento: number;
  incluirInativos?: boolean;
}): Promise<FechamentoExcepcionalAdmin[]> {
  const rows = await apiGet<FechamentoExcepcionalAdmin[]>(
    "/hospedagem/fechamentos-excepcionais",
    {
      idEvento: String(params.idEvento),
      incluirInativos: params.incluirInativos ? "true" : "false",
    },
  );
  return rows ?? [];
}

export async function criarFechamentoExcepcionalAdmin(body: {
  idEvento: number;
  dataInicio: string;
  dataFim: string;
  motivo?: string | null;
}): Promise<FechamentoExcepcionalAdmin> {
  return apiPost<FechamentoExcepcionalAdmin>(
    "/hospedagem/fechamentos-excepcionais",
    body,
  );
}

export async function atualizarFechamentoExcepcionalAdmin(
  id: number,
  body: {
    dataInicio?: string;
    dataFim?: string;
    motivo?: string | null;
    ativo?: boolean;
  },
): Promise<FechamentoExcepcionalAdmin> {
  return apiPatch<FechamentoExcepcionalAdmin>(
    `/hospedagem/fechamentos-excepcionais/${id}`,
    body,
  );
}
