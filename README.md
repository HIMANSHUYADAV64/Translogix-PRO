# TransLogix Fleet Management SaaS

A production-ready Fleet Management SaaS application built with React, Node.js, Firebase, and Supabase.

## 🚀 Features

- **User Authentication**: Email/Password and Google Sign-In via Firebase
- **Subscription Management**: Free, Pro, and Enterprise plans with Razorpay integration
- **Vehicle Management**: Track vehicles with documents (RC, Insurance, Pollution)
- **Driver Management**: Assign drivers to vehicles with license tracking
- **Maintenance Tracking**: Service history and due date reminders
- **Tyre Management**: Monitor tyre lifecycle and replacements
- **Trip Logging**: Track trips with distance and driver assignment
- **Payment Tracking**: RPS numbers, TDS, and invoice management
- **File Storage**: Supabase storage with automatic image compression
- **Email Notifications**: Automated reminders for subscriptions, maintenance, and insurance
- **Mobile Ready**: Capacitor integration for Android APK build

## 📁 Project Structure

```
fleet-management-app/
├── backend/          # Node.js + Express API
│   ├── src/
│   │   ├── routes/   # API endpoints
│   │   ├── middleware/
│   │   ├── services/
│   │   ├── jobs/     # Cron jobs
│   │   └── server.ts
│   └── package.json
│
└── frontend/         # React + Vite + Capacitor
    ├── src/
    │   ├── components/
    │   ├── pages/
    │   ├── contexts/
    │   ├── services/
    │   └── types/
    └── package.json
```

## 🛠️ Tech Stack

### Frontend
- React 18 + TypeScript
- Vite
- Tailwind CSS
- Firebase Authentication & Firestore
- Supabase Storage
- Capacitor (Android)
- Axios
- React Router

### Backend
- Node.js + Express
- TypeScript
- Firebase Admin SDK
- Razorpay
- Nodemailer
- node-cron

## 📋 Prerequisites

- Node.js 18+ and npm
- Firebase project
- Supabase project
- Razorpay account
- Email service (Gmail recommended)

## ⚙️ Setup Instructions

### 1. Backend Setup

```bash
cd backend
npm install
```

Create `.env` file (copy from `.env.example`):

```env
PORT=5000
FRONTEND_URL=http://localhost:5173

# Firebase Admin SDK
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-client-email

# Razorpay
RAZORPAY_KEY_ID=your-key-id
RAZORPAY_KEY_SECRET=your-key-secret
RAZORPAY_WEBHOOK_SECRET=your-webhook-secret

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=TransLogix Fleet <noreply@translogix.com>
```

Run the backend:

```bash
npm run dev
```

### 2. Frontend Setup

```bash
cd frontend
npm install
```

Create `.env` file (copy from `.env.example`):

```env
# Firebase
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id

# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Backend API
VITE_API_URL=http://localhost:5000

# Razorpay
VITE_RAZORPAY_KEY_ID=your-key-id
```

Run the frontend:

```bash
npm run dev
```

### 3. Firebase Configuration

1. Create a Firebase project at https://console.firebase.google.com
2. Enable Authentication (Email/Password and Google)
3. Create a Firestore database
4. Deploy Firestore security rules:

```bash
firebase deploy --only firestore:rules
```

5. Download service account key for backend

### 4. Supabase Configuration

1. Create a Supabase project at https://supabase.com
2. Create a storage bucket named `uploads`
3. Run the SQL policies from `supabase-policies.sql`

### 5. Razorpay Configuration

1. Create account at https://razorpay.com
2. Create subscription plans (Free, Pro, Enterprise)
3. Set up webhook endpoint: `https://your-backend-url/api/subscriptions/webhook`

## 📱 Android Build

```bash
cd frontend
npm run build
npx cap add android
npx cap sync
npx cap open android
```

Build APK in Android Studio.

## 🔐 Security

- Firestore rules enforce userId-based access
- Supabase policies restrict folder access by userId
- Backend validates all requests with Firebase tokens
- Subscription limits enforced on both frontend and backend
- No API keys in frontend bundle

## 📊 Subscription Plans

| Feature | Free | Pro | Enterprise |
|---------|------|-----|------------|
| Vehicles | 3 | 25 | Unlimited |
| Drivers | 5 | Unlimited | Unlimited |
| Maintenance | 5 | Unlimited | Unlimited |
| Trips | 5 | Unlimited | Unlimited |
| Payments | 5 | Unlimited | Unlimited |
| Tyres | 5 | Unlimited | Unlimited |

## 📧 Email Notifications

Automated emails for:
- Subscription expiry (7 days before)
- Maintenance due (3 days before)
- Insurance expiry (30 days before)
- Payment confirmations

## 🚀 Deployment

### Backend
- Deploy to Railway, Render, or DigitalOcean
- Set environment variables
- Ensure cron jobs are enabled

### Frontend
- Build: `npm run build`
- Deploy to Vercel, Netlify, or Firebase Hosting
- Update CORS settings in backend

## 📝 License

MIT

## 🤝 Support

For issues or questions, please open an issue on GitHub.
