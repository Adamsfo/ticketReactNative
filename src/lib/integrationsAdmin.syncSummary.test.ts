import {
  __resetSyncSummaryRequestCoalescingForTests,
  getSyncSummary,
} from "./integrationsAdmin";
import { api } from "@/src/lib/api";

jest.mock("@/src/lib/api", () => ({
  api: {
    request: jest.fn(),
  },
}));

describe("getSyncSummary — coalescing", () => {
  beforeEach(() => {
    __resetSyncSummaryRequestCoalescingForTests();
    jest.clearAllMocks();
  });

  it("compartilha uma única request HTTP entre chamadas concorrentes", async () => {
    let resolveRequest!: (value: unknown) => void;
    const pending = new Promise((resolve) => {
      resolveRequest = resolve;
    });
    (api.request as jest.Mock).mockReturnValue(pending);

    const p1 = getSyncSummary();
    const p2 = getSyncSummary();

    expect(api.request).toHaveBeenCalledTimes(1);

    resolveRequest({ success: true, data: { erros: 1, criticos: 0, alertas: 0, informativos: 0, pendentes: 0, processando: 0, sincronizadas: 0, ignoradas: 0, aguardandoSync: 0, ultimoErro: null, ultimaSincronizacaoSucesso: null } });

    const [r1, r2] = await Promise.all([p1, p2]);
    expect(r1).toBe(r2);
  });

  it("permite nova request após a anterior concluir", async () => {
    (api.request as jest.Mock).mockResolvedValue({ success: true, data: {} });

    await getSyncSummary();
    await getSyncSummary();

    expect(api.request).toHaveBeenCalledTimes(2);
  });
});
