import { api } from "./api";
import { EventoSuite } from "../types/geral";

export type EventoSuiteStatus = "Ativo" | "Oculto" | "Finalizado" | "PDV";

export type EventoSuitePayload = {
  id?: number;
  nome: string;
  descricao?: string | null;
  idEvento: number;
  qtdeMinimaPessoas: number;
  qtdeMaximaPessoas: number;
  preco: number;
  taxaServico: number;
  valor: number;
  status: EventoSuiteStatus | string;
  idCupomPromocional?: number | null;
};

export type EventoSuitePrefill = Partial<{
  nome: string;
  descricao: string;
  qtdeMinimaPessoas: number;
  qtdeMaximaPessoas: number;
  preco: number;
  taxaServico: number;
  valor: number;
  status: EventoSuiteStatus | string;
  idCupomPromocional: number | null;
}>;

function unwrapData<T>(resp: any): T {
  if (resp?.success === false) {
    throw new Error(resp.message || "Falha na operação de suíte.");
  }
  return (resp?.data ?? resp) as T;
}

export async function getEventoSuiteById(id: number): Promise<EventoSuite> {
  const resp = await api.request<EventoSuite>(`/eventosuite/${id}`, "GET");
  return unwrapData<EventoSuite>(resp);
}

export async function createEventoSuite(
  payload: EventoSuitePayload,
): Promise<EventoSuite> {
  const resp = await api.request<EventoSuite>("/eventosuite", "POST", payload);
  return unwrapData<EventoSuite>(resp);
}

export async function updateEventoSuite(
  id: number,
  payload: EventoSuitePayload,
): Promise<EventoSuite> {
  const resp = await api.request<EventoSuite>(
    `/eventosuite/${id}`,
    "PUT",
    payload,
  );
  return unwrapData<EventoSuite>(resp);
}

export async function deleteEventoSuite(id: number): Promise<void> {
  const resp = await api.request<{ message?: string }>(
    `/eventosuite/${id}`,
    "DELETE",
  );
  if (resp?.success === false) {
    throw new Error(resp.message || "Falha ao excluir suíte.");
  }
}

export type EventoSuiteFotoDto = {
  id: number;
  idEventoSuite: number;
  arquivo: string;
  ordem: number;
  principal: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export async function addEventoSuiteFotos(
  idEventoSuite: number,
  arquivos: string[],
): Promise<EventoSuiteFotoDto[]> {
  const resp = await api.request<EventoSuiteFotoDto[]>(
    `/eventosuite/${idEventoSuite}/fotos`,
    "POST",
    { arquivos },
  );
  if (resp?.success === false) {
    throw new Error(resp.message || "Falha ao adicionar fotos.");
  }
  const body = (resp?.data ?? resp) as any;
  if (body?.status === "fail" || body?.status === "error") {
    throw new Error(body?.message || "Falha ao adicionar fotos.");
  }
  if (Array.isArray(body)) return body;
  if (Array.isArray(body?.data)) return body.data;
  if (body?.data && typeof body.data === "object" && !Array.isArray(body.data)) {
    return [body.data as EventoSuiteFotoDto];
  }
  throw new Error("Resposta inválida ao anexar fotos. Tente novamente.");
}

export async function setEventoSuiteFotoPrincipal(
  idEventoSuite: number,
  fotoId: number,
): Promise<EventoSuiteFotoDto[]> {
  const resp = await api.request<EventoSuiteFotoDto[]>(
    `/eventosuite/${idEventoSuite}/fotos/${fotoId}/principal`,
    "POST",
    {},
  );
  if (resp?.success === false) {
    throw new Error(resp.message || "Falha ao definir foto principal.");
  }
  const body = (resp?.data ?? resp) as any;
  if (Array.isArray(body)) return body;
  return Array.isArray(body?.data) ? body.data : [];
}

export async function moverEventoSuiteFoto(
  idEventoSuite: number,
  fotoId: number,
  direcao: "esquerda" | "direita",
): Promise<EventoSuiteFotoDto[]> {
  const resp = await api.request<EventoSuiteFotoDto[]>(
    `/eventosuite/${idEventoSuite}/fotos/${fotoId}/mover`,
    "POST",
    { direcao },
  );
  if (resp?.success === false) {
    throw new Error(resp.message || "Falha ao reordenar foto.");
  }
  const body = (resp?.data ?? resp) as any;
  if (Array.isArray(body)) return body;
  return Array.isArray(body?.data) ? body.data : [];
}

export async function deleteEventoSuiteFoto(
  idEventoSuite: number,
  fotoId: number,
): Promise<EventoSuiteFotoDto[]> {
  const resp = await api.request<EventoSuiteFotoDto[]>(
    `/eventosuite/${idEventoSuite}/fotos/${fotoId}`,
    "DELETE",
  );
  if (resp?.success === false) {
    throw new Error(resp.message || "Falha ao excluir foto.");
  }
  const body = (resp?.data ?? resp) as any;
  if (Array.isArray(body)) return body;
  return Array.isArray(body?.data) ? body.data : [];
}
