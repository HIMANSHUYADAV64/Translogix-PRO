import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../services/firebase';
import { googleSignIn } from '../../services/googleAuth';
import { Truck, Mail, Lock, Chrome } from 'lucide-react';

const Login: React.FC = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await signInWithEmailAndPassword(auth, email, password);
            navigate('/vehicles');
        } catch (err: any) {
            let msg = err.message || 'Failed to login';
            if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
                msg = 'Invalid email or password.';
            } else if (err.code === 'auth/too-many-requests') {
                msg = 'Too many attempts. Please try again later.';
            } else if (err.code === 'auth/invalid-email') {
                msg = 'Please enter a valid email address.';
            } else if (err.message === 'Network Error') {
                msg = 'Network Error. Please check your connection.';
            }
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setLoading(true);
        setError('');

        try {
            await googleSignIn();
            navigate('/vehicles');
        } catch (err: any) {
            setError(err.message || 'Failed to login with Google');
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
                    <h1 className="text-3xl font-black text-primary-900 uppercase tracking-tighter">Sign In</h1>
                    <p className="text-xs font-bold text-primary-400 uppercase tracking-widest mt-2">Welcome back to your fleet</p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-xs font-bold uppercase tracking-tight flex items-center gap-3 animate-shake">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-5">
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

                    <div className="space-y-2">
                        <div className="flex justify-between items-center px-1">
                            <label className="text-[10px] font-black text-primary-400 uppercase tracking-widest">Password</label>
                            <Link to="/forgot-password" title="Forgot Password?" className="text-[9px] font-black text-primary-400 hover:text-primary-900 uppercase tracking-widest transition-colors">
                                Forgot Password?
                            </Link>
                        </div>
                        <div className="relative group">
                            <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-primary-300 group-focus-within:text-primary-900 transition-colors" />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pl-12 pr-4 py-4 bg-primary-50/50 border border-primary-100 rounded-2xl focus:ring-4 focus:ring-primary-900/5 focus:border-primary-900 outline-none transition-all text-sm font-bold placeholder:text-primary-200"
                                placeholder="Enter your password"
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-primary-900 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-black transition-all shadow-premium disabled:opacity-50 active:scale-[0.98] mt-4"
                    >
                        {loading ? 'Signing In...' : 'Sign In'}
                    </button>
                </form>

                <div className="mt-10">
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-primary-100" />
                        </div>
                        <div className="relative flex justify-center text-[10px] font-black uppercase tracking-[0.2em]">
                            <span className="px-4 bg-white text-primary-200">Or continue with</span>
                        </div>
                    </div>

                    <button
                        onClick={handleGoogleLogin}
                        disabled={loading}
                        className="mt-6 w-full flex items-center justify-center gap-3 bg-white border border-primary-200 text-primary-900 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-primary-50 transition-all disabled:opacity-50 active:scale-[0.98]"
                    >
                        <Chrome size={18} />
                        Sign In with Google
                    </button>
                </div>

                <div className="mt-10 text-center">
                    <p className="text-[10px] font-bold text-primary-400 uppercase tracking-widest">
                        Don't have an account?{' '}
                        <Link to="/signup" className="text-primary-900 font-black hover:underline ml-1">
                            Sign Up
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
