import React, { useState } from "react";
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
import TabReservas from "./tabs/tabReservas";
import TabSuites from "./tabs/tabSuites";
import TabAgenda from "./tabs/tabAgenda";
import { HospedagemAdminRefreshProvider } from "./contexts/HospedagemAdminRefreshContext";
import { NovaReservaRecepcaoProvider } from "./contexts/NovaReservaRecepcaoContext";
import { ReceberSaldoHospedagemProvider } from "./contexts/ReceberSaldoHospedagemContext";
import NovaReservaRecepcaoModal from "./components/NovaReservaRecepcaoModal";
import ReceberSaldoHospedagemModal from "./components/ReceberSaldoHospedagemModal";

const TABS = [
  { key: "suites", label: "🏨 Suítes" },
  { key: "agenda", label: "📅 Agenda" },
  { key: "reservas", label: "📋 Reservas" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default function HospedagemAdminPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("suites");

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

            <ScreenContainer style={styles.container}>
              <Text style={styles.titulo}>🏨 Hospedagem</Text>

              <View style={styles.tabsRow}>
                {TABS.map((tab) => {
                  const ativo = activeTab === tab.key;
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

              {/* Abas montadas em paralelo para receber refresh após operações */}
              <View style={styles.tabContent}>
                <View
                  style={[
                    styles.tabPanel,
                    activeTab === "suites"
                      ? styles.tabPanelAtivo
                      : styles.tabPanelHidden,
                  ]}
                  pointerEvents={activeTab === "suites" ? "auto" : "none"}
                >
                  <TabSuites />
                </View>
                <View
                  style={[
                    styles.tabPanel,
                    activeTab === "agenda"
                      ? styles.tabPanelAtivo
                      : styles.tabPanelHidden,
                  ]}
                  pointerEvents={activeTab === "agenda" ? "auto" : "none"}
                >
                  <TabAgenda />
                </View>
                <View
                  style={[
                    styles.tabPanel,
                    activeTab === "reservas"
                      ? styles.tabPanelAtivo
                      : styles.tabPanelHidden,
                  ]}
                  pointerEvents={activeTab === "reservas" ? "auto" : "none"}
                >
                  <TabReservas />
                </View>
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
