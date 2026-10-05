import {
  abrirWhatsAppLinkPagamentoManual,
  normalizarTelefoneWhatsAppLink,
} from "./telefoneWhatsApp";

describe("normalizarTelefoneWhatsAppLink", () => {
  it("remove máscara e adiciona DDI 55", () => {
    expect(normalizarTelefoneWhatsAppLink("(65) 99999-8888")).toBe(
      "5565999998888",
    );
  });

  it("mantém DDI quando já presente", () => {
    expect(normalizarTelefoneWhatsAppLink("5565988776655")).toBe(
      "5565988776655",
    );
  });

  it("retorna null para telefone vazio ou inválido", () => {
    expect(normalizarTelefoneWhatsAppLink("")).toBeNull();
    expect(normalizarTelefoneWhatsAppLink("123")).toBeNull();
  });
});

describe("abrirWhatsAppLinkPagamentoManual", () => {
  it("falha sem bloquear quando telefone é inválido", () => {
    const result = abrirWhatsAppLinkPagamentoManual({
      telefone: "123",
      mensagemWhatsApp: "Olá, link: https://example.com/reserva/x",
      linkPagamento: "https://example.com/reserva/x",
    });
    expect(result.aberto).toBe(false);
    expect(result.mensagemAviso).toMatch(/Não foi possível abrir o WhatsApp/);
  });
});
