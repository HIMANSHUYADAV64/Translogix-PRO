# TransLogix Frontend

React frontend for TransLogix Fleet Management SaaS.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file from `.env.example` and fill in your credentials

3. Run development server:
```bash
npm run dev
```

4. Build for production:
```bash
npm run build
```

## Capacitor Android Build

1. Build the web app:
```bash
npm run build
```

2. Add Android platform (first time only):
```bash
npx cap add android
```

3. Sync web assets to Android:
```bash
npx cap sync
```

4. Open in Android Studio:
```bash
npx cap open android
```

5. Build APK in Android Studio:
   - Build > Build Bundle(s) / APK(s) > Build APK(s)

## Environment Variables

See `.env.example` for required environment variables.

## Project Structure

```
src/
├── components/      # Reusable UI components
├── contexts/        # React Context providers
├── pages/           # Page components
│   ├── auth/        # Authentication pages
│   └── ...          # Main app pages
├── services/        # API and external services
├── types/           # TypeScript type definitions
├── App.tsx          # Main app component
└── main.tsx         # Entry point
```

## Features

- Firebase Authentication (Email/Password + Google)
- Firestore for data storage
- Supabase for file storage
- Razorpay payment integration
- Subscription-based access control
- Responsive design with Tailwind CSS
- Android app via Capacitor

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
