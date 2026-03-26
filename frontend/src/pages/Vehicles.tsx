
// Vehicles.tsx — Full-page UI with clickable cards, PDF (prints Details & Notes only), and reliable uploads
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Truck } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

// Firestore collections
import {
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
} from "firebase/firestore";
import { userVehiclesCol } from "../services/firebase";

// Plan limits
import { PLAN_LIMITS as LIMITS, PlanType } from "../types";

// Supabase storage provider
import { SupabaseStorageProvider as storageService } from "../storage/index";

// Layout component
import Layout from "../components/Layout";

/* ============================== Types ============================== */
type VehicleStatus = "active" | "inactive" | "in_maintenance";

type VehicleRecord = {
    id: string;
    number?: string;
    type?: string;
    make?: string;
    chassisNo?: string;
    engineNo?: string;
    registrationDate?: string;
    rcNumber?: string;
    status: VehicleStatus;
    insuranceExpiry?: string;

    // Display URLs
    rcUrl?: string | null;
    insuranceUrl?: string | null;
    pollutionUrl?: string | null;

    // Storage paths
    rcPath?: string | null;
    insurancePath?: string | null;
    pollutionPath?: string | null;
    notes?: string;
};

type VehicleForm = {
    number: string;
    type: string;
    make: string;
    chassisNo: string;
    engineNo: string;
    registrationDate: string;
    rcNumber: string;
    status: VehicleStatus;
    insuranceExpiry: string;
    rcUrl?: string | null;
    insuranceUrl?: string | null;
    pollutionUrl?: string | null;
    rcPath?: string | null;
    insurancePath?: string | null;
    pollutionPath?: string | null;
    notes: string;
};

const emptyForm: VehicleForm = {
    number: "",
    type: "",
    make: "",
    chassisNo: "",
    engineNo: "",
    registrationDate: "",
    rcNumber: "",
    status: "active",
    insuranceExpiry: "",
    rcUrl: null,
    insuranceUrl: null,
    pollutionUrl: null,
    rcPath: null,
    insurancePath: null,
    pollutionPath: null,
    notes: "",
};

/* ========================== Helpers/UI ============================= */
const normalizeStatus = (s?: VehicleStatus | string): VehicleStatus => {
    if (s === "maintenance") return "in_maintenance";
    if (s === "active" || s === "inactive" || s === "in_maintenance") {
        return s as VehicleStatus;
    }
    return "inactive";
};

const badgeClasses = (s: VehicleStatus) =>
    s === "active"
        ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
        : s === "in_maintenance"
            ? "bg-amber-50 text-amber-700 border border-amber-100"
            : "bg-slate-50 text-slate-700 border border-slate-100";

// Image compression is now handled by the storage service in supabase.ts
/* ============================== Component ========================== */
const Vehicles: React.FC = () => {
    const { user } = useAuth();
    const plan: PlanType = (user as any)?.plan ?? "free";
    const limits = LIMITS[plan];
    const canUploadDocs = limits.documents;
    const [vehicles, setVehicles] = useState<VehicleRecord[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [search, setSearch] = useState<string>("");
    // Full-page detail
    const [selected, setSelected] = useState<VehicleRecord | null>(null);
    // Add/Edit form state
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState<VehicleForm>(emptyForm);
    const [saving, setSaving] = useState<boolean>(false);
    // Upload state
    type DocField = "rc"
        | "insurance"
        | "pollution";
    const [uploadingField, setUploadingField] = useState<DocField | null>(null);
    const [uploadErr, setUploadErr] = useState<string | null>(null);
    const limitReached = vehicles.length >= limits.vehicles;
    /* -------------------------- Load List ---------------------------- */
    const loadVehicles = async () => {
        if (!user?.uid) return;
        setLoading(true);
        try {
            const snap = await getDocs(userVehiclesCol(user.uid));
            const list: VehicleRecord[] = snap.docs.map((d: any) => {
                const raw = d.data() as any;
                return {
                    id: d.id,
                    number: raw.number ?? "",
                    type: raw.type ?? "",
                    make: raw.make ?? "",
                    chassisNo: raw.chassisNo ?? "",
                    engineNo: raw.engineNo ?? "",
                    registrationDate: raw.registrationDate ?? "",
                    rcNumber: raw.rcNumber ?? "",
                    status: normalizeStatus(raw.status),
                    insuranceExpiry: raw.insuranceExpiry ?? "",
                    rcUrl: raw.rcUrl ?? null,
                    insuranceUrl: raw.insuranceUrl ?? null,
                    pollutionUrl: raw.pollutionUrl ?? null,
                    rcPath: raw.rcPath ?? null,
                    insurancePath: raw.insurancePath ?? null,
                    pollutionPath: raw.pollutionPath ?? null,
                    notes: raw.notes ?? "",
                };
            });
            setVehicles(list);
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        loadVehicles();
    }, [user?.uid]);
    /* -------------------------- Filtering ---------------------------- */
    const filtered = useMemo(() => {
        const q = search.toLowerCase().trim();
        return vehicles.filter(
            (v) =>
                (v.number ?? "").toLowerCase().includes(q)
                ||
                (v.type ?? "").toLowerCase().includes(q)
                ||
                (v.make ?? "").toLowerCase().includes(q)
                ||
                (v.chassisNo ?? "").toLowerCase().includes(q)
                ||
                (v.engineNo ?? "").toLowerCase().includes(q)
        );
    }, [vehicles, search]);
    /* ----------- Card click -> detail view -------------------------- */
    const openDetail = (v: VehicleRecord) => {
        setSelected(v);
        // Seed the form with selected data
        setEditingId(v.id);
        setForm({
            number: v.number ?? "",
            type: v.type ?? "",
            make: v.make ?? "",
            chassisNo: v.chassisNo ?? "",
            engineNo: v.engineNo ?? "",
            registrationDate: v.registrationDate ?? "",
            rcNumber: v.rcNumber ?? "",
            status: normalizeStatus(v.status),
            insuranceExpiry: v.insuranceExpiry ?? "",
            rcUrl: v.rcUrl ?? null,
            insuranceUrl: v.insuranceUrl ?? null,
            pollutionUrl: v.pollutionUrl ?? null,
            rcPath: v.rcPath ?? null,
            insurancePath: v.insurancePath ?? null,
            pollutionPath: v.pollutionPath ?? null,
            notes: v.notes ?? "",
        });
    };
    const closeDetail = async () => {
        setSelected(null);
        setEditingId(null);
        setForm(emptyForm);
    };
    /* -------- “+ Add” creates placeholder and opens form ------------- */
    const openAdd = async () => {
        if (limitReached) {
            alert("🚧 Vehicle limit reached — upgrade required.");
            return;
        }
        if (!user?.uid) return;
        setSaving(true);
        try {
            const placeholder: Partial<VehicleRecord> = {
                status: "inactive",
                number: "",
                type: "",
                chassisNo: "",
                engineNo: "",
                registrationDate: "",
                rcPath: null,
                insurancePath: null,
                pollutionPath: null,
                rcUrl: null,
                insuranceUrl: null,
                pollutionUrl: null,
                make: "",
                rcNumber: "",
                insuranceExpiry: "",
                notes: "",
            };
            const ref = await addDoc(userVehiclesCol(user.uid), placeholder);
            setEditingId(ref.id);
            setForm(emptyForm);
            // Open detail form for the newly added vehicle (instead of staying on grid)
            setSelected({
                id: ref.id,
                status: "inactive",
                number: "", type: "", make: "",
                chassisNo: "", engineNo: "",
                registrationDate: "", rcNumber: "",
                insuranceExpiry: "",
                rcUrl: null, insuranceUrl: null, pollutionUrl: null,
                rcPath: null, insurancePath: null, pollutionPath: null,
                notes: "",
            });
            await loadVehicles();
        } catch (e: any) {
            console.error("Create placeholder failed:", e);
            alert(e?.message ?? "Failed to start new vehicle.");
        } finally {
            setSaving(false);
        }
    };
    /* ---------------------------- Save/Delete ------------------------ */
    const handleChange: React.ChangeEventHandler<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    > = (e) => {
        const { name, value } = e.target;                            // (kept from previous)
        const toUppercase = [
            "number", "type", "make", "chassisNo", "engineNo",
            "rcNumber", "notes"
        ];
        const nextVal = toUppercase.includes(name)
            ? value.toUpperCase()
            : value;
        setForm((p) => ({ ...p, [name]: nextVal }));
    };
    const handleSave = async () => {
        if (!user?.uid) return;
        // Minimal validations
        if (
            !form.number.trim()
            ||
            !form.type.trim()
            ||
            !form.chassisNo.trim()
            ||
            !form.engineNo.trim()
            ||
            !form.registrationDate
        ) {
            alert(
                "Please fill Vehicle No., Type, Chassis No., Engine No., and Registration Date."
            );
            return;
        }
        setSaving(true);
        const payload: any = {
            number: form.number.trim(),
            type: form.type.trim(),
            make: form.make?.trim() || null,
            chassisNo: form.chassisNo.trim(),
            engineNo: form.engineNo.trim(),
            registrationDate: form.registrationDate,
            rcNumber: form.rcNumber?.trim() || null,
            status: form.status,
            insuranceExpiry: form.insuranceExpiry || null,
            rcUrl: form.rcUrl ?? null,
            insuranceUrl: form.insuranceUrl ?? null,
            pollutionUrl: form.pollutionUrl ?? null,
            rcPath: form.rcPath ?? null,
            insurancePath: form.insurancePath ?? null,
            pollutionPath: form.pollutionPath ?? null,
            notes: form.notes?.trim() || null,
            updatedAt: Date.now(),
        };
        try {
            if (editingId) {
                await updateDoc(doc(userVehiclesCol(user.uid), editingId), payload);
            } else {
                const ref = await addDoc(userVehiclesCol(user.uid), payload);
                setEditingId(ref.id);
            }
            await loadVehicles();
            // 👉 Return to the grid after saving
            await closeDetail();
        } catch (e: any) {
            console.error("Save error:", e);
            alert(e?.message ?? "Failed to save vehicle.");
        } finally {
            setSaving(false);
        }
    };
    const deleteVehicle = async () => {
        if (!user?.uid || !editingId || !selected) return;
        if (!confirm("Delete this vehicle?")) return;
        try {
            // Best-effort: delete storage objects
            if (selected.rcPath) await storageService.deleteFile(selected.rcPath);
            if (selected.insurancePath)
                await storageService.deleteFile(selected.insurancePath);
            if (selected.pollutionPath)
                await storageService.deleteFile(selected.pollutionPath);
        } catch (err) {
            console.warn("Storage delete failed:", err);
        }
        await deleteDoc(doc(userVehiclesCol(user.uid), editingId));
        await loadVehicles();
        closeDetail();
        alert("🗑️ Vehicle deleted.");
    };
    /* ---------------------------- Uploads ---------------------------- */
    const fieldToKeys = (field: DocField) => {
        switch (field) {
            case "rc":
                return { urlKey: "rcUrl", label: "RC Document" as const };
            case "insurance":
                return { urlKey: "insuranceUrl", label: "Insurance" as const };
            case "pollution":
                return {
                    urlKey: "pollutionUrl",
                    label: "Pollution Certificate" as const,
                };
        }
    };
    const onUploadFile = async (file: File, field: DocField) => {
        setUploadErr(null);
        if (!user?.uid) {
            setUploadErr("Not authenticated.");
            return;
        }
        if (!editingId) {
            setUploadErr("Upload enabled after starting a draft (use + Add).");
            return;
        }
        if (!canUploadDocs) {
            setUploadErr("Document uploads are available on higher plans.");
            return;
        }
        // Validate type/size quickly (provider also validates)
        const allowed = [
            "image/jpeg",
            "image/png",
            "image/jpg",
            "image/webp",
            "application/pdf",
        ];
        if (!allowed.includes(file.type)) {
            setUploadErr("Only images (JPEG/PNG/WebP) or PDFs are allowed.");
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            setUploadErr("File must be under 10MB.");
            return;
        }
        setUploadingField(field);
        try {
            const { urlKey } = fieldToKeys(field);
            const prevUrl = (form as any)[urlKey] as string | null;

            // Upload to hierarchical folder
            // The storage provider now handles compression and auto-deletion of the old file
            const { url } = await storageService.uploadFile(
                user.uid,
                file,
                `vehicles/${editingId}/documents`,
                prevUrl
            );

            // Update form state with URL
            setForm((prev) => ({
                ...prev,
                [urlKey]: url,
            }));

            // Persist immediately
            await updateDoc(doc(userVehiclesCol(user.uid), editingId), {
                [urlKey]: url,
                updatedAt: Date.now(),
            });
        } catch (err: any) {
            console.error("Upload error:", err);
            setUploadErr(err?.message ?? "Upload failed.");
        } finally {
            setUploadingField(null);
        }
    };
    /* ---------------------- Phone-ready Uploaders -------------------- */
    const Uploader: React.FC<{
        label: string;
        field: DocField;
        currentUrl?: string | null;
    }> = ({ label, field, currentUrl }) => {
        const galleryRef = useRef<HTMLInputElement>(null);
        const cameraRef = useRef<HTMLInputElement>(null);

        const isUploading = uploadingField === field;
        const pickFromGallery = () => galleryRef.current?.click();
        const useCamera = () => cameraRef.current?.click();

        const onGalleryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const f = e.target.files?.[0];
            if (f) onUploadFile(f, field);
            e.target.value = "";
        };
        const onCameraChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const f = e.target.files?.[0];
            if (f) onUploadFile(f, field);
            e.target.value = "";
        };

        return (
            <div className="border border-primary-100 rounded-2xl p-4 bg-primary-50/50 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <p className="text-xs font-extrabold text-primary-900 uppercase tracking-widest">{label}</p>
                    {isUploading && (
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 border-2 border-accent-indigo border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-[10px] font-bold text-accent-indigo uppercase">Uploading...</span>
                        </div>
                    )}
                </div>

                {currentUrl ? (
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white border border-primary-100 rounded-xl flex items-center justify-center text-accent-indigo shadow-sm">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414-5.414A1 1 0 0118.586 7V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <div className="flex-1 flex flex-col">
                            <a
                                href={currentUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[11px] font-bold text-accent-indigo hover:underline text-left uppercase tracking-tight"
                            >
                                View Document
                            </a>
                            <button
                                type="button"
                                onClick={async () => {
                                    try {
                                        const res = await fetch(currentUrl);
                                        const blob = await res.blob();
                                        const url = window.URL.createObjectURL(blob);
                                        const a = document.createElement("a");
                                        a.href = url;
                                        a.download = `${label.replace(/\s+/g, "_")}_${form.number || "vehicle"}.jpg`;
                                        document.body.appendChild(a);
                                        a.click();
                                        document.body.removeChild(a);
                                        window.URL.revokeObjectURL(url);
                                    } catch (err) {
                                        window.open(currentUrl, "_blank");
                                    }
                                }}
                                className="text-[10px] font-bold text-primary-400 hover:text-primary-600 text-left uppercase tracking-tight mt-0.5"
                            >
                                Download Copy
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="py-2">
                        <p className="text-[10px] font-medium text-primary-400 leading-tight">
                            Capture via camera or select a local file to upload.
                        </p>
                    </div>
                )}

                <div className="flex items-center gap-2 mt-auto">
                    <button
                        type="button"
                        disabled={!canUploadDocs || !editingId || isUploading}
                        onClick={pickFromGallery}
                        className="flex-1 px-3 py-2 rounded-xl border border-primary-200 text-[10px] font-extrabold text-primary-900 uppercase hover:bg-white hover:border-accent-indigo transition-all disabled:opacity-30"
                    >
                        Pick File
                    </button>
                    <button
                        type="button"
                        disabled={!canUploadDocs || !editingId || isUploading}
                        onClick={useCamera}
                        className="flex-1 px-3 py-2 rounded-xl bg-white border border-primary-200 text-[10px] font-extrabold text-primary-900 uppercase hover:border-accent-indigo transition-all shadow-sm disabled:opacity-30"
                    >
                        Camera
                    </button>

                    <input
                        ref={galleryRef}
                        hidden
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={onGalleryChange}
                    />
                    <input
                        ref={cameraRef}
                        hidden
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={onCameraChange}
                    />
                </div>
            </div>
        );
    };

    /* ------------------------------ PDF (print) ---------------------- */
    const downloadPdf = () => {
        if (!selected) return;
        setTimeout(() => window.print(), 50);
    };

    /* ------------------------------ Render --------------------------- */
    return (
        <Layout>
            <div className="space-y-6">
                <style>
                    {`
                    @media print {
                        .no-print { display: none !important; }
                    }
                    `}
                </style>

                {/* Header Section */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
                    <div>
                        <h1 className="text-2xl font-bold text-primary-900 uppercase tracking-tight">Vehicles</h1>
                        <p className="text-sm text-primary-500 font-medium">
                            <span className="text-accent-indigo font-bold">{vehicles.length}</span> / {limits.vehicles} vehicles used
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="relative group">
                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search vehicles..."
                                className="bg-white border border-primary-200 rounded-xl px-4 py-2.5 pl-10 text-sm text-primary-900 placeholder:text-primary-400 w-full sm:w-64 focus:ring-2 focus:ring-accent-indigo/10 focus:border-accent-indigo outline-none transition-all shadow-sm"
                            />
                            <svg className="absolute left-3 top-3 w-4 h-4 text-primary-400 group-focus-within:text-accent-indigo transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <button
                            onClick={openAdd}
                            disabled={limitReached || saving}
                            className={`px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-premium ${limitReached
                                ? "bg-primary-100 text-primary-400 cursor-not-allowed"
                                : "bg-primary-900 text-white hover:bg-black"
                                }`}
                        >
                            {limitReached ? (
                                <>
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                    Upgrade
                                </>
                            ) : (
                                <>
                                    <span className="text-lg">+</span>
                                    Add Vehicle
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {!selected && (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 no-print">
                        {loading && (
                            <>
                                {[...Array(6)].map((_, i) => (
                                    <div
                                        key={i}
                                        className="h-32 bg-white border border-primary-200 rounded-2xl animate-pulse"
                                    />
                                ))}
                            </>
                        )}
                        {!loading && filtered.length === 0 && (
                            <div className="col-span-full text-center py-20 bg-white border border-primary-200 border-dashed rounded-2xl">
                                <div className="bg-primary-50 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                                    <Truck size={24} className="text-primary-300" />
                                </div>
                                <h3 className="text-lg font-bold text-primary-900">No vehicles found</h3>
                                <p className="text-sm text-primary-500 mt-1">Start by adding your first vehicle to the fleet.</p>
                            </div>
                        )}
                        {!loading &&
                            filtered.map((v) => (
                                <button
                                    key={v.id}
                                    onClick={() => openDetail(v)}
                                    className="text-left bg-white border border-primary-200 rounded-2xl p-5 hover:border-accent-indigo hover:shadow-premium transition-all duration-300 group"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-1">
                                            <p className="font-extrabold text-lg text-primary-900 uppercase tracking-tight group-hover:text-accent-indigo transition-colors leading-none">
                                                {v.number || "NOT SET"}
                                            </p>
                                            <p className="text-xs font-bold text-primary-400 uppercase tracking-wide">
                                                {(v.type ?? "—") + (v.make ? ` · ${v.make}` : "")}
                                            </p>
                                        </div>
                                        <span
                                            className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${badgeClasses(
                                                v.status
                                            )}`}
                                        >
                                            {v.status === "in_maintenance" ? "maintenance" : v.status}
                                        </span>
                                    </div>
                                    <div className="mt-6 flex items-center justify-between border-t border-primary-50 pt-4">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-bold text-primary-300 uppercase tracking-tighter leading-none">Registered</span>
                                            <span className="text-xs font-bold text-primary-600 mt-0.5">{v.registrationDate || "N/A"}</span>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <span className="text-[10px] font-bold text-primary-300 uppercase tracking-tighter leading-none">Insur. Expiry</span>
                                            <span className={`text-xs font-bold mt-0.5 ${v.insuranceExpiry && new Date(v.insuranceExpiry) < new Date() ? 'text-error' : 'text-primary-600'}`}>
                                                {v.insuranceExpiry || "N/A"}
                                            </span>
                                        </div>
                                    </div>
                                </button>
                            ))}
                    </div>
                )}

                {/* Full-page detail view */}
                {selected && (
                    <div className="fixed inset-0 z-50 bg-primary-50 overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b border-primary-200 p-4 flex items-center justify-between no-print shadow-sm">
                            <button onClick={closeDetail} className="flex items-center gap-1.5 font-bold text-primary-500 hover:text-primary-900 transition-colors">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                                </svg>
                                <span>Back</span>
                            </button>
                            <h2 className="font-extrabold text-primary-900 tracking-tight">Vehicle Management</h2>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={downloadPdf}
                                    className="p-2.5 rounded-xl border border-primary-200 text-primary-600 hover:bg-primary-50 transition-colors"
                                    title="Export PDF"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.293 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                    </svg>
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="px-6 py-2.5 rounded-xl bg-primary-900 text-white font-bold hover:bg-black transition-all shadow-premium disabled:opacity-50"
                                >
                                    {saving ? "Saving..." : "Save Changes"}
                                </button>
                            </div>
                        </div>

                        <div className="max-w-4xl mx-auto p-4 sm:p-8 space-y-8 animate-fade-in">
                            <section className="bg-white border border-primary-200 rounded-2xl p-6 shadow-premium relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-1.5 h-full bg-accent-indigo"></div>
                                <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-8 gap-4">
                                    <div>
                                        <h3 className="text-3xl font-extrabold text-primary-900 uppercase tracking-tighter">
                                            {form.number || "UNNAMED"}
                                        </h3>
                                        <p className="text-sm font-bold text-primary-400 uppercase tracking-wide mt-1">
                                            {(form.type ?? "—") + (form.make ? ` · ${form.make}` : "")}
                                        </p>
                                    </div>
                                    <span
                                        className={`self-start text-xs px-4 py-1.5 rounded-full font-bold uppercase tracking-widest ${badgeClasses(
                                            form.status
                                        )}`}
                                    >
                                        {form.status === "in_maintenance" ? "maintenance" : form.status}
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                                    {[
                                        { label: "Vehicle Registration Number *", name: "number", value: form.number },
                                        { label: "Vehicle Type *", name: "type", value: form.type },
                                        { label: "Manufacturer / Make", name: "make", value: form.make },
                                        { label: "Chassis Number (VIN) *", name: "chassisNo", value: form.chassisNo },
                                        { label: "Engine Number *", name: "engineNo", value: form.engineNo },
                                        { label: "Date of Registration *", name: "registrationDate", value: form.registrationDate, type: "date" },
                                        { label: "RC Certificate Number", name: "rcNumber", value: form.rcNumber },
                                        { label: "Insurance Expiry Date", name: "insuranceExpiry", value: form.insuranceExpiry, type: "date" },
                                    ].map((item, i) => (
                                        <div key={i} className="space-y-1.5">
                                            <label className="text-[10px] font-extrabold text-primary-400 uppercase tracking-widest ml-1">
                                                {item.label}
                                            </label>
                                            <input
                                                type={item.type || "text"}
                                                name={item.name}
                                                value={item.value || ""}
                                                onChange={handleChange}
                                                className="w-full bg-primary-50/50 border border-primary-100 rounded-xl px-4 py-2.5 text-sm font-bold text-primary-900 uppercase focus:ring-4 focus:ring-accent-indigo/5 focus:border-accent-indigo outline-none transition-all"
                                            />
                                        </div>
                                    ))}
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-extrabold text-primary-400 uppercase tracking-widest ml-1">
                                            Operational Status *
                                        </label>
                                        <select
                                            name="status"
                                            value={form.status}
                                            onChange={handleChange}
                                            className="w-full bg-primary-50/50 border border-primary-100 rounded-xl px-4 py-2.5 text-sm font-bold text-primary-900 focus:ring-4 focus:ring-accent-indigo/5 focus:border-accent-indigo outline-none transition-all appearance-none cursor-pointer"
                                        >
                                            <option value="active">Active</option>
                                            <option value="inactive">Inactive</option>
                                            <option value="in_maintenance">Under Maintenance</option>
                                        </select>
                                    </div>
                                </div>
                            </section>

                            <section className="bg-white border border-primary-200 rounded-2xl p-6 shadow-premium no-print">
                                <h3 className="text-xs font-extrabold text-primary-900 mb-6 uppercase tracking-widest flex items-center gap-2">
                                    <svg className="w-4 h-4 text-accent-indigo" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414-5.414A1 1 0 0118.586 7V19a2 2 0 01-2 2z" />
                                    </svg>
                                    Documents & Verification
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <Uploader label="RC Document" field="rc" currentUrl={form.rcUrl} />
                                    <Uploader label="Insurance Policy" field="insurance" currentUrl={form.insuranceUrl} />
                                    <Uploader label="Pollution Cert." field="pollution" currentUrl={form.pollutionUrl} />
                                </div>
                                {uploadErr && <p className="mt-4 text-[10px] font-bold text-error bg-red-50 p-3 rounded-lg border border-red-100 uppercase tracking-wide">{uploadErr}</p>}
                            </section>

                            <section className="bg-white border border-primary-200 rounded-2xl p-6 shadow-premium">
                                <h3 className="text-xs font-extrabold text-primary-900 mb-4 uppercase tracking-widest flex items-center gap-2">
                                    <svg className="w-4 h-4 text-accent-indigo" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                    Additional Remarks
                                </h3>
                                <textarea
                                    name="notes"
                                    value={form.notes}
                                    onChange={handleChange}
                                    placeholder="Enter any additional maintenance notes, history, or remarks here..."
                                    rows={4}
                                    className="w-full bg-primary-50/50 border border-primary-100 rounded-xl px-4 py-3 text-sm font-medium text-primary-900 uppercase focus:ring-4 focus:ring-accent-indigo/5 focus:border-accent-indigo outline-none transition-all placeholder:text-primary-300"
                                />
                                <div className="mt-8 pt-6 border-t border-primary-50">
                                    <button
                                        onClick={deleteVehicle}
                                        className="w-full py-3.5 rounded-xl border border-red-100 text-error font-extrabold uppercase tracking-widest text-[10px] hover:bg-error hover:text-white hover:border-error transition-all flex items-center justify-center gap-2 no-print"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                        Terminat / Delete Vehicle Record
                                    </button>
                                </div>
                            </section>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default Vehicles;
