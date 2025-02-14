import React, { useState } from "react";
import { View, StyleSheet, Text } from "react-native";
import RNPickerSelect from "react-native-picker-select";

const Select = () => {
  const [selectedItem, setSelectedItem] = useState(null);

  const items = [
    { label: "Item 1", value: "item1" },
    { label: "Item 2", value: "item2" },
    { label: "Item 3", value: "item3" },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Selecione o produtor do evento</Text>
      <RNPickerSelect
        onValueChange={(value) => setSelectedItem(value)}
        items={items}
        style={pickerSelectStyles}
        placeholder={{ label: "Selecione um item...", value: null }}
      />
      {/* {selectedItem && (
        <Text style={styles.selected}>Item selecionado: {selectedItem}</Text>
      )} */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    // margin: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
  },
  selected: {
    marginTop: 20,
    fontSize: 16,
    color: "blue",
  },
});

const pickerSelectStyles = StyleSheet.create({
  inputIOS: {
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "gray",
    borderRadius: 4,
    color: "black",
    paddingRight: 30, // para garantir que o texto não se sobreponha ao ícone de dropdown
  },
  inputAndroid: {
    fontSize: 16,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 0.5,
    borderColor: "purple",
    borderRadius: 8,
    color: "black",
    paddingRight: 30, // para garantir que o texto não se sobreponha ao ícone de dropdown
  },
  inputWeb: {
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "gray",
    borderRadius: 4,
    color: "black",
    paddingRight: 30,
    // appearance: "none",
    // WebkitAppearance: "none",
    // MozAppearance: "none",
  },
});

export default Select;
