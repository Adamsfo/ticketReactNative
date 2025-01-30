import Menu from "@/src/components/Menu";
import { View, Text, StyleSheet } from "react-native";

export default function Login() {
  return (
    <View style={style.container}>
      <Menu />
      <Text>Pagina Perfil do usuario</Text>
    </View>
  );
}

const style = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
