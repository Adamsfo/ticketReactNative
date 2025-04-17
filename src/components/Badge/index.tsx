import React from "react";
import { View, Text, StyleSheet } from "react-native";

type BadgeProps = {
  children: React.ReactNode;
  variant?: "default" | "secondary" | "destructive" | "success";
};

export function Badge({ children, variant = "default" }: BadgeProps) {
  return (
    <View style={[styles.base, styles[variant]]}>
      <Text style={[styles.text, variant === "secondary" && styles.textDark]}>
        {children}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    alignSelf: "flex-start",
  },
  text: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  textDark: {
    color: "#374151",
  },
  default: {
    backgroundColor: "#3b82f6",
  },
  secondary: {
    backgroundColor: "#e5e7eb",
  },
  destructive: {
    backgroundColor: "#ef4444",
  },
  success: {
    backgroundColor: "#10b981",
  },
});
