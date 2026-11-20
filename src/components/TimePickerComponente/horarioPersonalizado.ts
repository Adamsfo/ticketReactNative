export function aplicarHorario(
  base: Date,
  hours: number,
  minutes: number,
): Date {
  const d = new Date(base);
  d.setHours(hours, minutes, 0, 0);
  return d;
}

export function formatarHoraInput(time: Date): string {
  const h = time.getHours();
  const m = time.getMinutes();
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function interpretarHoraInput(
  texto: string,
  base: Date,
): { ok: true; date: Date } | { ok: false } {
  const m = /^(\d{1,2}):(\d{2})$/.exec(texto.trim());
  if (!m) return { ok: false };
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (!Number.isFinite(h) || !Number.isFinite(min)) return { ok: false };
  if (h < 0 || h > 23 || min < 0 || min > 59) return { ok: false };
  return { ok: true, date: aplicarHorario(base, h, min) };
}