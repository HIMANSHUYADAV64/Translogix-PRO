import { Router } from 'express';
import { db } from '../services/firebase';
import { AuthRequest, Tyre } from '../types';
import { authenticateUser } from '../middleware/auth';
import { checkSubscriptionLimit } from '../middleware/subscription';

const router = Router();

// Get tyres by vehicle
router.get('/vehicle/:vehicleId', authenticateUser, async (req: AuthRequest, res) => {
    try {
        const userId = req.user?.uid;
        const snapshot = await db
            .collection('tyres')
            .where('userId', '==', userId)
            .where('vehicleId', '==', req.params.vehicleId)
            .orderBy('createdAt', 'desc')
            .get();

        const tyres = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        }));

        res.json(tyres);
    } catch (error) {
        console.error('Get tyres error:', error);
        res.status(500).json({ error: 'Failed to fetch tyres' });
    }
});

// Create tyre
router.post('/', authenticateUser, checkSubscriptionLimit('tyres'), async (req: AuthRequest, res) => {
    try {
        const userId = req.user?.uid;
        const tyreData: Partial<Tyre> = {
            ...req.body,
            userId,
            createdAt: new Date(),
        };

        const docRef = await db.collection('tyres').add(tyreData);
        res.status(201).json({ id: docRef.id, ...tyreData });
    } catch (error) {
        console.error('Create tyre error:', error);
        res.status(500).json({ error: 'Failed to create tyre record' });
    }
});

// Update tyre
router.put('/:id', authenticateUser, async (req: AuthRequest, res) => {
    try {
        const userId = req.user?.uid;
        const doc = await db.collection('tyres').doc(req.params.id).get();

        if (!doc.exists) {
            res.status(404).json({ error: 'Tyre not found' });
            return;
        }

        const tyre = doc.data();
        if (tyre?.userId !== userId) {
            res.status(403).json({ error: 'Forbidden' });
            return;
        }

        const updateData = { ...req.body };
        delete updateData.userId;
        delete updateData.createdAt;

        await db.collection('tyres').doc(req.params.id).update(updateData);
        res.json({ id: req.params.id, ...tyre, ...updateData });
    } catch (error) {
        console.error('Update tyre error:', error);
        res.status(500).json({ error: 'Failed to update tyre' });
    }
});

// Delete tyre
router.delete('/:id', authenticateUser, async (req: AuthRequest, res) => {
    try {
        const userId = req.user?.uid;
        const doc = await db.collection('tyres').doc(req.params.id).get();

        if (!doc.exists) {
            res.status(404).json({ error: 'Tyre not found' });
            return;
        }

        const tyre = doc.data();
        if (tyre?.userId !== userId) {
            res.status(403).json({ error: 'Forbidden' });
            return;
        }

        await db.collection('tyres').doc(req.params.id).delete();
        res.json({ message: 'Tyre deleted successfully' });
    } catch (error) {
        console.error('Delete tyre error:', error);
        res.status(500).json({ error: 'Failed to delete tyre' });
    }
});

export default router;
