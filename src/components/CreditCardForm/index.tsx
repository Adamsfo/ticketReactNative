import React from "react";
import { View, StyleSheet, Alert } from "react-native";
import {
  CreditCardInput,
  LiteCreditCardInput,
} from "react-native-credit-card-input";

const CreditCardForm = () => {
  const handleCardChange = (formData: any) => {
    console.log(formData);
    // Implementar lógica de validação adicional aqui, se necessário
  };

  const handleCardSubmit = () => {
    Alert.alert("Formulário enviado com sucesso!");
  };

  return (
    <View style={styles.container}>
      <CreditCardInput onChange={handleCardChange} />
      {/* <LiteCreditCardInput onChange={handleCardChange} /> */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
  },
});

export default CreditCardForm;
