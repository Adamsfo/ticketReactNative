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
import { HospedagemAdminRefreshProvider } from "./contexts/HospedagemAdminRefreshContext";
import { NovaReservaRecepcaoProvider } from "./contexts/NovaReservaRecepcaoContext";
import { ReceberSaldoHospedagemProvider } from "./contexts/ReceberSaldoHospedagemContext";
import NovaReservaRecepcaoModal from "./components/NovaReservaRecepcaoModal";
import ReceberSaldoHospedagemModal from "./components/ReceberSaldoHospedagemModal";
import { useHospedagemDesktopLayout } from "./useHospedagemDesktopLayout";

const TABS_BASE = [
  { key: "suites" as const, label: "🏨 Suítes" },
  { key: "agenda" as const, label: "📅 Agenda" },
  { key: "reservas" as const, label: "📋 Reservas" },
];

type TabKey = "suites" | "agenda" | "reservas" | "hospedin";

export default function HospedagemAdminPage() {
  const { isAdministrador, isProdutor } = useAuth();
  const { isDesktop } = useHospedagemDesktopLayout();
  const [activeTab, setActiveTab] = useState<TabKey>("suites");

  /** Mesmo perfil que acessa o menu Hospedagem: admGeral ou Administrador do produtor. */
  const podeMapaHospedin = isAdministrador || isProdutor;

  const tabs = useMemo(() => {
    if (!podeMapaHospedin) return TABS_BASE;
    return [...TABS_BASE, { key: "hospedin" as const, label: "Mapa" }];
  }, [podeMapaHospedin]);

  const tabAtiva: TabKey =
    !podeMapaHospedin && activeTab === "hospedin" ? "suites" : activeTab;

  return (
    <HospedagemAdminRefreshProvider>
      <NovaReservaRecepcaoProvider>
        <ReceberSaldoHospedagemProvider>
          <LinearGradient
            colors={[colors.branco, colors.laranjado]}
            style={styles.gradient}
          >
            <StatusBarPage style="dark" />
            <BarMenu />

            <ScreenContainer
              style={[styles.container, isDesktop && styles.containerDesktop]}
            >
              <Text style={styles.titulo}>🏨 Hospedagem</Text>

              <View style={styles.tabsRow}>
                {tabs.map((tab) => {
                  const ativo = tabAtiva === tab.key;
                  return (
                    <TouchableOpacity
                      key={tab.key}
                      style={[styles.tab, ativo && styles.tabAtiva]}
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
              </View>
            </ScreenContainer>
          </LinearGradient>
          <NovaReservaRecepcaoModal />
          <ReceberSaldoHospedagemModal />
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
  tabsRow: {
    flexDirection: "row",
    marginBottom: 12,
    backgroundColor: "rgba(255,255,255,0.45)",
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
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
