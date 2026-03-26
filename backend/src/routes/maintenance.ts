import { Router } from 'express';
import { db } from '../services/firebase';
import { AuthRequest, Maintenance } from '../types';
import { authenticateUser } from '../middleware/auth';
import { checkSubscriptionLimit } from '../middleware/subscription';

const router = Router();

// Get maintenance records by vehicle
router.get('/vehicle/:vehicleId', authenticateUser, async (req: AuthRequest, res) => {
    try {
        const userId = req.user?.uid;
        const snapshot = await db
            .collection('maintenance')
            .where('userId', '==', userId)
            .where('vehicleId', '==', req.params.vehicleId)
            .orderBy('serviceDate', 'desc')
            .get();

        const records = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        }));

        res.json(records);
    } catch (error) {
        console.error('Get maintenance records error:', error);
        res.status(500).json({ error: 'Failed to fetch maintenance records' });
    }
});

// Get all maintenance records
router.get('/', authenticateUser, async (req: AuthRequest, res) => {
    try {
        const userId = req.user?.uid;
        const snapshot = await db
            .collection('maintenance')
            .where('userId', '==', userId)
            .orderBy('serviceDate', 'desc')
            .get();

        const records = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        }));

        res.json(records);
    } catch (error) {
        console.error('Get maintenance records error:', error);
        res.status(500).json({ error: 'Failed to fetch maintenance records' });
    }
});

// Create maintenance record
router.post('/', authenticateUser, checkSubscriptionLimit('maintenance'), async (req: AuthRequest, res) => {
    try {
        const userId = req.user?.uid;
        const maintenanceData: Partial<Maintenance> = {
            ...req.body,
            userId,
            createdAt: new Date(),
        };

        const docRef = await db.collection('maintenance').add(maintenanceData);
        res.status(201).json({ id: docRef.id, ...maintenanceData });
    } catch (error) {
        console.error('Create maintenance error:', error);
        res.status(500).json({ error: 'Failed to create maintenance record' });
    }
});

// Update maintenance record
router.put('/:id', authenticateUser, async (req: AuthRequest, res) => {
    try {
        const userId = req.user?.uid;
        const doc = await db.collection('maintenance').doc(req.params.id).get();

        if (!doc.exists) {
            res.status(404).json({ error: 'Maintenance record not found' });
            return;
        }

        const record = doc.data();
        if (record?.userId !== userId) {
            res.status(403).json({ error: 'Forbidden' });
            return;
        }

        const updateData = { ...req.body };
        delete updateData.userId;
        delete updateData.createdAt;

        await db.collection('maintenance').doc(req.params.id).update(updateData);
        res.json({ id: req.params.id, ...record, ...updateData });
    } catch (error) {
        console.error('Update maintenance error:', error);
        res.status(500).json({ error: 'Failed to update maintenance record' });
    }
});

// Delete maintenance record
router.delete('/:id', authenticateUser, async (req: AuthRequest, res) => {
    try {
        const userId = req.user?.uid;
        const doc = await db.collection('maintenance').doc(req.params.id).get();

        if (!doc.exists) {
            res.status(404).json({ error: 'Maintenance record not found' });
            return;
        }

        const record = doc.data();
        if (record?.userId !== userId) {
            res.status(403).json({ error: 'Forbidden' });
            return;
        }

        await db.collection('maintenance').doc(req.params.id).delete();
        res.json({ message: 'Maintenance record deleted successfully' });
    } catch (error) {
        console.error('Delete maintenance error:', error);
        res.status(500).json({ error: 'Failed to delete maintenance record' });
    }
});

export default router;
