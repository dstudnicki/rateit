"use client";

import { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { X, Upload, Loader2, ImageIcon } from "lucide-react";
import { compressImage, createImagePreview, revokeImagePreview } from "@/lib/image-compression";
import { uploadPostImage } from "@/app/actions/images";
import { Button } from "@/components/ui/button";

interface ImageUploadProps {
    mode: "single" | "multiple";
    maxFiles?: number;
    maxSizeMB?: number;
    onUpload: (urls: string[]) => void;
    existingImages?: string[];
    folder?: "posts" | "profiles" | "companies";
    className?: string;
}

interface UploadedImage {
    url: string;
    preview: string;
    uploading: boolean;
}

export default function ImageUpload({
    mode = "multiple",
    maxFiles = 4,
    maxSizeMB = 5,
    onUpload,
    existingImages = [],
    folder = "posts",
    className = "",
}: ImageUploadProps) {
    const [images, setImages] = useState<UploadedImage[]>(
        existingImages.map((url) => ({ url, preview: url, uploading: false })),
    );
    const [error, setError] = useState<string | null>(null);

    // Notify parent whenever images change
    useEffect(() => {
        const uploadedUrls = images.filter((img) => img.url && !img.uploading).map((img) => img.url);
        onUpload(uploadedUrls);
    }, [images, onUpload]);

    const onDrop = useCallback(
        async (acceptedFiles: File[]) => {
            setError(null);

            // Check max files limit
            if (mode === "single" && acceptedFiles.length > 1) {
                setError("Only one file allowed");
                return;
            }

            if (images.length + acceptedFiles.length > maxFiles) {
                setError(`Maximum ${maxFiles} images allowed`);
                return;
            }

            // Create preview URLs
            const newImages: UploadedImage[] = acceptedFiles.map((file) => ({
                url: "",
                preview: createImagePreview(file),
                uploading: true,
            }));

            setImages((prev) => [...prev, ...newImages]);

            // Process each file
            for (let i = 0; i < acceptedFiles.length; i++) {
                const file = acceptedFiles[i];

                try {
                    // Compress image
                    const compressedFile = await compressImage(file, {
                        maxSizeMB: 1,
                        maxWidthOrHeight: 2048,
                    });

                    // Upload to Vercel Blob
                    const formData = new FormData();
                    formData.append("file", compressedFile);

                    const result = await uploadPostImage(formData);

                    if (result.success && result.url) {
                        setImages((prev) => {
                            const updated = [...prev];
                            const index = prev.length - acceptedFiles.length + i;
                            updated[index] = {
                                url: result.url!,
                                preview: result.url!,
                                uploading: false,
                            };
                            return updated;
                        });
                    } else {
                        throw new Error(result.error || "Upload failed");
                    }
                } catch (err) {
                    console.error("Upload error:", err);
                    setError(err instanceof Error ? err.message : "Upload failed");

                    // Remove failed upload
                    setImages((prev) => {
                        const updated = [...prev];
                        const index = prev.length - acceptedFiles.length + i;
                        revokeImagePreview(updated[index].preview);
                        updated.splice(index, 1);
                        return updated;
                    });
                }
            }
        },
        [images, maxFiles, mode],
    );

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            "image/jpeg": [".jpg", ".jpeg"],
            "image/png": [".png"],
            "image/webp": [".webp"],
            "image/gif": [".gif"],
        },
        maxSize: maxSizeMB * 1024 * 1024,
        multiple: mode === "multiple",
        disabled: mode === "single" && images.length >= 1,
    });

    const removeImage = (index: number) => {
        setImages((prev) => {
            const updated = [...prev];
            revokeImagePreview(updated[index].preview);
            updated.splice(index, 1);
            return updated;
        });
    };

    return (
        <div className={`space-y-4 ${className}`}>
            {/* Dropzone */}
            {(mode === "multiple" || images.length === 0) && (
                <div
                    {...getRootProps()}
                    className={`
                        border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
                        transition-colors duration-200
                        ${isDragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}
                        ${images.length >= maxFiles ? "opacity-50 cursor-not-allowed" : ""}
                    `}
                >
                    <input {...getInputProps()} />
                    <div className="flex flex-col items-center gap-2">
                        <Upload className="h-10 w-10 text-muted-foreground" />
                        <div>
                            <p className="text-sm font-medium">
                                {isDragActive ? "Umieść tutaj zdjęcia" : "Przeciągnij i upuść zdjęcia tutaj"}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                                lub kliknij, aby przeglądać (maksymalna liczba obrazów {maxFiles}, {maxSizeMB}MB każdy)
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">JPG, PNG, WebP, GIF</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Error message */}
            {error && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                    <p className="text-sm text-destructive">{error}</p>
                </div>
            )}

            {/* Image previews */}
            {images.length > 0 && (
                <div
                    className={`
                    grid gap-4
                    ${images.length === 1 ? "grid-cols-1" : ""}
                    ${images.length === 2 ? "grid-cols-2" : ""}
                    ${images.length >= 3 ? "grid-cols-2 md:grid-cols-3" : ""}
                `}
                >
                    {images.map((image, index) => (
                        <div
                            key={index}
                            className="relative aspect-square rounded-lg overflow-hidden border border-border bg-muted"
                        >
                            {image.uploading ? (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                                    <Loader2 className="h-8 w-8 text-white animate-spin" />
                                </div>
                            ) : (
                                <>
                                    <img
                                        src={image.preview}
                                        alt={`Upload ${index + 1}`}
                                        className="w-full h-full object-cover"
                                    />
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        size="icon"
                                        className="absolute top-2 right-2 h-8 w-8"
                                        onClick={() => removeImage(index)}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Upload count */}
            {images.length > 0 && mode === "multiple" && (
                <p className="text-xs text-muted-foreground text-center">
                    {images.length} / {maxFiles}{" "}
                    {images.length === 1 ? "zdjęcie" : images.length >= 2 && images.length <= 4 ? "zdjęcia" : "zdjęć"}
                </p>
            )}
        </div>
    );
}
