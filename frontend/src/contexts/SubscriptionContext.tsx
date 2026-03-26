import React, { createContext, useContext, useEffect, useState } from 'react';
import { Subscription, PlanType, PLAN_LIMITS, PlanLimits } from '../types';
import api from '../services/api';
import { useAuth } from './AuthContext';

interface SubscriptionContextType {
    subscription: Subscription | null;
    loading: boolean;
    canAddResource: (resourceType: keyof PlanLimits, currentCount: number) => boolean;
    getLimit: (resourceType: keyof PlanLimits) => number | boolean;
    refreshSubscription: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const useSubscription = () => {
    const context = useContext(SubscriptionContext);
    if (!context) {
        throw new Error('useSubscription must be used within SubscriptionProvider');
    }
    return context;
};

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { currentUser } = useAuth();
    const [subscription, setSubscription] = useState<Subscription | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchSubscription = async () => {
        if (!currentUser) {
            setLoading(false);
            return;
        }

        try {
            const response = await api.get('/subscriptions/current');
            setSubscription(response.data);
        } catch (error) {
            console.error('Failed to fetch subscription:', error);
            // Default to free plan
            setSubscription({
                plan: 'free',
                status: 'active',
                startDate: new Date(),
                endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
                userId: currentUser.uid,
                createdAt: new Date(),
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSubscription();
    }, [currentUser]);

    const canAddResource = (resourceType: keyof PlanLimits, currentCount: number): boolean => {
        const plan = (subscription?.plan || 'free') as PlanType;
        const limit = PLAN_LIMITS[plan][resourceType];

        if (typeof limit === 'boolean') {
            return limit;
        }

        return currentCount < limit;
    };

    const getLimit = (resourceType: keyof PlanLimits): number | boolean => {
        const plan = (subscription?.plan || 'free') as PlanType;
        return PLAN_LIMITS[plan][resourceType];
    };

    const refreshSubscription = async () => {
        await fetchSubscription();
    };

    const value = {
        subscription,
        loading,
        canAddResource,
        getLimit,
        refreshSubscription,
    };

    return <SubscriptionContext.Provider value={value}>{children}</SubscriptionContext.Provider>;
};
