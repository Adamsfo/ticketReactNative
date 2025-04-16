import { useEffect } from "react";
import { Platform, View } from "react-native";

export default function DeviceIdWeb({
  setDeviceId,
}: {
  setDeviceId: (id: string) => void;
}) {
  useEffect(() => {
    if (Platform.OS === "web") {
      // 1. Cria o script do Mercado Pago
      const script = document.createElement("script");
      script.src = "https://www.mercadopago.com/v2/security.js";
      script.setAttribute("view", "checkout");
      script.setAttribute("output", "deviceId");
      script.async = true;
      document.body.appendChild(script);

      // 2. Aguarda o ID ser gerado
      const interval = setInterval(() => {
        const deviceId = (window as any).MP_DEVICE_SESSION_ID;
        if (deviceId) {
          setDeviceId(deviceId);
          clearInterval(interval);
        }
      }, 500);

      // 3. Cleanup
      return () => {
        clearInterval(interval);
        document.body.removeChild(script);
      };
    }
  }, []);

  return <View style={{ height: 0, width: 0 }} />;
}
