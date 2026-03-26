import React, { useRef, useState } from 'react';
import { Upload, X, FileText, Image as ImageIcon } from 'lucide-react';
import { uploadFile } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';

interface FileUploadProps {
    category: string;
    currentFileUrl?: string;
    onUploadComplete: (url: string) => void;
    accept?: string;
    label?: string;
}

const FileUpload: React.FC<FileUploadProps> = ({
    category,
    currentFileUrl,
    onUploadComplete,
    accept = 'image/*,.pdf',
    label = 'Upload File',
}) => {
    const { currentUser } = useAuth();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const [preview, setPreview] = useState<string | null>(currentFileUrl || null);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !currentUser) return;

        setUploading(true);
        try {
            const url = await uploadFile(file, currentUser.uid, category, currentFileUrl);
            setPreview(url);
            onUploadComplete(url);
        } catch (error) {
            console.error('Upload failed:', error);
            alert('Failed to upload file. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    const handleRemove = () => {
        setPreview(null);
        onUploadComplete('');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const isImage = preview && (preview.endsWith('.jpg') || preview.endsWith('.jpeg') || preview.endsWith('.png') || preview.endsWith('.webp'));

    return (
        <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">{label}</label>

            {preview ? (
                <div className="relative border-2 border-gray-200 rounded-lg p-4">
                    {isImage ? (
                        <img src={preview} alt="Preview" className="w-full h-48 object-cover rounded-lg" />
                    ) : (
                        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                            <FileText size={40} className="text-gray-400" />
                            <div className="flex-1">
                                <p className="text-sm font-medium text-gray-700">Document uploaded</p>
                                <a href={preview} target="_blank" rel="noopener noreferrer" className="text-xs text-primary-600 hover:underline">
                                    View file
                                </a>
                            </div>
                        </div>
                    )}
                    <button
                        onClick={handleRemove}
                        className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                    >
                        <X size={16} />
                    </button>
                </div>
            ) : (
                <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-primary-500 hover:bg-primary-50 transition-all"
                >
                    {uploading ? (
                        <div className="flex flex-col items-center gap-2">
                            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent" />
                            <p className="text-sm text-gray-600">Uploading...</p>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-2">
                            <Upload size={40} className="text-gray-400" />
                            <p className="text-sm text-gray-600">Click to upload or drag and drop</p>
                            <p className="text-xs text-gray-400">PNG, JPG or PDF (max 10MB)</p>
                        </div>
                    )}
                </div>
            )}

            <input
                ref={fileInputRef}
                type="file"
                accept={accept}
                onChange={handleFileSelect}
                className="hidden"
            />
        </div>
    );
};

export default FileUpload;
