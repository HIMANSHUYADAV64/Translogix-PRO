import React from 'react';
import { Crown, Zap } from 'lucide-react';
import { useSubscription } from '../contexts/SubscriptionContext';
import { useNavigate } from 'react-router-dom';

const SubscriptionBadge: React.FC = () => {
    const { subscription } = useSubscription();
    const navigate = useNavigate();

    const getBadgeColor = () => {
        switch (subscription?.plan) {
            case 'pro':
                return 'bg-gradient-to-r from-purple-500 to-purple-600';
            case 'enterprise':
                return 'bg-gradient-to-r from-yellow-500 to-yellow-600';
            default:
                return 'bg-gradient-to-r from-gray-500 to-gray-600';
        }
    };

    const getIcon = () => {
        switch (subscription?.plan) {
            case 'pro':
                return <Zap size={16} className="fill-white" />;
            case 'enterprise':
                return <Crown size={16} className="fill-white" />;
            default:
                return null;
        }
    };

    return (
        <button
            onClick={() => navigate('/settings')}
            className={`${getBadgeColor()} text-white px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2 hover:shadow-lg transition-all`}
        >
            {getIcon()}
            <span className="uppercase">{subscription?.plan || 'Free'}</span>
        </button>
    );
};

export default SubscriptionBadge;
