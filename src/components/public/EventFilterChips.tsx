import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { publicTheme, type PublicEventCategory } from "@/src/constants/publicTheme";

const OPTIONS: { key: PublicEventCategory; label: string }[] = [
  { key: "todos", label: "Todos" },
  { key: "ingresso", label: "Ingressos" },
  { key: "pousada", label: "Hospedagem" },
];

type Props = {
  value: PublicEventCategory;
  onChange: (category: PublicEventCategory) => void;
  counts?: Partial<Record<PublicEventCategory, number>>;
};

export default function EventFilterChips({ value, onChange, counts }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {OPTIONS.map((opt) => {
        const active = value === opt.key;
        const count = counts?.[opt.key];
        return (
          <TouchableOpacity
            key={opt.key}
            onPress={() => onChange(opt.key)}
            style={[styles.chip, active && styles.chipActive]}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
          >
            <Text style={[styles.chipText, active && styles.chipTextActive]}>
              {opt.label}
              {count !== undefined && count >= 0 ? ` (${count})` : ""}
            </Text>
          </TouchableOpacity>
        );
      })}
      <View style={styles.spacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
    gap: 8,
  },
  spacer: {
    width: 4,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: publicTheme.surface,
    borderWidth: 1,
    borderColor: publicTheme.border,
  },
  chipActive: {
    backgroundColor: publicTheme.primarySoft,
    borderColor: publicTheme.brandOrange,
  },
  chipText: {
    fontSize: 14,
    fontWeight: "600",
    color: publicTheme.textSecondary,
  },
  chipTextActive: {
    color: publicTheme.textPrimary,
  },
});
