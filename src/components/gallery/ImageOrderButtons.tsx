import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import colors from "@/src/constants/colors";

type Props = {
  onMoveLeft?: () => void;
  onMoveRight?: () => void;
  canMoveLeft?: boolean;
  canMoveRight?: boolean;
};

/** Botões genéricos de ordenação (← →). Sem domínio de negócio. */
export default function ImageOrderButtons({
  onMoveLeft,
  onMoveRight,
  canMoveLeft = true,
  canMoveRight = true,
}: Props) {
  return (
    <View style={styles.row}>
      <TouchableOpacity
        style={styles.btn}
        onPress={onMoveLeft}
        disabled={!canMoveLeft}
        accessibilityLabel="Mover para esquerda"
      >
        <Feather
          name="chevron-left"
          size={18}
          color={!canMoveLeft ? "#ccc" : colors.cinza}
        />
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.btn}
        onPress={onMoveRight}
        disabled={!canMoveRight}
        accessibilityLabel="Mover para direita"
      >
        <Feather
          name="chevron-right"
          size={18}
          color={!canMoveRight ? "#ccc" : colors.cinza}
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center" },
  btn: { padding: 4 },
});
