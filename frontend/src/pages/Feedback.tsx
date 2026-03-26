import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, MessageSquare, Send, CheckCircle } from 'lucide-react';
import Layout from '../components/Layout';

const Feedback: React.FC = () => {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const [type, setType] = useState<'bug' | 'feature' | 'general'>('general');
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        // Simulate submission
        setTimeout(() => {
            setSubmitting(false);
            setSubmitted(true);
            setTimeout(() => {
                navigate('/settings');
            }, 2000);
        }, 1000);
    };

    if (submitted) {
        return (
            <Layout>
                <div className="min-h-[60vh] flex items-center justify-center">
                    <div className="bg-white border border-primary-200 rounded-[2rem] p-10 shadow-premium text-center max-w-md animate-fade-in">
                        <div className="w-16 h-16 bg-emerald-50 border border-emerald-100 rounded-3xl flex items-center justify-center text-emerald-600 mx-auto mb-6">
                            <CheckCircle size={32} />
                        </div>
                        <h2 className="text-2xl font-black text-primary-900 uppercase tracking-tight mb-2">
                            Feedback Sent!
                        </h2>
                        <p className="text-sm font-bold text-primary-400 uppercase tracking-widest">
                            Thank you for your feedback
                        </p>
                        <p className="text-xs text-primary-500 mt-4">
                            Redirecting to settings...
                        </p>
                    </div>
                </div>
            </Layout>
        );
    }

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
                            Send <span className="text-primary-400">Feedback</span>
                        </h1>
                        <p className="text-xs font-bold text-primary-400 uppercase tracking-widest mt-0.5">
                            Help us improve the app
                        </p>
                    </div>
                </div>

                {/* FORM */}
                <form onSubmit={handleSubmit} className="bg-white border border-primary-200 rounded-[2rem] p-8 shadow-premium space-y-6">
                    {/* FEEDBACK TYPE */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-primary-400 uppercase tracking-widest ml-1">
                            Feedback Type
                        </label>
                        <div className="grid grid-cols-3 gap-3">
                            {[
                                { id: 'bug', label: 'Bug Report', emoji: '🐛' },
                                { id: 'feature', label: 'Feature Request', emoji: '💡' },
                                { id: 'general', label: 'General', emoji: '💬' }
                            ].map((item) => (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => setType(item.id as any)}
                                    className={`p-4 rounded-2xl border-2 transition-all text-center ${type === item.id
                                            ? 'border-accent-indigo bg-accent-indigo/5'
                                            : 'border-primary-100 hover:border-primary-200'
                                        }`}
                                >
                                    <div className="text-2xl mb-2">{item.emoji}</div>
                                    <div className="text-[10px] font-black uppercase tracking-widest text-primary-900">
                                        {item.label}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* SUBJECT */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-primary-400 uppercase tracking-widest ml-1">
                            Subject
                        </label>
                        <input
                            type="text"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            placeholder="Brief description of your feedback"
                            required
                            className="w-full px-4 py-4 bg-primary-50/50 border border-primary-100 rounded-2xl focus:ring-4 focus:ring-primary-900/5 focus:border-primary-900 outline-none transition-all text-sm font-bold placeholder:text-primary-200"
                        />
                    </div>

                    {/* MESSAGE */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-primary-400 uppercase tracking-widest ml-1">
                            Message
                        </label>
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Provide details about your feedback..."
                            required
                            rows={6}
                            className="w-full px-4 py-4 bg-primary-50/50 border border-primary-100 rounded-2xl focus:ring-4 focus:ring-primary-900/5 focus:border-primary-900 outline-none transition-all text-sm font-bold placeholder:text-primary-200 resize-none"
                        />
                    </div>

                    {/* EMAIL CONFIRMATION */}
                    <div className="bg-primary-50/50 border border-primary-100 rounded-2xl p-4">
                        <p className="text-xs font-bold text-primary-500">
                            <span className="text-primary-900">Response will be sent to:</span> {currentUser?.email}
                        </p>
                    </div>

                    {/* SUBMIT */}
                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full py-4 bg-primary-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-black transition-all shadow-premium disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        <Send size={16} />
                        {submitting ? 'Sending...' : 'Send Feedback'}
                    </button>
                </form>
            </div>
        </Layout>
    );
};

export default Feedback;
