import colors from "@/src/constants/colors";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { View, Text, StyleSheet, Image } from "react-native";
import { Link } from "expo-router";

export default function Index() {
  return (
    <View style={style.container}>
      <Image source={require("../assets/logoJango.png")} />
    </View>
  );
}

const style = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
    justifyContent: "center",
    alignItems: "center",
  },
});
