import React, { createContext, useContext, useEffect, useState } from 'react';
import { User as FirebaseUser, onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { auth } from '../services/firebase';

interface AuthContextType {
    currentUser: FirebaseUser | null;
    user: FirebaseUser | null; // Alias for currentUser
    loading: boolean;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const signOut = async () => {
        await firebaseSignOut(auth);
    };

    const value = {
        currentUser,
        user: currentUser, // Provide alias
        loading,
        signOut,
    };

    return (
        <AuthContext.Provider value={value}>
            {loading ? (
                <div className="min-h-screen bg-primary-50 flex flex-col justify-center items-center">
                    <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-900 rounded-full animate-spin"></div>
                    <h2 className="mt-4 text-primary-900 font-bold tracking-widest uppercase text-sm animate-pulse">
                        Translogix
                    </h2>
                </div>
            ) : (
                children
            )}
        </AuthContext.Provider>
    );
};
