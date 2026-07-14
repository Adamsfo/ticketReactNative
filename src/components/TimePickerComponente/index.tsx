import React, { useMemo, useState } from "react";
import { View, Button, Platform, StyleSheet } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import DatePicker, { registerLocale } from "react-datepicker";
import { Picker } from "@react-native-picker/picker";
import "react-datepicker/dist/react-datepicker.css";
import "./TimePickerComponente.css";
import { pt } from "date-fns/locale/pt";

registerLocale("pt", pt);

interface TimePickerComponenteProps {
  value: Date;
  onChange: (date: Date) => void;
  minTime?: Date;
  maxTime?: Date;
}

function minutosDesdeMeiaNoite(time: Date): number {
  return time.getHours() * 60 + time.getMinutes();
}

function aplicarHorario(base: Date, hours: number, minutes: number): Date {
  const d = new Date(base);
  d.setHours(hours, minutes, 0, 0);
  return d;
}

function gerarHorariosPermitidos(
  minTime: Date,
  maxTime: Date,
  intervaloMinutos = 30,
): Date[] {
  const inicio = minutosDesdeMeiaNoite(minTime);
  const fim = minutosDesdeMeiaNoite(maxTime);
  const slots: Date[] = [];

  for (let minutos = inicio; minutos <= fim; minutos += intervaloMinutos) {
    slots.push(
      aplicarHorario(
        minTime,
        Math.floor(minutos / 60),
        minutos % 60,
      ),
    );
  }

  return slots;
}

function clampTime(value: Date, minTime?: Date, maxTime?: Date): Date {
  if (!minTime && !maxTime) {
    return value;
  }

  const atual = minutosDesdeMeiaNoite(value);
  const minimo = minTime ? minutosDesdeMeiaNoite(minTime) : 0;
  const maximo = maxTime ? minutosDesdeMeiaNoite(maxTime) : 24 * 60 - 1;
  const limitado = Math.max(minimo, Math.min(maximo, atual));

  return aplicarHorario(
    value,
    Math.floor(limitado / 60),
    limitado % 60,
  );
}

const TimePickerComponente = ({
  value,
  onChange,
  minTime,
  maxTime,
}: TimePickerComponenteProps) => {
  const [show, setShow] = useState(false);
  const hasLimits = Boolean(minTime && maxTime);

  const minimumDate = useMemo(() => {
    if (!minTime) return undefined;
    return aplicarHorario(
      value,
      minTime.getHours(),
      minTime.getMinutes(),
    );
  }, [minTime, value]);

  const maximumDate = useMemo(() => {
    if (!maxTime) return undefined;
    return aplicarHorario(
      value,
      maxTime.getHours(),
      maxTime.getMinutes(),
    );
  }, [maxTime, value]);

  const horariosPermitidos = useMemo(() => {
    if (!minTime || !maxTime) {
      return [];
    }
    return gerarHorariosPermitidos(minTime, maxTime);
  }, [minTime, maxTime]);

  const handleDateChange = (event: any, selectedDate?: Date) => {
    const currentDate = clampTime(selectedDate || value, minTime, maxTime);
    setShow(false);
    onChange(currentDate);
  };

  const showpicker = () => {
    setShow(true);
  };

  const selectedMinutes = minutosDesdeMeiaNoite(value);

  return (
    <View style={styles.container}>
      {Platform.OS === "web" ? (
        <View style={styles.webContainer}>
          <DatePicker
            selected={clampTime(value, minTime, maxTime)}
            onChange={(date) =>
              onChange(clampTime(date || value, minTime, maxTime))
            }
            dateFormat="p"
            timeFormat="HH:mm"
            showTimeSelect
            showTimeSelectOnly
            timeCaption="Hora"
            portalId="root-portal"
            popperPlacement="bottom-start"
            locale="pt"
            className="custom-timepicker"
            minTime={minTime}
            maxTime={maxTime}
            includeTimes={hasLimits ? horariosPermitidos : undefined}
          />
        </View>
      ) : hasLimits ? (
        <Picker
          selectedValue={selectedMinutes}
          onValueChange={(itemValue) => {
            onChange(
              aplicarHorario(
                value,
                Math.floor(Number(itemValue) / 60),
                Number(itemValue) % 60,
              ),
            );
          }}
          style={styles.nativePicker}
        >
          {horariosPermitidos.map((slot) => {
            const minutos = minutosDesdeMeiaNoite(slot);
            return (
              <Picker.Item
                key={minutos}
                label={slot.toLocaleTimeString("pt-BR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
                value={minutos}
              />
            );
          })}
        </Picker>
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
              value={clampTime(value, minTime, maxTime)}
              mode="time"
              is24Hour={true}
              display="default"
              minimumDate={minimumDate}
              maximumDate={maximumDate}
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
    paddingLeft: 0,
    justifyContent: "center",
  },
  webContainer: {
    marginBottom: 16,
    zIndex: 1000,
    width: "100%",
  },
  nativePicker: {
    width: "100%",
    height: Platform.OS === "ios" ? 180 : 48,
  },
});

export default TimePickerComponente;
