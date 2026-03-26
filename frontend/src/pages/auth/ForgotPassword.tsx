import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Truck, Mail, ArrowLeft, ShieldCheck, RefreshCw, Lock, ArrowRight } from 'lucide-react';
import api from '../../services/api';

const ForgotPassword: React.FC = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const handleSendOTP = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await api.post('/auth/send-otp', { email, purpose: 'reset' });
            setStep(2);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to send reset code');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await api.post('/auth/verify-otp', { email, otp, purpose: 'reset' });
            setStep(3);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to verify OTP');
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await api.post('/auth/reset-password', { email, otp, newPassword });
            setSuccess(true);
            setTimeout(() => navigate('/login'), 3000);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to reset password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-primary-50 flex items-center justify-center p-6 animate-fade-in font-sans">
            <div className="bg-white rounded-[2.5rem] shadow-premium w-full max-w-lg p-10 sm:p-12 border border-primary-200 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-primary-900"></div>

                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-primary-50 border border-primary-100 rounded-3xl mb-6 text-primary-900 shadow-inner">
                        <Truck size={36} />
                    </div>
                    <h1 className="text-2xl font-black text-primary-900 uppercase tracking-tighter">
                        {success ? 'Password Reset' : step === 1 ? 'Forgot Password' : step === 2 ? 'Verify Email' : 'New Password'}
                    </h1>
                    <p className="text-xs font-bold text-primary-400 uppercase tracking-widest mt-2">
                        {success ? 'Password updated successfully' : step === 1 ? 'Reset your password' : step === 2 ? `Code sent to ${email}` : 'Create a new password'}
                    </p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-xs font-bold uppercase tracking-tight flex items-center gap-3 animate-shake">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
                        {error}
                    </div>
                )}

                {success && (
                    <div className="p-5 bg-emerald-50 border border-emerald-100 rounded-2xl text-emerald-700 text-xs font-bold uppercase tracking-tight flex flex-col items-center gap-4 text-center">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-600 animate-bounce" />
                            Success: Password Updated.
                        </div>
                        <p className="text-[10px] text-emerald-600/70">Redirecting to sign in...</p>
                    </div>
                )}

                {!success && step === 1 && (
                    <form onSubmit={handleSendOTP} className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-primary-400 uppercase tracking-widest ml-1">Email</label>
                            <div className="relative group">
                                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-primary-300 group-focus-within:text-primary-900 transition-colors" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-12 pr-4 py-4 bg-primary-50/50 border border-primary-100 rounded-2xl focus:ring-4 focus:ring-primary-900/5 focus:border-primary-900 outline-none transition-all text-sm font-bold placeholder:text-primary-200"
                                    placeholder="Enter your email"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-primary-900 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-black transition-all shadow-premium disabled:opacity-50 active:scale-[0.98] flex items-center justify-center gap-2"
                        >
                            {loading ? 'Sending...' : (
                                <>
                                    Continue
                                    <ArrowRight size={16} />
                                </>
                            )}
                        </button>
                    </form>
                )}

                {!success && step === 2 && (
                    <form onSubmit={handleVerifyOTP} className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-primary-400 uppercase tracking-widest ml-1">Verification Code</label>
                            <div className="relative group">
                                <ShieldCheck size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-primary-300 group-focus-within:text-primary-900 transition-colors" />
                                <input
                                    type="text"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    className="w-full pl-12 pr-4 py-4 bg-primary-50/50 border border-primary-100 rounded-2xl focus:ring-4 focus:ring-primary-900/5 focus:border-primary-900 outline-none transition-all text-center text-2xl font-black tracking-[0.5em] placeholder:text-primary-100"
                                    placeholder="000000"
                                    maxLength={6}
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-primary-900 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-black transition-all shadow-premium active:scale-[0.98] flex items-center justify-center gap-2"
                        >
                            Verify Code
                            <ArrowRight size={16} />
                        </button>

                        <button
                            type="button"
                            onClick={() => handleSendOTP()}
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-2 text-[10px] font-black text-primary-400 hover:text-primary-900 uppercase tracking-widest transition-colors disabled:opacity-50"
                        >
                            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                            Resend Code
                        </button>
                    </form>
                )}

                {!success && step === 3 && (
                    <form onSubmit={handleResetPassword} className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-primary-400 uppercase tracking-widest ml-1">New Password</label>
                            <div className="relative group">
                                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-primary-300 group-focus-within:text-primary-900 transition-colors" />
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="w-full pl-12 pr-4 py-4 bg-primary-50/50 border border-primary-100 rounded-2xl focus:ring-4 focus:ring-primary-900/5 focus:border-primary-900 outline-none transition-all text-sm font-bold placeholder:text-primary-200"
                                    placeholder="Set new password"
                                    required
                                    minLength={6}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-primary-900 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-black transition-all shadow-premium disabled:opacity-50 active:scale-[0.98]"
                        >
                            {loading ? 'Resetting Password...' : 'Reset Password'}
                        </button>
                    </form>
                )}

                {!success && (
                    <div className="mt-10 text-center">
                        <Link
                            to="/login"
                            className="inline-flex items-center justify-center gap-2 text-[10px] font-black text-primary-400 hover:text-primary-900 uppercase tracking-widest transition-colors"
                        >
                            <ArrowLeft size={16} />
                            Back to Sign In
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ForgotPassword;
