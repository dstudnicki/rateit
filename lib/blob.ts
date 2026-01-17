import { put, del } from '@vercel/blob';

/**
 * Upload image to Vercel Blob Storage
 * @param file - File to upload
 * @param folder - Folder path (e.g., 'posts', 'profiles/avatars', 'companies')
 * @returns URL of uploaded image
 */
export async function uploadImage(file: File, folder: string): Promise<string> {
    try {
        const filename = `${folder}/${Date.now()}-${crypto.randomUUID()}.${file.name.split('.').pop()}`;

        const blob = await put(filename, file, {
            access: 'public',
            token: process.env.BLOB_READ_WRITE_TOKEN!,
        });

        return blob.url;
    } catch (error) {
        console.error('[Blob] Upload error:', error);
        throw new Error('Failed to upload image');
    }
}

/**
 * Delete image from Vercel Blob Storage
 * @param url - Full URL of the image to delete
 */
export async function deleteImage(url: string): Promise<void> {
    try {
        await del(url, {
            token: process.env.BLOB_READ_WRITE_TOKEN!,
        });
    } catch (error) {
        console.error('[Blob] Delete error:', error);
        throw new Error('Failed to delete image');
    }
}

/**
 * Get optimized image URL
 * @param url - Original Vercel Blob URL
 * @param width - Optional width for optimization
 * @returns Optimized URL
 */
export function getOptimizedImageUrl(url: string, width?: number): string {
    if (!url) return '';

    // Vercel Blob URLs are already optimized
    // You can add query parameters for further optimization if needed
    if (width) {
        return `${url}?w=${width}`;
    }

    return url;
}

/**
 * Validate image file
 * @param file - File to validate
 * @returns true if valid, throws error if invalid
 */
export function validateImageFile(file: File): boolean {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!validTypes.includes(file.type)) {
        throw new Error('Invalid file type. Only JPG, PNG, WebP, and GIF are allowed.');
    }

    if (file.size > maxSize) {
        throw new Error('File size exceeds 5MB limit.');
    }

    return true;
}

