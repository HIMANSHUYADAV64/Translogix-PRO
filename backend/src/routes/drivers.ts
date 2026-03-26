import { Router } from 'express';
import { db } from '../services/firebase';
import { AuthRequest, Driver } from '../types';
import { authenticateUser } from '../middleware/auth';
import { checkSubscriptionLimit } from '../middleware/subscription';

const router = Router();

// Get all drivers for user
router.get('/', authenticateUser, async (req: AuthRequest, res) => {
    try {
        const userId = req.user?.uid;
        const snapshot = await db
            .collection('drivers')
            .where('userId', '==', userId)
            .orderBy('createdAt', 'desc')
            .get();

        const drivers = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        }));

        res.json(drivers);
    } catch (error) {
        console.error('Get drivers error:', error);
        res.status(500).json({ error: 'Failed to fetch drivers' });
    }
});

// Get drivers by vehicle
router.get('/vehicle/:vehicleId', authenticateUser, async (req: AuthRequest, res) => {
    try {
        const userId = req.user?.uid;
        const snapshot = await db
            .collection('drivers')
            .where('userId', '==', userId)
            .where('assignedVehicleId', '==', req.params.vehicleId)
            .get();

        const drivers = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        }));

        res.json(drivers);
    } catch (error) {
        console.error('Get drivers by vehicle error:', error);
        res.status(500).json({ error: 'Failed to fetch drivers' });
    }
});

// Create driver
router.post('/', authenticateUser, checkSubscriptionLimit('drivers'), async (req: AuthRequest, res) => {
    try {
        const userId = req.user?.uid;
        const driverData: Partial<Driver> = {
            ...req.body,
            userId,
            createdAt: new Date(),
        };

        const docRef = await db.collection('drivers').add(driverData);
        res.status(201).json({ id: docRef.id, ...driverData });
    } catch (error) {
        console.error('Create driver error:', error);
        res.status(500).json({ error: 'Failed to create driver' });
    }
});

// Update driver
router.put('/:id', authenticateUser, async (req: AuthRequest, res) => {
    try {
        const userId = req.user?.uid;
        const doc = await db.collection('drivers').doc(req.params.id).get();

        if (!doc.exists) {
            res.status(404).json({ error: 'Driver not found' });
            return;
        }

        const driver = doc.data();
        if (driver?.userId !== userId) {
            res.status(403).json({ error: 'Forbidden' });
            return;
        }

        const updateData = { ...req.body };
        delete updateData.userId;
        delete updateData.createdAt;

        await db.collection('drivers').doc(req.params.id).update(updateData);
        res.json({ id: req.params.id, ...driver, ...updateData });
    } catch (error) {
        console.error('Update driver error:', error);
        res.status(500).json({ error: 'Failed to update driver' });
    }
});

// Delete driver
router.delete('/:id', authenticateUser, async (req: AuthRequest, res) => {
    try {
        const userId = req.user?.uid;
        const doc = await db.collection('drivers').doc(req.params.id).get();

        if (!doc.exists) {
            res.status(404).json({ error: 'Driver not found' });
            return;
        }

        const driver = doc.data();
        if (driver?.userId !== userId) {
            res.status(403).json({ error: 'Forbidden' });
            return;
        }

        await db.collection('drivers').doc(req.params.id).delete();
        res.json({ message: 'Driver deleted successfully' });
    } catch (error) {
        console.error('Delete driver error:', error);
        res.status(500).json({ error: 'Failed to delete driver' });
    }
});

export default router;
