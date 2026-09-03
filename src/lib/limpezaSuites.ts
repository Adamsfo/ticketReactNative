import { api } from "./api";
import { ApiResponse } from "../types/geral";

export type FiltroLimpezaSuites =
  | "todas"
  | "pendente"
  | "em_andamento"
  | "concluida";

export type StatusLimpezaSuite =
  | "Pendente"
  | "EmAndamento"
  | "Concluida"
  | string;

export type LimpezaSuiteCard = {
  id: number;
  idEventoSuite: number;
  nomeSuite: string | null;
  idReservaHospedagem: number;
  numeroReserva: number;
  hospede: string | null;
  status: StatusLimpezaSuite;
  checkin: string | null;
  checkout: string | null;
  dataHoraCheckoutRealizado: string | null;
  dataHoraInicio: string | null;
  dataHoraFim: string | null;
  usuarioInicio: string | null;
  usuarioFim: string | null;
  eventoNome?: string | null;
  statusReserva?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type MetaLimpezasSuites = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
  filtro?: string;
};

export function labelStatusLimpeza(status: StatusLimpezaSuite): string {
  switch (status) {
    case "Pendente":
      return "Pendente";
    case "EmAndamento":
      return "Em andamento";
    case "Concluida":
      return "Concluída";
    default:
      return String(status);
  }
}

export async function getLimpezasSuites(params?: {
  filtro?: FiltroLimpezaSuites | string;
  page?: number;
  pageSize?: number;
}): Promise<ApiResponse<LimpezaSuiteCard[]> & { meta?: MetaLimpezasSuites }> {
  return api.request<LimpezaSuiteCard[]>(
    "/limpeza/suites",
    "GET",
    null,
    {
      filtro: params?.filtro ?? "todas",
      page: String(params?.page ?? 1),
      pageSize: String(params?.pageSize ?? 30),
    },
  ) as Promise<ApiResponse<LimpezaSuiteCard[]> & { meta?: MetaLimpezasSuites }>;
}

export async function postIniciarLimpezaSuite(
  id: number,
): Promise<ApiResponse<LimpezaSuiteCard>> {
  return api.request<LimpezaSuiteCard>(
    `/limpeza/suites/${id}/iniciar`,
    "POST",
    null,
  );
}

export async function postConcluirLimpezaSuite(
  id: number,
): Promise<ApiResponse<LimpezaSuiteCard>> {
  return api.request<LimpezaSuiteCard>(
    `/limpeza/suites/${id}/concluir`,
    "POST",
    null,
  );
}
