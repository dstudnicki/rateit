import imageCompression from 'browser-image-compression';

export interface CompressionOptions {
    maxSizeMB?: number;
    maxWidthOrHeight?: number;
    useWebWorker?: boolean;
}

/**
 * Compress image on client-side before upload
 * @param file - Original image file
 * @param options - Compression options
 * @returns Compressed file
 */
export async function compressImage(
    file: File,
    options: CompressionOptions = {}
): Promise<File> {
    const defaultOptions = {
        maxSizeMB: 1,
        maxWidthOrHeight: 2048,
        useWebWorker: true,
        fileType: 'image/webp', // Convert to WebP for better compression
    };

    const compressionOptions = { ...defaultOptions, ...options };

    try {
        const compressedFile = await imageCompression(file, compressionOptions);

        console.log('[Compression] Original size:', (file.size / 1024 / 1024).toFixed(2), 'MB');
        console.log('[Compression] Compressed size:', (compressedFile.size / 1024 / 1024).toFixed(2), 'MB');
        console.log('[Compression] Reduction:', ((1 - compressedFile.size / file.size) * 100).toFixed(1), '%');

        return compressedFile;
    } catch (error) {
        console.error('[Compression] Error:', error);
        // Return original file if compression fails
        return file;
    }
}

/**
 * Compress multiple images
 * @param files - Array of files to compress
 * @param options - Compression options
 * @returns Array of compressed files
 */
export async function compressImages(
    files: File[],
    options: CompressionOptions = {}
): Promise<File[]> {
    const compressionPromises = files.map(file => compressImage(file, options));
    return Promise.all(compressionPromises);
}

/**
 * Get image dimensions
 * @param file - Image file
 * @returns Promise with width and height
 */
export async function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(file);

        img.onload = () => {
            URL.revokeObjectURL(url);
            resolve({
                width: img.width,
                height: img.height,
            });
        };

        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error('Failed to load image'));
        };

        img.src = url;
    });
}

/**
 * Create image preview URL
 * @param file - Image file
 * @returns Preview URL (should be revoked after use)
 */
export function createImagePreview(file: File): string {
    return URL.createObjectURL(file);
}

/**
 * Revoke image preview URL to free memory
 * @param url - Preview URL to revoke
 */
export function revokeImagePreview(url: string): void {
    URL.revokeObjectURL(url);
}

