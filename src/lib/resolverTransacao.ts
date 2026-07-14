import { Transacao } from "@/src/types/geral";

/**
 * Resolve a Transacao a partir do param de rota (objeto completo OU id numérico)
 * + fallback no CartContext.
 */
export function resolverRegistroTransacao(
  param: Transacao | number | string | null | undefined,
  cartTransacao: Transacao | null | undefined,
): Transacao | null {
  if (param != null && typeof param === "object" && "id" in param) {
    const id = Number((param as Transacao).id);
    if (!Number.isFinite(id) || id <= 0) {
      return cartTransacao ?? null;
    }
    return param as Transacao;
  }

  const id = Number(param);
  if (Number.isFinite(id) && id > 0) {
    if (cartTransacao && Number(cartTransacao.id) === id) {
      return cartTransacao;
    }
    return cartTransacao ?? null;
  }

  return cartTransacao ?? null;
}

export function extrairIdTransacao(
  param: Transacao | number | string | null | undefined,
  cartTransacao?: Transacao | null,
): number | null {
  if (param != null && typeof param === "object" && "id" in param) {
    const id = Number((param as Transacao).id);
    return Number.isFinite(id) && id > 0 ? id : null;
  }
  const id = Number(param);
  if (Number.isFinite(id) && id > 0) {
    return id;
  }
  const cartId = Number(cartTransacao?.id);
  return Number.isFinite(cartId) && cartId > 0 ? cartId : null;
}
