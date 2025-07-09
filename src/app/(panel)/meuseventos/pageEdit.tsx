import React, { useState } from "react";
import { View, Text, Button, TouchableOpacity, Platform } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import colors from "@/src/constants/colors";
import StatusBarPage from "@/src/components/StatusBarPage";
import BarMenu from "@/src/components/BarMenu";
import MeusEventosInfo from "./tabs/tabInfo";
import TabCortesia from "./tabs/tabCortesia";
import Footer from "@/src/components/Footer";
import TabIngressos from "./tabs/tabIngressos";
import TabFinanceiro from "./tabs/tabFinanceiro";

const tabs = [
  { key: "info", label: "Informações" },
  { key: "cortesia", label: "Cortesias" },
  { key: "ingressos", label: "Ingressos" },
  { key: "financeiro", label: "Financeiro" },
];

export default function MeusEventosEdit() {
  const [activeTab, setActiveTab] = useState("info");

  const renderTab = () => {
    switch (activeTab) {
      case "info":
        return <MeusEventosInfo />;
      case "cortesia":
        return <TabCortesia />;
      case "ingressos":
        return <TabIngressos />;
      case "financeiro":
        return <TabFinanceiro />;
      default:
        return null;
    }
  };

  return (
    <LinearGradient
      colors={[colors.branco, colors.laranjado]}
      style={{
        flex: 1,
        justifyContent: "center",
      }}
    >
      <StatusBarPage style="dark" />
      <BarMenu />
      <View
        style={{
          flex: 1,
          marginTop: Platform.OS === "web" ? 40 : 40,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            marginBottom: 10,
            flexWrap: "wrap",
            marginTop: Platform.OS === "web" ? 40 : 80,
          }}
        >
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              style={{
                paddingHorizontal: 15,
                paddingVertical: 8,
                backgroundColor: activeTab === tab.key ? colors.azul : "#eee",
                marginHorizontal: 5,
                borderRadius: 8,
                marginBottom: 10,
              }}
            >
              <Text
                style={{
                  color: activeTab === tab.key ? "#fff" : "#333",
                  fontWeight: "bold",
                }}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ flex: 1 }}>{renderTab()}</View>
      </View>
    </LinearGradient>
  );
}
