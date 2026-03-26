import { Request } from 'express';

export interface AuthRequest extends Request {
    user?: {
        uid: string;
        email: string;
    };
}

export type PlanType = 'free' | 'pro' | 'enterprise';

export interface User {
    uid: string;
    name: string;
    email: string;
    plan: PlanType;
    createdAt: Date;
}

export interface PlanLimits {
    vehicles: number;
    drivers: number;
    maintenance: number;
    trips: number;
    payments: number;
    tyres: number;
}

export const PLAN_LIMITS: Record<PlanType, PlanLimits> = {
    free: {
        vehicles: 3,
        drivers: 5,
        maintenance: 5,
        trips: 5,
        payments: 5,
        tyres: 5,
    },
    pro: {
        vehicles: 25,
        drivers: Infinity,
        maintenance: Infinity,
        trips: Infinity,
        payments: Infinity,
        tyres: Infinity,
    },
    enterprise: {
        vehicles: Infinity,
        drivers: Infinity,
        maintenance: Infinity,
        trips: Infinity,
        payments: Infinity,
        tyres: Infinity,
    },
};

export interface Vehicle {
    id?: string;
    userId: string;
    number: string;
    type: string;
    make: string;
    chassisNo: string;
    engineNo: string;
    registrationDate: Date;
    rcNumber: string;
    insuranceExpiry: Date;
    pollutionExpiry: Date;
    rcUrl?: string;
    insuranceUrl?: string;
    pollutionUrl?: string;
    status: 'active' | 'inactive' | 'maintenance';
    notes?: string;
    createdAt: Date;
}

export interface Driver {
    id?: string;
    userId: string;
    name: string;
    phone: string;
    assignedVehicleId?: string;
    aadhaarUrl?: string;
    licenseUrl?: string;
    licenseExpiry: Date;
    createdAt: Date;
}

export interface Maintenance {
    id?: string;
    userId: string;
    vehicleId: string;
    workshopName: string;
    serviceDoneBy: string;
    description: string;
    cost: number;
    serviceDate: Date;
    nextDueDate?: Date;
    billUrl?: string;
    createdAt: Date;
}

export interface Tyre {
    id?: string;
    userId: string;
    vehicleId: string;
    tyreNumber: string;
    position: string;
    brand: string;
    installedDate: Date;
    expectedLifeKm: number;
    currentKm: number;
    status: 'active' | 'worn' | 'replaced';
    createdAt: Date;
}

export interface Trip {
    id?: string;
    userId: string;
    vehicleId: string;
    driverId: string;
    from: string;
    to: string;
    distanceKm: number;
    startDate: Date;
    endDate: Date;
    status: 'planned' | 'ongoing' | 'completed';
    createdAt: Date;
}

export interface Payment {
    id?: string;
    userId: string;
    vehicleId: string;
    rpsNumber: string;
    amount: number;
    tds: number;
    paymentDate: Date;
    status: 'pending' | 'done';
    invoiceUrl?: string;
    createdAt: Date;
}

export interface Subscription {
    id?: string;
    userId: string;
    plan: PlanType;
    startDate: Date;
    endDate: Date;
    status: 'active' | 'expired' | 'cancelled';
    razorpaySubscriptionId?: string;
    createdAt: Date;
}
