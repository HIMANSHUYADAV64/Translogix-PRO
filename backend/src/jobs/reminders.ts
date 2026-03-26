import cron from 'node-cron';
import { db } from '../services/firebase';
import {
    sendSubscriptionReminder,
    sendMaintenanceDueAlert,
    sendInsuranceExpiryAlert,
} from '../services/email';

export const runSubscriptionReminders = async () => {
    console.log('Running subscription reminder job...');
    try {
        const now = new Date();
        const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

        const subscriptionsSnapshot = await db
            .collection('subscriptions')
            .where('status', '==', 'active')
            .where('endDate', '<=', sevenDaysFromNow)
            .get();

        for (const doc of subscriptionsSnapshot.docs) {
            const subscription = doc.data();
            const endDate = subscription.endDate.toDate();
            const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

            if (daysLeft > 0 && daysLeft <= 7) {
                const userDoc = await db.collection('users').doc(subscription.userId).get();
                const userData = userDoc.data();

                if (userData?.email) {
                    await sendSubscriptionReminder(userData.email, userData.name || 'User', daysLeft);
                }
            }
        }
        console.log('Subscription reminder job completed');
    } catch (error) {
        console.error('Subscription reminder job error:', error);
    }
};

export const runMaintenanceReminders = async () => {
    console.log('Running maintenance reminder job...');
    try {
        const now = new Date();
        const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

        const maintenanceSnapshot = await db
            .collection('maintenance')
            .where('nextDueDate', '<=', threeDaysFromNow)
            .get();

        for (const doc of maintenanceSnapshot.docs) {
            const maintenance = doc.data();
            const nextDueDate = maintenance.nextDueDate?.toDate();

            if (nextDueDate && nextDueDate > now) {
                const vehicleDoc = await db.collection('vehicles').doc(maintenance.vehicleId).get();
                const vehicleData = vehicleDoc.data();

                if (vehicleData) {
                    const userDoc = await db.collection('users').doc(maintenance.userId).get();
                    const userData = userDoc.data();

                    if (userData?.email) {
                        await sendMaintenanceDueAlert(
                            userData.email,
                            vehicleData.number,
                            nextDueDate.toLocaleDateString()
                        );
                    }
                }
            }
        }
        console.log('Maintenance reminder job completed');
    } catch (error) {
        console.error('Maintenance reminder job error:', error);
    }
};

export const runInsuranceReminders = async () => {
    console.log('Running insurance reminder job...');
    try {
        const now = new Date();
        const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

        const vehiclesSnapshot = await db
            .collection('vehicles')
            .where('insuranceExpiry', '<=', thirtyDaysFromNow)
            .get();

        for (const doc of vehiclesSnapshot.docs) {
            const vehicle = doc.data();
            const insuranceExpiry = vehicle.insuranceExpiry?.toDate();

            if (insuranceExpiry && insuranceExpiry > now) {
                const userDoc = await db.collection('users').doc(vehicle.userId).get();
                const userData = userDoc.data();

                if (userData?.email) {
                    await sendInsuranceExpiryAlert(
                        userData.email,
                        vehicle.number,
                        insuranceExpiry.toLocaleDateString()
                    );
                }
            }
        }
        console.log('Insurance reminder job completed');
    } catch (error) {
        console.error('Insurance reminder job error:', error);
    }
};

// Local Development Cron Jobs
export const subscriptionReminderJob = cron.schedule('0 9 * * *', runSubscriptionReminders);
export const maintenanceReminderJob = cron.schedule('0 10 * * *', runMaintenanceReminders);
export const insuranceReminderJob = cron.schedule('0 11 * * *', runInsuranceReminders);

export const startCronJobs = () => {
    subscriptionReminderJob.start();
    maintenanceReminderJob.start();
    insuranceReminderJob.start();
    console.log('All local cron jobs started');
};
