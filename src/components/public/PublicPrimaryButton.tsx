import React from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type ViewStyle,
} from "react-native";
import { publicTheme } from "@/src/constants/publicTheme";

type Props = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  variant?: "primary" | "secondary";
};

export default function PublicPrimaryButton({
  label,
  onPress,
  disabled,
  loading,
  style,
  variant = "primary",
}: Props) {
  return (
    <TouchableOpacity
      style={[
        styles.base,
        variant === "secondary" ? styles.secondary : styles.primary,
        (disabled || loading) && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.9}
    >
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator
            size="small"
            color={variant === "secondary" ? publicTheme.accent : publicTheme.surface}
            style={styles.spinner}
          />
        ) : null}
        <Text
          style={[
            styles.text,
            variant === "secondary" && styles.textSecondary,
          ]}
        >
          {label}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: publicTheme.radiusMd,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  primary: {
    backgroundColor: publicTheme.accent,
  },
  secondary: {
    backgroundColor: publicTheme.surface,
    borderWidth: 1,
    borderColor: publicTheme.border,
  },
  disabled: {
    opacity: 0.55,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
  },
  spinner: {
    marginRight: 8,
  },
  text: {
    color: publicTheme.surface,
    fontWeight: "700",
    fontSize: 15,
  },
  textSecondary: {
    color: publicTheme.textPrimary,
  },
});
