import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Truck, Users, Wrench, Circle, Route, CreditCard, Settings, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import VehicleSelector from './VehicleSelector';
import SubscriptionBadge from './SubscriptionBadge';

interface LayoutProps {
    children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
    const { signOut } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = React.useState(false);

    const menuItems = [
        { path: '/vehicles', icon: Truck, label: 'Vehicles' },
        { path: '/drivers', icon: Users, label: 'Drivers' },
        { path: '/maintenance', icon: Wrench, label: 'Maintenance' },
        { path: '/tyres', icon: Circle, label: 'Tyres' },
        { path: '/trips', icon: Route, label: 'Trips' },
        { path: '/payments', icon: CreditCard, label: 'Payments' },
        { path: '/settings', icon: Settings, label: 'Settings' },
    ];

    const handleSignOut = async () => {
        await signOut();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-primary-50">
            {/* Mobile Header */}
            <div className="lg:hidden bg-white border-b border-primary-200 p-4 pt-[max(1rem,env(safe-area-inset-top))] flex items-center justify-between sticky top-0 z-50">
                <div className="flex items-center gap-3">
                    <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-primary-100 rounded-lg text-primary-600 transition-colors">
                        {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                    <h1 className="text-xl font-extrabold tracking-tight text-primary-900">Trans<span className="text-accent-indigo">Logix</span></h1>
                </div>
                <SubscriptionBadge />
            </div>

            {/* Sidebar */}
            <aside
                className={`fixed top-0 left-0 h-full w-64 bg-white border-r border-primary-200 transform transition-transform duration-300 z-40 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                    } lg:translate-x-0`}
            >
                <div className="p-6 border-b border-primary-100">
                    <h1 className="text-2xl font-extrabold tracking-tight text-primary-900 flex items-center gap-2">
                        <Truck size={28} className="text-accent-indigo" />
                        Trans<span className="text-accent-indigo">Logix</span>
                    </h1>
                    <p className="text-xs font-semibold uppercase tracking-wider text-primary-400 mt-1">Fleet Management</p>
                </div>

                <div className="p-4">
                    <VehicleSelector />
                </div>

                <nav className="p-4 space-y-1">
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                onClick={() => setSidebarOpen(false)}
                                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 ${isActive
                                    ? 'bg-primary-900 text-white shadow-premium'
                                    : 'text-primary-600 hover:bg-primary-50 hover:text-primary-900'
                                    }`}
                            >
                                <Icon size={18} />
                                <span className="font-semibold text-sm">{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                <div className="absolute bottom-0 left-0 right-0 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] border-t border-primary-100 bg-primary-50/50">
                    <button
                        onClick={handleSignOut}
                        className="flex items-center gap-3 px-4 py-2.5 w-full text-primary-500 hover:text-error hover:bg-red-50 rounded-lg transition-all duration-200"
                    >
                        <LogOut size={18} />
                        <span className="font-semibold text-sm">Sign Out</span>
                    </button>
                </div>
            </aside>

            {/* Overlay for mobile */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Main Content */}
            <main className="lg:ml-64 min-h-screen">
                <div className="hidden lg:flex items-center justify-between p-6 bg-white border-b border-primary-200 sticky top-0 z-20">
                    <h2 className="text-xl font-bold text-primary-900">
                        {menuItems.find((item) => item.path === location.pathname)?.label || 'Dashboard'}
                    </h2>
                    <SubscriptionBadge />
                </div>
                <div className="p-8 max-w-7xl mx-auto">{children}</div>
            </main>
        </div>
    );
};

export default Layout;
