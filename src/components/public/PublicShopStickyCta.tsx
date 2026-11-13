import React from "react";
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { publicTheme } from "@/src/constants/publicTheme";

type Props = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
};

export default function PublicShopStickyCta({
  label,
  onPress,
  disabled,
}: Props) {
  return (
    <View style={styles.wrap} pointerEvents="box-none">
      <View style={styles.bar}>
        <TouchableOpacity
          style={[styles.button, disabled && styles.buttonDisabled]}
          onPress={onPress}
          disabled={disabled}
          activeOpacity={0.9}
          accessibilityRole="button"
          accessibilityLabel={label}
        >
          <Text style={styles.buttonText}>{label}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 20,
    pointerEvents: "box-none",
  },
  bar: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: Platform.OS === "ios" ? 28 : 16,
    backgroundColor: "transparent",
    maxWidth: publicTheme.contentMaxWidth,
    width: "100%",
    alignSelf: "center",
  },
  button: {
    backgroundColor: publicTheme.accent,
    borderRadius: publicTheme.radiusMd,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      web: {
        shadowColor: "rgba(15, 23, 42, 0.35)",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 1,
        shadowRadius: 14,
      },
      default: { elevation: 6 },
    }),
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: publicTheme.surface,
    fontSize: 16,
    fontWeight: "700",
  },
});
