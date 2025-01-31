import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Container, Item } from "./styles";
import { Feather } from "@expo/vector-icons";

interface CardEventoProps {
  data: { nome: string };
  onPress: () => void;
}

export default function CardEvento({ data, onPress }: CardEventoProps) {
  return (
    <View>
      <Container activeOpacity={0.5} onPress={onPress}>
        <Feather name="calendar" size={24} color="black" />
        <Item>{data.nome}</Item>
      </Container>
    </View>
  );
}
