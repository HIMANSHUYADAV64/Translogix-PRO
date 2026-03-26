import { Router } from 'express';
import { db } from '../services/firebase';
import { AuthRequest, Vehicle } from '../types';
import { authenticateUser } from '../middleware/auth';
import { checkSubscriptionLimit } from '../middleware/subscription';

const router = Router();

// Get all vehicles for user
router.get('/', authenticateUser, async (req: AuthRequest, res) => {
    try {
        const userId = req.user?.uid;
        const snapshot = await db
            .collection('vehicles')
            .where('userId', '==', userId)
            .orderBy('createdAt', 'desc')
            .get();

        const vehicles = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        }));

        res.json(vehicles);
    } catch (error) {
        console.error('Get vehicles error:', error);
        res.status(500).json({ error: 'Failed to fetch vehicles' });
    }
});

// Get single vehicle
router.get('/:id', authenticateUser, async (req: AuthRequest, res) => {
    try {
        const userId = req.user?.uid;
        const doc = await db.collection('vehicles').doc(req.params.id).get();

        if (!doc.exists) {
            res.status(404).json({ error: 'Vehicle not found' });
            return;
        }

        const vehicle = doc.data();
        if (vehicle?.userId !== userId) {
            res.status(403).json({ error: 'Forbidden' });
            return;
        }

        res.json({ id: doc.id, ...vehicle });
    } catch (error) {
        console.error('Get vehicle error:', error);
        res.status(500).json({ error: 'Failed to fetch vehicle' });
    }
});

// Create vehicle
router.post('/', authenticateUser, checkSubscriptionLimit('vehicles'), async (req: AuthRequest, res) => {
    try {
        const userId = req.user?.uid;
        const vehicleData: Partial<Vehicle> = {
            ...req.body,
            userId,
            createdAt: new Date(),
        };

        const docRef = await db.collection('vehicles').add(vehicleData);
        res.status(201).json({ id: docRef.id, ...vehicleData });
    } catch (error) {
        console.error('Create vehicle error:', error);
        res.status(500).json({ error: 'Failed to create vehicle' });
    }
});

// Update vehicle
router.put('/:id', authenticateUser, async (req: AuthRequest, res) => {
    try {
        const userId = req.user?.uid;
        const doc = await db.collection('vehicles').doc(req.params.id).get();

        if (!doc.exists) {
            res.status(404).json({ error: 'Vehicle not found' });
            return;
        }

        const vehicle = doc.data();
        if (vehicle?.userId !== userId) {
            res.status(403).json({ error: 'Forbidden' });
            return;
        }

        const updateData = { ...req.body };
        delete updateData.userId;
        delete updateData.createdAt;

        await db.collection('vehicles').doc(req.params.id).update(updateData);
        res.json({ id: req.params.id, ...vehicle, ...updateData });
    } catch (error) {
        console.error('Update vehicle error:', error);
        res.status(500).json({ error: 'Failed to update vehicle' });
    }
});

// Delete vehicle
router.delete('/:id', authenticateUser, async (req: AuthRequest, res) => {
    try {
        const userId = req.user?.uid;
        const doc = await db.collection('vehicles').doc(req.params.id).get();

        if (!doc.exists) {
            res.status(404).json({ error: 'Vehicle not found' });
            return;
        }

        const vehicle = doc.data();
        if (vehicle?.userId !== userId) {
            res.status(403).json({ error: 'Forbidden' });
            return;
        }

        await db.collection('vehicles').doc(req.params.id).delete();
        res.json({ message: 'Vehicle deleted successfully' });
    } catch (error) {
        console.error('Delete vehicle error:', error);
        res.status(500).json({ error: 'Failed to delete vehicle' });
    }
});

export default router;
