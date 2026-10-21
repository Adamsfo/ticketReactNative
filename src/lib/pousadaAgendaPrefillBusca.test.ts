import { fromZonedTime } from "date-fns-tz";
import {
  periodoBuscaAgendaAposAjusteInicial,
  prefillAgendaUsariaPeriodoFechadoSemAjuste,
} from "@/src/lib/pousadaAgendaPrefillBusca";
import { dataCivilHospedagem } from "@/src/lib/hospedagemDiasFechados";

const TZ = "America/Cuiaba";

function diaLocal(y: number, m: number, d: number): Date {
  return fromZonedTime(
    `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")} 12:00:00`,
    TZ,
  );
}

describe("pousada agenda prefill — período da busca após ajuste", () => {
  it("terça no prefill exige ajuste antes da busca automática", () => {
    const checkinPrefill = diaLocal(2026, 10, 20);
    const checkoutPrefill = diaLocal(2026, 10, 21);

    expect(
      prefillAgendaUsariaPeriodoFechadoSemAjuste({
        checkinPrefill,
        checkoutPrefill,
      }),
    ).toBe(true);

    const ajustado = periodoBuscaAgendaAposAjusteInicial({
      checkinPrefill,
      checkoutPrefill,
    });
    expect(dataCivilHospedagem(ajustado.checkinDate)).toBe("2026-10-22");
    expect(dataCivilHospedagem(ajustado.checkoutDate)).toBe("2026-10-23");
  });

  it("quinta no prefill não altera o período", () => {
    const checkinPrefill = diaLocal(2026, 10, 22);
    const checkoutPrefill = diaLocal(2026, 10, 23);

    expect(
      prefillAgendaUsariaPeriodoFechadoSemAjuste({
        checkinPrefill,
        checkoutPrefill,
      }),
    ).toBe(false);
  });
});
