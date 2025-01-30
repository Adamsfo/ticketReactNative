import React from "react";
import { ButtonMenu } from "./styles";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import colors from "@/src/constants/colors";

export default function Menu({ color }: { color?: string }) {
  const navigation = useNavigation() as any;

  return (
    <ButtonMenu onPress={() => navigation.openDrawer()}>
      <Feather name="menu" size={36} color={color ? color : colors.zinc} />
    </ButtonMenu>
  );
}
