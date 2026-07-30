import React, { useEffect, useState } from "react";
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

  useEffect(() => {
    let alive = true;
    const load = () => {
      void getSyncSummary()
        .then((resp) => {
          if (alive && resp.success && resp.data) {
            setErros(Number(resp.data.erros || 0));
          }
        })
        .catch(() => undefined);
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
