import React from "react";
import { Platform, StyleSheet, View } from "react-native";
import Menu from "@/src/components/Menu";
import FloatingMenu from "@/src/components/FloatingMenu";
import { publicTheme } from "@/src/constants/publicTheme";

type Props = {
  /** Cor dos ícones do menu (drawer / usuário). */
  iconColor?: string;
  variant?: "default" | "brand";
};

/**
 * Cabeçalho da jornada pública — no fluxo do layout (não absoluto).
 */
export default function PublicShopHeader({
  iconColor = publicTheme.accent,
  variant = "default",
}: Props) {
  return (
    <View
      style={[styles.wrapper, variant === "brand" && styles.wrapperBrand]}
    >
      <View style={styles.bar}>
        <View style={styles.left}>
          <Menu color={iconColor} embedded />
        </View>
        <View style={styles.right}>
          <FloatingMenu color={iconColor} embedded />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: publicTheme.surface,
    borderBottomWidth: 1,
    borderBottomColor: publicTheme.border,
    ...Platform.select({
      web: {
        shadowColor: publicTheme.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 1,
        shadowRadius: 12,
      },
      default: {
        elevation: 2,
      },
    }),
  },
  wrapperBrand: {
    borderBottomWidth: 3,
    borderBottomColor: publicTheme.brandOrange,
  },
  bar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === "web" ? 10 : 12,
    minHeight: Platform.OS === "web" ? 76 : 80,
    maxWidth: publicTheme.contentMaxWidth,
    width: "100%",
    alignSelf: "center",
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 1,
  },
  right: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    flexShrink: 0,
  },
});
