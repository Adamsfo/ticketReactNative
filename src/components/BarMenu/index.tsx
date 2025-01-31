import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  StatusBar,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import Menu from "../Menu";
import FloatingMenu from "../FloatingMenu";
import colors from "@/src/constants/colors";

export default function BarMenu({ color }: { color?: string }) {
  return (
    <TouchableOpacity style={styles.containerMargin}>
      <TouchableOpacity style={styles.container}>
        <Menu color={color} />
        <FloatingMenu color={color} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    top:
      Platform.OS === "ios"
        ? (StatusBar.currentHeight ?? 0) + 54
        : Platform.OS === "android"
        ? 54
        : 10,
    marginTop: 0,
    width: "100%",
    height: 50,
    position: "absolute",
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 10,
  },
  containerMargin: {
    marginHorizontal: 8,
  },
  item: {
    flexDirection: "row",
    backgroundColor: colors.roxo,
    marginRight: 7,
    marginTop: 7,
    padding: 12,
    borderRadius: 10,
  },
  titulo: {
    paddingLeft: 10,
    paddingRight: 20,
    fontSize: 18,
  },
});
