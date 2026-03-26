import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signInWithCustomToken } from 'firebase/auth';
import { auth } from '../../services/firebase';
import { googleSignIn } from '../../services/googleAuth';
import { Truck, Mail, Lock, User, Chrome, ArrowRight, ShieldCheck, RefreshCw } from 'lucide-react';
import api from '../../services/api';

const Signup: React.FC = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSendOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await api.post('/auth/send-otp', { email, purpose: 'signup' });
            setStep(2);
        } catch (err: any) {
            const msg = err.message === 'Network Error' 
                ? 'Network error: Cannot reach the backend. If on mobile, ensure VITE_API_URL uses your PC IP, not localhost.' 
                : (err.response?.data?.error || 'Failed to send OTP');
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await api.post('/auth/verify-otp', { email, otp, purpose: 'signup' });
            setStep(3);
        } catch (err: any) {
            const msg = err.message === 'Network Error' 
                ? 'Network error: Cannot reach the backend.' 
                : (err.response?.data?.error || 'Failed to verify OTP');
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    const handleCompleteSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await api.post('/auth/signup', { name, email, password, otp });
            const { token } = response.data;
            await signInWithCustomToken(auth, token);
            navigate('/vehicles');
        } catch (err: any) {
            const msg = err.message === 'Network Error' 
                ? 'Network error: Cannot reach the backend.' 
                : (err.response?.data?.error || 'Signup failed');
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignup = async () => {
        setLoading(true);
        setError('');

        try {
            // Use platform-aware Google Sign-In (native on Android, popup on web)
            const result = await googleSignIn();
            const idToken = await result.user.getIdToken();
            // Send the ID token to backend to create user document
            try {
                await api.post('/auth/google-signup', { idToken });
            } catch (backendErr) {
                // If backend call fails, user is already authenticated via Firebase
                // The user document may already exist (login vs signup)
                console.warn('Backend google-signup call failed, user may already exist:', backendErr);
            }
            navigate('/vehicles');
        } catch (err: any) {
            setError(err.message || 'Failed to sign up with Google');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-primary-50 flex items-center justify-center p-6 animate-fade-in font-sans py-12">
            <div className="bg-white rounded-[2.5rem] shadow-premium w-full max-w-lg p-10 sm:p-12 border border-primary-200 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-primary-900"></div>

                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-primary-50 border border-primary-100 rounded-3xl mb-6 text-primary-900 shadow-inner">
                        <Truck size={36} />
                    </div>
                    <h1 className="text-3xl font-black text-primary-900 uppercase tracking-tighter">
                        {step === 1 ? 'Sign Up' : step === 2 ? 'Verify Email' : 'Set Password'}
                    </h1>
                    <p className="text-xs font-bold text-primary-400 uppercase tracking-widest mt-2">
                        {step === 1 ? 'Create your fleet account' : step === 2 ? `Code sent to ${email}` : 'Secure your account'}
                    </p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-xs font-bold uppercase tracking-tight flex items-center gap-3 animate-shake">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
                        {error}
                    </div>
                )}

                {step === 1 && (
                    <form onSubmit={handleSendOTP} className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-primary-400 uppercase tracking-widest ml-1">Full Name</label>
                            <div className="relative group">
                                <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-primary-300 group-focus-within:text-primary-900 transition-colors" />
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full pl-12 pr-4 py-4 bg-primary-50/50 border border-primary-100 rounded-2xl focus:ring-4 focus:ring-primary-900/5 focus:border-primary-900 outline-none transition-all text-sm font-bold placeholder:text-primary-200"
                                    placeholder="Enter your name"
                                    required
                                />
                            </div>
                        </div>

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
                            className="w-full bg-primary-900 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-black transition-all shadow-premium disabled:opacity-50 active:scale-[0.98] mt-4 flex items-center justify-center gap-2"
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

                {step === 2 && (
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
                            disabled={loading}
                            className="w-full bg-primary-900 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-black transition-all shadow-premium active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {loading ? 'Verifying...' : (
                                <>
                                    Verify Code
                                    <ArrowRight size={16} />
                                </>
                            )}
                        </button>

                        <button
                            type="button"
                            onClick={handleSendOTP}
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-2 text-[10px] font-black text-primary-400 hover:text-primary-900 uppercase tracking-widest transition-colors disabled:opacity-50"
                        >
                            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                            Resend Code
                        </button>
                    </form>
                )}

                {step === 3 && (
                    <form onSubmit={handleCompleteSignup} className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-primary-400 uppercase tracking-widest ml-1">Password</label>
                            <div className="relative group">
                                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-primary-300 group-focus-within:text-primary-900 transition-colors" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-12 pr-4 py-4 bg-primary-50/50 border border-primary-100 rounded-2xl focus:ring-4 focus:ring-primary-900/5 focus:border-primary-900 outline-none transition-all text-sm font-bold placeholder:text-primary-200"
                                    placeholder="Set account password"
                                    required
                                    minLength={6}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-primary-900 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-black transition-all shadow-premium disabled:opacity-50 active:scale-[0.98] mt-4"
                        >
                            {loading ? 'Creating Account...' : 'Create Account'}
                        </button>
                    </form>
                )}

                {step === 1 && (
                    <div className="mt-10">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-primary-100" />
                            </div>
                            <div className="relative flex justify-center text-[10px] font-black uppercase tracking-[0.2em]">
                                <span className="px-4 bg-white text-primary-200">Or sign up with</span>
                            </div>
                        </div>

                        <button
                            onClick={handleGoogleSignup}
                            disabled={loading}
                            className="mt-6 w-full flex items-center justify-center gap-3 bg-white border border-primary-200 text-primary-900 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-primary-50 transition-all disabled:opacity-50 active:scale-[0.98]"
                        >
                            <Chrome size={18} />
                            Sign Up with Google
                        </button>
                    </div>
                )}

                <div className="mt-10 text-center">
                    <p className="text-[10px] font-bold text-primary-400 uppercase tracking-widest">
                        Already have an account?{' '}
                        <Link to="/login" className="text-primary-900 font-black hover:underline ml-1">
                            Sign In
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Signup;
