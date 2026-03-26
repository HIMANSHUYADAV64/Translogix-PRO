
import { loadRazorpayScript } from "../utils/loadRazorpay";
import { auth } from "../services/firebase";

export const startCheckout = async ({
    backendCreateUrl,
    verifyUrl,
    amount,
    planId,
    billingCycle,
    userEmail,
    userId,
}: any) => {

    const user = auth.currentUser;
    if (!user) throw new Error("Authentication required");
    const token = await user.getIdToken();

    // STEP 1: Load Razorpay JS
    const loaded = await loadRazorpayScript();
    if (!loaded) throw new Error("Razorpay SDK failed to load");

    // STEP 2: Create Order
    let res;
    try {
        res = await fetch(backendCreateUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ amount, userId, planId, billingCycle }),
        });
    } catch (fetchErr: any) {
        throw new Error("Network error: Cannot reach the backend server to create an order. Please ensure your PC backend is running and the phone is on the same Wi-Fi.");
    }

    const data = await res.json();
    if (!res.ok || !data.order) {
        throw new Error(data.error || "Order creation failed on backend");
    }

    const { order, txId, keyId } = data;

    // STEP 3: Razorpay Options
    const options = {
        key: keyId,
        amount: order.amount,
        currency: "INR",
        name: "TransLogix Pro",
        description: `Subscription: ${planId}`,
        order_id: order.id,
        prefill: { email: userEmail },

        handler: async function (response: any) {
            const verifyRes = await fetch(verifyUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_order_id: response.razorpay_order_id,
                    razorpay_signature: response.razorpay_signature,
                    txId,
                    planId,
                    billingCycle
                }),
            });

            const verifyData = await verifyRes.json();
            if (!verifyData.valid) {
                throw new Error(verifyData.error || "Payment verification failed");
            }
            alert("Payment successful! Reloading...");
            window.location.reload();
        },
    };

    // STEP 4: OPEN CHECKOUT
    const rzp = new (window as any).Razorpay(options);
    rzp.open();
};
