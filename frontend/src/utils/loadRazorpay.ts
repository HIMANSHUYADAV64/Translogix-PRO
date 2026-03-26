
export const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
        if ((window as any).Razorpay) {
            resolve(true);
            return;
        }
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.id = "razorpay-sdk";
        script.onload = () => {
            resolve(true);
        };
        script.onerror = () => {
            console.error("Razorpay SDK could not be loaded. Please check your internet connection or disable ad-blockers.");
            resolve(false);
        };
        document.body.appendChild(script);
    });
};
