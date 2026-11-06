import { fromZonedTime } from "date-fns-tz";
import {
  ajustarDatasIniciaisPeriodoHospedagem,
  criarVerificadorFechamentosExcepcionais,
  dataCivilCalendarioPickerHospedagem,
  dataCivilHospedagem,
  isDataCivilFechadaSemanalHospedagem,
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

/** Meia-noite local — mesmo padrão de react-datepicker (startOfDay). */
function celulaCalendarioLocal(y: number, m: number, d: number): Date {
  return new Date(y, m - 1, d, 0, 0, 0, 0);
}

describe("isDataSelecionavelEntradaSaidaHospedagem (filterDate)", () => {
  it("terça e quarta indisponíveis; quinta disponível (célula local)", () => {
    expect(
      isDataSelecionavelEntradaSaidaHospedagem(celulaCalendarioLocal(2026, 10, 20)),
    ).toBe(false);
    expect(
      isDataSelecionavelEntradaSaidaHospedagem(celulaCalendarioLocal(2026, 10, 21)),
    ).toBe(false);
    expect(
      isDataSelecionavelEntradaSaidaHospedagem(celulaCalendarioLocal(2026, 10, 22)),
    ).toBe(true);
  });

  it("meia-noite UTC: seleção segue civil do picker, não dataCivilHospedagem(instante)", () => {
    const utcQui = new Date(Date.UTC(2026, 9, 22));
    const civilPicker = dataCivilCalendarioPickerHospedagem(utcQui);
    const civilInstante = dataCivilHospedagem(utcQui);

    expect(isDataSelecionavelEntradaSaidaHospedagem(utcQui)).toBe(
      !isDataCivilFechadaSemanalHospedagem(civilPicker),
    );

    // Regressão: instante em Cuiabá cai na quarta, mas a célula é quinta (picker).
    if (civilPicker === "2026-10-22" && civilInstante === "2026-10-21") {
      expect(isDataSelecionavelEntradaSaidaHospedagem(utcQui)).toBe(true);
    }
  });
});

const ambienteUtcLocal =
  new Date(Date.UTC(2026, 9, 21)).getDate() === 21 &&
  dataCivilHospedagem(new Date(Date.UTC(2026, 9, 21))) === "2026-10-20";

(ambienteUtcLocal ? describe : describe.skip)(
  "isDataSelecionavelEntradaSaidaHospedagem (filterDate, TZ local UTC)",
  () => {
    it("terça/quarta/quinta na célula com Date em meia-noite UTC", () => {
      expect(
        isDataSelecionavelEntradaSaidaHospedagem(
          new Date(Date.UTC(2026, 9, 20)),
        ),
      ).toBe(false);
      expect(
        isDataSelecionavelEntradaSaidaHospedagem(
          new Date(Date.UTC(2026, 9, 21)),
        ),
      ).toBe(false);
      expect(
        isDataSelecionavelEntradaSaidaHospedagem(
          new Date(Date.UTC(2026, 9, 22)),
        ),
      ).toBe(true);
    });
  },
);

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
