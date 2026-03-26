
// Drivers.tsx — Full-page UI with clickable cards, no PDF, phone-friendly uploads to Supabase
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../contexts/AuthContext";

// Firestore collections (drivers metadata)
import {
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
} from "firebase/firestore";
import { userDriversCol } from "../services/firebase";

// Plan limits
import { PLAN_LIMITS as LIMITS, PlanType } from "../types";

// Supabase storage provider (barrel export)
import { SupabaseStorageProvider as storageService } from "../storage/index";

// Layout component
import Layout from "../components/Layout";

/* ============================== Types ============================== */
type DriverStatus = "available" | "on_trip" | "inactive";

type DriverRecord = {
    id: string;
    name?: string;
    phone?: string;
    email?: string;

    // Identity & compliance
    licenseNumber?: string;
    licenseExpiry?: string;
    aadhaar?: string;
    address?: string;

    // Emergency & HR
    emergencyContact?: string;
    emergencyContactName?: string;
    dateOfBirth?: string;
    joiningDate?: string;
    bloodGroup?: string;

    // Ops
    status: DriverStatus;
    experience?: string; // years
    assignedVehicleId?: string;

    // Display URLs
    licenseUrl?: string | null;
    aadhaarUrl?: string | null;
    photoUrl?: string | null;

    // Storage paths
    licensePath?: string | null;
    aadhaarPath?: string | null;
    photoPath?: string | null;
};

type DriverForm = {
    name: string;
    phone: string;
    email: string;

    licenseNumber: string;
    licenseExpiry: string;
    aadhaar: string;
    address: string;

    emergencyContact: string;
    emergencyContactName: string;
    dateOfBirth: string;
    joiningDate: string;
    bloodGroup: string;

    status: DriverStatus;
    experience: string;
    assignedVehicleId: string;

    licenseUrl?: string | null;
    aadhaarUrl?: string | null;
    photoUrl?: string | null;

    licensePath?: string | null;
    aadhaarPath?: string | null;
    photoPath?: string | null;
};

const emptyForm: DriverForm = {
    name: "",
    phone: "",
    email: "",

    licenseNumber: "",
    licenseExpiry: "",
    aadhaar: "",
    address: "",

    emergencyContact: "",
    emergencyContactName: "",
    dateOfBirth: "",
    joiningDate: "",
    bloodGroup: "",

    status: "available",
    experience: "",
    assignedVehicleId: "",

    licenseUrl: null,
    aadhaarUrl: null,
    photoUrl: null,

    licensePath: null,
    aadhaarPath: null,
    photoPath: null,
};

/* ========================== Helpers/UI ============================= */
const badgeClasses = (s: DriverStatus) =>
    s === "available"
        ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
        : s === "on_trip"
            ? "bg-amber-50 text-amber-700 border border-amber-100"
            : "bg-slate-50 text-slate-700 border border-slate-100";

// Image compression is now handled by the storage service in supabase.ts

/* ============================== Component ========================== */
const Drivers: React.FC = () => {
    const { user } = useAuth();

    const plan: PlanType = (user as { plan?: PlanType })?.plan ?? "free";
    const limits = LIMITS[plan];
    const canUploadDocs = limits.documents;

    const [drivers, setDrivers] = useState<DriverRecord[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [search, setSearch] = useState<string>("");

    // Full-page detail
    const [selected, setSelected] = useState<DriverRecord | null>(null);

    // Add/Edit
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState<DriverForm>(emptyForm);
    const [saving, setSaving] = useState<boolean>(false);

    // Upload state
    type DocField = "photo" | "license" | "aadhaar";
    const [uploadingField, setUploadingField] = useState<DocField | null>(null);
    const [uploadErr, setUploadErr] = useState<string | null>(null);

    const limitReached = drivers.length >= limits.drivers;

    /* --------------------------- Load list --------------------------- */
    const loadDrivers = async () => {
        if (!user?.uid) return;
        setLoading(true);
        try {
            const snap = await getDocs(userDriversCol(user.uid));
            const list: DriverRecord[] = snap.docs.map((d) => {
                const raw = d.data() as any;
                return {
                    id: d.id,
                    name: raw.name ?? "",
                    phone: raw.phone ?? "",
                    email: raw.email ?? "",

                    licenseNumber: raw.licenseNumber ?? raw.license ?? "",
                    licenseExpiry: raw.licenseExpiry ?? "",
                    aadhaar: raw.aadhaar ?? "",
                    address: raw.address ?? "",

                    emergencyContact: raw.emergencyContact ?? "",
                    emergencyContactName: raw.emergencyContactName ?? "",
                    dateOfBirth: raw.dateOfBirth ?? "",
                    joiningDate: raw.joiningDate ?? "",
                    bloodGroup: raw.bloodGroup ?? "",

                    status: (raw.status as DriverStatus) ?? "available",
                    experience: raw.experience ?? "",
                    assignedVehicleId: raw.assignedVehicleId ?? "",

                    licenseUrl: raw.licenseUrl ?? null,
                    aadhaarUrl: raw.aadhaarUrl ?? null,
                    photoUrl: raw.photoUrl ?? null,

                    licensePath: raw.licensePath ?? null,
                    aadhaarPath: raw.aadhaarPath ?? null,
                    photoPath: raw.photoPath ?? null,
                };
            });
            setDrivers(list);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDrivers();
    }, [user?.uid]);

    /* --------------------------- Filtering --------------------------- */
    const filtered = useMemo(() => {
        const q = search.toLowerCase().trim();
        return drivers.filter(
            (d) =>
                (d.name ?? "").toLowerCase().includes(q) ||
                (d.phone ?? "").toLowerCase().includes(q) ||
                (d.licenseNumber ?? "").toLowerCase().includes(q) ||
                (d.assignedVehicleId ?? "").toLowerCase().includes(q)
        );
    }, [drivers, search]);

    /* --------------------------- Card click -> detail ---------------- */
    const openDetail = (d: DriverRecord) => {
        setSelected(d);
        setEditingId(d.id);
        setForm({
            name: d.name ?? "",
            phone: d.phone ?? "",
            email: d.email ?? "",
            licenseNumber: d.licenseNumber ?? "",
            licenseExpiry: d.licenseExpiry ?? "",
            aadhaar: d.aadhaar ?? "",
            address: d.address ?? "",
            emergencyContact: d.emergencyContact ?? "",
            emergencyContactName: d.emergencyContactName ?? "",
            dateOfBirth: d.dateOfBirth ?? "",
            joiningDate: d.joiningDate ?? "",
            bloodGroup: d.bloodGroup ?? "",
            status: d.status ?? "available",
            experience: d.experience ?? "",
            assignedVehicleId: d.assignedVehicleId ?? "",
            licenseUrl: d.licenseUrl ?? null,
            aadhaarUrl: d.aadhaarUrl ?? null,
            photoUrl: d.photoUrl ?? null,
            licensePath: d.licensePath ?? null,
            aadhaarPath: d.aadhaarPath ?? null,
            photoPath: d.photoPath ?? null,
        });
    };

    const closeDetail = async () => {
        setSelected(null);
        setEditingId(null);
        setForm(emptyForm);
    };

    /* --------------------------- “+ Add” creates placeholder ---------- */
    const openAdd = async () => {
        if (limitReached) {
            alert("🚧 Driver limit reached — upgrade required.");
            return;
        }
        if (!user?.uid) return;

        setSaving(true);
        try {
            const placeholder: Partial<DriverRecord> = {
                status: "available",
                name: "",
                phone: "",
                licenseNumber: "",
                licenseUrl: null,
                aadhaarUrl: null,
                photoUrl: null,
                licensePath: null,
                aadhaarPath: null,
                photoPath: null,
                // createdAt: Date.now(),
            };
            const ref = await addDoc(userDriversCol(user.uid), placeholder);
            setEditingId(ref.id);
            setForm(emptyForm);

            setSelected({
                id: ref.id,
                status: "available",
                name: "",
                phone: "",
                email: "",
                licenseNumber: "",
                licenseExpiry: "",
                aadhaar: "",
                address: "",
                emergencyContact: "",
                emergencyContactName: "",
                dateOfBirth: "",
                joiningDate: "",
                bloodGroup: "",
                experience: "",
                assignedVehicleId: "",
                licenseUrl: null,
                aadhaarUrl: null,
                photoUrl: null,
                licensePath: null,
                aadhaarPath: null,
                photoPath: null,
            });
        } catch (e: any) {
            console.error("Create placeholder failed:", e);
            alert(e?.message ?? "Failed to start new driver.");
        } finally {
            setSaving(false);
        }
    };

    /* --------------------------- Save/Delete -------------------------- */
    const handleChange: React.ChangeEventHandler<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    > = (e) => {
        setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
    };

    const handleSave = async () => {
        if (!user?.uid) return;

        // Minimal validations
        if (!form.name.trim() || !form.phone.trim() || !form.licenseNumber.trim()) {
            alert("Please fill Name, Phone, and License Number.");
            return;
        }

        setSaving(true);
        const payload: any = {
            name: form.name.trim(),
            phone: form.phone.trim(),
            email: form.email?.trim() || null,
            licenseNumber: form.licenseNumber.trim(),
            licenseExpiry: form.licenseExpiry || null,
            aadhaar: form.aadhaar?.trim() || null,
            address: form.address?.trim() || null,
            emergencyContact: form.emergencyContact?.trim() || null,
            emergencyContactName: form.emergencyContactName?.trim() || null,
            dateOfBirth: form.dateOfBirth || null,
            joiningDate: form.joiningDate || null,
            bloodGroup: form.bloodGroup || null,
            status: form.status,
            experience: form.experience?.trim() || null,
            assignedVehicleId: form.assignedVehicleId?.trim() || null,

            // URLs
            licenseUrl: form.licenseUrl ?? null,
            aadhaarUrl: form.aadhaarUrl ?? null,
            photoUrl: form.photoUrl ?? null,

            // Paths
            licensePath: form.licensePath ?? null,
            aadhaarPath: form.aadhaarPath ?? null,
            photoPath: form.photoPath ?? null,

            updatedAt: Date.now(),
        };

        try {
            if (editingId) {
                await updateDoc(doc(userDriversCol(user.uid), editingId), payload);
            } else {
                const ref = await addDoc(userDriversCol(user.uid), payload);
                setEditingId(ref.id);
            }
            await loadDrivers();
            closeDetail();
        } catch (e: any) {
            console.error("Save error:", e);
            alert(e?.message ?? "Failed to save driver.");
        } finally {
            setSaving(false);
        }
    };

    const deleteDriver = async () => {
        if (!user?.uid || !editingId || !selected) return;
        if (!confirm("Delete this driver?")) return;

        try {
            if (selected.photoPath) await storageService.deleteFile(selected.photoPath);
            if (selected.licensePath) await storageService.deleteFile(selected.licensePath);
            if (selected.aadhaarPath) await storageService.deleteFile(selected.aadhaarPath);
        } catch (err) {
            console.warn("Storage delete failed:", err);
        }

        await deleteDoc(doc(userDriversCol(user.uid), editingId));
        await loadDrivers();
        closeDetail();
        alert("🗑️ Driver deleted.");
    };

    /* --------------------------- Upload Logic ------------------------ */
    const fieldToKeys = (field: DocField) => {
        switch (field) {
            case "photo":
                return { urlKey: "photoUrl", label: "Photo" as const };
            case "license":
                return { urlKey: "licenseUrl", label: "License" as const };
            case "aadhaar":
                return { urlKey: "aadhaarUrl", label: "Aadhaar" as const };
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

            const { url } = await storageService.uploadFile(
                user.uid,
                file,
                `drivers/${editingId}/documents`,
                prevUrl
            );

            setForm((prev) => ({
                ...prev,
                [urlKey]: url,
            }));

            await updateDoc(doc(userDriversCol(user.uid), editingId), {
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

    /* --------------------------- Phone-friendly Uploaders ------------ */
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
                        <div className="w-10 h-10 bg-white border border-primary-100 rounded-xl flex items-center justify-center text-accent-indigo shadow-sm relative group overflow-hidden">
                            {field === 'photo' ? (
                                <img src={currentUrl} className="w-full h-full object-cover" alt="Preview" />
                            ) : (
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414-5.414A1 1 0 0118.586 7V19a2 2 0 01-2 2z" />
                                </svg>
                            )}
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
                                        a.download = `${label.replace(/\s+/g, "_")}_${form.name || "driver"}.jpg`;
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

                    <input ref={galleryRef} hidden type="file" accept="image/*,application/pdf" onChange={onGalleryChange} />
                    <input ref={cameraRef} hidden type="file" accept="image/*" capture="environment" onChange={onCameraChange} />
                </div>
            </div>
        );
    };

    /* --------------------------- Render ------------------------------ */
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
                        <h1 className="text-2xl font-bold text-primary-900 uppercase tracking-tight">Drivers</h1>
                        <p className="text-sm text-primary-500 font-medium">
                            <span className="text-accent-indigo font-bold">{drivers.length}</span> / {limits.drivers} drivers used
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="relative group">
                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search drivers..."
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
                                    Add Driver
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Grid of clickable cards */}
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
                                <div className="bg-primary-50 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4 text-primary-300">
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-bold text-primary-900">No drivers found</h3>
                                <p className="text-sm text-primary-500 mt-1">Start by adding your first driver to the team.</p>
                            </div>
                        )}
                        {!loading &&
                            filtered.map((d) => (
                                <button
                                    key={d.id}
                                    onClick={() => openDetail(d)}
                                    className="text-left bg-white border border-primary-200 rounded-2xl p-5 hover:border-accent-indigo hover:shadow-premium transition-all duration-300 group"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-4">
                                            {/* Photo thumb */}
                                            <div className="h-12 w-12 rounded-full bg-primary-50 border border-primary-100 overflow-hidden shadow-sm flex-shrink-0">
                                                {d.photoUrl ? (
                                                    <img
                                                        src={d.photoUrl}
                                                        alt={d.name}
                                                        className="h-full w-full object-cover"
                                                        loading="lazy"
                                                    />
                                                ) : (
                                                    <div className="h-full w-full grid place-items-center">
                                                        <svg className="w-6 h-6 text-primary-200" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                                        </svg>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="space-y-0.5">
                                                <p className="font-extrabold text-base text-primary-900 tracking-tight group-hover:text-accent-indigo transition-colors leading-tight">
                                                    {d.name || "UNNAMED"}
                                                </p>
                                                <p className="text-[11px] font-bold text-primary-400 uppercase tracking-wide leading-none">{d.phone || "NO PHONE"}</p>
                                            </div>
                                        </div>
                                        <span
                                            className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${badgeClasses(
                                                d.status
                                            )}`}
                                        >
                                            {d.status.replace("_", " ")}
                                        </span>
                                    </div>
                                    <div className="mt-6 flex items-center justify-between border-t border-primary-50 pt-4">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-bold text-primary-300 uppercase tracking-tighter leading-none">License No.</span>
                                            <span className="text-xs font-bold text-primary-600 mt-0.5">{d.licenseNumber || "N/A"}</span>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <span className="text-[10px] font-bold text-primary-300 uppercase tracking-tighter leading-none">License Expiry</span>
                                            <span className={`text-xs font-bold mt-0.5 ${d.licenseExpiry && new Date(d.licenseExpiry) < new Date() ? 'text-error' : 'text-primary-600'}`}>
                                                {d.licenseExpiry || "N/A"}
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
                            <h2 className="font-extrabold text-primary-900 tracking-tight">Driver Profile</h2>
                            <div className="flex items-center gap-3">
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
                                <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-8 gap-6">
                                    <div className="flex items-center gap-6">
                                        <div className="h-20 w-20 rounded-2xl bg-primary-50 border border-primary-100 overflow-hidden shadow-sm flex-shrink-0 relative group">
                                            {form.photoUrl ? (
                                                <img
                                                    src={form.photoUrl}
                                                    alt={form.name}
                                                    className="h-full w-full object-cover"
                                                />
                                            ) : (
                                                <div className="h-full w-full grid place-items-center">
                                                    <svg className="w-10 h-10 text-primary-200" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                                    </svg>
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="text-3xl font-extrabold text-primary-900 uppercase tracking-tighter">
                                                {form.name || "NEW DRIVER"}
                                            </h3>
                                            <p className="text-sm font-bold text-primary-400 uppercase tracking-wide mt-1">
                                                {form.phone || "No phone set"}
                                                {form.email ? ` · ${form.email}` : ""}
                                            </p>
                                        </div>
                                    </div>
                                    <span
                                        className={`self-start text-xs px-4 py-1.5 rounded-full font-bold uppercase tracking-widest ${badgeClasses(
                                            form.status
                                        )}`}
                                    >
                                        {form.status.replace("_", " ")}
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-extrabold text-primary-400 uppercase tracking-widest ml-1">Full Name *</label>
                                        <input
                                            name="name"
                                            value={form.name}
                                            onChange={handleChange}
                                            placeholder="Enter full name"
                                            className="w-full bg-primary-50/50 border border-primary-100 rounded-xl px-4 py-2.5 text-sm font-bold text-primary-900 uppercase focus:ring-4 focus:ring-accent-indigo/5 focus:border-accent-indigo outline-none transition-all"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-extrabold text-primary-400 uppercase tracking-widest ml-1">Phone Number *</label>
                                        <input
                                            name="phone"
                                            value={form.phone}
                                            onChange={handleChange}
                                            placeholder="10-digit mobile"
                                            className="w-full bg-primary-50/50 border border-primary-100 rounded-xl px-4 py-2.5 text-sm font-bold text-primary-900 focus:ring-4 focus:ring-accent-indigo/5 focus:border-accent-indigo outline-none transition-all"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-extrabold text-primary-400 uppercase tracking-widest ml-1">Email Address</label>
                                        <input
                                            name="email"
                                            value={form.email}
                                            onChange={handleChange}
                                            placeholder="email@example.com"
                                            className="w-full bg-primary-50/50 border border-primary-100 rounded-xl px-4 py-2.5 text-sm font-bold text-primary-900 focus:ring-4 focus:ring-accent-indigo/5 focus:border-accent-indigo outline-none transition-all"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-extrabold text-primary-400 uppercase tracking-widest ml-1">Operational Status *</label>
                                        <select
                                            name="status"
                                            value={form.status}
                                            onChange={handleChange}
                                            className="w-full bg-primary-50/50 border border-primary-100 rounded-xl px-4 py-2.5 text-sm font-bold text-primary-900 focus:ring-4 focus:ring-accent-indigo/5 focus:border-accent-indigo outline-none transition-all appearance-none cursor-pointer"
                                        >
                                            <option value="available">Available</option>
                                            <option value="on_trip">On Active Trip</option>
                                            <option value="inactive">Inactive / On Leave</option>
                                        </select>
                                    </div>
                                </div>
                            </section>

                            <section className="bg-white border border-primary-200 rounded-2xl p-6 shadow-premium">
                                <h3 className="text-xs font-extrabold text-primary-900 mb-6 uppercase tracking-widest flex items-center gap-2">
                                    <svg className="w-4 h-4 text-accent-indigo" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414-5.414A1 1 0 0118.586 7V19a2 2 0 01-2 2z" />
                                    </svg>
                                    Compliance & Identity
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                                    {[
                                        { label: "Driving License Number *", name: "licenseNumber", value: form.licenseNumber },
                                        { label: "License Expiry Date", name: "licenseExpiry", value: form.licenseExpiry, type: "date" },
                                        { label: "Aadhaar Card Number", name: "aadhaar", value: form.aadhaar },
                                        { label: "Date of Birth", name: "dateOfBirth", value: form.dateOfBirth, type: "date" },
                                        { label: "Blood Group", name: "bloodGroup", value: form.bloodGroup },
                                        { label: "Exp. (Years)", name: "experience", value: form.experience },
                                        { label: "Joining Date", name: "joiningDate", value: form.joiningDate, type: "date" },
                                    ].map((item, i) => (
                                        <div key={i} className="space-y-1.5">
                                            <label className="text-[10px] font-extrabold text-primary-400 uppercase tracking-widest ml-1">{item.label}</label>
                                            <input
                                                type={item.type || "text"}
                                                name={item.name}
                                                value={item.value || ""}
                                                onChange={handleChange}
                                                className="w-full bg-primary-50/50 border border-primary-100 rounded-xl px-4 py-2.5 text-sm font-bold text-primary-900 uppercase focus:ring-4 focus:ring-accent-indigo/5 focus:border-accent-indigo outline-none transition-all"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </section>

                            <section className="bg-white border border-primary-200 rounded-2xl p-6 shadow-premium no-print">
                                <h3 className="text-xs font-extrabold text-primary-900 mb-6 uppercase tracking-widest flex items-center gap-2">
                                    <svg className="w-4 h-4 text-accent-indigo" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    Verification Documents
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <Uploader label="Driver Portrait" field="photo" currentUrl={form.photoUrl} />
                                    <Uploader label="Driving License" field="license" currentUrl={form.licenseUrl} />
                                    <Uploader label="Aadhaar Document" field="aadhaar" currentUrl={form.aadhaarUrl} />
                                </div>
                                {uploadErr && <p className="mt-4 text-[10px] font-bold text-error bg-red-50 p-3 rounded-lg border border-red-100 uppercase tracking-wide">{uploadErr}</p>}
                            </section>

                            <div className="mt-8 pt-6">
                                <button
                                    onClick={deleteDriver}
                                    className="w-full py-3.5 rounded-xl border border-red-100 text-error font-extrabold uppercase tracking-widest text-[10px] hover:bg-error hover:text-white hover:border-error transition-all flex items-center justify-center gap-2 no-print"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                    Terminate Driver Profile
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default Drivers;
