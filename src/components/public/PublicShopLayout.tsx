import React, { ReactNode } from "react";
import { Platform, StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import StatusBarPage from "@/src/components/StatusBarPage";
import BarMenu from "@/src/components/BarMenu";
import { publicTheme } from "@/src/constants/publicTheme";

/** Espaço abaixo do BarMenu absoluto (mesmo padrão das telas legadas). */
const BAR_MENU_TOP_OFFSET = Platform.OS === "web" ? 80 : 120;

export type PublicShopLayoutVariant = "neutral" | "brand";

type Props = {
  children: ReactNode;
  /**
   * `brand` = gradiente branco→laranja (jornada pública).
   * `neutral` = fundo cinza claro (ex.: telas futuras fora da marca).
   */
  variant?: PublicShopLayoutVariant;
};

export default function PublicShopLayout({
  children,
  variant = "brand",
}: Props) {
  const isBrand = variant === "brand";

  const body = (
    <>
      <StatusBarPage style="dark" />
      <BarMenu />
      <View style={[styles.content, styles.contentBelowMenu]}>{children}</View>
    </>
  );

  if (isBrand) {
    return (
      <LinearGradient
        colors={[...publicTheme.brandGradient]}
        style={styles.root}
      >
        {body}
      </LinearGradient>
    );
  }

  return <View style={[styles.root, styles.rootNeutral]}>{body}</View>;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  rootNeutral: {
    backgroundColor: publicTheme.background,
  },
  content: {
    flex: 1,
    width: "100%",
    maxWidth: publicTheme.contentMaxWidth,
    alignSelf: "center",
  },
  contentBelowMenu: {
    marginTop: BAR_MENU_TOP_OFFSET,
  },
});
