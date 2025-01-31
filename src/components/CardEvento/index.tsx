import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";

interface CardEventoProps {
  data: { id: string; nome: string };
  onPress: () => void;
  widthCardItem: number;
}

export default function CardEvento({
  data,
  onPress,
  widthCardItem,
}: CardEventoProps) {
  return (
    <View>
      <TouchableOpacity
        style={[styles.item, { width: widthCardItem }]}
        activeOpacity={0.5}
        onPress={onPress}
      >
        <Feather name="calendar" size={24} color="black" />
        <Text style={styles.titulo} key={data.id}>
          {data.nome}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  item: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255, 0.21)",
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
