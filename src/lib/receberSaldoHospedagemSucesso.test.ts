import {
  extrairReservaDaRespostaPagamento,
  montarConfirmacaoSucesso,
  podeReceberNovoSaldo,
} from "./receberSaldoHospedagemSucesso";
import type { ReservaAdminDetalhe } from "./hospedagemAdmin";

function detalheBase(
  overrides: Partial<ReservaAdminDetalhe> = {},
): ReservaAdminDetalhe {
  return {
    id: 1,
    idReservaHospedagem: 1,
    numeroReserva: 1,
    status: "Confirmada",
    checkin: "2026-01-01",
    checkout: "2026-01-02",
    noites: 1,
    preco: 1000,
    taxaServico: 40,
    valorTotal: 1040,
    valorPago: 300,
    saldoPendente: 740,
    ...overrides,
  };
}

describe("extrairReservaDaRespostaPagamento", () => {
  it("extrai reserva direta (manual)", () => {
    const reserva = detalheBase();
    expect(extrairReservaDaRespostaPagamento(reserva)).toEqual(reserva);
  });

  it("extrai reserva em { data } (api.request)", () => {
    const reserva = detalheBase();
    expect(extrairReservaDaRespostaPagamento({ data: reserva })).toEqual(reserva);
  });

  it("extrai reserva em { data: { reserva } } (dinheiro)", () => {
    const reserva = detalheBase();
    expect(
      extrairReservaDaRespostaPagamento({ data: { reserva, data: {} } }),
    ).toEqual(reserva);
  });

  it("extrai reserva em { reserva } (TEF consulta)", () => {
    const reserva = detalheBase({ valorPago: 740, saldoPendente: 300 });
    expect(extrairReservaDaRespostaPagamento({ reserva, data: {} })).toEqual(
      reserva,
    );
  });

  it("retorna null quando não há detalhe", () => {
    expect(extrairReservaDaRespostaPagamento(null)).toBeNull();
    expect(extrairReservaDaRespostaPagamento({ success: true })).toBeNull();
  });
});

describe("montarConfirmacaoSucesso", () => {
  it("monta confirmação após Antecipado R$ 300", () => {
    const conf = montarConfirmacaoSucesso(300, detalheBase());
    expect(conf.valorRecebido).toBe(300);
    expect(conf.valorPagoTotal).toBe(300);
    expect(conf.saldoRestante).toBe(740);
    expect(conf.quitada).toBe(false);
  });

  it("marca reserva quitada quando saldo é zero", () => {
    const conf = montarConfirmacaoSucesso(
      740,
      detalheBase({ valorPago: 1040, saldoPendente: 0 }),
    );
    expect(conf.saldoRestante).toBe(0);
    expect(conf.quitada).toBe(true);
  });

  it("usa saldo recalculado quando coluna saldoPendente está inconsistente", () => {
    const conf = montarConfirmacaoSucesso(
      300,
      detalheBase({ valorPago: 300, saldoPendente: 0 }),
    );
    expect(conf.saldoRestante).toBe(740);
    expect(conf.quitada).toBe(false);
  });
});

describe("podeReceberNovoSaldo", () => {
  it("permite novo recebimento com saldo positivo", () => {
    expect(podeReceberNovoSaldo(740)).toBe(true);
  });

  it("bloqueia quando saldo é zero", () => {
    expect(podeReceberNovoSaldo(0)).toBe(false);
    expect(podeReceberNovoSaldo(0.004)).toBe(false);
  });
});
