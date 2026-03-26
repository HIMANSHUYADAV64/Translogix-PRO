import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { User, Mail, Phone, Building2, ArrowLeft, Save } from 'lucide-react';
import Layout from '../components/Layout';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';

const Profile: React.FC = () => {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [name, setName] = useState(currentUser?.displayName || '');
    const [phone, setPhone] = useState('');
    const [company, setCompany] = useState('');

    const handleSave = async () => {
        if (!currentUser) return;
        setSaving(true);
        try {
            await updateDoc(doc(db, 'users', currentUser.uid), {
                displayName: name,
                phone,
                company,
                updatedAt: new Date().toISOString()
            });
            setEditing(false);
        } catch (error) {
            console.error('Failed to update profile:', error);
        } finally {
            setSaving(false);
        }
    };

    return (
        <Layout>
            <div className="max-w-3xl mx-auto space-y-6 pb-20 animate-fade-in">
                {/* HEADER */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/settings')}
                        className="p-2 rounded-xl bg-white border border-primary-200 text-primary-400 hover:text-primary-900 hover:border-primary-900 transition-all shadow-sm"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-black text-primary-900 uppercase tracking-tight">
                            Profile <span className="text-primary-400">Settings</span>
                        </h1>
                        <p className="text-xs font-bold text-primary-400 uppercase tracking-widest mt-0.5">
                            Manage your personal information
                        </p>
                    </div>
                </div>

                {/* PROFILE CARD */}
                <div className="bg-white border border-primary-200 rounded-[2rem] p-8 shadow-premium">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-primary-50 border border-primary-100 rounded-3xl flex items-center justify-center text-accent-indigo shadow-inner">
                                <User size={32} />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-primary-900 uppercase tracking-tight">
                                    {currentUser?.displayName || 'Fleet Operator'}
                                </h2>
                                <p className="text-xs font-bold text-primary-400 uppercase tracking-widest">
                                    Account ID: {currentUser?.uid.slice(0, 8)}...
                                </p>
                            </div>
                        </div>
                        {!editing && (
                            <button
                                onClick={() => setEditing(true)}
                                className="px-4 py-2 bg-primary-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-black transition-all"
                            >
                                Edit Profile
                            </button>
                        )}
                    </div>

                    <div className="space-y-5">
                        {/* NAME */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-primary-400 uppercase tracking-widest ml-1">
                                Full Name
                            </label>
                            <div className="relative group">
                                <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-primary-300" />
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    disabled={!editing}
                                    className="w-full pl-12 pr-4 py-4 bg-primary-50/50 border border-primary-100 rounded-2xl focus:ring-4 focus:ring-primary-900/5 focus:border-primary-900 outline-none transition-all text-sm font-bold disabled:opacity-50"
                                />
                            </div>
                        </div>

                        {/* EMAIL */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-primary-400 uppercase tracking-widest ml-1">
                                Email Address
                            </label>
                            <div className="relative group">
                                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-primary-300" />
                                <input
                                    type="email"
                                    value={currentUser?.email || ''}
                                    disabled
                                    className="w-full pl-12 pr-4 py-4 bg-primary-50/50 border border-primary-100 rounded-2xl text-sm font-bold opacity-50"
                                />
                            </div>
                            <p className="text-[9px] font-bold text-primary-300 uppercase tracking-widest ml-1">
                                Email cannot be changed
                            </p>
                        </div>

                        {/* PHONE */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-primary-400 uppercase tracking-widest ml-1">
                                Phone Number
                            </label>
                            <div className="relative group">
                                <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-primary-300" />
                                <input
                                    type="tel"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    disabled={!editing}
                                    placeholder="Enter phone number"
                                    className="w-full pl-12 pr-4 py-4 bg-primary-50/50 border border-primary-100 rounded-2xl focus:ring-4 focus:ring-primary-900/5 focus:border-primary-900 outline-none transition-all text-sm font-bold disabled:opacity-50 placeholder:text-primary-200"
                                />
                            </div>
                        </div>

                        {/* COMPANY */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-primary-400 uppercase tracking-widest ml-1">
                                Company / Fleet Name
                            </label>
                            <div className="relative group">
                                <Building2 size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-primary-300" />
                                <input
                                    type="text"
                                    value={company}
                                    onChange={(e) => setCompany(e.target.value)}
                                    disabled={!editing}
                                    placeholder="Enter company name"
                                    className="w-full pl-12 pr-4 py-4 bg-primary-50/50 border border-primary-100 rounded-2xl focus:ring-4 focus:ring-primary-900/5 focus:border-primary-900 outline-none transition-all text-sm font-bold disabled:opacity-50 placeholder:text-primary-200"
                                />
                            </div>
                        </div>

                        {editing && (
                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="flex-1 py-4 bg-primary-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-black transition-all shadow-premium disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    <Save size={16} />
                                    {saving ? 'Saving...' : 'Save Changes'}
                                </button>
                                <button
                                    onClick={() => setEditing(false)}
                                    disabled={saving}
                                    className="px-6 py-4 bg-white border border-primary-200 text-primary-900 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-primary-50 transition-all"
                                >
                                    Cancel
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* ACCOUNT INFO */}
                <div className="bg-white border border-primary-200 rounded-[2rem] p-8 shadow-premium">
                    <h3 className="text-sm font-black text-primary-900 uppercase tracking-tight mb-6">
                        Account Information
                    </h3>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center py-3 border-b border-primary-50">
                            <span className="text-xs font-bold text-primary-400 uppercase tracking-widest">User ID</span>
                            <span className="text-xs font-black text-primary-900 font-mono">{currentUser?.uid}</span>
                        </div>
                        <div className="flex justify-between items-center py-3 border-b border-primary-50">
                            <span className="text-xs font-bold text-primary-400 uppercase tracking-widest">Email Verified</span>
                            <span className="text-xs font-black text-primary-900">{currentUser?.emailVerified ? 'Yes' : 'No'}</span>
                        </div>
                        <div className="flex justify-between items-center py-3">
                            <span className="text-xs font-bold text-primary-400 uppercase tracking-widest">Account Created</span>
                            <span className="text-xs font-black text-primary-900">
                                {currentUser?.metadata.creationTime ? new Date(currentUser.metadata.creationTime).toLocaleDateString() : 'N/A'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default Profile;
