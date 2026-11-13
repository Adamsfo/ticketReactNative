import React, { ReactNode } from "react";
import {
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { publicTheme } from "@/src/constants/publicTheme";

type Props = {
  children: ReactNode;
  title?: string;
  style?: StyleProp<ViewStyle>;
  noPadding?: boolean;
};

export default function PublicShopSection({
  children,
  title,
  style,
  noPadding,
}: Props) {
  return (
    <View style={[styles.section, style]}>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      <View style={noPadding ? undefined : styles.body}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    backgroundColor: publicTheme.surface,
    borderRadius: publicTheme.radiusLg,
    borderWidth: 1,
    borderColor: publicTheme.border,
    marginBottom: 16,
    overflow: "hidden",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: publicTheme.textPrimary,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 8,
  },
  body: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
});
