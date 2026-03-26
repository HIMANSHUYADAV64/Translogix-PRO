import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Compress image before upload
const compressImage = async (file: File): Promise<File> => {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 1200;
                const MAX_HEIGHT = 1200;
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > MAX_WIDTH) {
                        height *= MAX_WIDTH / width;
                        width = MAX_WIDTH;
                    }
                } else {
                    if (height > MAX_HEIGHT) {
                        width *= MAX_HEIGHT / height;
                        height = MAX_HEIGHT;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, width, height);

                canvas.toBlob(
                    (blob) => {
                        if (blob) {
                            const compressedFile = new File([blob], file.name, {
                                type: 'image/jpeg',
                                lastModified: Date.now(),
                            });
                            resolve(compressedFile);
                        } else {
                            resolve(file);
                        }
                    },
                    'image/jpeg',
                    0.8
                );
            };
        };
    });
};

export const uploadFile = async (
    file: File,
    userId: string,
    category: string,
    oldFileUrl?: string
): Promise<string> => {
    try {
        // Delete old file if exists
        if (oldFileUrl) {
            const parts = oldFileUrl.split('/uploads/');
            if (parts.length >= 2) {
                const oldPath = parts[1];
                await supabase.storage.from('uploads').remove([oldPath]);
            }
        }

        // Compress if image
        let fileToUpload = file;
        if (file.type.startsWith('image/')) {
            fileToUpload = await compressImage(file);
        }

        // Upload new file
        const fileName = `${Date.now()}_${file.name}`;
        const filePath = `${userId}/${category}/${fileName}`;

        const { error } = await supabase.storage
            .from('uploads')
            .upload(filePath, fileToUpload, {
                cacheControl: '3600',
                upsert: false,
            });

        if (error) throw error;

        // Get public URL
        const { data } = supabase.storage
            .from('uploads')
            .getPublicUrl(filePath);

        return data.publicUrl;
    } catch (error) {
        console.error('Upload error:', error);
        throw error;
    }
};

export const deleteFile = async (fileUrl: string): Promise<void> => {
    try {
        // Extract path from public URL
        // Expected URL format: https://.../storage/v1/object/public/uploads/userId/category/filename
        const parts = fileUrl.split('/uploads/');
        if (parts.length < 2) return;

        const filePath = parts[1];
        await supabase.storage.from('uploads').remove([filePath]);
    } catch (error) {
        console.error('Delete error:', error);
        throw error;
    }
};
