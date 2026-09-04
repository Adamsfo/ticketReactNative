import React, { useMemo, useState } from "react";
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import StatusBarPage from "@/src/components/StatusBarPage";
import BarMenu from "@/src/components/BarMenu";
import ScreenContainer from "@/src/components/ScreenContainer";
import colors from "@/src/constants/colors";
import { useAuth } from "@/src/contexts_/AuthContext";
import TabReservas from "./tabs/tabReservas";
import TabSuites from "./tabs/tabSuites";
import TabAgenda from "./tabs/tabAgenda";
import TabHospedinMapeamento from "./tabs/tabHospedinMapeamento";
import TabIntegracoes from "./tabs/tabIntegracoes";
import { HospedagemAdminRefreshProvider } from "./contexts/HospedagemAdminRefreshContext";
import { NovaReservaRecepcaoProvider } from "./contexts/NovaReservaRecepcaoContext";
import { ReceberSaldoHospedagemProvider } from "./contexts/ReceberSaldoHospedagemContext";
import NovaReservaRecepcaoModal from "./components/NovaReservaRecepcaoModal";
import ReceberSaldoHospedagemModal from "./components/ReceberSaldoHospedagemModal";
import { useHospedagemDesktopLayout } from "./useHospedagemDesktopLayout";
import { useHospedagemAdminRefresh } from "./contexts/HospedagemAdminRefreshContext";

const TABS_BASE = [
  { key: "suites" as const, label: "🏨 Suítes" },
  { key: "agenda" as const, label: "📅 Agenda" },
  { key: "reservas" as const, label: "📋 Reservas" },
];

type TabKey = "suites" | "agenda" | "reservas" | "hospedin" | "integracoes";

function HospedagemAdminPageInner() {
  const { isAdministrador, isProdutor } = useAuth();
  const { isDesktop, suiteColumns } = useHospedagemDesktopLayout();
  const layoutMobile = suiteColumns === 1;
  const [activeTab, setActiveTab] = useState<TabKey>("suites");
  const {
    syncErros,
    syncErrosSemReserva,
    syncErrosTotal,
    pedirFiltroSyncErro,
    pedirAbrirPendencias,
  } = useHospedagemAdminRefresh();

  /** Mesmo perfil que acessa o menu Hospedagem: admGeral ou Administrador do produtor. */
  const podeMapaHospedin = isAdministrador || isProdutor;
  const podeIntegracoes = isAdministrador || isProdutor;

  const tabs = useMemo(() => {
    const extra: Array<{ key: TabKey; label: string }> = [];
    if (podeMapaHospedin) {
      extra.push({ key: "hospedin", label: "Mapa" });
    }
    if (podeIntegracoes) {
      extra.push({ key: "integracoes", label: "Integrações" });
    }
    return [...TABS_BASE, ...extra];
  }, [podeMapaHospedin, podeIntegracoes]);

  const tabAtiva: TabKey =
    (!podeMapaHospedin && activeTab === "hospedin") ||
    (!podeIntegracoes && activeTab === "integracoes")
      ? "suites"
      : activeTab;

  const onVisualizarFalhas = () => {
    // Com reserva Jango → Reservas / Falhas sync (mesma regra do contador.erros)
    if (syncErros > 0) {
      pedirFiltroSyncErro();
      setActiveTab("reservas");
      return;
    }
    // Sem reserva (internal_entity_id NULL) → Integrações / Pendências
    if (syncErrosSemReserva > 0 && podeIntegracoes) {
      pedirAbrirPendencias();
      setActiveTab("integracoes");
    }
  };

  const bannerVisivel = syncErrosTotal > 0;
  const bannerTexto =
    syncErros > 0
      ? `🔴 Existem ${syncErros} reserva${syncErros === 1 ? "" : "s"} com falha de sincronização.`
      : `🔴 Existem ${syncErrosSemReserva} pendência${
          syncErrosSemReserva === 1 ? "" : "s"
        } de integração (sem reserva criada).`;

  return (
    <LinearGradient
      colors={[colors.branco, colors.laranjado]}
      style={styles.gradient}
    >
      <StatusBarPage style="dark" />
      <BarMenu />

      <ScreenContainer
        style={[
          styles.container,
          layoutMobile &&
            Platform.OS !== "web" &&
            styles.containerMobile,
          isDesktop && styles.containerDesktop,
        ]}
      >
        <Text style={[styles.titulo, layoutMobile && styles.tituloMobile]}>
          🏨 Hospedagem
          {syncErrosTotal > 0 ? `  🔴 ${syncErrosTotal}` : ""}
        </Text>

        {bannerVisivel ? (
          <TouchableOpacity
            style={styles.alertaSync}
            onPress={onVisualizarFalhas}
            activeOpacity={0.85}
          >
            <Text style={styles.alertaSyncTexto}>{bannerTexto}</Text>
            <Text style={styles.alertaSyncLink}>Clique para visualizar</Text>
          </TouchableOpacity>
        ) : null}

        <View
          style={[styles.tabsRow, layoutMobile && styles.tabsRowMobile]}
        >
          {tabs.map((tab) => {
            const ativo = tabAtiva === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[
                  styles.tab,
                  layoutMobile && styles.tabMobile,
                  ativo && styles.tabAtiva,
                ]}
                onPress={() => setActiveTab(tab.key)}
              >
                <Text
                  style={[styles.tabTexto, ativo && styles.tabTextoAtivo]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.tabContent}>
          <View
            style={[
              styles.tabPanel,
              tabAtiva === "suites"
                ? styles.tabPanelAtivo
                : styles.tabPanelHidden,
            ]}
            pointerEvents={tabAtiva === "suites" ? "auto" : "none"}
          >
            <TabSuites />
          </View>
          <View
            style={[
              styles.tabPanel,
              tabAtiva === "agenda"
                ? styles.tabPanelAtivo
                : styles.tabPanelHidden,
            ]}
            pointerEvents={tabAtiva === "agenda" ? "auto" : "none"}
          >
            <TabAgenda />
          </View>
          <View
            style={[
              styles.tabPanel,
              tabAtiva === "reservas"
                ? styles.tabPanelAtivo
                : styles.tabPanelHidden,
            ]}
            pointerEvents={tabAtiva === "reservas" ? "auto" : "none"}
          >
            <TabReservas />
          </View>
          {podeMapaHospedin ? (
            <View
              style={[
                styles.tabPanel,
                tabAtiva === "hospedin"
                  ? styles.tabPanelAtivo
                  : styles.tabPanelHidden,
              ]}
              pointerEvents={tabAtiva === "hospedin" ? "auto" : "none"}
            >
              <TabHospedinMapeamento />
            </View>
          ) : null}
          {podeIntegracoes ? (
            <View
              style={[
                styles.tabPanel,
                tabAtiva === "integracoes"
                  ? styles.tabPanelAtivo
                  : styles.tabPanelHidden,
              ]}
              pointerEvents={tabAtiva === "integracoes" ? "auto" : "none"}
            >
              <TabIntegracoes />
            </View>
          ) : null}
        </View>
      </ScreenContainer>
      <NovaReservaRecepcaoModal />
      <ReceberSaldoHospedagemModal />
    </LinearGradient>
  );
}

export default function HospedagemAdminPage() {
  return (
    <HospedagemAdminRefreshProvider>
      <NovaReservaRecepcaoProvider>
        <ReceberSaldoHospedagemProvider>
          <HospedagemAdminPageInner />
        </ReceberSaldoHospedagemProvider>
      </NovaReservaRecepcaoProvider>
    </HospedagemAdminRefreshProvider>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    marginTop: Platform.OS === "web" ? 80 : 120,
  },
  containerMobile: {
    marginTop: 102,
  },
  containerDesktop: {
    maxWidth: 1450,
    width: "100%",
    alignSelf: "center",
  },
  titulo: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 12,
    color: colors.cinza,
  },
  tituloMobile: {
    fontSize: 22,
    marginBottom: 6,
  },
  alertaSync: {
    backgroundColor: "rgba(185, 28, 28, 0.1)",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    gap: 4,
  },
  alertaSyncTexto: {
    fontSize: 14,
    fontWeight: "700",
    color: "#b91c1c",
  },
  alertaSyncLink: {
    fontSize: 13,
    fontWeight: "600",
    color: "#0073E6",
  },
  tabsRow: {
    flexDirection: "row",
    marginBottom: 12,
    backgroundColor: "rgba(255,255,255,0.45)",
    borderRadius: 12,
    padding: 4,
  },
  tabsRowMobile: {
    padding: 2,
    marginBottom: 6,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  tabMobile: {
    paddingVertical: 8,
  },
  tabAtiva: {
    backgroundColor: colors.azul,
  },
  tabTexto: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.cinza,
  },
  tabTextoAtivo: {
    color: colors.branco,
  },
  tabContent: {
    flex: 1,
    position: "relative",
  },
  tabPanel: {
    ...StyleSheet.absoluteFillObject,
  },
  tabPanelAtivo: {
    opacity: 1,
    zIndex: 2,
  },
  tabPanelHidden: {
    opacity: 0,
    zIndex: 0,
  },
});
