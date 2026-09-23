const STATUS_COM_ACOES_CLIENTE = new Set(["Confirmada"]);

export const TITULO_BLOQUEIO_CANCELAMENTO = "Cancelamento não disponível";
export const TITULO_BLOQUEIO_REMARCACAO = "Remarcação não disponível";

export const MENSAGEM_BLOQUEIO_FALLBACK_CANCELAMENTO =
  "Esta reserva não pode ser cancelada pelo cliente.";

export const MENSAGEM_BLOQUEIO_FALLBACK_REMARCACAO =
  "Esta reserva não pode ser remarcada no momento.";

export function deveExibirAcaoCancelarReserva(status: string): boolean {
  return STATUS_COM_ACOES_CLIENTE.has(String(status));
}

export function deveExibirAcaoRemarcarReserva(params: {
  status: string;
  remarcacaoPendente?: boolean | null;
}): boolean {
  return STATUS_COM_ACOES_CLIENTE.has(String(params.status));
}

export function acaoCancelarDisponivel(podeCancelar: boolean): boolean {
  return podeCancelar;
}

export function acaoRemarcarDisponivel(params: {
  podeRemarcar: boolean;
  remarcacaoPendente?: boolean | null;
  status?: string;
}): boolean {
  if (
    params.status != null &&
    !STATUS_COM_ACOES_CLIENTE.has(String(params.status))
  ) {
    return false;
  }
  if (params.remarcacaoPendente) {
    return true;
  }
  return params.podeRemarcar;
}

export function labelBotaoRemarcar(remarcacaoPendente?: boolean | null): string {
  return remarcacaoPendente ? "Continuar remarcação" : "Remarcar reserva";
}

export function resolverMensagemBloqueioCancelamento(
  motivoBloqueio?: string | null,
): string {
  const texto = String(motivoBloqueio ?? "").trim();
  return texto || MENSAGEM_BLOQUEIO_FALLBACK_CANCELAMENTO;
}

export function resolverMensagemBloqueioRemarcacao(
  motivoBloqueio?: string | null,
): string {
  const texto = String(motivoBloqueio ?? "").trim();
  return texto || MENSAGEM_BLOQUEIO_FALLBACK_REMARCACAO;
}
