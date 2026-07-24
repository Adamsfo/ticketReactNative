import React, { ReactNode } from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import { SCREEN_PADDING_HORIZONTAL } from "@/src/constants/layout";

type Props = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Sobrescreve o padding horizontal padrão (12). */
  paddingHorizontal?: number;
};

/**
 * Container de tela com padding lateral unificado.
 * Use nas telas novas (Hospedagem, Check-in, Financeiro, etc.)
 * para manter a mesma largura útil.
 */
export default function ScreenContainer({
  children,
  style,
  paddingHorizontal = SCREEN_PADDING_HORIZONTAL,
}: Props) {
  return (
    <View style={[styles.base, { paddingHorizontal }, style]}>{children}</View>
  );
}

const styles = StyleSheet.create({
  base: {
    flex: 1,
  },
});
