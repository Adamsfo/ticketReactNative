import React, { useState } from "react";
import {
  View,
  Button,
  Platform,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import DatePicker, { registerLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "./DatePickerComponente.css"; // Importa o arquivo CSS personalizado
import { pt } from "date-fns/locale/pt";

registerLocale("pt", pt); // Registra a localidade em português

const DatePickerComponente = () => {
  const [date, setDate] = useState(new Date());
  const [show, setShow] = useState(false);

  const onChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || date;
    setShow(false);
    setDate(currentDate);
  };

  const showpicker = () => {
    setShow(true);
  };

  return (
    <View style={styles.container}>
      {Platform.OS === "web" ? (
        <View style={styles.webContainer}>
          <DatePicker
            selected={date}
            onChange={(date) => setDate(date || new Date())}
            dateFormat="P"
            timeFormat="HH:mm"
            // showTimeSelect
            timeCaption="Hora"
            portalId="root-portal"
            popperPlacement="bottom-start"
            locale="pt"
            className="custom-datepicker"
          />
        </View>
      ) : (
        <View>
          <View>
            <Button
              onPress={showpicker}
              title={date.toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              })}
            />
          </View>
          {show && (
            <DateTimePicker
              testID="dateTimePicker"
              value={date}
              mode="date"
              is24Hour={true}
              display="default"
              onChange={onChange}
            />
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingLeft: 10,
    justifyContent: "center",
  },
  webContainer: {
    marginBottom: 16,
    zIndex: 20000, // Adiciona zIndex para garantir que o datepicker apareça corretamente
  },
  text: {
    marginTop: 20,
    fontSize: 18,
    textAlign: "center",
  },
});

export default DatePickerComponente;
