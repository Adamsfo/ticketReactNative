import { View, Text, StyleSheet } from "react-native";

export default function Login() {
  return (
    <View style={style.container}>
      <Text>Pagina Cadastro</Text>
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
