
import React, { useEffect, useState, useMemo } from "react";
import { useAuth } from "../contexts/AuthContext";
// import { useSubscription } from "../contexts/SubscriptionContext";
import {
    db,
    collection,
    getDocs,
    doc,
    setDoc,
    serverTimestamp,
} from "../services/firebase";
import Layout from "../components/Layout";

type Tyre = {
    position: string;
    brand: string;
    tyreNo: string;
    cost?: number;
    odometer?: number;
    status: "active" | "retired";
    updatedAt?: string;
};

type VehicleTyres = {
    vehicleNo: string;
    axleType: "6wheel" | "10wheel";
    tyres: Tyre[];
    make?: string;
};

const AXLE_CONFIGS = [
    { id: "6wheel", label: "6-WHEEL", count: 6 },
    { id: "10wheel", label: "10-WHEEL", count: 10 },
];

const rowLabel = (idx: number, axleType: "6wheel" | "10wheel") => {
    if (axleType === "6wheel") {
        if (idx < 2) return "STEER";
        if (idx < 4) return "DRIVE L";
        return "DRIVE R";
    }
    // 10-wheel configuration
    if (idx < 2) return "STEONIE";
    if (idx < 4) return "STEER";
    if (idx < 6) return "DRIVE L1";
    if (idx < 8) return "DRIVE L2";
    return "DRIVE R";
};

const Tyres: React.FC = () => {
    const { user } = useAuth();
    // const { canAddResource } = useSubscription();

    const [vehicles, setVehicles] = useState<VehicleTyres[]>([]);
    const [selectedVehicle, setSelectedVehicle] = useState<VehicleTyres | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [saving, setSaving] = useState(false);

    // Edit Modal State
    const [editIdx, setEditIdx] = useState<number | null>(null);
    const [editForm, setEditForm] = useState<Partial<Tyre>>({ brand: "", tyreNo: "", cost: 0, odometer: 0, status: "active" });

    const loadData = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const vSnap = await getDocs(collection(db, "users", user.uid, "vehicles"));
            const tSnap = await getDocs(collection(db, "users", user.uid, "tyres"));

            const tyresData = tSnap.docs.reduce((acc: any, d) => {
                acc[d.id] = d.data();
                return acc;
            }, {});

            const list = vSnap.docs.map(d => {
                const data = d.data();
                const vNo = (data.number || data.vehicleNo || d.id).toUpperCase();
                const existing = tyresData[vNo];
                return {
                    vehicleNo: vNo,
                    make: data.make || "General Asset",
                    axleType: (existing?.axleType || "6wheel") as "6wheel" | "10wheel",
                    tyres: existing?.tyres || Array(10).fill(null).map((_, i) => ({ position: `T${i + 1}`, brand: "", tyreNo: "", status: "active", cost: 0, odometer: 0 }))
                };
            });
            setVehicles(list);
            if (selectedVehicle) {
                const updated = list.find(v => v.vehicleNo === selectedVehicle.vehicleNo);
                if (updated) setSelectedVehicle(updated);
            }
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    useEffect(() => { loadData(); }, [user]);

    const filteredVehicles = useMemo(() => {
        const q = searchQuery.toUpperCase();
        return vehicles.filter(v => v.vehicleNo.includes(q) || v.make?.toUpperCase().includes(q));
    }, [vehicles, searchQuery]);

    const startEdit = (idx: number, tyre: Tyre) => {
        setEditIdx(idx);
        setEditForm({ ...tyre });
    };

    const saveTyre = async () => {
        if (!user || !selectedVehicle || editIdx === null) return;
        setSaving(true);
        try {
            const newTyres = [...selectedVehicle.tyres];
            newTyres[editIdx] = {
                ...newTyres[editIdx],
                ...editForm,
                updatedAt: new Date().toISOString()
            } as Tyre;

            const updatedVehicle = { ...selectedVehicle, tyres: newTyres };
            await setDoc(doc(db, "users", user.uid, "tyres", selectedVehicle.vehicleNo), {
                axleType: selectedVehicle.axleType,
                tyres: newTyres,
                updatedAt: serverTimestamp()
            });

            setSelectedVehicle(updatedVehicle);
            setVehicles(prev => prev.map(v => v.vehicleNo === selectedVehicle.vehicleNo ? updatedVehicle : v));
            setEditIdx(null);
        } catch (err) { alert("Failed to save"); }
        finally { setSaving(false); }
    };

    const changeAxle = async (type: "6wheel" | "10wheel") => {
        if (!user || !selectedVehicle || saving) return;
        const config = AXLE_CONFIGS.find(c => c.id === type);

        setSaving(true);
        try {
            const tyreCount = config?.count || 6;
            const emptyTyres = Array(tyreCount).fill(null).map((_, i) => ({ position: `T${i + 1}`, brand: "", tyreNo: "", status: "active", cost: 0, odometer: 0 }));
            await setDoc(doc(db, "users", user.uid, "tyres", selectedVehicle.vehicleNo), { axleType: type, tyres: emptyTyres, updatedAt: serverTimestamp() });
            loadData();
        } catch (err) { console.error(err); }
        finally { setSaving(false); }
    };

    return (
        <Layout>
            <div className="space-y-6 animate-fade-in">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
                    <div className="flex items-center gap-3">
                        {selectedVehicle && (
                            <button
                                onClick={() => setSelectedVehicle(null)}
                                className="p-2 rounded-xl bg-white border border-primary-200 text-primary-400 hover:text-accent-indigo hover:border-accent-indigo transition-all shadow-sm"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                        )}
                        <div>
                            <h1 className="text-2xl font-bold text-primary-900 uppercase tracking-tight">
                                Tyre <span className="text-primary-400">Inventory</span>
                                {selectedVehicle && <span className="text-accent-indigo ml-2">· {selectedVehicle.vehicleNo}</span>}
                            </h1>
                            <p className="text-xs font-bold text-primary-400 uppercase tracking-widest mt-0.5">
                                {selectedVehicle ? "Component Lifecycle Management" : "Fleet Wheelbase Overview"}
                            </p>
                        </div>
                    </div>
                    {!selectedVehicle && (
                        <div className="relative group">
                            <input
                                className="bg-white border border-primary-200 rounded-xl px-4 py-2.5 pl-10 text-sm text-primary-900 placeholder:text-primary-400 w-full sm:w-64 focus:ring-2 focus:ring-accent-indigo/10 focus:border-accent-indigo outline-none transition-all shadow-sm"
                                placeholder="Search vehicle..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            <svg className="absolute left-3 top-3 w-4 h-4 text-primary-400 group-focus-within:text-accent-indigo transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                    )}
                </div>

                <div>
                    {!selectedVehicle && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {loading
                                ? [1, 2, 3, 4].map((i) => (
                                    <div key={i} className="h-24 bg-white border border-primary-200 rounded-2xl animate-pulse" />
                                ))
                                : filteredVehicles.map((v) => (
                                    <button
                                        key={v.vehicleNo}
                                        onClick={() => setSelectedVehicle(v)}
                                        className="bg-white border border-primary-200 p-5 rounded-2xl text-left hover:border-accent-indigo hover:shadow-premium transition-all group"
                                    >
                                        <h3 className="text-lg font-extrabold text-primary-900 uppercase tracking-tight group-hover:text-accent-indigo transition-colors">
                                            {v.vehicleNo}
                                        </h3>
                                        <p className="text-xs font-bold text-primary-400 uppercase tracking-widest mt-1">
                                            {v.make || "General Asset"}
                                        </p>
                                    </button>
                                ))}
                        </div>
                    )}

                    {selectedVehicle && (
                        <div className="space-y-6 max-w-4xl mx-auto">
                            <div className="bg-white border border-primary-200 p-1.5 rounded-2xl shadow-sm flex gap-2">
                                {AXLE_CONFIGS.map((at) => (
                                    <button
                                        key={at.id}
                                        onClick={() => changeAxle(at.id as any)}
                                        className={`flex-1 py-3 px-4 rounded-xl text-xs font-black tracking-widest uppercase transition-all ${selectedVehicle.axleType === at.id
                                            ? "bg-primary-900 text-white shadow-premium"
                                            : "text-primary-400 hover:bg-primary-50 hover:text-primary-900"
                                            }`}
                                    >
                                        {at.label} CONFIG
                                    </button>
                                ))}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {selectedVehicle.tyres.slice(0, selectedVehicle.axleType === "6wheel" ? 6 : 10).map((t, i) => (
                                    <div
                                        key={i}
                                        className="bg-white border border-primary-200 rounded-2xl p-5 hover:border-accent-indigo hover:shadow-premium transition-all group relative overflow-hidden"
                                    >
                                        <div className="absolute top-0 right-0 p-3">
                                            <span className="text-[10px] font-black text-primary-900 bg-primary-50 px-2 py-1 rounded-md border border-primary-100 uppercase tracking-tighter">
                                                {t.position}
                                            </span>
                                        </div>
                                        <div className="mb-6">
                                            <p className="text-[10px] font-extrabold text-primary-300 uppercase tracking-widest mb-1">
                                                {rowLabel(i, selectedVehicle.axleType)} Position
                                            </p>
                                            {t.tyreNo ? (
                                                <div className="space-y-1">
                                                    <h4 className="text-lg font-black text-primary-900 uppercase tracking-tight group-hover:text-accent-indigo transition-colors leading-none">
                                                        {t.tyreNo}
                                                    </h4>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-bold text-primary-400 uppercase tracking-wider">{t.brand}</span>
                                                        <span
                                                            className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest ${t.status === "active"
                                                                ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                                                                : "bg-red-50 text-red-600 border border-red-100"
                                                                }`}
                                                        >
                                                            {t.status}
                                                        </span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="py-2">
                                                    <p className="text-xs font-bold text-primary-200 italic uppercase tracking-widest">Unassigned Dock</p>
                                                </div>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => startEdit(i, t)}
                                            className="w-full py-2.5 bg-primary-50 text-primary-900 text-[10px] font-black uppercase tracking-widest rounded-xl border border-primary-100 hover:bg-primary-900 hover:text-white hover:border-primary-900 transition-all"
                                        >
                                            {t.tyreNo ? "Manage Asset" : "Assign Unit"}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {editIdx !== null && (
                    <div className="fixed inset-0 z-50 bg-primary-50 overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b border-primary-200 p-4 flex items-center justify-between no-print shadow-sm">
                            <button
                                onClick={() => setEditIdx(null)}
                                className="font-bold text-primary-500 hover:text-primary-900 px-2"
                            >
                                Cancel
                            </button>
                            <h2 className="font-extrabold text-primary-900 tracking-tight uppercase">
                                Unit Registry: <span className="text-accent-indigo">{selectedVehicle?.tyres[editIdx].position}</span>
                            </h2>
                            <button
                                onClick={saveTyre}
                                disabled={saving}
                                className="px-6 py-2.5 rounded-xl bg-primary-900 text-white font-bold hover:bg-black transition-all shadow-premium"
                            >
                                {saving ? "Syncing..." : "Commit"}
                            </button>
                        </div>

                        <div className="max-w-xl mx-auto p-4 sm:p-8 space-y-6">
                            <section className="bg-white border border-primary-200 rounded-3xl p-6 shadow-premium relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-2 h-full bg-accent-indigo"></div>
                                <h3 className="text-xs font-black text-primary-900 mb-6 uppercase tracking-widest px-1">Identity & Build</h3>
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-extrabold text-primary-400 uppercase tracking-widest ml-1">Serial Registry *</label>
                                            <input
                                                className="w-full bg-primary-50/50 border border-primary-100 rounded-xl px-4 py-3 text-sm font-bold text-primary-900 uppercase outline-none focus:ring-4 focus:ring-accent-indigo/5 focus:border-accent-indigo transition-all"
                                                value={editForm.tyreNo}
                                                onChange={(e) => setEditForm({ ...editForm, tyreNo: e.target.value.toUpperCase() })}
                                                placeholder="E.G. SN-9921"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-extrabold text-primary-400 uppercase tracking-widest ml-1">Manufacturer</label>
                                            <input
                                                className="w-full bg-primary-50/50 border border-primary-100 rounded-xl px-4 py-3 text-sm font-bold text-primary-900 uppercase outline-none focus:ring-4 focus:ring-accent-indigo/5 focus:border-accent-indigo transition-all"
                                                value={editForm.brand}
                                                onChange={(e) => setEditForm({ ...editForm, brand: e.target.value.toUpperCase() })}
                                                placeholder="MRF / APOLLO"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-extrabold text-primary-400 uppercase tracking-widest ml-1">Acquisition Cost (₹)</label>
                                            <input
                                                type="number"
                                                className="w-full bg-primary-50/50 border border-primary-100 rounded-xl px-4 py-3 text-sm font-bold text-primary-900 outline-none focus:ring-4 focus:ring-accent-indigo/5 focus:border-accent-indigo transition-all"
                                                value={editForm.cost || ""}
                                                onChange={(e) => setEditForm({ ...editForm, cost: Number(e.target.value) })}
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-extrabold text-primary-400 uppercase tracking-widest ml-1">Lifecycle Status</label>
                                            <select
                                                className="w-full bg-primary-50/50 border border-primary-100 rounded-xl px-4 py-3 text-sm font-bold text-primary-900 uppercase outline-none focus:ring-4 focus:ring-accent-indigo/5 focus:border-accent-indigo transition-all appearance-none cursor-pointer"
                                                value={editForm.status}
                                                onChange={(e) => setEditForm({ ...editForm, status: e.target.value as any })}
                                            >
                                                <option value="active">Active Service</option>
                                                <option value="retired">Retired / Scrap</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-extrabold text-primary-400 uppercase tracking-widest ml-1">Installation Odometer (KM)</label>
                                        <input
                                            type="number"
                                            className="w-full bg-primary-50/50 border border-primary-100 rounded-xl px-4 py-3 text-sm font-bold text-primary-900 outline-none focus:ring-4 focus:ring-accent-indigo/5 focus:border-accent-indigo transition-all"
                                            value={editForm.odometer || ""}
                                            onChange={(e) => setEditForm({ ...editForm, odometer: Number(e.target.value) })}
                                        />
                                    </div>
                                </div>
                            </section>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default Tyres;
