import { Router } from 'express';
import { db } from '../services/firebase';
import { AuthRequest, Trip } from '../types';
import { authenticateUser } from '../middleware/auth';
import { checkSubscriptionLimit } from '../middleware/subscription';

const router = Router();

// Get trips by vehicle
router.get('/vehicle/:vehicleId', authenticateUser, async (req: AuthRequest, res) => {
    try {
        const userId = req.user?.uid;
        const snapshot = await db
            .collection('trips')
            .where('userId', '==', userId)
            .where('vehicleId', '==', req.params.vehicleId)
            .orderBy('startDate', 'desc')
            .get();

        const trips = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        }));

        res.json(trips);
    } catch (error) {
        console.error('Get trips error:', error);
        res.status(500).json({ error: 'Failed to fetch trips' });
    }
});

// Get all trips
router.get('/', authenticateUser, async (req: AuthRequest, res) => {
    try {
        const userId = req.user?.uid;
        const snapshot = await db
            .collection('trips')
            .where('userId', '==', userId)
            .orderBy('startDate', 'desc')
            .get();

        const trips = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        }));

        res.json(trips);
    } catch (error) {
        console.error('Get trips error:', error);
        res.status(500).json({ error: 'Failed to fetch trips' });
    }
});

// Create trip
router.post('/', authenticateUser, checkSubscriptionLimit('trips'), async (req: AuthRequest, res) => {
    try {
        const userId = req.user?.uid;
        const tripData: Partial<Trip> = {
            ...req.body,
            userId,
            createdAt: new Date(),
        };

        const docRef = await db.collection('trips').add(tripData);
        res.status(201).json({ id: docRef.id, ...tripData });
    } catch (error) {
        console.error('Create trip error:', error);
        res.status(500).json({ error: 'Failed to create trip' });
    }
});

// Update trip
router.put('/:id', authenticateUser, async (req: AuthRequest, res) => {
    try {
        const userId = req.user?.uid;
        const doc = await db.collection('trips').doc(req.params.id).get();

        if (!doc.exists) {
            res.status(404).json({ error: 'Trip not found' });
            return;
        }

        const trip = doc.data();
        if (trip?.userId !== userId) {
            res.status(403).json({ error: 'Forbidden' });
            return;
        }

        const updateData = { ...req.body };
        delete updateData.userId;
        delete updateData.createdAt;

        await db.collection('trips').doc(req.params.id).update(updateData);
        res.json({ id: req.params.id, ...trip, ...updateData });
    } catch (error) {
        console.error('Update trip error:', error);
        res.status(500).json({ error: 'Failed to update trip' });
    }
});

// Delete trip
router.delete('/:id', authenticateUser, async (req: AuthRequest, res) => {
    try {
        const userId = req.user?.uid;
        const doc = await db.collection('trips').doc(req.params.id).get();

        if (!doc.exists) {
            res.status(404).json({ error: 'Trip not found' });
            return;
        }

        const trip = doc.data();
        if (trip?.userId !== userId) {
            res.status(403).json({ error: 'Forbidden' });
            return;
        }

        await db.collection('trips').doc(req.params.id).delete();
        res.json({ message: 'Trip deleted successfully' });
    } catch (error) {
        console.error('Delete trip error:', error);
        res.status(500).json({ error: 'Failed to delete trip' });
    }
});

export default router;
