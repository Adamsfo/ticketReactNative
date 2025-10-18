// utils/analytics.ts
export const logPageView = (screenName: string) => {
    if (typeof window !== "undefined" && (window as any).gtag) {
        (window as any).gtag("config", "G-ZE9CB4KB8L", {
            page_path: "/" + screenName, // pode personalizar aqui
        });
        console.log("GA4 pageview:", screenName);
    }
};


// components/GoogleAnalytics/analytics.ts
export const logEvent = (action: string, params: Record<string, any> = {}) => {
    try {
        if (typeof window !== "undefined" && (window as any).gtag) {
            (window as any).gtag("event", action, params);
        } else {
            console.log("📊 logEvent (debug):", action, params);
        }
    } catch (error) {
        console.error("Erro ao enviar evento GA:", error);
    }
};
