"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { put, del } from '@vercel/blob';
import { getClient } from "@/lib/mongoose";
import { requireAdmin } from "@/lib/auth-helpers";

interface ActionResponse {
    success: boolean;
    message?: string;
    url?: string;
    error?: string;
}

/**
 * Upload image for post
 */
export async function uploadPostImage(formData: FormData): Promise<ActionResponse> {
    try {
        // Check authentication
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session) {
            return { success: false, error: "Authentication required" };
        }

        const file = formData.get('file') as File;
        if (!file) {
            return { success: false, error: "No file provided" };
        }

        // Validate file
        const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (!validTypes.includes(file.type)) {
            return { success: false, error: "Invalid file type. Only JPG, PNG, WebP, and GIF are allowed" };
        }

        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            return { success: false, error: "File size exceeds 5MB limit" };
        }

        // Upload to Vercel Blob
        const filename = `posts/user-${session.user.id}/${Date.now()}-${crypto.randomUUID()}.${file.name.split('.').pop()}`;

        const blob = await put(filename, file, {
            access: 'public',
            token: process.env.BLOB_READ_WRITE_TOKEN!,
        });

        console.log(`[Images] Uploaded post image: ${blob.url}`);

        return {
            success: true,
            url: blob.url,
            message: "Image uploaded successfully"
        };
    } catch (error) {
        console.error('[Images] Upload error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to upload image"
        };
    }
}

/**
 * Upload profile image (avatar or background)
 */
export async function uploadProfileImage(
    formData: FormData,
    type: 'avatar' | 'background'
): Promise<ActionResponse> {
    try {
        // Check authentication
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session) {
            return { success: false, error: "Authentication required" };
        }

        const file = formData.get('file') as File;
        if (!file) {
            return { success: false, error: "No file provided" };
        }

        // Validate file
        const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (!validTypes.includes(file.type)) {
            return { success: false, error: "Invalid file type" };
        }

        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            return { success: false, error: "File size exceeds 5MB limit" };
        }

        const db = await getClient();

        // Get current profile
        const profile = await db.collection("profiles").findOne({ userId: session.user.id });
        if (!profile) {
            return { success: false, error: "Profile not found" };
        }

        // Delete old image if exists
        const oldImageField = type === 'avatar' ? 'image' : 'backgroundImage';
        const oldImage = profile[oldImageField];
        if (oldImage && oldImage.includes('blob.vercel-storage.com')) {
            try {
                await del(oldImage, {
                    token: process.env.BLOB_READ_WRITE_TOKEN!,
                });
                console.log(`[Images] Deleted old ${type}: ${oldImage}`);
            } catch (error) {
                console.warn(`[Images] Could not delete old ${type}:`, error);
            }
        }

        // Upload new image with timestamp to avoid cache issues
        const folder = type === 'avatar' ? 'profiles/avatars' : 'profiles/backgrounds';
        const timestamp = Date.now();
        const filename = `${folder}/${session.user.id}-${type}-${timestamp}.${file.name.split('.').pop()}`;

        const blob = await put(filename, file, {
            access: 'public',
            token: process.env.BLOB_READ_WRITE_TOKEN!,
        });

        // Update image based on type
        if (type === 'avatar') {
            // For avatar, update user.userImage (separate from OAuth image)
            const { ObjectId } = require('mongodb');
            let userId;
            try {
                userId = new ObjectId(session.user.id);
            } catch {
                userId = session.user.id; // Already a string ID
            }

            const updateUserResult = await db.collection("user").updateOne(
                { _id: userId },
                {
                    $set: {
                        userImage: blob.url, // Custom uploaded image (separate from OAuth)
                    }
                }
            );

            console.log(`[Images] Updated user.userImage:`, {
                url: blob.url,
                userId: session.user.id,
                matchedCount: updateUserResult.matchedCount,
                modifiedCount: updateUserResult.modifiedCount,
            });

            // Verify the update
            const verifyUser = await db.collection("user").findOne({ _id: userId });
            console.log(`[Images] Verified user.userImage:`, {
                userId: session.user.id,
                hasUserImage: !!verifyUser?.userImage,
                userImageValue: verifyUser?.userImage,
                hasOAuthImage: !!verifyUser?.image,
                oauthImageValue: verifyUser?.image,
            });
        } else {
            // For background, keep in profile collection
            const updateProfileResult = await db.collection("profiles").updateOne(
                { userId: session.user.id },
                {
                    $set: {
                        backgroundImage: blob.url,
                        updatedAt: new Date()
                    }
                }
            );

            console.log(`[Images] Updated profile.backgroundImage:`, {
                url: blob.url,
                matchedCount: updateProfileResult.matchedCount,
                modifiedCount: updateProfileResult.modifiedCount,
            });
        }

        return {
            success: true,
            url: blob.url,
            message: `${type === 'avatar' ? 'Avatar' : 'Background'} updated successfully`
        };
    } catch (error) {
        console.error(`[Images] Profile ${type} upload error:`, error);
        return {
            success: false,
            error: error instanceof Error ? error.message : `Failed to upload ${type}`
        };
    }
}

/**
 * Delete profile image (avatar or background)
 */
export async function deleteProfileImage(
    type: 'avatar' | 'background'
): Promise<ActionResponse> {
    try {
        // Check authentication
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session) {
            return { success: false, error: "Authentication required" };
        }

        const db = await getClient();
        const { ObjectId } = require('mongodb');

        if (type === 'avatar') {
            // Delete userImage from user collection
            let userId;
            try {
                userId = new ObjectId(session.user.id);
            } catch {
                userId = session.user.id;
            }

            // Get current userImage URL to delete from Blob
            const user = await db.collection("user").findOne({ _id: userId });
            if (user?.userImage && user.userImage.includes('blob.vercel-storage.com')) {
                try {
                    await del(user.userImage, {
                        token: process.env.BLOB_READ_WRITE_TOKEN!,
                    });
                    console.log(`[Images] Deleted blob: ${user.userImage}`);
                } catch (error) {
                    console.warn(`[Images] Could not delete blob:`, error);
                }
            }

            // Remove userImage field from user
            await db.collection("user").updateOne(
                { _id: userId },
                { $unset: { userImage: "" } }
            );

            console.log(`[Images] Deleted user.userImage, OAuth image will show now`);
        } else {
            // Delete backgroundImage from profile
            const profile = await db.collection("profiles").findOne({ userId: session.user.id });

            if (profile?.backgroundImage && profile.backgroundImage.includes('blob.vercel-storage.com')) {
                try {
                    await del(profile.backgroundImage, {
                        token: process.env.BLOB_READ_WRITE_TOKEN!,
                    });
                    console.log(`[Images] Deleted blob: ${profile.backgroundImage}`);
                } catch (error) {
                    console.warn(`[Images] Could not delete blob:`, error);
                }
            }

            // Remove backgroundImage from profile
            await db.collection("profiles").updateOne(
                { userId: session.user.id },
                { $unset: { backgroundImage: "" } }
            );

            console.log(`[Images] Deleted profile.backgroundImage`);
        }

        return {
            success: true,
            message: `${type === 'avatar' ? 'Avatar' : 'Background'} removed successfully`
        };
    } catch (error) {
        console.error(`[Images] Delete ${type} error:`, error);
        return {
            success: false,
            error: error instanceof Error ? error.message : `Failed to delete ${type}`
        };
    }
}

/**
 * Upload company logo (admin only)
 */
export async function uploadCompanyLogo(
    companySlug: string,
    formData: FormData
): Promise<ActionResponse> {
    try {
        // Check admin authentication
        await requireAdmin();

        const file = formData.get('file') as File;
        if (!file) {
            return { success: false, error: "No file provided" };
        }

        // Validate file
        const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (!validTypes.includes(file.type)) {
            return { success: false, error: "Invalid file type" };
        }

        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            return { success: false, error: "File size exceeds 5MB limit" };
        }

        const db = await getClient();

        // Get company
        const company = await db.collection("companies").findOne({ slug: companySlug });
        if (!company) {
            return { success: false, error: "Company not found" };
        }

        // Delete old logo if exists
        if (company.logo && company.logo.includes('blob.vercel-storage.com')) {
            try {
                await del(company.logo, {
                    token: process.env.BLOB_READ_WRITE_TOKEN!,
                });
                console.log(`[Images] Deleted old company logo: ${company.logo}`);
            } catch (error) {
                console.warn('[Images] Could not delete old logo:', error);
            }
        }

        // Upload new logo
        const filename = `companies/${companySlug}-logo.${file.name.split('.').pop()}`;

        const blob = await put(filename, file, {
            access: 'public',
            token: process.env.BLOB_READ_WRITE_TOKEN!,
        });

        // Update company in DB
        await db.collection("companies").updateOne(
            { slug: companySlug },
            {
                $set: {
                    logo: blob.url,
                    updatedAt: new Date()
                }
            }
        );

        console.log(`[Images] Updated company logo for ${companySlug}: ${blob.url}`);

        return {
            success: true,
            url: blob.url,
            message: "Company logo updated successfully"
        };
    } catch (error) {
        console.error('[Images] Company logo upload error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to upload company logo"
        };
    }
}

/**
 * Delete image
 */
export async function deleteImage(url: string, type: 'post' | 'profile' | 'company'): Promise<ActionResponse> {
    try {
        // Check authentication
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session) {
            return { success: false, error: "Authentication required" };
        }

        // Verify ownership based on type
        const db = await getClient();

        if (type === 'profile') {
            const profile = await db.collection("profiles").findOne({ userId: session.user.id });
            if (!profile || (profile.image !== url && profile.backgroundImage !== url)) {
                return { success: false, error: "Unauthorized" };
            }
        }

        if (type === 'company') {
            // Only admin can delete company images
            try {
                await requireAdmin();
            } catch {
                return { success: false, error: "Admin access required" };
            }
        }

        // Delete from Vercel Blob
        if (url.includes('blob.vercel-storage.com')) {
            await del(url, {
                token: process.env.BLOB_READ_WRITE_TOKEN!,
            });
            console.log(`[Images] Deleted image: ${url}`);
        }

        // Update DB if needed
        if (type === 'profile') {
            const profile = await db.collection("profiles").findOne({ userId: session.user.id });
            const updateFields: any = { updatedAt: new Date() };

            if (profile?.image === url) {
                updateFields.image = null;
            }
            if (profile?.backgroundImage === url) {
                updateFields.backgroundImage = null;
            }

            await db.collection("profiles").updateOne(
                { userId: session.user.id },
                { $set: updateFields }
            );
        }

        return {
            success: true,
            message: "Image deleted successfully"
        };
    } catch (error) {
        console.error('[Images] Delete error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to delete image"
        };
    }
}

