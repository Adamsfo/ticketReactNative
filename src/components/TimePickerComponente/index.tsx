import React, { useMemo, useState } from "react";
import {
  View,
  Button,
  Platform,
  StyleSheet,
  TextInput,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import DatePicker, { registerLocale } from "react-datepicker";
import { Picker } from "@react-native-picker/picker";
import "react-datepicker/dist/react-datepicker.css";
import "./TimePickerComponente.css";
import { pt } from "date-fns/locale/pt";
import {
  formatarHoraInput,
  interpretarHoraInput,
} from "./horarioPersonalizado";

registerLocale("pt", pt);

interface TimePickerComponenteProps {
  value: Date;
  onChange: (date: Date) => void;
  minTime?: Date;
  maxTime?: Date;
  /** Qualquer minuto (00–59); na web permite digitar HH:mm. */
  horarioPersonalizado?: boolean;
  /** Intervalo dos slots fixos quando min/max estão definidos (padrão 30). */
  intervaloMinutos?: number;
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
  if (inicio > fim) {
    return [];
  }

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

  if (minimo > maximo) {
    return aplicarHorario(value, Math.floor(maximo / 60), maximo % 60);
  }

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
  horarioPersonalizado = false,
  intervaloMinutos,
}: TimePickerComponenteProps) => {
  const [show, setShow] = useState(false);
  const [textoHoraWeb, setTextoHoraWeb] = useState(() => formatarHoraInput(value));
  const [textoHoraInvalido, setTextoHoraInvalido] = useState(false);
  const hasLimits = Boolean(minTime && maxTime);
  const intervaloSlots = horarioPersonalizado
    ? 1
    : (intervaloMinutos ?? 30);
  const usarSlotsFixos = hasLimits && intervaloSlots > 1;

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
    if (!minTime || !maxTime || !usarSlotsFixos) {
      return [];
    }
    return gerarHorariosPermitidos(minTime, maxTime, intervaloSlots);
  }, [minTime, maxTime, usarSlotsFixos, intervaloSlots]);

  const semHorarios = usarSlotsFixos && horariosPermitidos.length === 0;

  React.useEffect(() => {
    if (Platform.OS !== "web" || !horarioPersonalizado) return;
    setTextoHoraWeb(formatarHoraInput(value));
    setTextoHoraInvalido(false);
  }, [value, horarioPersonalizado]);

  const handleDateChange = (event: any, selectedDate?: Date) => {
    const currentDate = clampTime(selectedDate || value, minTime, maxTime);
    setShow(false);
    onChange(currentDate);
  };

  const showpicker = () => {
    setShow(true);
  };

  const selectedMinutes = minutosDesdeMeiaNoite(
    clampTime(value, minTime, maxTime),
  );

  const commitTextoHoraWeb = () => {
    const parsed = interpretarHoraInput(textoHoraWeb, value);
    if (!parsed.ok) {
      setTextoHoraInvalido(true);
      return;
    }
    setTextoHoraInvalido(false);
    onChange(clampTime(parsed.date, minTime, maxTime));
  };

  return (
    <View style={styles.container}>
      {Platform.OS === "web" && horarioPersonalizado ? (
        <View style={styles.webContainer}>
          <TextInput
            style={[
              styles.horaManual,
              textoHoraInvalido && styles.horaManualInvalida,
            ]}
            value={textoHoraWeb}
            onChangeText={(t) => {
              setTextoHoraWeb(t);
              setTextoHoraInvalido(false);
            }}
            onBlur={commitTextoHoraWeb}
            onSubmitEditing={commitTextoHoraWeb}
            placeholder="HH:mm"
            placeholderTextColor="#999"
            keyboardType="numbers-and-punctuation"
            maxLength={5}
            accessibilityLabel="Horário"
          />
        </View>
      ) : Platform.OS === "web" ? (
        <View style={styles.webContainer}>
          <DatePicker
            selected={
              semHorarios ? value : clampTime(value, minTime, maxTime)
            }
            onChange={(date) => {
              if (semHorarios) return;
              onChange(clampTime(date || value, minTime, maxTime));
            }}
            dateFormat="p"
            timeFormat="HH:mm"
            showTimeSelect
            showTimeSelectOnly
            timeCaption="Hora"
            portalId="root-portal"
            popperPlacement="bottom-start"
            locale="pt"
            className="custom-timepicker"
            minTime={semHorarios ? maxTime : minTime}
            maxTime={maxTime}
            timeIntervals={horarioPersonalizado ? 1 : intervaloSlots}
            includeTimes={
              usarSlotsFixos && !semHorarios ? horariosPermitidos : undefined
            }
            disabled={semHorarios}
          />
        </View>
      ) : hasLimits && usarSlotsFixos ? (
        <Picker
          enabled={!semHorarios}
          selectedValue={
            semHorarios
              ? -1
              : horariosPermitidos.some(
                    (s) => minutosDesdeMeiaNoite(s) === selectedMinutes,
                  )
                ? selectedMinutes
                : minutosDesdeMeiaNoite(horariosPermitidos[0])
          }
          onValueChange={(itemValue) => {
            if (semHorarios || Number(itemValue) < 0) return;
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
          {semHorarios ? (
            <Picker.Item label="Sem horários" value={-1} />
          ) : (
            horariosPermitidos.map((slot) => {
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
            })
          )}
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
  horaManual: {
    fontSize: 16,
    paddingVertical: 10,
    paddingHorizontal: 8,
    height: 45,
    width: "100%",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#ccc",
    textAlign: "center",
    color: "#333",
  },
  horaManualInvalida: {
    borderColor: "#c62828",
  },
});

export default TimePickerComponente;
