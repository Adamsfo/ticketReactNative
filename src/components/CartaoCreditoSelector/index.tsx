import colors from "@/src/constants/colors";
import { Picker } from "@react-native-picker/picker";
import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList, // ou @react-native-picker/picker se for novo projeto
} from "react-native";

type Props = {
  savedPaymentData: any;
  installmentOptions: any;
  setCardToken: (token: string) => void;
  setInstallments: (qtd: number) => void;
  buscarParcelas: (bin: string, paymentMethodId: string) => void;
  setVisiblePagamento: (visible: boolean) => void;
  visiblePagamento: boolean;
};

export default function CartaoCreditoSelector({
  savedPaymentData,
  installmentOptions,
  setCardToken,
  setInstallments,
  buscarParcelas,
  setVisiblePagamento,
  visiblePagamento,
}: Props) {
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

  const renderCard = ({ item }: any) => {
    const isSelected = item.id === selectedCardId;
    return (
      <TouchableOpacity
        style={[styles.card, isSelected && styles.cardSelected]}
        onPress={() => {
          setCardToken(item.id);
          setSelectedCardId(item.id);
          buscarParcelas(item.first_six_digits, item.payment_method.id);
        }}
      >
        <View style={styles.cardHeader}>
          <Text
            style={[styles.cardBrand, isSelected && styles.cardBrandSelected]}
          >
            {item.payment_method.name}
          </Text>
          <Text
            style={[styles.cardDigits, isSelected && styles.cardDigitsSelected]}
          >
            •••• {item.last_four_digits}
          </Text>
        </View>
        <Text
          style={[styles.cardFooter, isSelected && styles.cardFooterSelected]}
        >
          Vencimento: {String(item.expiration_month).padStart(2, "0")}/
          {String(item.expiration_year).slice(-2)}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {savedPaymentData?.cards?.length > 0 && (
        <>
          <View style={{ flexDirection: "row" }}>
            <TouchableOpacity
              style={[styles.card, !visiblePagamento && styles.cardSelected]}
              onPress={() => {
                setVisiblePagamento(false);
              }}
            >
              <View style={styles.cardHeader}>
                <Text
                  style={[
                    styles.cardBrand,
                    !visiblePagamento && styles.cardBrandSelected,
                  ]}
                >
                  Cartão Salvo
                </Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.card, visiblePagamento && styles.cardSelected]}
              onPress={() => {
                setVisiblePagamento(true);
              }}
            >
              <View style={styles.cardHeader}>
                <Text
                  style={[
                    styles.cardBrand,
                    visiblePagamento && styles.cardBrandSelected,
                  ]}
                >
                  Novo Cartão
                </Text>
              </View>
            </TouchableOpacity>
          </View>
          {!visiblePagamento && (
            <>
              <Text style={styles.sectionTitle}>Selecione um Cartão Salvo</Text>
              <FlatList
                data={savedPaymentData.cards}
                renderItem={renderCard}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.cardList}
              />
            </>
          )}
        </>
      )}

      {installmentOptions &&
        installmentOptions.length > 0 &&
        !visiblePagamento && (
          <>
            <Text style={styles.sectionTitle}>Parcelamento</Text>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={null}
                onValueChange={(value) => {
                  if (value) setInstallments(Number(value));
                }}
              >
                <Picker.Item label="Selecione uma opção" value={null} />
                {installmentOptions.map((opcao: any) => (
                  <Picker.Item
                    key={opcao.installments}
                    label={`${
                      opcao.installments
                    }x de R$ ${opcao.installment_amount
                      .toFixed(2)
                      .replace(".", ",")} ${
                      opcao.installment_rate > 0 ? "(com juros)" : "(sem juros)"
                    } - Total: R$ ${opcao.total_amount
                      .toFixed(2)
                      .replace(".", ",")}`}
                    value={opcao.installments}
                  />
                ))}
              </Picker>
            </View>
          </>
        )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: colors.branco,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
    color: "#333",
    marginTop: 8,
  },
  cardList: {
    paddingBottom: 12,
  },
  card: {
    backgroundColor: "#f2f2f2",
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    // width: 250,
    elevation: 2,
  },
  cardSelected: {
    backgroundColor: colors.azul,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    color: colors.branco,
  },
  cardBrand: {
    fontWeight: "bold",
    color: "#000",
  },
  cardBrandSelected: {
    fontWeight: "bold",
    color: colors.branco,
  },
  cardDigits: {
    fontWeight: "bold",
    color: "#666",
  },
  cardDigitsSelected: {
    fontWeight: "bold",
    color: colors.branco,
  },
  cardFooter: {
    marginTop: 8,
    fontSize: 12,
    color: "#555",
  },
  cardFooterSelected: {
    marginTop: 8,
    fontSize: 12,
    color: colors.branco,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    overflow: "hidden",
  },
});
