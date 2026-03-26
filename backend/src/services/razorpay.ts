import Razorpay from 'razorpay';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

export const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || '',
    key_secret: process.env.RAZORPAY_KEY_SECRET || '',
});

export const verifyWebhookSignature = (
    payload: string,
    signature: string,
    secret: string
): boolean => {
    const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(payload)
        .digest('hex');
    return expectedSignature === signature;
};

export const createOrder = async (amount: number, currency = 'INR') => {
    try {
        const order = await razorpay.orders.create({
            amount: amount * 100, // Convert to paise
            currency,
            receipt: `receipt_${Date.now()}`,
        });
        return order;
    } catch (error) {
        console.error('Razorpay order creation error:', error);
        throw error;
    }
};

export const createSubscription = async (planId: string, _customerId: string) => {
    try {
        const subscription = await razorpay.subscriptions.create({
            plan_id: planId,
            customer_notify: 1,
            total_count: 12, // 12 billing cycles for monthly plans
        });
        return subscription;
    } catch (error) {
        console.error('Razorpay subscription creation error:', error);
        throw error;
    }
};
