import colors from "@/src/constants/colors";
import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import { View, Text, TextInput, StyleSheet, Dimensions } from "react-native";

const CustomGrid = () => {
  const { width } = Dimensions.get("window");
  const isMobile = width < 768;

  const [description, setDescription] = useState("");
  const [value, setValue] = useState("");

  return (
    <View style={styles.container}>
      <View style={[styles.row, isMobile && styles.column]}>
        <View style={styles.box}>
          {/* <Text style={styles.text}>Descrição</Text> */}
          <Text style={styles.text}>Tipo</Text>
        </View>
        <View style={styles.box}>
          {/* <Text style={styles.text}>Descrição</Text> */}
          <Text style={styles.text}>Day Use Adulto</Text>
        </View>
        <View style={styles.box}>
          {/* <Text style={styles.text}>Valor</Text> */}
          <Text style={styles.text}>Valor R$ 60,00</Text>
        </View>
        <View style={styles.box}>
          {/* <Text style={styles.text}>Vendidos</Text> */}
          <Text style={styles.text}>Taxa R$ 6,00</Text>
        </View>
        <View style={styles.box}>
          {/* <Text style={styles.text}>Vendidos</Text> */}
          <Text style={styles.text}>Total R$ 66,00</Text>
        </View>
        <View style={styles.box}>
          {/* <Text style={styles.text}>Vendidos</Text> */}
          <Text style={styles.text}>Vendidos 200</Text>
        </View>
        <View style={styles.boxIcone}>
          <Feather name="edit" size={18} color={colors.branco} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    margin: 5,
    backgroundColor: colors.azul,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  column: {
    flexDirection: "column",
  },
  box: {
    backgroundColor: colors.azul,
    margin: 5,
    flex: 1,
    alignItems: "center",
  },
  boxIcone: {
    backgroundColor: colors.azul,
    margin: 5,
    alignItems: "center",
  },
  fullBox: {
    flex: 1,
  },
  text: {
    color: "#FFF",
  },
  input: {
    height: 40,
    borderColor: "#FFF",
    borderWidth: 1,
    backgroundColor: "#FFF",
    color: "#000",
    paddingHorizontal: 10,
    marginTop: 10,
    width: "100%",
  },
});

export default CustomGrid;
