/**
 * @jest-environment node
 */
import {
  formatarHoraInput,
  interpretarHoraInput,
} from "./horarioPersonalizado";

describe("horarioPersonalizado", () => {
  const base = new Date(2026, 0, 15, 12, 0, 0, 0);

  it("formata HH:mm com zero à esquerda", () => {
    const d = new Date(2026, 0, 1, 9, 7, 0, 0);
    expect(formatarHoraInput(d)).toBe("09:07");
  });

  it("interpreta horários arbitrários no minuto", () => {
    const r = interpretarHoraInput("20:17", base);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.date.getHours()).toBe(20);
      expect(r.date.getMinutes()).toBe(17);
    }
  });

  it("rejeita formato inválido", () => {
    expect(interpretarHoraInput("25:00", base).ok).toBe(false);
    expect(interpretarHoraInput("ab:cd", base).ok).toBe(false);
  });
});