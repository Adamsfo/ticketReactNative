// src/GoogleAnalytics.tsx
import { useEffect } from "react";

const GoogleAnalytics = () => {
  useEffect(() => {
    // carrega o script do gtag
    const script1 = document.createElement("script");
    script1.async = true;
    script1.src = "https://www.googletagmanager.com/gtag/js?id=G-ZE9CB4KB8L";
    document.head.appendChild(script1);

    // inicializa o GA
    const script2 = document.createElement("script");
    script2.innerHTML = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'G-ZE9CB4KB8L');
    `;
    document.head.appendChild(script2);
  }, []);

  return null;
};

export default GoogleAnalytics;
