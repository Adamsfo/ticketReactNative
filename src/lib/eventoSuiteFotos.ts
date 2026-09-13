import type { EventoSuiteFoto } from "@/src/types/geral";
import { uploadsUrl } from "./upload";

/** Ordem crescente por `ordem` (1-based no cadastro). */
export function ordenarFotosEventoSuite(
  fotos: EventoSuiteFoto[],
): EventoSuiteFoto[] {
  return [...fotos].sort(
    (a, b) => Number(a.ordem ?? 0) - Number(b.ordem ?? 0),
  );
}

/** Principal primeiro; demais na ordem cadastrada. */
export function ordenarFotosParaExibicao(
  fotos: EventoSuiteFoto[],
): EventoSuiteFoto[] {
  const sorted = ordenarFotosEventoSuite(fotos);
  const principal = sorted.find((f) => f.principal);
  if (!principal) return sorted;
  const demais = sorted.filter((f) => f !== principal);
  return [principal, ...demais];
}

/** URLs públicas das fotos da suíte (principal primeiro). */
export function resolverUrlsFotosEventoSuite(
  fotos?: EventoSuiteFoto[] | null,
): string[] {
  if (!fotos?.length) return [];
  return ordenarFotosParaExibicao(fotos)
    .map((f) => uploadsUrl(f.arquivo))
    .filter((url): url is string => Boolean(url));
}

/**
 * URL da imagem do card: foto principal da suíte ou fallback do evento.
 * Regra: `fotos.find(f => f.principal) || fotos[0]` (após ordenar por ordem).
 */
export function resolverUrlImagemSuite(
  fotos?: EventoSuiteFoto[] | null,
  imagemEventoFallback?: string | null,
): string | null {
  const urls = resolverUrlsFotosEventoSuite(fotos);
  if (urls.length > 0) return urls[0];
  return uploadsUrl(imagemEventoFallback);
}
