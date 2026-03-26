import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, Lock, Database, Eye, UserCheck } from 'lucide-react';
import Layout from '../components/Layout';

const Privacy: React.FC = () => {
    const navigate = useNavigate();

    return (
        <Layout>
            <div className="max-w-4xl mx-auto space-y-6 pb-20 animate-fade-in">
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
                            Privacy <span className="text-primary-400">Policy</span>
                        </h1>
                        <p className="text-xs font-bold text-primary-400 uppercase tracking-widest mt-0.5">
                            How we protect your data
                        </p>
                    </div>
                </div>

                {/* CONTENT */}
                <div className="bg-white border border-primary-200 rounded-[2rem] p-8 sm:p-10 shadow-premium space-y-8">
                    <Section
                        icon={Database}
                        title="Information We Collect"
                        content="We collect information you provide directly to us, including your name, email address, phone number, and fleet management data such as vehicle information, driver details, trip records, and maintenance logs."
                    />

                    <Section
                        icon={Eye}
                        title="How We Use Your Data"
                        content="Your data is used to provide and improve our fleet management services, process transactions, send notifications about your account, and analyze usage patterns to enhance the application."
                    />

                    <Section
                        icon={Lock}
                        title="Data Security"
                        content="We implement industry-standard security measures including encryption, secure authentication, and regular security audits to protect your information from unauthorized access, alteration, or destruction."
                    />

                    <Section
                        icon={Shield}
                        title="Third-Party Services"
                        content="We use trusted third-party services including Firebase for authentication and database, Razorpay for payment processing, and analytics tools. These services have their own privacy policies and security measures."
                    />

                    <Section
                        icon={UserCheck}
                        title="Your Rights"
                        content="You have the right to access, update, or delete your personal information at any time. You can export your data or request account deletion through your account settings."
                    />

                    <div className="pt-6 border-t border-primary-100">
                        <p className="text-xs font-bold text-primary-400 uppercase tracking-widest">
                            Last Updated: February 2026
                        </p>
                        <p className="text-xs font-bold text-primary-500 mt-2">
                            For questions about our privacy practices, please contact us through the feedback page.
                        </p>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

const Section = ({ icon: Icon, title, content }: { icon: any; title: string; content: string }) => (
    <div className="space-y-3">
        <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-50 border border-primary-100 rounded-2xl flex items-center justify-center text-accent-indigo">
                <Icon size={20} />
            </div>
            <h2 className="text-lg font-black text-primary-900 uppercase tracking-tight">{title}</h2>
        </div>
        <p className="text-sm font-medium text-primary-600 leading-relaxed pl-13">
            {content}
        </p>
    </div>
);

export default Privacy;
