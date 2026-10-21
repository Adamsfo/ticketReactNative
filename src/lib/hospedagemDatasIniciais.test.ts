import { fromZonedTime } from "date-fns-tz";
import {
  ajustarDatasIniciaisPeriodoHospedagem,
  criarVerificadorFechamentosExcepcionais,
  dataCivilHospedagem,
  isDataSelecionavelEntradaSaidaHospedagem,
  proximaDataSelecionavelHospedagem,
} from "@/src/lib/hospedagemDiasFechados";

const TZ = "America/Cuiaba";

function diaLocal(y: number, m: number, d: number): Date {
  return fromZonedTime(
    `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")} 12:00:00`,
    TZ,
  );
}

describe("ajuste datas iniciais pousada", () => {
  it("terça avança para quinta", () => {
    const terca = diaLocal(2026, 10, 20);
    const prox = proximaDataSelecionavelHospedagem(terca);
    expect(dataCivilHospedagem(prox)).toBe("2026-10-22");
  });

  it("quarta avança para quinta", () => {
    const quarta = diaLocal(2026, 10, 21);
    const prox = proximaDataSelecionavelHospedagem(quarta);
    expect(dataCivilHospedagem(prox)).toBe("2026-10-22");
  });

  it("fechamento excepcional avança para o próximo dia permitido", () => {
    const verificador = criarVerificadorFechamentosExcepcionais([
      { inicio: "2026-10-22", fim: "2026-10-22" },
    ]);
    const quinta = diaLocal(2026, 10, 22);
    const prox = proximaDataSelecionavelHospedagem(quinta, verificador);
    expect(dataCivilHospedagem(prox)).toBe("2026-10-23");
  });

  it("data já disponível permanece", () => {
    const quinta = diaLocal(2026, 10, 22);
    const prox = proximaDataSelecionavelHospedagem(quinta);
    expect(dataCivilHospedagem(prox)).toBe("2026-10-22");
  });

  it("preserva noites ao ajustar check-in", () => {
    const terca = diaLocal(2026, 10, 20);
    const quarta = diaLocal(2026, 10, 21);
    const { checkinDate, checkoutDate } = ajustarDatasIniciaisPeriodoHospedagem(
      terca,
      quarta,
      1,
    );
    expect(dataCivilHospedagem(checkinDate)).toBe("2026-10-22");
    expect(dataCivilHospedagem(checkoutDate)).toBe("2026-10-23");
  });

  it("período ajustado não inclui dia fechado", () => {
    const terca = diaLocal(2026, 10, 20);
    const quarta = diaLocal(2026, 10, 21);
    const { checkinDate, checkoutDate } = ajustarDatasIniciaisPeriodoHospedagem(
      terca,
      quarta,
      1,
    );
    expect(
      isDataSelecionavelEntradaSaidaHospedagem(checkinDate),
    ).toBe(true);
    expect(
      isDataSelecionavelEntradaSaidaHospedagem(checkoutDate),
    ).toBe(true);
  });
});
