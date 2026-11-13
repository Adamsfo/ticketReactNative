import { useAuth } from "@/src/contexts_/AuthContext";
import { useNavigation } from "@react-navigation/native";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { publicTheme } from "@/src/constants/publicTheme";
import colors from "@/src/constants/colors";

type Props = {
  /** `brand` = rodapé laranja clássico da Home. */
  variant?: "default" | "brand";
};

const PublicShopFooter = ({ variant = "default" }: Props) => {
  const { visitasNoSite } = useAuth();
  const navigation = useNavigation() as any;
  const isBrand = variant === "brand";

  return (
    <View style={[styles.footerContainer, isBrand && styles.footerBrand]}>
      <Text style={[styles.brand, isBrand && styles.brandOnOrange]}>
        Jango Ingressos
      </Text>
      <Text style={[styles.slogan, isBrand && styles.sloganOnOrange]}>
        Diversão, lazer e música!
      </Text>
      <Text style={[styles.visits, isBrand && styles.visitsOnOrange]}>
        {visitasNoSite} visitas na plataforma
      </Text>
      <View style={styles.linksRow}>
        <TouchableOpacity onPress={() => navigation.navigate("termosuso")}>
          <Text style={[styles.linkText, isBrand && styles.linkOnOrange]}>
            Termos de Uso
          </Text>
        </TouchableOpacity>
        <Text style={[styles.dot, isBrand && styles.dotOnOrange]}>·</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate("politicadeprivacidade")}
        >
          <Text style={[styles.linkText, isBrand && styles.linkOnOrange]}>
            Política de Privacidade
          </Text>
        </TouchableOpacity>
      </View>
      <Text style={[styles.copy, isBrand && styles.copyOnOrange]}>
        © {new Date().getFullYear()} Tanz Tecnologia Ltda. Todos os direitos
        reservados.
      </Text>
      <Text style={[styles.copyMuted, isBrand && styles.copyMutedOnOrange]}>
        CNPJ 50.626.772/0001-01 — Av. A, 670 — Cuiabá — MT
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  footerContainer: {
    backgroundColor: colors.zinc,
    paddingVertical: 32,
    paddingHorizontal: 20,
    alignItems: "center",
    marginTop: 24,
    borderTopWidth: 4,
    borderTopColor: publicTheme.primary,
  },
  footerBrand: {
    backgroundColor: "#FF9E1B",
    borderTopWidth: 0,
    marginTop: 32,
    borderRadius: publicTheme.radiusLg,
    marginHorizontal: 4,
  },
  brand: {
    fontSize: 18,
    fontWeight: "700",
    color: publicTheme.surface,
    marginBottom: 4,
  },
  brandOnOrange: {
    color: colors.white,
  },
  slogan: {
    fontSize: 14,
    color: publicTheme.primary,
    fontWeight: "600",
    marginBottom: 12,
  },
  sloganOnOrange: {
    color: colors.roxo,
  },
  visits: {
    fontSize: 13,
    color: publicTheme.textMuted,
    marginBottom: 16,
  },
  visitsOnOrange: {
    color: "rgba(255,255,255,0.95)",
  },
  linksRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
    marginBottom: 16,
  },
  linkText: {
    color: publicTheme.surface,
    fontSize: 14,
    fontWeight: "600",
  },
  linkOnOrange: {
    color: colors.white,
    textDecorationLine: "underline",
  },
  dot: {
    color: publicTheme.textMuted,
    fontSize: 14,
  },
  dotOnOrange: {
    color: "rgba(255,255,255,0.8)",
  },
  copy: {
    fontSize: 12,
    color: "rgba(255,255,255,0.85)",
    textAlign: "center",
  },
  copyOnOrange: {
    color: "rgba(255,255,255,0.95)",
  },
  copyMuted: {
    fontSize: 11,
    color: publicTheme.textMuted,
    textAlign: "center",
    marginTop: 6,
  },
  copyMutedOnOrange: {
    color: "rgba(255,255,255,0.85)",
  },
});

export default PublicShopFooter;
