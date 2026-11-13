import React from "react";
import {
  Platform,
  StyleSheet,
  TextInput,
  View,
  type ViewStyle,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { publicTheme } from "@/src/constants/publicTheme";

type Props = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  style?: ViewStyle;
};

export default function EventSearchBar({
  value,
  onChangeText,
  placeholder = "Buscar eventos por nome ou local…",
  style,
}: Props) {
  return (
    <View style={[styles.wrap, style]}>
      <Feather
        name="search"
        size={20}
        color={publicTheme.textMuted}
        style={styles.icon}
      />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={publicTheme.textMuted}
        style={styles.input}
        autoCapitalize="none"
        autoCorrect={false}
        clearButtonMode={Platform.OS === "ios" ? "while-editing" : undefined}
        accessibilityLabel="Buscar eventos"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: publicTheme.surface,
    borderRadius: publicTheme.radiusMd,
    borderWidth: 1,
    borderColor: publicTheme.border,
    paddingHorizontal: 14,
    minHeight: 48,
    ...Platform.select({
      web: {
        shadowColor: publicTheme.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 1,
        shadowRadius: 8,
      },
      default: {},
    }),
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: publicTheme.textPrimary,
    paddingVertical: Platform.OS === "web" ? 12 : 10,
  },
});
