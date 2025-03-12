import React, { useState } from "react";
import { View, StyleSheet, Text } from "react-native";
import RNPickerSelect from "react-native-picker-select";

interface SelectProps {
  items: { label: string; value: any }[];
  currentValue: any;
  onValueChange: (value: any) => void;
}

const Select: React.FC<SelectProps> = ({
  items,
  currentValue,
  onValueChange,
}) => {
  const [selectedItem, setSelectedItem] = useState(currentValue);

  const handleValueChange = (value: any) => {
    setSelectedItem(value);
    onValueChange(value);
  };

  return (
    <View style={styles.container}>
      <RNPickerSelect
        onValueChange={handleValueChange}
        items={items}
        value={selectedItem}
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
  },
});

export default Select;
