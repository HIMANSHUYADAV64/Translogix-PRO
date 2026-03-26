import { uploadFile as supabaseUpload, deleteFile as supabaseDelete } from '../services/supabase';

export const SupabaseStorageProvider = {
    uploadFile: async (uid: string, file: File, pathPrefix: string, oldFileUrl?: string | null) => {
        // Old file deletion is now handled inside supabase.ts uploadFile
        // but we need to pass the oldFileUrl to it.
        // pathPrefix here is the category/subfolder

        const url = await supabaseUpload(file, uid, pathPrefix, oldFileUrl || undefined);
        return { url, path: url };
    },

    deleteFile: async (pathOrUrl: string) => {
        await supabaseDelete(pathOrUrl);
    },

    deleteFileByUrl: async (url: string) => {
        await supabaseDelete(url);
    }
};
