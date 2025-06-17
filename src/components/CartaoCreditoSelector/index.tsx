import colors from "@/src/constants/colors";
import { Picker } from "@react-native-picker/picker";
import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TextInput, // ou @react-native-picker/picker se for novo projeto
} from "react-native";
import PaymentPix from "../PaymentPix";
import { Transacao } from "@/src/types/geral";
import { api } from "@/src/lib/api";

type Props = {
  savedPaymentData: any;
  installmentOptions: any;
  setCardToken: (token: string) => void;
  setInstallments: (qtd: number) => void;
  buscarParcelas: (bin: string, paymentMethodId: string) => void;
  setVisiblePagamento: (visible: boolean) => void;
  visiblePagamento: boolean;
  registroTransacao: Transacao;
  email: string;
  setPaymentStatusId: (id: string) => void;
  setCpfCardSalvo: (cpf: string) => void;
  enviarPagamentoCartaoSalvo: () => void;
  loading: boolean;
  setPaymentMethodCardSaved?: (paymentMethod: string) => void; // Adicionado para definir o método de pagamento do cartão salvo
  setCVV: (cvv: string) => void; // Adicionado para definir o CVV do cartão salvo
  CVV: string; // Adicionado para receber o CVV do cartão salvo
  error: string; // Adicionado para receber erros
  installments: number; // Adicionado para receber a quantidade de parcelas selecionadas
};

export default function CartaoCreditoSelector({
  savedPaymentData,
  installmentOptions,
  setCardToken,
  setInstallments,
  buscarParcelas,
  setVisiblePagamento,
  visiblePagamento,
  registroTransacao,
  email,
  setPaymentStatusId,
  setCpfCardSalvo,
  enviarPagamentoCartaoSalvo,
  loading,
  setPaymentMethodCardSaved, // Adicionado para definir o método de pagamento do cartão salvo
  setCVV, // Adicionado para definir o CVV do cartão salvo
  CVV, // Adicionado para receber o CVV do cartão salvo
  error, // Adicionado para receber erros
  installments, // Adicionado para receber a quantidade de parcelas selecionadas
}: Props) {
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [pagamentoPix, setPagamentoPix] = useState(false); // Estado para armazenar o ID do pagamento

  const renderCard = ({ item }: any) => {
    const isSelected = item.id === selectedCardId;
    return (
      <TouchableOpacity
        style={[styles.card, isSelected && styles.cardSelected]}
        onPress={() => {
          setCardToken(item.id);
          setSelectedCardId(item.id);
          setCpfCardSalvo(item.cardholder.identification.number);
          buscarParcelas(item.first_six_digits, item.payment_method.id);
          setPaymentMethodCardSaved &&
            setPaymentMethodCardSaved(item.payment_method.id);
          setCVV(""); // Limpa o CVV ao selecionar um cartão
          setInstallments(0); // Reseta a quantidade de parcelas ao selecionar um cartão
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
      <View style={{ flexDirection: "row" }}>
        <TouchableOpacity
          style={[
            styles.card,
            !visiblePagamento && !pagamentoPix && styles.cardSelected,
          ]}
          onPress={() => {
            setVisiblePagamento(false);
            setPagamentoPix(false);
          }}
        >
          <View style={styles.cardHeader}>
            <Text
              style={[
                styles.cardBrand,
                !visiblePagamento && !pagamentoPix && styles.cardBrandSelected,
              ]}
            >
              Cartão Salvo
            </Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.card,
            visiblePagamento && !pagamentoPix && styles.cardSelected,
          ]}
          onPress={() => {
            setVisiblePagamento(true);
            setPagamentoPix(false);
          }}
        >
          <View style={styles.cardHeader}>
            <Text
              style={[
                styles.cardBrand,
                visiblePagamento && !pagamentoPix && styles.cardBrandSelected,
              ]}
            >
              Novo Cartão
            </Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.card, pagamentoPix && styles.cardSelected]}
          onPress={() => {
            setPagamentoPix(true);
            setVisiblePagamento(false);
          }}
        >
          <View style={styles.cardHeader}>
            <Text
              style={[
                styles.cardBrand,
                pagamentoPix && styles.cardBrandSelected,
              ]}
            >
              {"   Pix   "}
            </Text>
          </View>
        </TouchableOpacity>
      </View>
      {!pagamentoPix && savedPaymentData?.cards?.length > 0 && (
        <>
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

      {!pagamentoPix &&
        installmentOptions &&
        installmentOptions.length > 0 &&
        !visiblePagamento && (
          <>
            <Text style={styles.sectionTitle}>Parcelamento</Text>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={installments}
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

            <View style={{ marginTop: 10 }}>
              {/* <Text style={styles.sectionTitle}>CVV (Código de Segurança)</Text> */}
              <Text style={{ color: "#666" }}>
                Digite o CVV do cartão selecionado
              </Text>
              <TextInput
                style={styles.input}
                // placeholder="cvv..."
                keyboardType="default"
                value={CVV}
                onChangeText={(text) => setCVV(text)}
              ></TextInput>
            </View>

            {error && <Text style={styles.labelError}>{error}</Text>}

            <TouchableOpacity
              style={[
                styles.button,
                styles.buttonSave,
                { marginTop: 20 },
                !CVV && { backgroundColor: "#ccc" }, // botão desabilitado visualmente
              ]}
              onPress={() => enviarPagamentoCartaoSalvo()}
            >
              <View style={styles.buttonContent}>
                {loading && (
                  <ActivityIndicator
                    size="small"
                    color={colors.laranjado}
                    style={{ marginRight: 10 }}
                  />
                )}
                <Text style={styles.buttonText}>Pagar</Text>
              </View>
            </TouchableOpacity>
          </>
        )}
      {!visiblePagamento && pagamentoPix && registroTransacao && (
        <PaymentPix
          valor={registroTransacao.valorTotal}
          email={email}
          idTransacao={registroTransacao.id} // Replace 0 with an appropriate fallback value
          setPaymentStatusId={setPaymentStatusId} // Passar a função para definir o ID do pagamento
        ></PaymentPix>
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
  button: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    marginLeft: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonSave: {
    backgroundColor: colors.azul,
  },
  buttonText: {
    color: "#FFF",
    fontWeight: "bold",
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: colors.gray,
    borderRadius: 8,
    marginBottom: 18,
    paddingHorizontal: 8,
    paddingTop: 14,
    paddingBottom: 14,
    fontSize: 16,
  },
  labelError: {
    color: colors.red,
    marginTop: -18,
    marginBottom: 18,
  },
});
