import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'com.translogix.fleet',
    appName: 'TransLogix Fleet',
    webDir: 'dist',
    server: {
        androidScheme: 'https',
        allowNavigation: ["*"]
    },
    plugins: {
        SplashScreen: {
            launchShowDuration: 2000,
            backgroundColor: '#4F46E5',
            showSpinner: false,
        },
        GoogleAuth: {
            scopes: ['profile', 'email'],
            serverClientId: 'YOUR_GOOGLE_WEB_CLIENT_ID.apps.googleusercontent.com', // TODO: User needs to replace this
            forceCodeForRefreshToken: true,
        },
    },
};

export default config;
