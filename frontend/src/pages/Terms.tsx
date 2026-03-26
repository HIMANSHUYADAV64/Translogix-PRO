import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, CheckCircle, AlertCircle, CreditCard, XCircle } from 'lucide-react';
import Layout from '../components/Layout';

const Terms: React.FC = () => {
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
                            Terms of <span className="text-primary-400">Service</span>
                        </h1>
                        <p className="text-xs font-bold text-primary-400 uppercase tracking-widest mt-0.5">
                            Usage agreement and guidelines
                        </p>
                    </div>
                </div>

                {/* CONTENT */}
                <div className="bg-white border border-primary-200 rounded-[2rem] p-8 sm:p-10 shadow-premium space-y-8">
                    <Section
                        icon={CheckCircle}
                        title="Acceptance of Terms"
                        content="By accessing and using this fleet management application, you accept and agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the service."
                    />

                    <Section
                        icon={FileText}
                        title="Service Description"
                        content="We provide a comprehensive fleet management platform that allows you to track vehicles, manage drivers, record trips, schedule maintenance, and process payments. The service is provided 'as is' and we reserve the right to modify or discontinue features at any time."
                    />

                    <Section
                        icon={AlertCircle}
                        title="User Responsibilities"
                        content="You are responsible for maintaining the confidentiality of your account credentials, ensuring the accuracy of data you input, complying with all applicable laws and regulations, and using the service only for lawful purposes."
                    />

                    <Section
                        icon={CreditCard}
                        title="Subscription and Billing"
                        content="Paid subscriptions are billed in advance on a monthly or quarterly basis. You can cancel your subscription at any time, but refunds are not provided for partial billing periods. Prices are subject to change with 30 days notice."
                    />

                    <Section
                        icon={XCircle}
                        title="Termination"
                        content="We reserve the right to suspend or terminate your account if you violate these terms, engage in fraudulent activity, or fail to pay subscription fees. You may terminate your account at any time through the account settings."
                    />

                    <Section
                        icon={FileText}
                        title="Limitation of Liability"
                        content="We are not liable for any indirect, incidental, or consequential damages arising from your use of the service. Our total liability shall not exceed the amount you paid for the service in the past 12 months."
                    />

                    <div className="pt-6 border-t border-primary-100">
                        <p className="text-xs font-bold text-primary-400 uppercase tracking-widest">
                            Last Updated: February 2026
                        </p>
                        <p className="text-xs font-bold text-primary-500 mt-2">
                            For questions about these terms, please contact us through the feedback page.
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

export default Terms;
