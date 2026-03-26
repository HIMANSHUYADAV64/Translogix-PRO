import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

export const sendEmail = async (
  to: string,
  subject: string,
  html: string
): Promise<void> => {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html,
    });
    console.log(`Email sent to ${to}: ${subject}`);
  } catch (error) {
    console.error('Email sending error:', error);
    throw error;
  }
};

export const sendSubscriptionReminder = async (
  email: string,
  name: string,
  daysLeft: number
): Promise<void> => {
  const subject = `Your TransLogix subscription expires in ${daysLeft} days`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Subscription Expiry Reminder</h2>
      <p>Hi ${name},</p>
      <p>Your TransLogix Fleet subscription will expire in <strong>${daysLeft} days</strong>.</p>
      <p>To continue enjoying uninterrupted service, please renew your subscription.</p>
      <a href="${process.env.FRONTEND_URL}/settings" style="display: inline-block; padding: 10px 20px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px; margin-top: 10px;">Renew Now</a>
      <p>Thank you for using TransLogix Fleet!</p>
    </div>
  `;
  await sendEmail(email, subject, html);
};

export const sendMaintenanceDueAlert = async (
  email: string,
  vehicleNumber: string,
  dueDate: string
): Promise<void> => {
  const subject = `Maintenance due for vehicle ${vehicleNumber}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Maintenance Due Alert</h2>
      <p>This is a reminder that maintenance is due for your vehicle <strong>${vehicleNumber}</strong>.</p>
      <p>Due Date: <strong>${dueDate}</strong></p>
      <p>Please schedule the service to keep your vehicle in optimal condition.</p>
      <a href="${process.env.FRONTEND_URL}/maintenance" style="display: inline-block; padding: 10px 20px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px; margin-top: 10px;">View Details</a>
    </div>
  `;
  await sendEmail(email, subject, html);
};

export const sendInsuranceExpiryAlert = async (
  email: string,
  vehicleNumber: string,
  expiryDate: string
): Promise<void> => {
  const subject = `Insurance expiring soon for vehicle ${vehicleNumber}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Insurance Expiry Alert</h2>
      <p>The insurance for your vehicle <strong>${vehicleNumber}</strong> is expiring soon.</p>
      <p>Expiry Date: <strong>${expiryDate}</strong></p>
      <p>Please renew your insurance to avoid any legal issues.</p>
      <a href="${process.env.FRONTEND_URL}/vehicles" style="display: inline-block; padding: 10px 20px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px; margin-top: 10px;">View Vehicle</a>
    </div>
  `;
  await sendEmail(email, subject, html);
};

export const sendPaymentInvoice = async (
  email: string,
  name: string,
  amount: number,
  plan: string
): Promise<void> => {
  const subject = 'Payment Successful - TransLogix Fleet';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Payment Confirmation</h2>
      <p>Hi ${name},</p>
      <p>Thank you for your payment!</p>
      <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Plan:</strong> ${plan}</p>
        <p><strong>Amount:</strong> ₹${amount}</p>
        <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
      </div>
      <p>Your subscription has been activated successfully.</p>
      <a href="${process.env.FRONTEND_URL}/settings" style="display: inline-block; padding: 10px 20px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px; margin-top: 10px;">View Subscription</a>
    </div>
  `;
  await sendEmail(email, subject, html);
};

export const sendOTPEmail = async (
  email: string,
  otp: string,
  purpose: 'signup' | 'reset'
): Promise<void> => {
  const actionText = purpose === 'signup' ? 'creating your account' : 'resetting your password';
  const subject = `Your TransLogix Verification Code: ${otp}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px;">
      <h2 style="color: #111827; margin-bottom: 16px;">Verification Code</h2>
      <p style="color: #4b5563; font-size: 16px; line-height: 24px;">
        You are ${actionText}. Use the following code to verify your email address:
      </p>
      <div style="background-color: #f9fafb; padding: 24px; border-radius: 8px; text-align: center; margin: 24px 0;">
        <span style="font-family: monospace; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #111827;">${otp}</span>
      </div>
      <p style="color: #6b7280; font-size: 14px;">
        This code will expire in 10 minutes. If you didn't request this, please ignore this email.
      </p>
      <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
      <p style="color: #9ca3af; font-size: 12px; text-align: center;">
        © ${new Date().getFullYear()} TransLogix Fleet Management. All rights reserved.
      </p>
    </div>
  `;
  await sendEmail(email, subject, html);
};
