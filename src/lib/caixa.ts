import { api } from "./api";

export type CaixaValores = {
  totalVendido: number;
  totalRecebido: number;
};

export type CaixaGatewayResumo = {
  ingressos: CaixaValores;
  hospedagem: CaixaValores;
  total: CaixaValores;
};

export type CaixaPdvResumo = CaixaValores & {
  idCaixa: number | null;
  dataAbertura?: string | null;
  status?: string | null;
};

export type CaixaResumo = {
  periodo: { dataInicio: string; dataFim: string };
  tef: CaixaGatewayResumo;
  mercadoPago: CaixaGatewayResumo;
  pdv: CaixaPdvResumo;
  totalGeral: CaixaValores;
};

export async function fetchCaixaResumo(params: {
  dataInicio: string;
  dataFim: string;
}): Promise<CaixaResumo> {
  const response = await api.request<CaixaResumo>("/admin/caixa", "GET", null, {
    dataInicio: params.dataInicio,
    dataFim: params.dataFim,
  });
  if (!response.data) {
    throw new Error("Resposta inválida do caixa.");
  }
  return response.data;
}
