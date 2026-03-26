import { initializeApp } from "firebase/app";
import { getFirestore, collection, doc, getDocs, getDoc, addDoc, updateDoc, deleteDoc, setDoc, onSnapshot, query, where, serverTimestamp } from "firebase/firestore";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged, createUserWithEmailAndPassword, type User } from "firebase/auth";
import { getStorage, ref, getDownloadURL, uploadBytes } from "firebase/storage";



// ===============================
// 🔥 FIREBASE CONFIG
// ===============================
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);

// ===============================
// ✅ CORE INSTANCES
// ===============================
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

// ===============================
// 📦 USER COLLECTION HELPERS
// ===============================
export const userVehiclesCol = (uid: string) => collection(db, `users/${uid}/vehicles`);
export const userDriversCol = (uid: string) => collection(db, `users/${uid}/drivers`);
export const userTripsCol = (uid: string) => collection(db, `users/${uid}/trips`);
export const userMaintenanceCol = (uid: string) => collection(db, `users/${uid}/maintenance`);
export const userPaymentsCol = (uid: string) => collection(db, `users/${uid}/payments`);

// ===============================
// 📤 STORAGE HELPERS
// ===============================

/**
 * Upload a vehicle document (RC, Insurance, PUC, etc.)
 * @param uid - User ID
 * @param file - File to upload
 * @param docType - Document type (rcUrl, insuranceUrl, pollutionUrl)
 * @returns Download URL of the uploaded file
 */
export const uploadVehicleDocument = async (
    uid: string,
    file: File,
    docType: string
): Promise<string> => {
    // Validate file
    if (!file.type.startsWith('image/')) {
        throw new Error("Please upload an image file");
    }

    if (file.size > 5 * 1024 * 1024) {
        throw new Error("File size must be less than 5MB");
    }

    // Create file reference with proper extension
    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `${Date.now()}-${docType}.${fileExt}`;
    const fileRef = ref(storage, `vehicles/${uid}/${fileName}`);

    // Add metadata
    const metadata = {
        contentType: file.type,
        customMetadata: {
            uploadedBy: uid,
            uploadedAt: new Date().toISOString(),
            documentType: docType
        }
    };

    // Upload and get URL
    const snapshot = await uploadBytes(fileRef, file, metadata);
    return await getDownloadURL(snapshot.ref);
};

/**
 * Upload a driver document (License, Aadhaar, etc.)
 * @param uid - User ID
 * @param file - File to upload
 * @param docType - Document type
 * @returns Download URL of the uploaded file
 */
export const uploadDriverDocument = async (
    uid: string,
    file: File,
    docType: string
): Promise<string> => {
    if (!file.type.startsWith('image/')) {
        throw new Error("Please upload an image file");
    }

    if (file.size > 5 * 1024 * 1024) {
        throw new Error("File size must be less than 5MB");
    }

    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `${Date.now()}-${docType}.${fileExt}`;
    const fileRef = ref(storage, `drivers/${uid}/${fileName}`);

    const metadata = {
        contentType: file.type,
        customMetadata: {
            uploadedBy: uid,
            uploadedAt: new Date().toISOString(),
            documentType: docType
        }
    };

    const snapshot = await uploadBytes(fileRef, file, metadata);
    return await getDownloadURL(snapshot.ref);
};

/**
 * Handle Firebase errors and return user-friendly messages
 */
export const handleFirebaseError = (error: any): string => {
    console.error("Firebase error:", error);

    // Storage errors
    if (error.code === 'storage/unauthorized') {
        return "Permission denied. Please check your login status.";
    } else if (error.code === 'storage/canceled') {
        return "Upload was cancelled";
    } else if (error.code === 'storage/unknown') {
        return "Network error. Please check your connection.";
    } else if (error.code === 'storage/object-not-found') {
        return "File not found";
    } else if (error.code === 'storage/quota-exceeded') {
        return "Storage quota exceeded";
    }

    // Auth errors
    if (error.code === 'auth/user-not-found') {
        return "User not found";
    } else if (error.code === 'auth/wrong-password') {
        return "Incorrect password";
    } else if (error.code === 'auth/email-already-in-use') {
        return "Email already in use";
    } else if (error.code === 'auth/weak-password') {
        return "Password is too weak";
    } else if (error.code === 'auth/invalid-email') {
        return "Invalid email address";
    } else if (error.code === 'auth/network-request-failed') {
        return "Network error. Please check your connection.";
    }

    // Firestore errors
    if (error.code === 'permission-denied') {
        return "Permission denied. Please check your access rights.";
    } else if (error.code === 'not-found') {
        return "Document not found";
    } else if (error.code === 'already-exists') {
        return "Document already exists";
    }

    return error.message || "An unknown error occurred";
};

// ===============================
// 🔔 NOTIFICATIONS
// ===============================
export const userNotificationsCol = (uid: string) =>
    collection(db, `notifications/${uid}/autoDoc`);

export const userNotificationDoc = (uid: string, notificationId: string) =>
    doc(db, `notifications/${uid}/autoDoc/${notificationId}`);

export const createNotification = async (uid: string, title: string, message: string) => {
    const refDoc = doc(userNotificationsCol(uid));
    await setDoc(refDoc, {
        title,
        message,
        read: false,
        createdAt: serverTimestamp(),
    });
    return refDoc.id;
};

export const listenToNotifications = (uid: string, callback: (data: any[]) => void) =>
    onSnapshot(userNotificationsCol(uid), snap =>
        callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );

export const markNotificationRead = async (uid: string, id: string) =>
    updateDoc(userNotificationDoc(uid, id), { read: true });

// ===============================
// 💳 SUBSCRIPTIONS
// ===============================
export const userSubscriptionDoc = (uid: string) => doc(db, `subscriptions/${uid}`);
export const userSubscriptionHistoryCol = (uid: string) =>
    collection(db, `subscriptions/${uid}/history`);

export const updateSubscription = async (plan: string) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    const expiry = new Date();
    expiry.setDate(expiry.getDate() + (plan === "Annual Pro" ? 365 : 30));

    await setDoc(userSubscriptionDoc(uid), {
        plan,
        expiry,
        active: true,
        updatedAt: serverTimestamp(),
    });

    await addDoc(userSubscriptionHistoryCol(uid), {
        event: `Subscription updated to ${plan}`,
        plan,
        expiry,
        timestamp: serverTimestamp(),
    });

    await createNotification(uid, "Subscription Activated", `🎉 Your plan is now: ${plan}`);
};

// ===============================
// 📜 AUDIT LOGS
// ===============================
export const userAuditLogCol = (uid: string) => collection(db, `auditLogs/${uid}/logs`);

export const addAuditLog = async (uid: string, action: string, meta: any = {}) =>
    addDoc(userAuditLogCol(uid), { action, meta, timestamp: serverTimestamp() });

export const listenAuditLogs = (uid: string, callback: (logs: any[]) => void) =>
    onSnapshot(userAuditLogCol(uid), snap =>
        callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );

// ===============================
// 🌍 RE-EXPORT HELPERS
// ===============================
export {
    app,
    collection,
    doc,
    getDocs,
    getDoc,
    addDoc,
    updateDoc,
    deleteDoc,
    setDoc,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    createUserWithEmailAndPassword,
    User,
    serverTimestamp,
    query,
    where,
    ref,
    getDownloadURL,
    uploadBytes,
    onSnapshot,
};
