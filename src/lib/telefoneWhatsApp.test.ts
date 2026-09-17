import {
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
