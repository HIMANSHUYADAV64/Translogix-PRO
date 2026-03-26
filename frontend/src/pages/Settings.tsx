
import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useSubscription } from "../contexts/SubscriptionContext";
import { startCheckout } from "../lib/payments";
import { useNavigate } from "react-router-dom";
import {
    User,
    Globe,
    Star,
    Shield,
    FileText,
    MessageCircle,
    LogOut,
    Trash2,
    ChevronRight,
    Sparkles,
    Crown
} from "lucide-react";
import Layout from "../components/Layout";
import { deleteDoc, doc } from "firebase/firestore";
import { db } from "../services/firebase";

/* =======================
   PAYMENT CONFIG
======================= */
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";
const BACKEND_CREATE = `${API_BASE}/api/subscriptions/create-order`;
const BACKEND_VERIFY = `${API_BASE}/api/subscriptions/verify-payment`;

/* =======================
   PLAN DEFINITIONS
======================= */
const PLANS = [
    { id: "pro_monthly", label: "Pro – Monthly", amount: 199, planId: "pro", billingCycle: "monthly" },
    { id: "pro_quarterly", label: "Pro – 3 Months", amount: 499, planId: "pro", billingCycle: "quarterly" },
    { id: "enterprise_monthly", label: "Enterprise – Monthly", amount: 499, planId: "enterprise", billingCycle: "monthly" },
    { id: "enterprise_quarterly", label: "Enterprise – 3 Months", amount: 1299, planId: "enterprise", billingCycle: "quarterly" }
];

const Settings: React.FC = () => {
    const { currentUser, signOut } = useAuth();
    const { subscription } = useSubscription();
    const navigate = useNavigate();

    const [showUpgrade, setShowUpgrade] = useState(false);
    const [loading, setLoading] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState(PLANS[0]);

    /* =======================
        PAYMENT HANDLER
    ======================= */
    const handleUpgrade = async () => {
        if (!currentUser) {
            alert("Please login first");
            return;
        }

        setLoading(true);
        try {
            await startCheckout({
                backendCreateUrl: BACKEND_CREATE,
                verifyUrl: BACKEND_VERIFY,
                amount: selectedPlan.amount,
                planId: selectedPlan.planId,
                billingCycle: selectedPlan.billingCycle,
                userEmail: currentUser.email || "",
                userId: currentUser.uid,
            });
        } catch (e: any) {
            alert(e?.message || "Payment failed");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
            return;
        }

        try {
            await deleteDoc(doc(db, 'users', currentUser!.uid));
            await currentUser?.delete();
            navigate('/signup');
        } catch (error) {
            console.error('Failed to delete account:', error);
            alert('Failed to delete account. Please try again.');
        }
    };

    /* =======================
        REUSABLE ROW
    ======================= */
    const Row = ({
        icon: Icon,
        label,
        value,
        onClick,
        danger
    }: {
        icon: any;
        label: string;
        value?: string;
        onClick?: () => void;
        danger?: boolean;
    }) => (
        <button
            type="button"
            onClick={onClick}
            className={`w-full flex items-center justify-between px-6 py-4 transition-all
                ${danger ? "text-error hover:bg-red-50" : "text-primary-600 hover:bg-primary-50/50"}
            `}
        >
            <div className="flex items-center gap-4">
                <Icon size={18} className={danger ? "text-error" : "text-primary-400"} />
                <span className="text-sm font-bold uppercase tracking-widest">{label}</span>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-black text-primary-300">
                {value && <span className="uppercase tracking-widest">{value}</span>}
                <ChevronRight size={14} />
            </div>
        </button>
    );

    return (
        <Layout>
            <div className="max-w-3xl mx-auto space-y-8 pb-20 animate-fade-in">
                {/* HEADER */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-black text-primary-900 uppercase tracking-tight">System <span className="text-primary-400">Settings</span></h1>
                        <p className="text-xs font-bold text-primary-400 uppercase tracking-widest mt-0.5">Manage your account & preferences</p>
                    </div>

                    {subscription?.plan === 'free' && (
                        <button
                            onClick={() => setShowUpgrade(true)}
                            className="px-5 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl bg-primary-900 text-white shadow-premium flex items-center gap-2 hover:bg-black transition-all"
                        >
                            <Sparkles size={14} /> Premium Access
                        </button>
                    )}
                </div>

                {/* USER INFO */}
                <div className="bg-white border border-primary-200 rounded-[2rem] p-8 flex flex-col sm:flex-row items-center gap-6 relative overflow-hidden shadow-premium">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-accent-indigo/5 blur-3xl -mr-32 -mt-32 rounded-full" />
                    <div className="w-20 h-20 bg-primary-50 border border-primary-100 rounded-3xl flex items-center justify-center text-accent-indigo shadow-inner relative z-10">
                        <User size={36} />
                    </div>
                    <div className="text-center sm:text-left relative z-10">
                        <h2 className="text-xl font-black text-primary-900 uppercase tracking-tight leading-none">{currentUser?.displayName || 'Fleet Operator'}</h2>
                        <p className="text-sm font-bold text-primary-400 tracking-tight mt-1">{currentUser?.email}</p>
                        <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-indigo/5 border border-accent-indigo/10">
                            <Crown size={12} className="text-accent-indigo" />
                            <span className="text-[10px] font-black text-accent-indigo uppercase tracking-widest">{subscription?.plan || 'Free'} Plan</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* GENERAL */}
                    <div className="space-y-4">
                        <h3 className="text-[10px] font-extrabold text-primary-400 uppercase tracking-widest ml-1">General</h3>
                        <section className="bg-white border border-primary-200 rounded-[2rem] overflow-hidden divide-y divide-primary-50 shadow-premium">
                            <Row icon={User} label="Profile" onClick={() => navigate("/profile")} />
                            <Row icon={Globe} label="Language & Region" value="IND / EN" />
                            <Row icon={Star} label="Rate App" onClick={() => window.open("https://play.google.com", "_blank")} />
                            <Row icon={Shield} label="Privacy Policy" onClick={() => navigate("/privacy")} />
                            <Row icon={FileText} label="Terms of Service" onClick={() => navigate("/terms")} />
                            <Row icon={MessageCircle} label="Send Feedback" onClick={() => navigate("/feedback")} />
                        </section>
                    </div>

                    <div className="space-y-8">
                        {/* PREMIUM UPSELL */}
                        {subscription?.plan === 'free' && (
                            <div className="rounded-[2rem] p-8 bg-primary-900 text-white shadow-premium relative group overflow-hidden flex flex-col justify-between h-full min-h-[320px]">
                                <div className="absolute -top-10 -right-10 opacity-10 group-hover:scale-110 transition-transform duration-500">
                                    <Crown size={200} />
                                </div>
                                <div className="relative z-10">
                                    <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-6">
                                        <Sparkles size={24} className="text-white" />
                                    </div>
                                    <h3 className="font-black text-2xl uppercase tracking-tighter leading-tight">Elevate Management Capabilities</h3>
                                    <p className="text-xs font-bold text-primary-300 mt-2 uppercase tracking-widest leading-relaxed">
                                        Unlock unlimited technical assets & predictive diagnostic features.
                                    </p>
                                </div>

                                <button
                                    onClick={() => setShowUpgrade(true)}
                                    className="relative z-10 px-8 py-4 bg-white text-primary-900 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl hover:bg-primary-50 transition-all flex items-center justify-center gap-2 group/btn"
                                >
                                    Initiate Upgrade
                                    <ChevronRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
                                </button>
                            </div>
                        )}

                        {/* ACCOUNT DESTRUCTION */}
                        <div className="space-y-4">
                            <h3 className="text-[10px] font-extrabold text-error/50 uppercase tracking-widest ml-1">Critical Operations</h3>
                            <section className="bg-white border border-red-100 rounded-[2rem] overflow-hidden divide-y divide-red-50 shadow-sm">
                                <Row
                                    icon={LogOut}
                                    label="Sign Out"
                                    onClick={async () => {
                                        await signOut();
                                        navigate("/login", { replace: true });
                                    }}
                                />
                                <Row
                                    icon={Trash2}
                                    label="Delete Account"
                                    danger
                                    onClick={handleDeleteAccount}
                                />
                            </section>
                        </div>
                    </div>
                </div>

                {/* UPGRADE MODAL */}
                {showUpgrade && (
                    <div className="fixed inset-0 bg-primary-900/40 backdrop-blur-md z-[100] flex items-end sm:items-center justify-center p-4">
                        <div className="bg-white border border-primary-200 w-full sm:max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-fade-in">
                            <div className="p-8 border-b border-primary-50 bg-primary-50/30">
                                <h2 className="text-2xl font-black text-primary-900 uppercase tracking-tighter">Scale <span className="text-accent-indigo">Fleet</span> Authorization</h2>
                                <p className="text-[10px] text-primary-400 font-black uppercase tracking-widest mt-1">Select deployment architecture</p>
                            </div>

                            <div className="p-8 space-y-4">
                                {PLANS.map(p => (
                                    <label
                                        key={p.id}
                                        className={`flex items-center justify-between border-2 rounded-3xl px-6 py-5 cursor-pointer transition-all
                                            ${selectedPlan.id === p.id
                                                ? "border-accent-indigo bg-accent-indigo/5 shadow-premium"
                                                : "border-primary-100 hover:border-primary-200 bg-white"}
                                        `}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${selectedPlan.id === p.id ? "border-accent-indigo bg-accent-indigo" : "border-primary-200"}`}>
                                                {selectedPlan.id === p.id && <div className="w-2 h-2 bg-white rounded-full" />}
                                            </div>
                                            <div>
                                                <p className={`font-black uppercase tracking-tight text-sm ${selectedPlan.id === p.id ? "text-accent-indigo" : "text-primary-900"}`}>{p.label}</p>
                                                <p className="text-[10px] text-primary-400 font-bold uppercase tracking-widest">₹{p.amount.toLocaleString()} Deployment Cost / {p.billingCycle}</p>
                                            </div>
                                        </div>
                                        <input
                                            type="radio"
                                            className="hidden"
                                            checked={selectedPlan.id === p.id}
                                            onChange={() => setSelectedPlan(p)}
                                        />
                                    </label>
                                ))}
                            </div>

                            <div className="p-8 pt-0 flex flex-col gap-3">
                                <button
                                    onClick={handleUpgrade}
                                    disabled={loading}
                                    className="w-full py-5 rounded-[1.5rem] bg-primary-900 text-white font-black uppercase tracking-widest text-xs shadow-premium disabled:opacity-50 transition-all hover:bg-black active:scale-[0.98]"
                                >
                                    {loading ? "Decrypting Payment Core..." : `Deploy License · ₹${selectedPlan.amount.toLocaleString()}`}
                                </button>

                                <button
                                    onClick={() => setShowUpgrade(false)}
                                    disabled={loading}
                                    className="w-full text-[10px] text-primary-400 font-black uppercase tracking-widest py-3 hover:text-primary-900 transition-colors"
                                >
                                    Cancel Request
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default Settings;
