"use server";

import { updateTag } from "next/cache";
import { getClient } from "@/lib/mongoose";
import Company from "@/models/Company";
import { requireUser } from "@/app/data/user/require-user";
import { generateSlug } from "@/lib/slug";

export async function createCompany(data: {
    name: string;
    location: string;
    industry: string;
    website?: string;
    description?: string;
}) {
    const session = await requireUser();

    try {
        await getClient();

        // Generate slug from company name
        let slug = generateSlug(data.name);
        console.log('[createCompany] Generated slug:', slug, 'from name:', data.name);

        // Check if company with same slug already exists
        const existingCompany = await Company.findOne({ slug });

        if (existingCompany) {
            console.log('[createCompany] Slug exists, generating new one');
            // Add a number suffix if slug exists
            let counter = 1;
            let newSlug = `${slug}-${counter}`;
            while (await Company.findOne({ slug: newSlug })) {
                counter++;
                newSlug = `${slug}-${counter}`;
            }
            slug = newSlug;
            console.log('[createCompany] Final slug:', slug);
        }

        const newCompany = {
            ...data,
            slug,
            createdBy: session.user.id,
            createdAt: new Date(),
            reviews: [],
            averageRating: 0,
        };

        console.log('[createCompany] Creating company with data:', { ...newCompany, slug });

        const result = await Company.create(newCompany);

        console.log('[createCompany] Company created with _id:', result._id, 'slug:', result.slug);

        const cacheBucket = Math.floor(Date.now() / (5 * 60 * 1000));
        updateTag(`companies-list-${cacheBucket}`);

        return { success: true, companyId: result._id.toString(), slug: result.slug };
    } catch (error) {
        console.error("Failed to create company:", error);
        return { success: false, error: "Failed to create company" };
    }
}

export async function addCompanyReview(
    companyId: string,
    data: {
        title: string;
        content: string;
        rating: number;
        role: string;
        reviewType: "work" | "interview";
    }
) {
    const session = await requireUser();

    try {
        await getClient();

        const company = await Company.findById(companyId);

        if (!company) {
            return { success: false, error: "Company not found" };
        }

        const newReview = {
            ...data,
            user: session.user.id,
            createdAt: new Date(),
            likes: [],
            comments: [],
        };

        company.reviews.push(newReview);

        // Calculate new average rating
        const totalRating = company.reviews.reduce((sum: number, review: any) => sum + review.rating, 0);
        company.averageRating = totalRating / company.reviews.length;

        await company.save();

        updateTag(`company-${companyId}`);
        updateTag(`company-slug-${company.slug}`);
        const cacheBucket = Math.floor(Date.now() / (5 * 60 * 1000));
        updateTag(`companies-list-${cacheBucket}`);

        return { success: true };
    } catch (error) {
        console.error("Failed to add review:", error);
        return { success: false, error: "Failed to add review" };
    }
}

export async function updateCompany(
    companyId: string,
    data: {
        name?: string;
        location?: string;
        industry?: string;
        website?: string;
        description?: string;
    }
) {
    const session = await requireUser();

    try {
        await getClient();

        const company = await Company.findById(companyId);

        if (!company) {
            return { success: false, error: "Company not found" };
        }

        if (company.createdBy.toString() !== session.user.id) {
            return { success: false, error: "Not authorized to edit this company" };
        }

        Object.assign(company, data);
        company.updatedAt = new Date();
        await company.save();

        updateTag(`company-${companyId}`);
        updateTag(`company-slug-${company.slug}`);
        const cacheBucket = Math.floor(Date.now() / (5 * 60 * 1000));
        updateTag(`companies-list-${cacheBucket}`);

        return { success: true };
    } catch (error) {
        console.error("Failed to update company:", error);
        return { success: false, error: "Failed to update company" };
    }
}

export async function deleteCompany(companyId: string) {
    const session = await requireUser();

    try {
        await getClient();

        const company = await Company.findById(companyId);

        if (!company) {
            return { success: false, error: "Company not found" };
        }

        if (company.createdBy.toString() !== session.user.id) {
            return { success: false, error: "Not authorized to delete this company" };
        }

        const companySlug = company.slug;

        await Company.findByIdAndDelete(companyId);

        updateTag(`company-${companyId}`);
        updateTag(`company-slug-${companySlug}`);
        const cacheBucket = Math.floor(Date.now() / (5 * 60 * 1000));
        updateTag(`companies-list-${cacheBucket}`);

        return { success: true };
    } catch (error) {
        console.error("Failed to delete company:", error);
        return { success: false, error: "Failed to delete company" };
    }
}

export async function toggleReviewLike(companyId: string, reviewId: string) {
    const session = await requireUser();

    try {
        await getClient();
        const company = await Company.findById(companyId);

        if (!company) {
            return { success: false, error: "Company not found" };
        }

        const review = company.reviews.id(reviewId);
        if (!review) {
            return { success: false, error: "Review not found" };
        }

        const userId = session.user.id;
        const likeIndex = review.likes.indexOf(userId);

        if (likeIndex > -1) {
            review.likes.splice(likeIndex, 1);
        } else {
            review.likes.push(userId);
        }

        await company.save();

        updateTag(`company-${companyId}`);
        updateTag(`company-slug-${company.slug}`);
        return { success: true, isLiked: likeIndex === -1, likesCount: review.likes.length };
    } catch (error) {
        console.error("Failed to toggle like:", error);
        return { success: false, error: "Failed to toggle like" };
    }
}

export async function updateReview(
    companyId: string,
    reviewId: string,
    data: {
        title?: string;
        content?: string;
        rating?: number;
        role?: string;
    }
) {
    const session = await requireUser();

    try {
        await getClient();
        const company = await Company.findById(companyId);

        if (!company) {
            return { success: false, error: "Company not found" };
        }

        const review = company.reviews.id(reviewId);
        if (!review) {
            return { success: false, error: "Review not found" };
        }

        if (review.user.toString() !== session.user.id) {
            return { success: false, error: "Not authorized to edit this review" };
        }

        Object.assign(review, data);
        review.updatedAt = new Date();

        // Recalculate average rating if rating changed
        if (data.rating) {
            const totalRating = company.reviews.reduce((sum: number, r: any) => sum + r.rating, 0);
            company.averageRating = totalRating / company.reviews.length;
        }

        await company.save();

        updateTag(`company-${companyId}`);
        updateTag(`company-slug-${company.slug}`);
        return { success: true };
    } catch (error) {
        console.error("Failed to update review:", error);
        return { success: false, error: "Failed to update review" };
    }
}

export async function deleteReview(companyId: string, reviewId: string) {
    const session = await requireUser();

    try {
        await getClient();
        const company = await Company.findById(companyId);

        if (!company) {
            return { success: false, error: "Company not found" };
        }

        const review = company.reviews.id(reviewId);
        if (!review) {
            return { success: false, error: "Review not found" };
        }

        if (review.user.toString() !== session.user.id) {
            return { success: false, error: "Not authorized to delete this review" };
        }

        company.reviews.pull(reviewId);

        // Recalculate average rating
        if (company.reviews.length > 0) {
            const totalRating = company.reviews.reduce((sum: number, r: any) => sum + r.rating, 0);
            company.averageRating = totalRating / company.reviews.length;
        } else {
            company.averageRating = 0;
        }

        await company.save();

        updateTag(`company-${companyId}`);
        updateTag(`company-slug-${company.slug}`);
        return { success: true };
    } catch (error) {
        console.error("Failed to delete review:", error);
        return { success: false, error: "Failed to delete review" };
    }
}

