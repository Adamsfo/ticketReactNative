import React, { useState } from "react";
import { View, Button, Platform, Text, StyleSheet } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import DatePicker, { registerLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "./TimePickerComponente.css"; // Importa o arquivo CSS personalizado
import { pt } from "date-fns/locale/pt";

registerLocale("pt", pt); // Registra a localidade em português

interface DatePickerComponenteProps {
  value: Date;
  onChange: (date: Date) => void;
}

const TimePickerComponente = ({
  value,
  onChange,
}: DatePickerComponenteProps) => {
  // const [date, setDate] = useState(new Date());
  const [show, setShow] = useState(false);

  const handleDateChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || value;
    setShow(false);
    onChange(currentDate);
  };

  const showpicker = () => {
    setShow(true);
  };

  return (
    <View style={styles.container}>
      {Platform.OS === "web" ? (
        <View style={styles.webContainer}>
          <DatePicker
            selected={value}
            onChange={(date) => onChange(date || new Date())}
            dateFormat="p"
            timeFormat="HH:mm"
            showTimeSelect
            showTimeSelectOnly
            timeCaption="Hora"
            portalId="root-portal"
            popperPlacement="bottom-start"
            locale="pt"
          />
        </View>
      ) : (
        <View>
          {Platform.OS === "android" && (
            <View>
              <Button
                onPress={showpicker}
                title={value.toLocaleTimeString("pt-BR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              />
            </View>
          )}
          {(show || Platform.OS === "ios") && (
            <DateTimePicker
              testID="dateTimePicker"
              value={value}
              mode="time"
              is24Hour={true}
              display="default"
              onChange={handleDateChange}
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
    zIndex: 1000, // Adiciona zIndex para garantir que o datepicker apareça corretamente
  },
  text: {
    marginTop: 20,
    fontSize: 18,
    textAlign: "center",
  },
});

export default TimePickerComponente;
