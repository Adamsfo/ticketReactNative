import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
// import styles from "./styles";

interface CardEventoProps {
  data: { nome: string };
  onPress: () => void;
}
// { data, onPress }: CardEventoProps
export default function CardEvento() {
  return (
    <TouchableOpacity>
      <View>
        <Text>Item</Text>
      </View>
    </TouchableOpacity>
  );
}
