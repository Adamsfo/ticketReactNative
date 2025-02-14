import colors from "@/src/constants/colors";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  Platform,
  TouchableOpacity,
} from "react-native";
import { Link } from "expo-router";
import { navigate } from "expo-router/build/global-state/routing";

export default function Index() {
  useEffect(() => {
    if (Platform.OS === "web") {
      const rootPortal = document.createElement("div");
      rootPortal.setAttribute("id", "root-portal");
      document.body.appendChild(rootPortal);
    }
  }, []);

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
