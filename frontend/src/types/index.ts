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
    documents: boolean;
}

export const PLAN_LIMITS: Record<PlanType, PlanLimits> = {
    free: {
        vehicles: 3,
        drivers: 5,
        maintenance: 5,
        trips: 5,
        payments: 5,
        tyres: 5,
        documents: true,
    },
    pro: {
        vehicles: 25,
        drivers: Infinity,
        maintenance: Infinity,
        trips: Infinity,
        payments: Infinity,
        tyres: Infinity,
        documents: true,
    },
    enterprise: {
        vehicles: Infinity,
        drivers: Infinity,
        maintenance: Infinity,
        trips: Infinity,
        payments: Infinity,
        tyres: Infinity,
        documents: true,
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
    registrationDate: Date | string;
    rcNumber: string;
    insuranceExpiry: Date | string;
    pollutionExpiry: Date | string;
    rcUrl?: string;
    insuranceUrl?: string;
    pollutionUrl?: string;
    status: 'active' | 'inactive' | 'maintenance';
    notes?: string;
    createdAt: Date | string;
}

export interface Driver {
    id?: string;
    userId: string;
    name: string;
    phone: string;
    assignedVehicleId?: string;
    aadhaarUrl?: string;
    licenseUrl?: string;
    licenseExpiry: Date | string;
    createdAt: Date | string;
}

export interface Maintenance {
    id?: string;
    userId: string;
    vehicleId: string;
    workshopName: string;
    serviceDoneBy: string;
    description: string;
    cost: number;
    serviceDate: Date | string;
    nextDueDate?: Date | string;
    billUrl?: string;
    createdAt: Date | string;
}

export interface Tyre {
    id?: string;
    userId: string;
    vehicleId: string;
    tyreNumber: string;
    position: string;
    brand: string;
    installedDate: Date | string;
    expectedLifeKm: number;
    currentKm: number;
    status: 'active' | 'worn' | 'replaced';
    createdAt: Date | string;
}

export interface Trip {
    id?: string;
    userId: string;
    vehicleId: string;
    driverId: string;
    from: string;
    to: string;
    distanceKm: number;
    startDate: Date | string;
    endDate: Date | string;
    status: 'planned' | 'ongoing' | 'completed';
    createdAt: Date | string;
}

export interface Payment {
    id?: string;
    userId: string;
    vehicleId: string;
    rpsNumber: string;
    amount: number;
    tds: number;
    paymentDate: Date | string;
    status: 'pending' | 'done';
    invoiceUrl?: string;
    createdAt: Date | string;
}

export interface Subscription {
    id?: string;
    userId: string;
    plan: PlanType;
    startDate: Date | string;
    endDate: Date | string;
    status: 'active' | 'expired' | 'cancelled';
    razorpaySubscriptionId?: string;
    createdAt: Date | string;
}

export interface PlanPricing {
    name: string;
    plan: PlanType;
    monthlyPrice: number;
    yearlyPrice: number;
    features: string[];
}

export const PLAN_PRICING: PlanPricing[] = [
    {
        name: 'Free',
        plan: 'free',
        monthlyPrice: 0,
        yearlyPrice: 0,
        features: [
            '3 Vehicles',
            '5 Drivers',
            '5 Maintenance Records',
            '5 Trips',
            '5 Payments',
            '5 Tyres',
            'Basic Support',
        ],
    },
    {
        name: 'Pro',
        plan: 'pro',
        monthlyPrice: 999,
        yearlyPrice: 9999,
        features: [
            '25 Vehicles',
            'Unlimited Drivers',
            'Unlimited Maintenance',
            'Unlimited Trips',
            'Unlimited Payments',
            'Unlimited Tyres',
            'Priority Support',
            'Email Reminders',
        ],
    },
    {
        name: 'Enterprise',
        plan: 'enterprise',
        monthlyPrice: 2999,
        yearlyPrice: 29999,
        features: [
            'Unlimited Vehicles',
            'Unlimited Everything',
            'Advanced Analytics',
            'Custom Reports',
            'API Access',
            'Dedicated Support',
            'Custom Integrations',
        ],
    },
];
