import React from "react";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import colors from "@/src/constants/colors";
import FloatingMenu from "../FloatingMenu";
import {
  TouchableOpacity,
  StyleSheet,
  Platform,
  StatusBar,
} from "react-native";

export default function Menu({ color }: { color?: string }) {
  const navigation = useNavigation() as any;

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => navigation.openDrawer()}
    >
      <Feather name="menu" size={36} color={color ? color : colors.roxo} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 5,
    marginLeft: 20,
    position: "absolute",
    justifyContent: "space-around",
  },
});
