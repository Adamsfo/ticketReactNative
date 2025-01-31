import React, { useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Picker } from "@react-native-picker/picker";

const ComboBox = () => {
  const [selectedValue, setSelectedValue] = useState("java");

  return (
    <View style={styles.container}>
      <Text style={styles.label}></Text>
      <Picker
        selectedValue={selectedValue}
        style={styles.picker}
        onValueChange={(itemValue, itemIndex) => setSelectedValue(itemValue)}
      >
        <Picker.Item label="Java" value="java" />
        <Picker.Item label="JavaScript" value="javascript" />
        <Picker.Item label="Python" value="python" />
        <Picker.Item label="C#" value="csharp" />
        <Picker.Item label="C++" value="cplusplus" />
      </Picker>
      <Text style={styles.selectedText}>
        Linguagem selecionada: {selectedValue}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 16,
  },
  label: {
    fontSize: 18,
    marginBottom: 8,
  },
  picker: {
    height: 50,
    // width: "100%",
  },
  selectedText: {
    marginTop: 16,
    fontSize: 16,
  },
});

export default ComboBox;
