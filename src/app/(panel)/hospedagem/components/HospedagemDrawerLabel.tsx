import React, { useEffect, useRef, useState } from "react";
import { Text } from "react-native";
import { getSyncSummary } from "@/src/lib/integrationsAdmin";

/**
 * Label do menu Hospedagem com badge de erros de sync (polling leve).
 */
export default function HospedagemDrawerLabel({
  color,
}: {
  color?: string;
  focused?: boolean;
}) {
  const [erros, setErros] = useState(0);
  const fetchInFlightRef = useRef(false);

  useEffect(() => {
    let alive = true;
    const load = () => {
      if (fetchInFlightRef.current) {
        return;
      }
      fetchInFlightRef.current = true;
      void getSyncSummary()
        .then((resp) => {
          if (alive && resp.success && resp.data) {
            setErros(
              Number(
                resp.data.errosTotal ??
                  Number(resp.data.erros || 0) +
                    Number(resp.data.errosSemReserva || 0),
              ),
            );
          }
        })
        .catch(() => undefined)
        .finally(() => {
          fetchInFlightRef.current = false;
        });
    };
    load();
    const t = setInterval(load, 30_000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);

  return (
    <Text style={{ color, fontSize: 16, fontWeight: "600" }}>
      🏨 Hospedagem{erros > 0 ? `  🔴 ${erros}` : ""}
    </Text>
  );
}
