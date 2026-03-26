import { Router } from 'express';
import { db } from '../services/firebase';
import { AuthRequest, Payment } from '../types';
import { authenticateUser } from '../middleware/auth';
import { checkSubscriptionLimit } from '../middleware/subscription';

const router = Router();

// Get payments by vehicle
router.get('/vehicle/:vehicleId', authenticateUser, async (req: AuthRequest, res) => {
    try {
        const userId = req.user?.uid;
        const snapshot = await db
            .collection('payments')
            .where('userId', '==', userId)
            .where('vehicleId', '==', req.params.vehicleId)
            .orderBy('paymentDate', 'desc')
            .get();

        const payments = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        }));

        res.json(payments);
    } catch (error) {
        console.error('Get payments error:', error);
        res.status(500).json({ error: 'Failed to fetch payments' });
    }
});

// Get all payments
router.get('/', authenticateUser, async (req: AuthRequest, res) => {
    try {
        const userId = req.user?.uid;
        const snapshot = await db
            .collection('payments')
            .where('userId', '==', userId)
            .orderBy('paymentDate', 'desc')
            .get();

        const payments = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        }));

        res.json(payments);
    } catch (error) {
        console.error('Get payments error:', error);
        res.status(500).json({ error: 'Failed to fetch payments' });
    }
});

// Create payment
router.post('/', authenticateUser, checkSubscriptionLimit('payments'), async (req: AuthRequest, res) => {
    try {
        const userId = req.user?.uid;
        const paymentData: Partial<Payment> = {
            ...req.body,
            userId,
            createdAt: new Date(),
        };

        const docRef = await db.collection('payments').add(paymentData);
        res.status(201).json({ id: docRef.id, ...paymentData });
    } catch (error) {
        console.error('Create payment error:', error);
        res.status(500).json({ error: 'Failed to create payment record' });
    }
});

// Update payment
router.put('/:id', authenticateUser, async (req: AuthRequest, res) => {
    try {
        const userId = req.user?.uid;
        const doc = await db.collection('payments').doc(req.params.id).get();

        if (!doc.exists) {
            res.status(404).json({ error: 'Payment not found' });
            return;
        }

        const payment = doc.data();
        if (payment?.userId !== userId) {
            res.status(403).json({ error: 'Forbidden' });
            return;
        }

        const updateData = { ...req.body };
        delete updateData.userId;
        delete updateData.createdAt;

        await db.collection('payments').doc(req.params.id).update(updateData);
        res.json({ id: req.params.id, ...payment, ...updateData });
    } catch (error) {
        console.error('Update payment error:', error);
        res.status(500).json({ error: 'Failed to update payment' });
    }
});

// Delete payment
router.delete('/:id', authenticateUser, async (req: AuthRequest, res) => {
    try {
        const userId = req.user?.uid;
        const doc = await db.collection('payments').doc(req.params.id).get();

        if (!doc.exists) {
            res.status(404).json({ error: 'Payment not found' });
            return;
        }

        const payment = doc.data();
        if (payment?.userId !== userId) {
            res.status(403).json({ error: 'Forbidden' });
            return;
        }

        await db.collection('payments').doc(req.params.id).delete();
        res.json({ message: 'Payment deleted successfully' });
    } catch (error) {
        console.error('Delete payment error:', error);
        res.status(500).json({ error: 'Failed to delete payment' });
    }
});

export default router;
