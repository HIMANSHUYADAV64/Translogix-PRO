// Platform-aware Google Sign-In helper
// Uses native Google Sign-In on Capacitor (Android/iOS), falls back to Firebase popup on web

import { Capacitor } from '@capacitor/core';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { GoogleAuthProvider, signInWithCredential, signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from './firebase';

/**
 * Initialize Google Auth plugin (call once on app startup)
 */
export const initGoogleAuth = () => {
    if (Capacitor.isNativePlatform()) {
        GoogleAuth.initialize({
            clientId: 'YOUR_GOOGLE_WEB_CLIENT_ID.apps.googleusercontent.com', // TODO: Replace with your Web Client ID from Firebase Console
            scopes: ['profile', 'email'],
            grantOfflineAccess: true,
        });
    }
};

/**
 * Sign in with Google - platform aware
 * Returns the Firebase UserCredential
 */
export const googleSignIn = async () => {
    if (Capacitor.isNativePlatform()) {
        // Native: Use Capacitor Google Auth plugin
        const googleUser = await GoogleAuth.signIn();
        const idToken = googleUser.authentication.idToken;
        const credential = GoogleAuthProvider.credential(idToken);
        return await signInWithCredential(auth, credential);
    } else {
        // Web: Use Firebase popup (works fine in browser)
        return await signInWithPopup(auth, googleProvider);
    }
};
