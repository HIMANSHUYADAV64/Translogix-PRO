import { Response, NextFunction } from 'express';
import { db } from '../services/firebase';
import { AuthRequest, PLAN_LIMITS, PlanType } from '../types';

export const checkSubscriptionLimit = (resourceType: keyof typeof PLAN_LIMITS.free) => {
    return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = req.user?.uid;
            if (!userId) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }

            // Get user's subscription
            const subscriptionsSnapshot = await db
                .collection('subscriptions')
                .where('userId', '==', userId)
                .where('status', '==', 'active')
                .orderBy('createdAt', 'desc')
                .limit(1)
                .get();

            let userPlan: PlanType = 'free';
            if (!subscriptionsSnapshot.empty) {
                userPlan = subscriptionsSnapshot.docs[0].data().plan as PlanType;
            }

            const limit = PLAN_LIMITS[userPlan][resourceType];

            // If unlimited, proceed
            if (limit === Infinity) {
                next();
                return;
            }

            // Count existing resources
            const resourceSnapshot = await db
                .collection(resourceType === 'drivers' ? 'drivers' : resourceType === 'vehicles' ? 'vehicles' : resourceType)
                .where('userId', '==', userId)
                .get();

            const currentCount = resourceSnapshot.size;

            if (currentCount >= limit) {
                res.status(403).json({
                    error: 'Subscription limit reached',
                    message: `Your ${userPlan} plan allows only ${limit} ${resourceType}. Please upgrade to add more.`,
                    currentPlan: userPlan,
                    limit,
                    currentCount,
                });
                return;
            }

            next();
        } catch (error) {
            console.error('Subscription check error:', error);
            res.status(500).json({ error: 'Internal server error' });
            return;
        }
    };
};
