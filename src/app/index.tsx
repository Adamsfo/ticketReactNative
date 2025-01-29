import { View, Text, StyleSheet } from "react-native";
import colors from "@/constants/colors";

export default function Login() {
  return (
    <View style={style.container}>
      <View style={style.header}>
        <Text style={style.logoText}>
          Ticket<Text style={{ color: colors.green }}>App</Text>
        </Text>
        <Text style={style.slogan}>Faça login para comprar seu Ticket</Text>
      </View>
    </View>
  );
}

const style = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 34,
    backgroundColor: colors.zinc,
  },
  header: {
    flex: 1,
    paddingLeft: 14,
    paddingRight: 14,
  },
  logoText: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.white,
    marginBottom: 8,
  },
  slogan: {
    fontSize: 36,
    color: colors.white,
    marginBottom: 36,
  },
});
