
import React, { useEffect, useState, useMemo } from "react";
import { useAuth } from "../contexts/AuthContext";
// import { useSubscription } from "../contexts/SubscriptionContext";
import {
    userMaintenanceCol,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    db,
    collection,
} from "../services/firebase";
import Layout from "../components/Layout";

type MaintenanceEntry = {
    id?: string;
    vehicle: string;
    serviceType: string;
    description: string;
    date: string;
    cost: number;
    partsCost?: number;
    laborCost?: number;
    workshopName?: string;
    priority: "low" | "medium" | "high";
    nextServiceDate?: string;
    odometer?: number;
    status: "completed" | "pending" | "scheduled";
};

type VehicleLite = {
    vehicleNo: string;
    make?: string;
};

const Maintenance: React.FC = () => {
    const { user } = useAuth();
    // const { canAddResource } = useSubscription();

    const [vehicles, setVehicles] = useState<VehicleLite[]>([]);
    const [selectedVehicleNo, setSelectedVehicleNo] = useState<string | null>(null);
    const [records, setRecords] = useState<MaintenanceEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingVehicles, setLoadingVehicles] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [saving, setSaving] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState<MaintenanceEntry>({ vehicle: "", serviceType: "General Service", description: "", date: new Date().toISOString().split('T')[0], cost: 0, status: "completed", priority: "medium", partsCost: 0, laborCost: 0, workshopName: "", nextServiceDate: "" });
    const [editingId, setEditingId] = useState<string | null>(null);
    const [selectedRecord, setSelectedRecord] = useState<MaintenanceEntry | null>(null);

    const loadData = async () => {
        if (!user) return;
        setLoadingVehicles(true);
        try {
            const vSnap = await getDocs(collection(db, "users", user.uid, "vehicles"));
            setVehicles(vSnap.docs.map(d => ({ vehicleNo: (d.data().number || d.id).toUpperCase(), make: d.data().make })));

            const mSnap = await getDocs(userMaintenanceCol(user.uid));
            setRecords(mSnap.docs.map(d => ({ ...d.data(), id: d.id } as MaintenanceEntry)));
        } catch (err) { console.error(err); }
        finally { setLoadingVehicles(false); setLoading(false); }
    };

    useEffect(() => { loadData(); }, [user]);

    const filteredVehicles = useMemo(() => {
        const q = searchQuery.toUpperCase();
        return vehicles.filter(v => v.vehicleNo.includes(q) || v.make?.toUpperCase().includes(q));
    }, [vehicles, searchQuery]);

    const filteredRecords = useMemo(() => {
        return records.filter(r => {
            if (selectedVehicleNo && r.vehicle !== selectedVehicleNo) return false;
            const q = searchQuery.toUpperCase();
            return !searchQuery || r.serviceType.toUpperCase().includes(q) || r.description?.toUpperCase().includes(q) || r.workshopName?.toUpperCase().includes(q);
        }).sort((a, b) => b.date.localeCompare(a.date));
    }, [records, searchQuery, selectedVehicleNo]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault(); if (!user) return;
        setSaving(true);
        try {
            const payload = { ...form, vehicle: selectedVehicleNo || form.vehicle };
            if (editingId) { await updateDoc(doc(userMaintenanceCol(user.uid), editingId), payload); }
            else { await addDoc(userMaintenanceCol(user.uid), { ...payload, createdAt: new Date().toISOString() }); }
            await loadData(); setShowForm(false);
        } catch (err) { alert("Save failed"); }
        finally { setSaving(false); }
    };

    const handleDelete = async (id: string) => {
        if (user && confirm("Purge logic entry?")) {
            await deleteDoc(doc(userMaintenanceCol(user.uid), id));
            setRecords(r => r.filter(x => x.id !== id));
            setSelectedRecord(null);
        }
    };

    const badgeStatus = (s: string) => {
        if (s === "completed") return "bg-emerald-50 text-emerald-700 border-emerald-100";
        if (s === "pending") return "bg-amber-50 text-amber-700 border-amber-100";
        return "bg-slate-50 text-slate-700 border-slate-100";
    };

    return (
        <Layout>
            <div className="space-y-6 animate-fade-in">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
                    <div className="flex items-center gap-3">
                        {selectedVehicleNo && (
                            <button
                                onClick={() => setSelectedVehicleNo(null)}
                                className="p-2 rounded-xl bg-white border border-primary-200 text-primary-400 hover:text-accent-amber hover:border-accent-amber transition-all shadow-sm"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                        )}
                        <div>
                            <h1 className="text-2xl font-bold text-primary-900 uppercase tracking-tight">
                                Maintenance
                                {selectedVehicleNo && <span className="text-accent-amber ml-2">· {selectedVehicleNo}</span>}
                            </h1>
                            <p className="text-xs font-bold text-primary-400 uppercase tracking-widest mt-0.5">
                                {selectedVehicleNo ? "Vehicle Service Registry" : "Fleet Health Overview"}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {!selectedVehicleNo && (
                            <div className="relative group">
                                <input
                                    className="bg-white border border-primary-200 rounded-xl px-4 py-2.5 pl-10 text-sm text-primary-900 placeholder:text-primary-400 w-full sm:w-64 focus:ring-2 focus:ring-accent-amber/10 focus:border-accent-amber outline-none transition-all shadow-sm"
                                    placeholder="Search asset or service..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                                <svg className="absolute left-3 top-3 w-4 h-4 text-primary-400 group-focus-within:text-accent-amber transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                        )}
                        <button
                            onClick={() => {
                                setEditingId(null);
                                setForm({
                                    vehicle: selectedVehicleNo || "",
                                    serviceType: "General Service",
                                    description: "",
                                    date: new Date().toISOString().split("T")[0],
                                    cost: 0,
                                    status: "completed",
                                    priority: "medium",
                                    partsCost: 0,
                                    laborCost: 0,
                                    workshopName: "",
                                    nextServiceDate: "",
                                });
                                setShowForm(true);
                            }}
                            className="bg-primary-900 text-white px-5 py-2.5 rounded-xl text-sm font-bold uppercase tracking-tight hover:bg-black transition-all shadow-premium"
                        >
                            + Log Service
                        </button>
                    </div>
                </div>

                <div>
                    {!selectedVehicleNo ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {loadingVehicles
                                ? [1, 2, 3, 4].map((i) => (
                                    <div key={i} className="h-24 bg-white border border-primary-200 rounded-2xl animate-pulse" />
                                ))
                                : filteredVehicles.map((v) => (
                                    <button
                                        key={v.vehicleNo}
                                        onClick={() => setSelectedVehicleNo(v.vehicleNo)}
                                        className="bg-white border border-primary-200 p-5 rounded-2xl text-left hover:border-accent-amber hover:shadow-premium transition-all group"
                                    >
                                        <h3 className="text-lg font-extrabold text-primary-900 uppercase tracking-tight group-hover:text-accent-amber transition-colors">
                                            {v.vehicleNo}
                                        </h3>
                                        <p className="text-xs font-bold text-primary-400 uppercase tracking-widest mt-1">
                                            {v.make || "General Asset"}
                                        </p>
                                    </button>
                                ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {loading ? (
                                <div className="col-span-full text-center py-20 bg-white border border-primary-200 border-dashed rounded-2xl">
                                    <div className="w-10 h-10 border-4 border-accent-amber border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                                    <p className="text-sm font-bold text-primary-400 uppercase tracking-widest">Accessing records...</p>
                                </div>
                            ) : filteredRecords.length === 0 ? (
                                <div className="col-span-full text-center py-20 bg-white border border-primary-200 border-dashed rounded-2xl">
                                    <p className="text-sm font-bold text-primary-400 uppercase tracking-widest">No service history found</p>
                                </div>
                            ) : (
                                filteredRecords.map((r) => (
                                    <button
                                        key={r.id}
                                        onClick={() => setSelectedRecord(r)}
                                        className="bg-white border border-primary-200 rounded-2xl p-5 text-left flex justify-between items-start hover:border-accent-amber hover:shadow-premium transition-all group"
                                    >
                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center gap-2 mb-3">
                                                <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${badgeStatus(r.status)}`}>
                                                    {r.status}
                                                </span>
                                                <span className="text-[10px] font-bold text-primary-400 border border-primary-100 px-2 py-1 rounded-full uppercase tracking-wider">
                                                    {r.date}
                                                </span>
                                            </div>
                                            <h3 className="text-base font-extrabold text-primary-900 uppercase tracking-tight group-hover:text-accent-amber transition-colors">
                                                {r.serviceType}
                                            </h3>
                                            <p className="text-xs font-bold text-primary-400 uppercase tracking-widest mt-1 truncate">
                                                {r.workshopName || "Direct / In-House"}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-lg font-black text-primary-900 leading-none">₹{r.cost.toLocaleString()}</p>
                                            <span className={`text-[9px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-md mt-2 inline-block ${r.priority === 'high' ? 'bg-red-50 text-error border border-red-100' : 'bg-primary-50 text-primary-400 border border-primary-100'
                                                }`}>
                                                {r.priority}
                                            </span>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    )}
                </div>

                {selectedRecord && (
                    <div className="fixed inset-0 z-50 bg-primary-50 overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b border-primary-200 p-4 flex items-center justify-between no-print shadow-sm">
                            <button
                                onClick={() => setSelectedRecord(null)}
                                className="flex items-center gap-1.5 font-bold text-primary-500 hover:text-primary-900 transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                                </svg>
                                <span>Back</span>
                            </button>
                            <h2 className="font-extrabold text-primary-900 tracking-tight uppercase">Service Details</h2>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => {
                                        setEditingId(selectedRecord.id!);
                                        setForm({ ...selectedRecord });
                                        setShowForm(true);
                                        setSelectedRecord(null);
                                    }}
                                    className="px-6 py-2.5 rounded-xl bg-primary-900 text-white font-bold hover:bg-black transition-all shadow-premium"
                                >
                                    Modify
                                </button>
                            </div>
                        </div>

                        <div className="max-w-4xl mx-auto p-4 sm:p-8 space-y-6 animate-fade-in">
                            <section className="bg-white border border-primary-200 rounded-3xl p-8 shadow-premium relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-2 h-full bg-accent-amber"></div>
                                <div className="flex flex-col md:flex-row justify-between gap-8 mb-10">
                                    <div>
                                        <p className="text-[10px] font-extrabold text-primary-400 uppercase tracking-widest mb-1.5">Asset Condition</p>
                                        <h3 className="text-3xl font-black text-primary-900 uppercase tracking-tighter">
                                            {selectedRecord.serviceType}
                                        </h3>
                                        <p className="text-sm font-bold text-primary-400 uppercase tracking-widest mt-1">
                                            {selectedRecord.workshopName || "Direct / In-House"}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-extrabold text-primary-400 uppercase tracking-widest mb-1.5">Final Invoice</p>
                                        <p className="text-4xl font-black text-primary-900 tracking-tighter">₹{selectedRecord.cost.toLocaleString()}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 py-8 border-y border-primary-50">
                                    {[
                                        { label: "Status", value: selectedRecord.status, color: "text-accent-amber" },
                                        { label: "Priority", value: selectedRecord.priority, color: selectedRecord.priority === 'high' ? 'text-error' : 'text-primary-600' },
                                        { label: "Date", value: selectedRecord.date, color: "text-primary-900" },
                                        { label: "Odometer", value: `${selectedRecord.odometer?.toLocaleString() || "-"} KM`, color: "text-primary-900" },
                                    ].map((stat, i) => (
                                        <div key={i}>
                                            <p className="text-[9px] font-extrabold text-primary-300 uppercase tracking-widest mb-1">{stat.label}</p>
                                            <p className={`text-sm font-black uppercase ${stat.color}`}>{stat.value}</p>
                                        </div>
                                    ))}
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mt-8">
                                    <div>
                                        <p className="text-[9px] font-extrabold text-primary-300 uppercase tracking-widest mb-2">Cost Analysis</p>
                                        <div className="space-y-2">
                                            <div className="flex justify-between py-2 border-b border-primary-50">
                                                <span className="text-xs font-bold text-primary-500 uppercase">Parts & Spares</span>
                                                <span className="text-xs font-black text-primary-900">₹{selectedRecord.partsCost?.toLocaleString() || "0"}</span>
                                            </div>
                                            <div className="flex justify-between py-2 border-b border-primary-50">
                                                <span className="text-xs font-bold text-primary-500 uppercase">Labor Charges</span>
                                                <span className="text-xs font-black text-primary-900">₹{selectedRecord.laborCost?.toLocaleString() || "0"}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-extrabold text-primary-300 uppercase tracking-widest mb-2">Maintenance Note</p>
                                        <p className="text-sm font-medium text-primary-600 uppercase leading-relaxed italic">
                                            {selectedRecord.description || "No specific observations recorded for this service entry."}
                                        </p>
                                    </div>
                                </div>
                            </section>

                            <button
                                onClick={() => handleDelete(selectedRecord.id!)}
                                className="w-full py-4 rounded-2xl border border-red-100 text-error font-extrabold uppercase tracking-widest text-[11px] hover:bg-error hover:text-white hover:border-error transition-all flex items-center justify-center gap-2 no-print"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Purge Service Log
                            </button>
                        </div>
                    </div>
                )}

                {showForm && (
                    <div className="fixed inset-0 z-[60] bg-primary-50 overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b border-primary-200 p-4 flex items-center justify-between no-print shadow-sm">
                            <button
                                type="button"
                                onClick={() => setShowForm(false)}
                                className="font-bold text-primary-500 hover:text-primary-900 px-2"
                            >
                                Cancel
                            </button>
                            <h2 className="font-extrabold text-primary-900 tracking-tight uppercase">
                                {editingId ? "Edit Service" : "Log New Service"}
                            </h2>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="px-6 py-2.5 rounded-xl bg-primary-900 text-white font-bold hover:bg-black transition-all shadow-premium"
                            >
                                {saving ? "Saving..." : "Commit"}
                            </button>
                        </div>

                        <div className="max-w-2xl mx-auto p-4 sm:p-8 space-y-6">
                            <section className="bg-white border border-primary-200 rounded-3xl p-6 shadow-premium relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-2 h-full bg-accent-amber"></div>
                                <h3 className="text-xs font-black text-primary-900 mb-6 uppercase tracking-widest px-1">Service Particulars</h3>
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-extrabold text-primary-400 uppercase tracking-widest ml-1">Total Bill Amount *</label>
                                            <div className="relative">
                                                <span className="absolute left-4 top-3 text-primary-400 font-bold">₹</span>
                                                <input
                                                    type="number"
                                                    required
                                                    className="w-full bg-primary-50/50 border border-primary-100 rounded-xl pl-8 pr-4 py-3 text-sm font-bold text-primary-900 outline-none focus:ring-4 focus:ring-accent-amber/5 focus:border-accent-amber transition-all"
                                                    value={form.cost}
                                                    onChange={(e) => setForm({ ...form, cost: Number(e.target.value) })}
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-extrabold text-primary-400 uppercase tracking-widest ml-1">Service Category</label>
                                            <select
                                                className="w-full bg-primary-50/50 border border-primary-100 rounded-xl px-4 py-3 text-sm font-bold text-primary-900 uppercase outline-none focus:ring-4 focus:ring-accent-amber/5 focus:border-accent-amber transition-all appearance-none cursor-pointer"
                                                value={form.serviceType}
                                                onChange={(e) => setForm({ ...form, serviceType: e.target.value })}
                                            >
                                                {["Oil Change", "Tire Replacement", "Brake Service", "Engine Repair", "Electrical", "General Service", "Body Work"].map((c) => (
                                                    <option key={c} value={c}>
                                                        {c}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-extrabold text-primary-400 uppercase tracking-widest ml-1">Current Status</label>
                                            <select
                                                className="w-full bg-primary-50/50 border border-primary-100 rounded-xl px-4 py-3 text-sm font-bold text-primary-900 uppercase outline-none focus:ring-4 focus:ring-accent-amber/5 focus:border-accent-amber transition-all appearance-none cursor-pointer"
                                                value={form.status}
                                                onChange={(e) => setForm({ ...form, status: e.target.value as any })}
                                            >
                                                {["completed", "pending", "scheduled"].map((s) => (
                                                    <option key={s} value={s}>
                                                        {s}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-extrabold text-primary-400 uppercase tracking-widest ml-1">Urgency / Priority</label>
                                            <select
                                                className="w-full bg-primary-50/50 border border-primary-100 rounded-xl px-4 py-3 text-sm font-bold text-primary-900 uppercase outline-none focus:ring-4 focus:ring-accent-amber/5 focus:border-accent-amber transition-all appearance-none cursor-pointer"
                                                value={form.priority}
                                                onChange={(e) => setForm({ ...form, priority: e.target.value as any })}
                                            >
                                                {["low", "medium", "high"].map((s) => (
                                                    <option key={s} value={s}>
                                                        {s}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            <section className="bg-white border border-primary-200 rounded-3xl p-6 shadow-premium">
                                <h3 className="text-xs font-black text-primary-900 mb-6 uppercase tracking-widest px-1">Workshop & Timeline</h3>
                                <div className="space-y-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-extrabold text-primary-400 uppercase tracking-widest ml-1">Workshop Name</label>
                                        <input
                                            className="w-full bg-primary-50/50 border border-primary-100 rounded-xl px-4 py-3 text-sm font-bold text-primary-900 uppercase outline-none focus:ring-4 focus:ring-accent-amber/5 focus:border-accent-amber transition-all"
                                            value={form.workshopName}
                                            onChange={(e) => setForm({ ...form, workshopName: e.target.value.toUpperCase() })}
                                            placeholder="E.G. MAHINDRA AUTHORIZED SERVICE"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-extrabold text-primary-400 uppercase tracking-widest ml-1">Entry Date *</label>
                                            <input
                                                type="date"
                                                required
                                                className="w-full bg-primary-50/50 border border-primary-100 rounded-xl px-4 py-3 text-sm font-bold text-primary-900 outline-none focus:ring-4 focus:ring-accent-amber/5 focus:border-accent-amber transition-all"
                                                value={form.date}
                                                onChange={(e) => setForm({ ...form, date: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-extrabold text-primary-400 uppercase tracking-widest ml-1">Odometer Reading (KM)</label>
                                            <input
                                                type="number"
                                                className="w-full bg-primary-50/50 border border-primary-100 rounded-xl px-4 py-3 text-sm font-bold text-primary-900 outline-none focus:ring-4 focus:ring-accent-amber/5 focus:border-accent-amber transition-all"
                                                value={form.odometer || ""}
                                                onChange={(e) => setForm({ ...form, odometer: Number(e.target.value) })}
                                                placeholder="KM"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </section>

                            <section className="bg-white border border-primary-200 rounded-3xl p-6 shadow-premium">
                                <label className="text-[10px] font-extrabold text-primary-400 uppercase tracking-widest mb-1.5 block ml-1">Service Observations</label>
                                <textarea
                                    className="w-full bg-primary-50/50 border border-primary-100 rounded-xl px-4 py-3 text-sm font-medium text-primary-600 resize-none outline-none focus:ring-4 focus:ring-accent-amber/5 focus:border-accent-amber transition-all"
                                    rows={4}
                                    value={form.description}
                                    onChange={(e) => setForm({ ...form, description: e.target.value.toUpperCase() })}
                                    placeholder="DETAILED DESCRIPTION OF WORK DONE..."
                                />
                            </section>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default Maintenance;
