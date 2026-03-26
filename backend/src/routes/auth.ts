import express from 'express';
import { db, auth } from '../services/firebase';
import { sendOTPEmail } from '../services/email';

const router = express.Router();

// Generate 6-digit OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

/**
 * Send OTP to email
 */
router.post('/send-otp', async (req, res) => {
    const { email, purpose } = req.body; // purpose: 'signup' | 'reset'

    if (!email) return res.status(400).json({ error: 'Email is required' });

    try {
        // For password reset, user must exist
        if (purpose === 'reset') {
            try {
                await auth.getUserByEmail(email);
            } catch (error: any) {
                if (error.code === 'auth/user-not-found') {
                    return res.status(404).json({ error: 'No user found with this email' });
                }
                throw error;
            }
        }

        const otp = generateOTP();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        await db.collection('otps').doc(email).set({
            otp,
            expiresAt,
            purpose,
            createdAt: new Date(),
        });

        await sendOTPEmail(email, otp, purpose);
        return res.json({ success: true, message: 'OTP sent successfully' });
    } catch (error: any) {
        console.error('Error sending OTP:', error);
        return res.status(500).json({ error: 'Failed to send OTP' });
    }
});

/**
 * Verify OTP (Step 2)
 */
router.post('/verify-otp', async (req, res) => {
    const { email, otp, purpose } = req.body;

    if (!email || !otp || !purpose) {
        return res.status(400).json({ error: 'Email, OTP, and purpose are required' });
    }

    try {
        const doc = await db.collection('otps').doc(email).get();
        if (!doc.exists) return res.status(400).json({ error: 'No OTP found' });

        const data = doc.data();
        if (!data || data.otp !== otp || data.purpose !== purpose) {
            return res.status(400).json({ error: 'Invalid OTP' });
        }

        if (new Date() > data.expiresAt.toDate()) {
            return res.status(400).json({ error: 'OTP expired' });
        }

        return res.json({ success: true, message: 'OTP verified' });
    } catch (error: any) {
        console.error('Verify OTP error:', error);
        return res.status(500).json({ error: 'Failed to verify OTP' });
    }
});

/**
 * Create user after OTP verification
 */
router.post('/signup', async (req, res) => {
    const { name, email, password, otp } = req.body;

    if (!name || !email || !password || !otp) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    try {
        // 1. Verify OTP
        const doc = await db.collection('otps').doc(email).get();
        if (!doc.exists) return res.status(400).json({ error: 'No OTP found' });

        const data = doc.data();
        if (!data || data.otp !== otp || data.purpose !== 'signup') {
            return res.status(400).json({ error: 'Invalid OTP' });
        }

        if (new Date() > data.expiresAt.toDate()) {
            return res.status(400).json({ error: 'OTP expired' });
        }

        // 2. Create User via Admin SDK
        const userRecord = await auth.createUser({
            email,
            password,
            displayName: name,
        });

        // 3. Create User Document in Firestore (matching Frontend Signup.tsx logic)
        await db.collection('users').doc(userRecord.uid).set({
            uid: userRecord.uid,
            name,
            email,
            plan: 'free',
            createdAt: new Date(),
        });

        // 4. Delete OTP after use
        await db.collection('otps').doc(email).delete();

        // 5. Generate Custom Token for client login
        const customToken = await auth.createCustomToken(userRecord.uid);

        return res.json({ success: true, token: customToken });
    } catch (error: any) {
        console.error('Signup error:', error);
        return res.status(400).json({ error: error.message || 'Failed to create account' });
    }
});

/**
 * Handle Google Signup / Login
 * Receives the Firebase idToken from the frontend after passing the native/web Google sign in.
 * Verifies the token, ensures user document exists in Firestore.
 */
router.post('/google-signup', async (req, res) => {
    const { idToken } = req.body;

    if (!idToken) {
        return res.status(400).json({ error: 'idToken is required' });
    }

    try {
        // Verify the given Firebase id token
        const decodedToken = await auth.verifyIdToken(idToken);
        const { uid, email, name, picture } = decodedToken;

        // Check if user document already exists in Firestore
        const userDocRef = db.collection('users').doc(uid);
        const userDoc = await userDocRef.get();

        if (!userDoc.exists) {
            // First time Google sign in (Signup), create user document
            await userDocRef.set({
                uid,
                email: email || '',
                name: name || '',
                photoURL: picture || '',
                plan: 'free',
                createdAt: new Date(),
            });
        }

        // Return a custom token just in case the client needs it (frontend uses it if present)
        const customToken = await auth.createCustomToken(uid);
        
        return res.json({ success: true, firebaseToken: customToken });
    } catch (error: any) {
        console.error('Google Signup Error:', error);
        return res.status(400).json({ error: error.message || 'Failed to verify Google login' });
    }
});

/**
 * Reset password after OTP verification
 */
router.post('/reset-password', async (req, res) => {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
        return res.status(400).json({ error: 'Email, OTP, and new password are required' });
    }

    try {
        // 1. Verify OTP
        const doc = await db.collection('otps').doc(email).get();
        if (!doc.exists) return res.status(400).json({ error: 'No OTP found' });

        const data = doc.data();
        if (!data || data.otp !== otp || data.purpose !== 'reset') {
            return res.status(400).json({ error: 'Invalid OTP' });
        }

        if (new Date() > data.expiresAt.toDate()) {
            return res.status(400).json({ error: 'OTP expired' });
        }

        // 2. Get User and Update Password
        const user = await auth.getUserByEmail(email);
        await auth.updateUser(user.uid, { password: newPassword });

        // 3. Delete OTP after use
        await db.collection('otps').doc(email).delete();

        return res.json({ success: true, message: 'Password updated successfully' });
    } catch (error: any) {
        console.error('Reset password error:', error);
        return res.status(400).json({ error: error.message || 'Failed to reset password' });
    }
});

export default router;
