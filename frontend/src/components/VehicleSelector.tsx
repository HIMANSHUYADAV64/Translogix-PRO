import React from 'react';
import { ChevronDown } from 'lucide-react';
import { useVehicle } from '../contexts/VehicleContext';

const VehicleSelector: React.FC = () => {
    const { vehicles, selectedVehicle, selectVehicle } = useVehicle();
    const [isOpen, setIsOpen] = React.useState(false);

    const handleSelect = (vehicle: typeof selectedVehicle) => {
        selectVehicle(vehicle);
        setIsOpen(false);
    };

    if (vehicles.length === 0) {
        return null; // Don't show anything if there are no vehicles
    }

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full px-4 py-3 bg-white border border-primary-200 rounded-xl hover:bg-primary-50 transition-all flex items-center justify-between shadow-sm"
            >
                <div className="text-left">
                    <p className="text-[10px] font-black text-primary-400 uppercase tracking-widest leading-none">Selected Unit</p>
                    <p className="font-extrabold text-primary-900 uppercase tracking-tight mt-1">{selectedVehicle?.number || 'Switch Unit'}</p>
                </div>
                <ChevronDown size={18} className={`text-primary-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-primary-200 rounded-2xl shadow-premium z-20 max-h-64 overflow-y-auto animate-fade-in p-1">
                        {vehicles.map((vehicle) => (
                            <button
                                key={vehicle.id}
                                onClick={() => handleSelect(vehicle)}
                                className={`w-full px-4 py-3 text-left rounded-xl transition-all mb-1 last:mb-0 ${selectedVehicle?.id === vehicle.id
                                    ? 'bg-primary-900 text-white shadow-premium'
                                    : 'text-primary-600 hover:bg-primary-50 hover:text-primary-900'
                                    }`}
                            >
                                <p className="font-extrabold uppercase tracking-tight leading-none">{vehicle.number}</p>
                                <p className={`text-[10px] font-bold mt-1 uppercase tracking-widest ${selectedVehicle?.id === vehicle.id ? 'text-primary-300' : 'text-primary-400'}`}>
                                    {vehicle.make} · {vehicle.type}
                                </p>
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

export default VehicleSelector;
