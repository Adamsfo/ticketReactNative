import React, { useState } from "react";
import { TextInput, Platform, StyleSheet, View } from "react-native";
import MaskedInput from "react-text-mask";

interface CurrencyInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const CurrencyInput: React.FC<CurrencyInputProps> = ({
  value,
  onChange,
  placeholder,
}) => {
  const [text, setText] = useState(value);

  const handleChange = (newValue: string) => {
    const numericValue = newValue.replace(/[^0-9,]/g, "").replace(",", ".");
    const formattedValue = formatCurrency(numericValue);
    setText(formattedValue);
    onChange(formattedValue);
  };

  const formatCurrency = (value: string) => {
    const number = parseFloat(value);
    if (isNaN(number)) return "";
    return number.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  if (Platform.OS === "web") {
    return (
      <MaskedInput
        mask={[
          "R$",
          " ",
          /\d/,
          /\d/,
          /\d/,
          ".",
          /\d/,
          /\d/,
          /\d/,
          ",",
          /\d/,
          /\d/,
        ]}
        value={text}
        onChange={(e) => handleChange(e.target.value)}
        render={(ref, props) => (
          <input
            ref={(input: HTMLInputElement | null) => ref(input as HTMLElement)}
            {...props}
            style={styles.input}
            placeholder={placeholder}
          />
        )}
      />
    );
  } else {
    return (
      <TextInput
        style={styles.input}
        value={text}
        onChangeText={handleChange}
        placeholder={placeholder}
        keyboardType="numeric"
      />
    );
  }
};

const styles = StyleSheet.create({
  input: {
    height: 40,
    borderColor: "gray",
    borderWidth: 1,
    paddingHorizontal: 10,
    width: "100%",
    fontSize: 16,
  },
});

export default CurrencyInput;
