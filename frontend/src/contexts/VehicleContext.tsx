import React, { createContext, useContext, useEffect, useState } from 'react';
import { Vehicle } from '../types';
import api from '../services/api';
import { useAuth } from './AuthContext';

interface VehicleContextType {
    vehicles: Vehicle[];
    selectedVehicle: Vehicle | null;
    loading: boolean;
    selectVehicle: (vehicle: Vehicle | null) => void;
    addVehicle: (vehicle: Partial<Vehicle>) => Promise<void>;
    updateVehicle: (id: string, vehicle: Partial<Vehicle>) => Promise<void>;
    deleteVehicle: (id: string) => Promise<void>;
    refreshVehicles: () => Promise<void>;
}

const VehicleContext = createContext<VehicleContextType | undefined>(undefined);

export const useVehicle = () => {
    const context = useContext(VehicleContext);
    if (!context) {
        throw new Error('useVehicle must be used within VehicleProvider');
    }
    return context;
};

export const VehicleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { currentUser } = useAuth();
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchVehicles = async () => {
        if (!currentUser) {
            setLoading(false);
            return;
        }

        try {
            const response = await api.get('/vehicles');
            setVehicles(response.data);

            // Auto-select first vehicle if none selected
            if (!selectedVehicle && response.data.length > 0) {
                setSelectedVehicle(response.data[0]);
            }
        } catch (error) {
            console.error('Failed to fetch vehicles:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchVehicles();
    }, [currentUser]);

    const selectVehicle = (vehicle: Vehicle | null) => {
        setSelectedVehicle(vehicle);
    };

    const addVehicle = async (vehicle: Partial<Vehicle>) => {
        const response = await api.post('/vehicles', vehicle);
        setVehicles([response.data, ...vehicles]);
        if (!selectedVehicle) {
            setSelectedVehicle(response.data);
        }
    };

    const updateVehicle = async (id: string, vehicle: Partial<Vehicle>) => {
        const response = await api.put(`/vehicles/${id}`, vehicle);
        setVehicles(vehicles.map((v) => (v.id === id ? response.data : v)));
        if (selectedVehicle?.id === id) {
            setSelectedVehicle(response.data);
        }
    };

    const deleteVehicle = async (id: string) => {
        await api.delete(`/vehicles/${id}`);
        setVehicles(vehicles.filter((v) => v.id !== id));
        if (selectedVehicle?.id === id) {
            setSelectedVehicle(vehicles.length > 1 ? vehicles[0] : null);
        }
    };

    const refreshVehicles = async () => {
        await fetchVehicles();
    };

    const value = {
        vehicles,
        selectedVehicle,
        loading,
        selectVehicle,
        addVehicle,
        updateVehicle,
        deleteVehicle,
        refreshVehicles,
    };

    return <VehicleContext.Provider value={value}>{children}</VehicleContext.Provider>;
};
