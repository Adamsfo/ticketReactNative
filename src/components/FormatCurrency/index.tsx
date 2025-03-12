function formatCurrency(value: number | string) {
  // Convert the value to a string if it's a number
  let stringValue = value.toString();

  // Replace the dot with a comma
  stringValue = stringValue.replace(".", ",");

  // Add the currency symbol (R$)
  return `R$ ${stringValue}`;
}

export default formatCurrency;
