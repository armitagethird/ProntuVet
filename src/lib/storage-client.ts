import { createClient as createBrowserClient } from '@/lib/supabase/client'

const BUCKET_NAME = 'medical-attachments'

/**
 * Client-side helper for uploading files to the medical-attachments bucket.
 * Path structure: {user_id}/{animal_id}/{consulta_id}/{type}/{filename}
 */
export async function uploadAttachment(
    file: File, 
    path: string
) {
    const supabase = createBrowserClient()
    
    const { data, error } = await supabase
        .storage
        .from(BUCKET_NAME)
        .upload(path, file, {
            cacheControl: '3600',
            upsert: false
        })
        
    if (error) {
        throw error
    }
    
    return data
}
