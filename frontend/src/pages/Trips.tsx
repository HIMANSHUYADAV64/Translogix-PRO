
import React, { useEffect, useState, useMemo } from "react";
import { useAuth } from "../contexts/AuthContext";
// import { useSubscription } from "../contexts/SubscriptionContext";
import {
    userTripsCol,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    db,
    collection,
} from "../services/firebase";
import Layout from "../components/Layout";

type Trip = {
    id?: string;
    vehicle: string;
    driver: string;
    fromLocation: string;
    toLocation: string;
    tripDate: string;
    startTime?: string;
    endTime?: string;
    distanceKm: number;
    fuelUsed: number;
    fuelCost: number;
    toll: number;
    otherExpenses: number;
    cargoType?: string;
    cargoWeight?: number;
    status: "planned" | "ongoing" | "completed";
    notes?: string;
};

type VehicleLite = {
    id: string;
    number: string;
    make?: string;
};

const Trips: React.FC = () => {
    const { user } = useAuth();


    const [vehicles, setVehicles] = useState<VehicleLite[]>([]);
    const [selectedVehicleNo, setSelectedVehicleNo] = useState<string | null>(null);
    const [trips, setTrips] = useState<Trip[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingVehicles, setLoadingVehicles] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [saving, setSaving] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState<Trip>({ vehicle: "", driver: "", fromLocation: "", toLocation: "", tripDate: new Date().toISOString().split('T')[0], startTime: "", endTime: "", distanceKm: 0, fuelUsed: 0, fuelCost: 0, toll: 0, otherExpenses: 0, status: "planned", cargoType: "", cargoWeight: 0, notes: "" });
    const [editingId, setEditingId] = useState<string | null>(null);
    const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);

    const loadData = async () => {
        if (!user) return;
        setLoadingVehicles(true);
        try {
            const vSnap = await getDocs(collection(db, "users", user.uid, "vehicles"));
            setVehicles(vSnap.docs.map(d => ({ id: d.id, number: (d.data().number || d.id).toUpperCase(), make: d.data().make })));

            const tSnap = await getDocs(userTripsCol(user.uid));
            setTrips(tSnap.docs.map(d => ({ ...d.data(), id: d.id } as Trip)));
        } catch (err) { console.error(err); }
        finally { setLoadingVehicles(false); setLoading(false); }
    };

    useEffect(() => { loadData(); }, [user]);

    const filteredVehicles = useMemo(() => {
        const q = searchQuery.toUpperCase();
        return vehicles.filter(v => v.number.includes(q) || v.make?.toUpperCase().includes(q));
    }, [vehicles, searchQuery]);

    const filteredTrips = useMemo(() => {
        return trips.filter(t => {
            if (selectedVehicleNo && t.vehicle !== selectedVehicleNo) return false;
            const q = searchQuery.toUpperCase();
            return !searchQuery || t.driver.toUpperCase().includes(q) || t.fromLocation.toUpperCase().includes(q) || t.toLocation.toUpperCase().includes(q);
        }).sort((a, b) => b.tripDate.localeCompare(a.tripDate));
    }, [trips, searchQuery, selectedVehicleNo]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault(); if (!user) return;
        setSaving(true);
        try {
            const payload = { ...form, vehicle: selectedVehicleNo || form.vehicle };
            if (editingId) { await updateDoc(doc(userTripsCol(user.uid), editingId), payload); }
            else { await addDoc(userTripsCol(user.uid), { ...payload, createdAt: new Date().toISOString() }); }
            await loadData(); setShowForm(false);
        } catch (err) { alert("Save failed"); }
        finally { setSaving(false); }
    };

    const handleDelete = async (id: string) => {
        if (user && confirm("Purge trip manifest?")) {
            await deleteDoc(doc(userTripsCol(user.uid), id));
            setTrips(t => t.filter(x => x.id !== id));
            setSelectedTrip(null);
        }
    };

    const badgeStatus = (s: string) => {
        if (s === "completed") return "bg-emerald-50 text-emerald-700 border-emerald-100";
        if (s === "ongoing") return "bg-indigo-50 text-accent-indigo border-indigo-100 shadow-sm";
        return "bg-slate-50 text-slate-500 border-slate-100";
    };

    return (
        <Layout>
            <div className="space-y-6 animate-fade-in">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
                    <div className="flex items-center gap-3">
                        {selectedVehicleNo && (
                            <button
                                onClick={() => setSelectedVehicleNo(null)}
                                className="p-2 rounded-xl bg-white border border-primary-200 text-primary-400 hover:text-accent-indigo hover:border-accent-indigo transition-all shadow-sm"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                        )}
                        <div>
                            <h1 className="text-2xl font-bold text-primary-900 uppercase tracking-tight">
                                Trip <span className="text-primary-400">Registry</span>
                                {selectedVehicleNo && <span className="text-accent-indigo ml-2">· {selectedVehicleNo}</span>}
                            </h1>
                            <p className="text-xs font-bold text-primary-400 uppercase tracking-widest mt-0.5">
                                {selectedVehicleNo ? "Asset Operational Logs" : "Fleet Movement Overview"}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {!selectedVehicleNo && (
                            <div className="relative group">
                                <input
                                    className="bg-white border border-primary-200 rounded-xl px-4 py-2.5 pl-10 text-sm text-primary-900 placeholder:text-primary-400 w-full sm:w-64 focus:ring-2 focus:ring-accent-indigo/10 focus:border-accent-indigo outline-none transition-all shadow-sm"
                                    placeholder="Search manifests..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                                <svg className="absolute left-3 top-3 w-4 h-4 text-primary-400 group-focus-within:text-accent-indigo transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                        )}
                        <button
                            onClick={() => {
                                setEditingId(null);
                                setForm({
                                    vehicle: selectedVehicleNo || "",
                                    driver: "",
                                    fromLocation: "",
                                    toLocation: "",
                                    tripDate: new Date().toISOString().split("T")[0],
                                    startTime: "",
                                    endTime: "",
                                    distanceKm: 0,
                                    fuelUsed: 0,
                                    fuelCost: 0,
                                    toll: 0,
                                    otherExpenses: 0,
                                    status: "planned",
                                    cargoType: "",
                                    cargoWeight: 0,
                                    notes: "",
                                });
                                setShowForm(true);
                            }}
                            className="bg-primary-900 text-white px-5 py-2.5 rounded-xl text-sm font-bold uppercase tracking-tight hover:bg-black transition-all shadow-premium"
                        >
                            + Add
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
                                        key={v.id}
                                        onClick={() => setSelectedVehicleNo(v.number)}
                                        className="bg-white border border-primary-200 p-5 rounded-2xl text-left hover:border-accent-indigo hover:shadow-premium transition-all group"
                                    >
                                        <h3 className="text-lg font-extrabold text-primary-900 uppercase tracking-tight group-hover:text-accent-indigo transition-colors">
                                            {v.number}
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
                                    <div className="w-10 h-10 border-4 border-accent-indigo border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                                    <p className="text-sm font-bold text-primary-400 uppercase tracking-widest">Scanning manifests...</p>
                                </div>
                            ) : filteredTrips.length === 0 ? (
                                <div className="col-span-full text-center py-20 bg-white border border-primary-200 border-dashed rounded-2xl">
                                    <p className="text-sm font-bold text-primary-400 uppercase tracking-widest">No trips recorded for this asset</p>
                                </div>
                            ) : (
                                filteredTrips.map((t) => (
                                    <button
                                        key={t.id}
                                        onClick={() => setSelectedTrip(t)}
                                        className="bg-white border border-primary-200 rounded-2xl p-5 text-left flex justify-between items-start hover:border-accent-indigo hover:shadow-premium transition-all group"
                                    >
                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center gap-2 mb-3">
                                                <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${badgeStatus(t.status)}`}>
                                                    {t.status}
                                                </span>
                                                <span className="text-[10px] font-bold text-primary-400 border border-primary-100 px-2 py-1 rounded-full uppercase tracking-wider">
                                                    {t.tripDate}
                                                </span>
                                            </div>
                                            <h3 className="text-base font-extrabold text-primary-900 uppercase tracking-tight group-hover:text-accent-indigo transition-colors truncate pr-4">
                                                {t.fromLocation} → {t.toLocation}
                                            </h3>
                                            <p className="text-xs font-bold text-primary-400 uppercase tracking-widest mt-1">
                                                {t.driver}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-lg font-black text-primary-900 leading-none">{t.distanceKm} <span className="text-[10px]">KM</span></p>
                                            <span className="text-[9px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-md mt-2 inline-block bg-primary-50 text-primary-400 border border-primary-100">
                                                ₹{((t.fuelCost || 0) + (t.toll || 0) + (t.otherExpenses || 0)).toLocaleString()}
                                            </span>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    )}
                </div>

                {selectedTrip && (
                    <div className="fixed inset-0 z-50 bg-primary-50 overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b border-primary-200 p-4 flex items-center justify-between no-print shadow-sm">
                            <button
                                onClick={() => setSelectedTrip(null)}
                                className="flex items-center gap-1.5 font-bold text-primary-500 hover:text-primary-900 transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                                </svg>
                                <span>Back</span>
                            </button>
                            <h2 className="font-extrabold text-primary-900 tracking-tight uppercase">Manifest Registry</h2>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => {
                                        setEditingId(selectedTrip.id!);
                                        setForm({ ...selectedTrip });
                                        setShowForm(true);
                                        setSelectedTrip(null);
                                    }}
                                    className="px-6 py-2.5 rounded-xl bg-primary-900 text-white font-bold hover:bg-black transition-all shadow-premium"
                                >
                                    Record Adjustment
                                </button>
                            </div>
                        </div>

                        <div className="max-w-4xl mx-auto p-4 sm:p-8 space-y-6 animate-fade-in">
                            <section className="bg-white border border-primary-200 rounded-3xl p-8 shadow-premium relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-2 h-full bg-accent-indigo"></div>
                                <div className="flex flex-col md:flex-row justify-between gap-8 mb-10">
                                    <div>
                                        <p className="text-[10px] font-extrabold text-primary-400 uppercase tracking-widest mb-1.5">Route Timeline</p>
                                        <h3 className="text-3xl font-black text-primary-900 uppercase tracking-tighter">
                                            {selectedTrip.fromLocation} <span className="text-primary-300 mx-2">→</span> {selectedTrip.toLocation}
                                        </h3>
                                        <p className="text-sm font-bold text-primary-400 uppercase tracking-widest mt-1">
                                            Manifest Class: {selectedTrip.cargoType || "General Cargo"} · {selectedTrip.cargoWeight || 0} Tons
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-extrabold text-primary-400 uppercase tracking-widest mb-1.5">Total Payload Flow</p>
                                        <p className="text-4xl font-black text-primary-900 tracking-tighter">₹{((selectedTrip.fuelCost || 0) + (selectedTrip.toll || 0) + (selectedTrip.otherExpenses || 0)).toLocaleString()}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 py-8 border-y border-primary-50">
                                    {[
                                        { label: "Asset Unit", value: selectedTrip.vehicle, color: "text-accent-indigo" },
                                        { label: "Personnel", value: selectedTrip.driver, color: "text-primary-900" },
                                        { label: "Distance", value: `${selectedTrip.distanceKm} KM`, color: "text-primary-900" },
                                        { label: "Manifest Date", value: selectedTrip.tripDate, color: "text-primary-900" },
                                    ].map((stat, i) => (
                                        <div key={i}>
                                            <p className="text-[9px] font-extrabold text-primary-300 uppercase tracking-widest mb-1">{stat.label}</p>
                                            <p className={`text-sm font-black uppercase ${stat.color}`}>{stat.value}</p>
                                        </div>
                                    ))}
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 py-8 border-b border-primary-50">
                                    <div>
                                        <p className="text-[9px] font-extrabold text-primary-300 uppercase tracking-widest mb-1">Fuel Expenditure</p>
                                        <p className="text-xl font-black text-primary-900">₹{selectedTrip.fuelCost?.toLocaleString()}</p>
                                        <p className="text-[10px] font-bold text-primary-400 uppercase">Class-1 Diesel</p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-extrabold text-primary-300 uppercase tracking-widest mb-1">Toll / Fastag</p>
                                        <p className="text-xl font-black text-primary-900">₹{selectedTrip.toll?.toLocaleString()}</p>
                                        <p className="text-[10px] font-bold text-primary-400 uppercase">National Highways</p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-extrabold text-primary-300 uppercase tracking-widest mb-1">Miscellaneous</p>
                                        <p className="text-xl font-black text-primary-900">₹{selectedTrip.otherExpenses?.toLocaleString()}</p>
                                        <p className="text-[10px] font-bold text-primary-400 uppercase">Incidental Costs</p>
                                    </div>
                                </div>

                                <div className="mt-8">
                                    <p className="text-[9px] font-extrabold text-primary-300 uppercase tracking-widest mb-2">Manifest Registry Notes</p>
                                    <div className="bg-primary-50/50 rounded-2xl p-6 border border-primary-100">
                                        <p className="text-sm font-medium text-primary-600 uppercase leading-relaxed text-pre">
                                            {selectedTrip.notes || "No additional specific details recorded for this movement."}
                                        </p>
                                    </div>
                                </div>
                            </section>

                            <button
                                onClick={() => handleDelete(selectedTrip.id!)}
                                className="w-full py-4 rounded-2xl border border-red-100 text-error font-extrabold uppercase tracking-widest text-[11px] hover:bg-error hover:text-white hover:border-error transition-all flex items-center justify-center gap-2 no-print"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Purge Trip Manifest
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
                                {editingId ? "Update Manifest" : "New Trip Registry"}
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
                                <div className="absolute top-0 left-0 w-2 h-full bg-accent-indigo"></div>
                                <h3 className="text-xs font-black text-primary-900 mb-6 uppercase tracking-widest px-1">Route & Personnel</h3>
                                <div className="space-y-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-extrabold text-primary-400 uppercase tracking-widest ml-1">Driver Name *</label>
                                        <input
                                            required
                                            className="w-full bg-primary-50/50 border border-primary-100 rounded-xl px-4 py-3 text-sm font-bold text-primary-900 uppercase outline-none focus:ring-4 focus:ring-accent-indigo/5 focus:border-accent-indigo transition-all"
                                            value={form.driver}
                                            onChange={(e) => setForm({ ...form, driver: e.target.value.toUpperCase() })}
                                            placeholder="E.G. RAJESH KUMAR"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-extrabold text-primary-400 uppercase tracking-widest ml-1">Origin *</label>
                                            <input
                                                required
                                                className="w-full bg-primary-50/50 border border-primary-100 rounded-xl px-4 py-3 text-sm font-bold text-primary-900 uppercase outline-none focus:ring-4 focus:ring-accent-indigo/5 focus:border-accent-indigo transition-all"
                                                value={form.fromLocation}
                                                onChange={(e) => setForm({ ...form, fromLocation: e.target.value.toUpperCase() })}
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-extrabold text-primary-400 uppercase tracking-widest ml-1">Destination *</label>
                                            <input
                                                required
                                                className="w-full bg-primary-50/50 border border-primary-100 rounded-xl px-4 py-3 text-sm font-bold text-primary-900 uppercase outline-none focus:ring-4 focus:ring-accent-indigo/5 focus:border-accent-indigo transition-all"
                                                value={form.toLocation}
                                                onChange={(e) => setForm({ ...form, toLocation: e.target.value.toUpperCase() })}
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-extrabold text-primary-400 uppercase tracking-widest ml-1">Manifest Date *</label>
                                            <input
                                                type="date"
                                                required
                                                className="w-full bg-primary-50/50 border border-primary-100 rounded-xl px-4 py-3 text-sm font-bold text-primary-900 outline-none focus:ring-4 focus:ring-accent-indigo/5 focus:border-accent-indigo transition-all"
                                                value={form.tripDate}
                                                onChange={(e) => setForm({ ...form, tripDate: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-extrabold text-primary-400 uppercase tracking-widest ml-1">Status</label>
                                            <select
                                                className="w-full bg-primary-50/50 border border-primary-100 rounded-xl px-4 py-3 text-sm font-bold text-primary-900 uppercase outline-none focus:ring-4 focus:ring-accent-indigo/5 focus:border-accent-indigo transition-all appearance-none cursor-pointer"
                                                value={form.status}
                                                onChange={(e) => setForm({ ...form, status: e.target.value as any })}
                                            >
                                                {["planned", "ongoing", "completed"].map((s) => (
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
                                <h3 className="text-xs font-black text-primary-900 mb-6 uppercase tracking-widest px-1">Payload & Timeline</h3>
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-extrabold text-primary-400 uppercase tracking-widest ml-1">Cargo Class</label>
                                            <input
                                                className="w-full bg-primary-50/50 border border-primary-100 rounded-xl px-4 py-3 text-sm font-bold text-primary-900 uppercase outline-none focus:ring-4 focus:ring-accent-indigo/5 focus:border-accent-indigo transition-all"
                                                value={form.cargoType}
                                                onChange={(e) => setForm({ ...form, cargoType: e.target.value.toUpperCase() })}
                                                placeholder="E.G. COAL"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-extrabold text-primary-400 uppercase tracking-widest ml-1">Weight (Tons)</label>
                                            <input
                                                type="number"
                                                className="w-full bg-primary-50/50 border border-primary-100 rounded-xl px-4 py-3 text-sm font-bold text-primary-900 outline-none focus:ring-4 focus:ring-accent-indigo/5 focus:border-accent-indigo transition-all"
                                                value={form.cargoWeight || ""}
                                                onChange={(e) => setForm({ ...form, cargoWeight: Number(e.target.value) })}
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-extrabold text-primary-400 uppercase tracking-widest ml-1">Commence Time</label>
                                            <input
                                                type="time"
                                                className="w-full bg-primary-50/50 border border-primary-100 rounded-xl px-4 py-3 text-sm font-bold text-primary-900 outline-none focus:ring-4 focus:ring-accent-indigo/5 focus:border-accent-indigo transition-all"
                                                value={form.startTime}
                                                onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-extrabold text-primary-400 uppercase tracking-widest ml-1">Conclusion Time</label>
                                            <input
                                                type="time"
                                                className="w-full bg-primary-50/50 border border-primary-100 rounded-xl px-4 py-3 text-sm font-bold text-primary-900 outline-none focus:ring-4 focus:ring-accent-indigo/5 focus:border-accent-indigo transition-all"
                                                value={form.endTime}
                                                onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </section>

                            <section className="bg-white border border-primary-200 rounded-3xl p-6 shadow-premium">
                                <h3 className="text-xs font-black text-primary-900 mb-6 uppercase tracking-widest px-1">Operational Manifest</h3>
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-extrabold text-primary-400 uppercase tracking-widest ml-1">Trip Distance (KM)</label>
                                            <input
                                                type="number"
                                                className="w-full bg-primary-50/50 border border-primary-100 rounded-xl px-4 py-3 text-sm font-bold text-primary-900 outline-none focus:ring-4 focus:ring-accent-indigo/5 focus:border-accent-indigo transition-all"
                                                value={form.distanceKm}
                                                onChange={(e) => setForm({ ...form, distanceKm: Number(e.target.value) })}
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-extrabold text-primary-400 uppercase tracking-widest ml-1">Total Fuel (Ltrs)</label>
                                            <input
                                                type="number"
                                                className="w-full bg-primary-50/50 border border-primary-100 rounded-xl px-4 py-3 text-sm font-bold text-primary-900 outline-none focus:ring-4 focus:ring-accent-indigo/5 focus:border-accent-indigo transition-all"
                                                value={form.fuelUsed}
                                                onChange={(e) => setForm({ ...form, fuelUsed: Number(e.target.value) })}
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-primary-50 pt-6">
                                        <div className="space-y-1.5">
                                            <label className="text-[9px] font-extrabold text-primary-400 uppercase tracking-widest ml-1">Fuel (₹)</label>
                                            <input
                                                type="number"
                                                className="w-full bg-primary-50/50 border border-primary-100 rounded-xl px-3 py-3 text-sm font-bold text-primary-900 outline-none focus:border-accent-indigo"
                                                value={form.fuelCost}
                                                onChange={(e) => setForm({ ...form, fuelCost: Number(e.target.value) })}
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[9px] font-extrabold text-primary-400 uppercase tracking-widest ml-1">Toll (₹)</label>
                                            <input
                                                type="number"
                                                className="w-full bg-primary-50/50 border border-primary-100 rounded-xl px-3 py-3 text-sm font-bold text-primary-900 outline-none focus:border-accent-indigo"
                                                value={form.toll}
                                                onChange={(e) => setForm({ ...form, toll: Number(e.target.value) })}
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[9px] font-extrabold text-primary-400 uppercase tracking-widest ml-1">Misc (₹)</label>
                                            <input
                                                type="number"
                                                className="w-full bg-primary-50/50 border border-primary-100 rounded-xl px-3 py-3 text-sm font-bold text-primary-900 outline-none focus:border-accent-indigo"
                                                value={form.otherExpenses}
                                                onChange={(e) => setForm({ ...form, otherExpenses: Number(e.target.value) })}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </section>

                            <section className="bg-white border border-primary-200 rounded-3xl p-6 shadow-premium">
                                <label className="text-[10px] font-extrabold text-primary-400 uppercase tracking-widest mb-1.5 block ml-1">Manifest Registry Notes</label>
                                <textarea
                                    className="w-full bg-primary-50/50 border border-primary-100 rounded-xl px-4 py-3 text-sm font-medium text-primary-600 resize-none outline-none focus:ring-4 focus:ring-accent-indigo/5 focus:border-accent-indigo transition-all"
                                    rows={4}
                                    value={form.notes}
                                    onChange={(e) => setForm({ ...form, notes: e.target.value.toUpperCase() })}
                                    placeholder="DETAILED AUDIT TRAIL..."
                                />
                            </section>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default Trips;
