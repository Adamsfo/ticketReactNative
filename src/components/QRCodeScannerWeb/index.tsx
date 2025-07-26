// QRCodeScannerWeb.tsx
import React, { useEffect } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";

type Props = {
  onScanSuccess: (decodedText: string) => void;
};

export default function QRCodeScannerWeb({ onScanSuccess }: Props) {
  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "reader",
      { fps: 10, qrbox: 250 },
      false
    );

    scanner.render(
      (decodedText) => {
        onScanSuccess(decodedText);
        scanner.clear(); // Stop scanning after successful read
      },
      (error) => {
        console.warn("QR scan error:", error);
      }
    );

    return () => {
      scanner.clear().catch((e) => console.error("Clear scanner error", e));
    };
  }, []);

  return <div id="reader" style={{ width: "100%" }} />;
}
