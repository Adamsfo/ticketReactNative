import React from "react";
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import colors from "@/src/constants/colors";
import ImageOrderButtons from "./ImageOrderButtons";

export type GalleryPhotoItem = {
  key: string;
  uri: string;
  principal?: boolean;
};

type Props = {
  item: GalleryPhotoItem;
  index: number;
  total: number;
  onPressView?: () => void;
  onPressPrincipal?: () => void;
  onPressDelete?: () => void;
  onMoveLeft?: () => void;
  onMoveRight?: () => void;
  /** Variante grande para destaque da principal */
  large?: boolean;
  disabled?: boolean;
};

/** Card genérico de foto com ações. */
export default function PhotoCard({
  item,
  index,
  total,
  onPressView,
  onPressPrincipal,
  onPressDelete,
  onMoveLeft,
  onMoveRight,
  large = false,
  disabled = false,
}: Props) {
  return (
    <View style={[styles.card, large && styles.cardLarge, disabled && styles.cardDisabled]}>
      <TouchableOpacity onPress={onPressView} activeOpacity={0.85} disabled={disabled}>
        <Image
          source={{ uri: item.uri }}
          style={[styles.image, large && styles.imageLarge]}
        />
      </TouchableOpacity>
      {item.principal ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Principal</Text>
        </View>
      ) : null}
      <View style={styles.actions} pointerEvents={disabled ? "none" : "auto"}>
        <ImageOrderButtons
          onMoveLeft={onMoveLeft}
          onMoveRight={onMoveRight}
          canMoveLeft={!disabled && index > 0}
          canMoveRight={!disabled && index < total - 1}
        />
        <View style={styles.actionsRight}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={onPressPrincipal}
            disabled={disabled}
            accessibilityLabel="Marcar como principal"
          >
            <Feather
              name="star"
              size={16}
              color={item.principal ? colors.laranjado : colors.cinza}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={onPressView}
            disabled={disabled}
            accessibilityLabel="Visualizar"
          >
            <Feather name="eye" size={16} color={colors.cinza} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={onPressDelete}
            disabled={disabled}
            accessibilityLabel="Excluir"
          >
            <Feather name="trash-2" size={16} color="#B42318" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 132,
    marginRight: 8,
  },
  cardLarge: {
    width: "100%",
    maxWidth: 420,
    marginRight: 0,
    marginBottom: 8,
  },
  cardDisabled: {
    opacity: 0.55,
  },
  image: {
    width: 132,
    height: 100,
    borderRadius: 10,
    backgroundColor: "#f3f4f6",
  },
  imageLarge: {
    width: "100%",
    height: 220,
    borderRadius: 12,
  },
  badge: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: colors.laranjado,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "800",
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 6,
  },
  actionsRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconBtn: {
    padding: 4,
    marginLeft: 2,
  },
});
