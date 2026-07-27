/**
 * Máscara monetária por dígitos/centavos (mesmo padrão visual do PDV),
 * em lib compartilhada — sem importar a tela PagamentoPDV.
 */

export function digitosParaExibicaoMoeda(digitos: string): string {
  const only = (digitos || "").replace(/\D/g, "");
  const padded = only.padStart(3, "0");
  const cents = padded.slice(-2);
  const integerRaw = padded.slice(0, -2).replace(/^0+/, "") || "0";
  const integer = integerRaw.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `R$ ${integer},${cents}`;
}

export function valorParaDigitosCentavos(valor: number): string {
  const cents = Math.round(Math.max(0, valor) * 100);
  return String(cents);
}

export function digitosCentavosParaNumero(digitos: string): number {
  const only = (digitos || "").replace(/\D/g, "");
  if (!only) return 0;
  return Number(only) / 100;
}

export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}
