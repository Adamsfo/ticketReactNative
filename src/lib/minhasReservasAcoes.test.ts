import {
  acaoCancelarDisponivel,
  acaoRemarcarDisponivel,
  deveExibirAcaoCancelarReserva,
  deveExibirAcaoRemarcarReserva,
  labelBotaoRemarcar,
} from "./minhasReservasAcoes";

describe("minhasReservasAcoes", () => {
  it("exibe ações apenas para reservas confirmadas", () => {
    expect(deveExibirAcaoCancelarReserva("Confirmada")).toBe(true);
    expect(deveExibirAcaoRemarcarReserva({ status: "Confirmada" })).toBe(true);
    expect(deveExibirAcaoCancelarReserva("Hospedada")).toBe(false);
    expect(deveExibirAcaoRemarcarReserva({ status: "Cancelada" })).toBe(false);
  });

  it("exibe remarcação pendente mesmo fora da janela de horário", () => {
    expect(
      deveExibirAcaoRemarcarReserva({
        status: "Confirmada",
        remarcacaoPendente: true,
      }),
    ).toBe(true);
    expect(
      acaoRemarcarDisponivel({
        podeRemarcar: false,
        remarcacaoPendente: true,
      }),
    ).toBe(true);
  });

  it("marca cancelamento indisponível quando podeCancelar é false", () => {
    expect(acaoCancelarDisponivel(true)).toBe(true);
    expect(acaoCancelarDisponivel(false)).toBe(false);
  });

  it("marca remarcação indisponível quando bloqueada e sem pendência", () => {
    expect(
      acaoRemarcarDisponivel({
        podeRemarcar: true,
        remarcacaoPendente: false,
      }),
    ).toBe(true);
    expect(
      acaoRemarcarDisponivel({
        podeRemarcar: false,
        remarcacaoPendente: false,
      }),
    ).toBe(false);
  });

  it("usa label de continuação para remarcação pendente", () => {
    expect(labelBotaoRemarcar(true)).toBe("Continuar remarcação");
    expect(labelBotaoRemarcar(false)).toBe("Remarcar reserva");
  });
});
