import {
  ordenarFotosEventoSuite,
  ordenarFotosParaExibicao,
  resolverUrlImagemSuite,
  resolverUrlsFotosEventoSuite,
} from "./eventoSuiteFotos";
import type { EventoSuiteFoto } from "@/src/types/geral";

jest.mock("./api", () => ({
  api: { getBaseApi: () => "https://api.test" },
}));

function foto(partial: Partial<EventoSuiteFoto> & { arquivo: string }): EventoSuiteFoto {
  return {
    id: partial.id ?? 1,
    idEventoSuite: partial.idEventoSuite ?? 10,
    arquivo: partial.arquivo,
    ordem: partial.ordem ?? 1,
    principal: partial.principal ?? false,
  };
}

describe("ordenarFotosEventoSuite", () => {
  it("ordena por ordem crescente", () => {
    const out = ordenarFotosEventoSuite([
      foto({ id: 3, arquivo: "c.jpg", ordem: 3 }),
      foto({ id: 1, arquivo: "a.jpg", ordem: 1 }),
      foto({ id: 2, arquivo: "b.jpg", ordem: 2 }),
    ]);
    expect(out.map((f) => f.arquivo)).toEqual(["a.jpg", "b.jpg", "c.jpg"]);
  });
});

describe("ordenarFotosParaExibicao", () => {
  it("coloca principal primeiro", () => {
    const out = ordenarFotosParaExibicao([
      foto({ id: 1, arquivo: "a.jpg", ordem: 1, principal: false }),
      foto({ id: 2, arquivo: "b.jpg", ordem: 2, principal: true }),
      foto({ id: 3, arquivo: "c.jpg", ordem: 3, principal: false }),
    ]);
    expect(out[0].arquivo).toBe("b.jpg");
  });
});

describe("resolverUrlsFotosEventoSuite", () => {
  it("retorna URLs com principal primeiro", () => {
    const urls = resolverUrlsFotosEventoSuite([
      foto({ arquivo: "a.jpg", ordem: 1 }),
      foto({ arquivo: "b.jpg", ordem: 2, principal: true }),
    ]);
    expect(urls).toEqual([
      "https://api.test/uploads/b.jpg",
      "https://api.test/uploads/a.jpg",
    ]);
  });

  it("retorna vazio sem fotos", () => {
    expect(resolverUrlsFotosEventoSuite([])).toEqual([]);
    expect(resolverUrlsFotosEventoSuite(null)).toEqual([]);
  });
});

describe("resolverUrlImagemSuite", () => {
  it("usa foto da suíte quando existir", () => {
    const url = resolverUrlImagemSuite(
      [foto({ arquivo: "suite.jpg", principal: true })],
      "evento.jpg",
    );
    expect(url).toBe("https://api.test/uploads/suite.jpg");
  });

  it("usa fallback do evento sem fotos", () => {
    const url = resolverUrlImagemSuite([], "evento.jpg");
    expect(url).toBe("https://api.test/uploads/evento.jpg");
  });
});
