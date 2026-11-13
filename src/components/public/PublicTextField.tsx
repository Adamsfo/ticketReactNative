import React from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from "react-native";
import { publicTheme } from "@/src/constants/publicTheme";

type Props = TextInputProps & {
  label: string;
  error?: string;
  success?: string;
  hint?: string;
  inputWrapperStyle?: object;
};

export default function PublicTextField({
  label,
  error,
  success,
  hint,
  style,
  inputWrapperStyle,
  ...inputProps
}: Props) {
  return (
    <View style={styles.group}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputWrap, inputWrapperStyle]}>
        <TextInput
          style={[styles.input, style]}
          placeholderTextColor={publicTheme.textMuted}
          {...inputProps}
        />
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {!error && success ? (
        <Text style={styles.success}>{success}</Text>
      ) : null}
      {hint && !error && !success ? (
        <Text style={styles.hint}>{hint}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    width: "100%",
    marginBottom: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: publicTheme.textPrimary,
    marginBottom: 6,
  },
  inputWrap: {
    position: "relative",
    width: "100%",
  },
  input: {
    borderWidth: 1,
    borderColor: publicTheme.border,
    borderRadius: publicTheme.radiusSm,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 16,
    color: publicTheme.textPrimary,
    backgroundColor: publicTheme.background,
    width: "100%",
  },
  error: {
    color: "#DC2626",
    fontSize: 13,
    marginTop: 6,
    marginBottom: 8,
  },
  success: {
    color: publicTheme.success,
    fontSize: 13,
    marginTop: 6,
    marginBottom: 8,
  },
  hint: {
    color: publicTheme.textSecondary,
    fontSize: 13,
    marginTop: 6,
  },
});
