import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import { Feather } from "@expo/vector-icons";
import colors from "@/src/constants/colors";
import formatCurrency from "@/src/components/FormatCurrency";
import { formatDateTimeHospedagem } from "@/src/lib/hospedagemStatusOperacional";
import type {
  ReservaAdminDetalhe,
  ReservaOrigemIntegracaoPayload,
} from "@/src/lib/hospedagemAdmin";
import {
  emojiUiStatus,
  EntitySyncEvent,
  getEntitySyncEvents,
  labelUiStatus,
  runEntitySyncNow,
} from "@/src/lib/integrationsAdmin";
import { labelCanalVenda } from "./OrigemReservaIndicador";

export { labelCanalVenda };

type Props = {
  detalhe: ReservaAdminDetalhe;
  sync?: ReservaAdminDetalhe["syncIntegracao"];
  onReprocessado?: () => void;
};

export function labelTipoIdentificador(tipo: string): string {
  const raw = String(tipo || "").toUpperCase();
  const map: Record<string, string> = {
    RESERVATION_ID: "ID da reserva",
    SEARCHABLE_CODE: "Código pesquisável",
    CONFIRMATION_CODE: "Código de confirmação",
    OTA_ID: "ID OTA",
  };
  return map[raw] || tipo;
}

export function labelTipoDocumento(tipo: string): string {
  const raw = String(tipo || "").toUpperCase();
  const map: Record<string, string> = {
    PASSPORT: "Passaporte",
    IDENTIFICATION: "Identificação",
    DOCUMENT: "Documento",
    CPF: "CPF",
  };
  return map[raw] || tipo;
}

export function labelPayloadKind(kind: string): string {
  const raw = String(kind || "").toUpperCase();
  if (raw === "RESERVATION") return "Reserva";
  if (raw === "GUEST") return "Hóspede";
  return kind;
}

function LinhaInfo({
  label,
  valor,
}: {
  label: string;
  valor: string;
}) {
  return (
    <View style={styles.linha}>
      <Text style={styles.linhaLabel}>{label}</Text>
      <Text style={styles.linhaValor}>{valor}</Text>
    </View>
  );
}

function Cartao({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.cartao}>
      <Text style={styles.cartaoTitulo}>{titulo}</Text>
      {children}
    </View>
  );
}

function moneyOrDash(v?: number | null): string {
  if (v == null || !Number.isFinite(Number(v))) return "—";
  return formatCurrency(Number(v));
}

/**
 * Aba Integração — auditoria + status de sync (Hospedin e futuros providers).
 */
export default function ReservaOrigemIntegracaoPanel({
  detalhe,
  sync,
  onReprocessado,
}: Props) {
  const origem = detalhe.origemIntegracao;
  const [payloadAtivo, setPayloadAtivo] =
    useState<ReservaOrigemIntegracaoPayload | null>(null);
  const [copiado, setCopiado] = useState(false);
  const [eventos, setEventos] = useState<EntitySyncEvent[]>([]);
  const [reprocessando, setReprocessando] = useState(false);
  const [msgReprocess, setMsgReprocess] = useState<string | null>(null);

  const provider =
    sync?.provider ||
    detalhe.origemIntegracao?.financeira?.provider ||
    "HOSPEDIN";
  const externalId =
    sync?.externalId || detalhe.idExterno || String(detalhe.idExterno || "");

  useEffect(() => {
    void getEntitySyncEvents({
      provider,
      externalId: externalId || undefined,
      internalEntityId: String(detalhe.idReservaHospedagem),
      limit: 20,
    }).then((resp) => {
      if (resp.success && resp.data) setEventos(resp.data);
    });
  }, [provider, externalId, detalhe.idReservaHospedagem, sync?.lastSyncAt]);

  const reprocessar = async () => {
    if (!externalId) {
      setMsgReprocess("ID externo ausente — não é possível reprocessar.");
      return;
    }
    setReprocessando(true);
    setMsgReprocess(null);
    try {
      const resp = await runEntitySyncNow(provider, String(externalId), {
        refreshImport: true,
      });
      if (!resp.success) {
        setMsgReprocess(resp.message || "Falha ao reprocessar.");
      } else {
        setMsgReprocess(
          (resp.data as any)?.ok
            ? "Sincronização reexecutada com sucesso."
            : (resp.data as any)?.errorMessage ||
                "Reprocessamento concluído com pendências.",
        );
        onReprocessado?.();
      }
    } catch {
      setMsgReprocess("Erro ao reprocessar sincronização.");
    } finally {
      setReprocessando(false);
    }
  };

  const jsonTexto = useMemo(() => {
    if (!payloadAtivo) return "";
    try {
      return JSON.stringify(payloadAtivo.payloadJson, null, 2);
    } catch {
      return String(payloadAtivo.payloadJson ?? "");
    }
  }, [payloadAtivo]);

  const abrirPayload = (p: ReservaOrigemIntegracaoPayload) => {
    setCopiado(false);
    setPayloadAtivo(p);
  };

  const textoDePayload = (p: ReservaOrigemIntegracaoPayload): string => {
    try {
      return JSON.stringify(p.payloadJson, null, 2);
    } catch {
      return String(p.payloadJson ?? "");
    }
  };

  const copiarJson = async (texto?: string) => {
    const body = texto ?? jsonTexto;
    if (!body) return;
    try {
      await Clipboard.setStringAsync(body);
      setCopiado(true);
    } catch {
      /* ignore */
    }
  };

  const compartilharJson = async (p?: ReservaOrigemIntegracaoPayload | null) => {
    const alvo = p ?? payloadAtivo;
    if (!alvo) return;
    const body = p ? textoDePayload(p) : jsonTexto;
    if (!body) return;
    const nome = `hospedin-${alvo.kind.toLowerCase()}-${
      detalhe.idReservaHospedagem
    }.json`;
    try {
      if (Platform.OS === "web" && typeof document !== "undefined") {
        const blob = new Blob([body], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = nome;
        a.click();
        URL.revokeObjectURL(url);
        return;
      }
      await Share.share({ message: body, title: nome });
    } catch {
      await copiarJson(body);
    }
  };

  const fin = origem?.financeira ?? null;
  const ids = origem?.identificadores ?? [];
  const docs = origem?.documentos ?? [];
  const payloads = origem?.payloads ?? [];
  const syncIso =
    origem?.ultimaSincronizacao ||
    fin?.syncedAt ||
    payloads[0]?.capturedAt ||
    null;

  return (
    <View style={styles.wrap}>
      <Cartao titulo="Status da sincronização">
        <LinhaInfo
          label="Status"
          valor={
            sync?.uiStatus
              ? `${emojiUiStatus(sync.uiStatus as any)} ${labelUiStatus(sync.uiStatus as any)}`
              : "—"
          }
        />
        <LinhaInfo
          label="Severidade"
          valor={sync?.errorSeverityLabel || "—"}
        />
        <LinhaInfo
          label="Última sincronização"
          valor={
            sync?.lastSyncAt
              ? formatDateTimeHospedagem(sync.lastSyncAt)
              : "—"
          }
        />
        <LinhaInfo
          label="Último sucesso"
          valor={
            sync?.lastSuccessAt
              ? formatDateTimeHospedagem(sync.lastSuccessAt)
              : "—"
          }
        />
        <LinhaInfo
          label="Tentativas"
          valor={String(sync?.retryCount ?? 0)}
        />
        {sync?.lastError ? (
          <LinhaInfo label="Último erro" valor={sync.lastError} />
        ) : null}
        {sync?.errorCode ? (
          <LinhaInfo label="Código" valor={sync.errorCode} />
        ) : null}
        <TouchableOpacity
          style={[styles.btnPrim, reprocessando && { opacity: 0.6 }]}
          disabled={reprocessando || !externalId}
          onPress={() => void reprocessar()}
          activeOpacity={0.85}
        >
          {reprocessando ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.btnPrimTexto}>
              Executar sincronização novamente
            </Text>
          )}
        </TouchableOpacity>
        {msgReprocess ? (
          <Text style={styles.msgReprocess}>{msgReprocess}</Text>
        ) : null}
      </Cartao>

      <Cartao titulo="Origem e canal de venda">
        <LinhaInfo label="Origem" valor="Hospedin" />
        <LinhaInfo
          label="Canal de venda"
          valor={labelCanalVenda(detalhe.canalVenda, detalhe.origemReserva)}
        />
        {detalhe.idExterno ? (
          <LinhaInfo label="ID externo" valor={String(detalhe.idExterno)} />
        ) : null}
        {detalhe.codigoExterno ? (
          <LinhaInfo
            label="Código externo"
            valor={String(detalhe.codigoExterno)}
          />
        ) : null}
      </Cartao>

      <Cartao titulo="Histórico da reserva">
        {eventos.length === 0 ? (
          <Text style={styles.vazio}>Nenhum evento de sincronização.</Text>
        ) : (
          eventos.map((ev) => (
            <View key={ev.id} style={styles.itemBloco}>
              <Text style={styles.itemTitulo}>
                {formatDateTimeHospedagem(String(ev.createdAt))} ·{" "}
                {ev.operation}{" "}
                {ev.result === "SUCCESS" ? "✅" : "❌"} {ev.result}
              </Text>
              {ev.message ? (
                <Text style={styles.itemMeta}>{ev.message}</Text>
              ) : null}
              {ev.durationMs != null ? (
                <Text style={styles.itemMeta}>
                  Duração: {Math.round(ev.durationMs / 1000)}s
                </Text>
              ) : null}
            </View>
          ))
        )}
      </Cartao>

      <Cartao titulo="Identificadores externos">
        {ids.length === 0 && !detalhe.idExterno && !detalhe.codigoExterno ? (
          <Text style={styles.vazio}>Nenhum identificador registrado.</Text>
        ) : (
          <>
            {ids.map((item) => (
              <View key={item.id} style={styles.itemBloco}>
                <Text style={styles.itemTitulo}>
                  {labelTipoIdentificador(item.tipo)}
                </Text>
                <Text style={styles.itemValor}>{item.valor}</Text>
                <Text style={styles.itemMeta}>{item.provider}</Text>
              </View>
            ))}
            {ids.length === 0 ? (
              <>
                {detalhe.idExterno ? (
                  <LinhaInfo
                    label="ID externo"
                    valor={String(detalhe.idExterno)}
                  />
                ) : null}
                {detalhe.codigoExterno ? (
                  <LinhaInfo
                    label="Código externo"
                    valor={String(detalhe.codigoExterno)}
                  />
                ) : null}
              </>
            ) : null}
          </>
        )}
      </Cartao>

      <Cartao titulo="Financeiro da origem">
        <View style={styles.avisoBox}>
          <Feather name="info" size={14} color="#92400e" />
          <Text style={styles.avisoTexto}>
            {fin?.aviso ||
              "Informativo da origem — não substitui o financeiro oficial do Jango."}
          </Text>
        </View>
        {!fin ? (
          <Text style={styles.vazio}>
            Sem espelho financeiro da origem para esta reserva.
          </Text>
        ) : (
          <>
            <LinhaInfo label="Moeda" valor={fin.moeda || "—"} />
            <LinhaInfo label="Total origem" valor={moneyOrDash(fin.total)} />
            <LinhaInfo label="Recebido" valor={moneyOrDash(fin.received)} />
            <LinhaInfo label="A receber" valor={moneyOrDash(fin.toReceive)} />
            <LinhaInfo label="Diária" valor={moneyOrDash(fin.daily)} />
            <LinhaInfo
              label="Total diárias"
              valor={moneyOrDash(fin.totalDaily)}
            />
            <LinhaInfo label="Desconto" valor={moneyOrDash(fin.discount)} />
            <LinhaInfo label="Produtos" valor={moneyOrDash(fin.product)} />
            <LinhaInfo label="Serviços" valor={moneyOrDash(fin.service)} />
            {fin.statusPagamento ? (
              <LinhaInfo label="Status pagamento" valor={fin.statusPagamento} />
            ) : null}
            {fin.formaPagamento ? (
              <LinhaInfo label="Forma pagamento" valor={fin.formaPagamento} />
            ) : null}
            {fin.origemPagamento ? (
              <LinhaInfo label="Origem pagamento" valor={fin.origemPagamento} />
            ) : null}
            {fin.responsavelPagamento ? (
              <LinhaInfo
                label="Responsável pagamento"
                valor={fin.responsavelPagamento}
              />
            ) : null}
            {fin.paymentFromOta != null ? (
              <LinhaInfo
                label="Pago via OTA"
                valor={fin.paymentFromOta ? "Sim" : "Não"}
              />
            ) : null}
          </>
        )}
      </Cartao>

      <Cartao titulo="Documentos importados">
        {docs.length === 0 ? (
          <Text style={styles.vazio}>Nenhum documento importado.</Text>
        ) : (
          docs.map((d) => (
            <View key={d.id} style={styles.itemBloco}>
              <Text style={styles.itemTitulo}>
                {labelTipoDocumento(d.tipo)}
                {d.hospedeNome ? ` · ${d.hospedeNome}` : ""}
              </Text>
              <Text style={styles.itemValor}>{d.numero}</Text>
              {d.paisEmissao ? (
                <Text style={styles.itemMeta}>País: {d.paisEmissao}</Text>
              ) : null}
            </View>
          ))
        )}
      </Cartao>

      <Cartao titulo="Última sincronização">
        {syncIso ? (
          <LinhaInfo
            label="Sincronizado em"
            valor={formatDateTimeHospedagem(String(syncIso))}
          />
        ) : (
          <Text style={styles.vazio}>Sem registro de sincronização.</Text>
        )}
      </Cartao>

      <Cartao titulo="Payload bruto">
        {payloads.length === 0 ? (
          <Text style={styles.vazio}>Nenhum payload armazenado.</Text>
        ) : (
          payloads.map((p) => (
            <View key={p.id} style={styles.payloadRow}>
              <View style={styles.payloadInfo}>
                <Text style={styles.itemTitulo}>
                  {labelPayloadKind(p.kind)}
                </Text>
                <Text style={styles.itemMeta}>
                  {formatDateTimeHospedagem(String(p.capturedAt))}
                </Text>
              </View>
              <View style={styles.payloadBtns}>
                <TouchableOpacity
                  style={styles.btnSec}
                  onPress={() => abrirPayload(p)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.btnSecTexto}>Visualizar JSON</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.btnSecOutline}
                  onPress={() => void compartilharJson(p)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.btnSecOutlineTexto}>Baixar JSON</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </Cartao>

      <Modal
        visible={Boolean(payloadAtivo)}
        transparent
        animationType="fade"
        onRequestClose={() => setPayloadAtivo(null)}
      >
        <Pressable
          style={styles.jsonBackdrop}
          onPress={() => setPayloadAtivo(null)}
        >
          <Pressable
            style={styles.jsonSheet}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.jsonHeader}>
              <Text style={styles.jsonTitulo}>
                JSON · {payloadAtivo ? labelPayloadKind(payloadAtivo.kind) : ""}
              </Text>
              <TouchableOpacity
                onPress={() => setPayloadAtivo(null)}
                hitSlop={12}
              >
                <Feather name="x" size={20} color={colors.cinza} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.jsonScroll}>
              <Text style={styles.jsonTexto} selectable>
                {jsonTexto}
              </Text>
            </ScrollView>
            <View style={styles.jsonActions}>
              <TouchableOpacity
                style={styles.btnSec}
                onPress={() => void copiarJson()}
                activeOpacity={0.85}
              >
                <Text style={styles.btnSecTexto}>
                  {copiado ? "Copiado" : "Copiar"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.btnPrim}
                onPress={() => void compartilharJson()}
                activeOpacity={0.85}
              >
                <Text style={styles.btnPrimTexto}>Baixar / Compartilhar</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 12,
    paddingBottom: 8,
  },
  cartao: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 14,
    backgroundColor: "#fafafa",
    gap: 8,
  },
  cartaoTitulo: {
    fontSize: 12,
    fontWeight: "700",
    color: "#6b7280",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  linha: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  linhaLabel: {
    fontSize: 13,
    color: "#6b7280",
    flexShrink: 0,
  },
  linhaValor: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    textAlign: "right",
    flex: 1,
  },
  vazio: {
    fontSize: 13,
    color: "#9ca3af",
  },
  avisoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "rgba(245, 158, 11, 0.12)",
    borderRadius: 8,
    padding: 10,
    marginBottom: 4,
  },
  avisoTexto: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    color: "#92400e",
    fontWeight: "600",
  },
  itemBloco: {
    gap: 2,
    paddingVertical: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#e5e7eb",
  },
  itemTitulo: {
    fontSize: 13,
    fontWeight: "700",
    color: "#374151",
  },
  itemValor: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
  },
  itemMeta: {
    fontSize: 12,
    color: "#9ca3af",
  },
  payloadRow: {
    gap: 8,
    paddingVertical: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#e5e7eb",
  },
  payloadInfo: {
    gap: 2,
  },
  payloadBtns: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  btnSec: {
    backgroundColor: colors.azul,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  btnSecTexto: {
    color: colors.branco,
    fontSize: 12,
    fontWeight: "700",
  },
  btnSecOutline: {
    borderWidth: 1,
    borderColor: colors.azul,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  btnSecOutlineTexto: {
    color: colors.azul,
    fontSize: 12,
    fontWeight: "700",
  },
  jsonBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    padding: 16,
  },
  jsonSheet: {
    backgroundColor: colors.branco,
    borderRadius: 14,
    maxHeight: "80%",
    padding: 14,
    gap: 10,
  },
  jsonHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  jsonTitulo: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.cinza,
  },
  jsonScroll: {
    maxHeight: 360,
    backgroundColor: "#0f172a",
    borderRadius: 10,
    padding: 12,
  },
  jsonTexto: {
    fontFamily: Platform.select({
      ios: "Menlo",
      android: "monospace",
      default: "monospace",
    }),
    fontSize: 11,
    lineHeight: 16,
    color: "#e2e8f0",
  },
  jsonActions: {
    flexDirection: "row",
    gap: 8,
    justifyContent: "flex-end",
  },
  btnPrim: {
    backgroundColor: "#111827",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  btnPrimTexto: {
    color: colors.branco,
    fontSize: 12,
    fontWeight: "700",
  },
  msgReprocess: {
    marginTop: 6,
    fontSize: 12,
    color: "#374151",
    fontWeight: "600",
  },
});
