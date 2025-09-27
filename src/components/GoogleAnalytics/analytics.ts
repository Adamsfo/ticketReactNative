// utils/analytics.ts
export const logPageView = (screenName: string) => {
    if (typeof window !== "undefined" && (window as any).gtag) {
        (window as any).gtag("config", "G-ZE9CB4KB8L", {
            page_path: "/" + screenName, // pode personalizar aqui
        });
        console.log("GA4 pageview:", screenName);
    }
};
