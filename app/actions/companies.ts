"use server";

import { revalidateTag } from "next/cache";
import { getClient } from "@/lib/mongoose";
import Company from "@/models/Company";
import Profile from "@/models/Profile";
import Post from "@/models/Post";
import { requireUser } from "@/app/data/user/require-user";
import { auth } from "@/lib/auth";
import { generateSlug } from "@/lib/slug";
import { updateCompanyKeywords } from "./company-keywords";
import { requireAuth } from "@/lib/auth-helpers";
import { validateCompanyReview, sanitizeString } from "@/lib/validation";
import { requireNotBanned } from "@/lib/ban-check";
import { put, del } from "@vercel/blob";
import { headers } from "next/headers";

type ActionResponse = {
    success: boolean;
    error?: string;
    url?: string;
    message?: string;
};

export async function createCompany(data: {
    name: string;
    location: string;
    industry: string;
    website?: string;
    description?: string;
    customIndustries?: string[];
}) {
    const user = await requireAuth();

    // Check if user is banned
    await requireNotBanned();

    // Validate and sanitize input
    if (!data.name || data.name.trim().length === 0) {
        return { success: false, error: "Company name is required" };
    }

    if (data.name.length > 200) {
        return { success: false, error: "Company name must be less than 200 characters" };
    }

    try {
        await getClient();

        // Sanitize all string fields
        const sanitizedData = {
            name: sanitizeString(data.name),
            location: sanitizeString(data.location),
            industry: sanitizeString(data.industry),
            website: data.website ? sanitizeString(data.website) : undefined,
            description: data.description ? sanitizeString(data.description) : undefined,
        };

        // Generate slug from company name
        let slug = generateSlug(sanitizedData.name);
        console.log("[createCompany] Generated slug:", slug, "from name:", sanitizedData.name);

        // Check if company with same slug already exists
        const existingCompany = await Company.findOne({ slug });

        if (existingCompany) {
            console.log("[createCompany] Slug exists, generating new one");
            // Add a number suffix if slug exists
            let counter = 1;
            let newSlug = `${slug}-${counter}`;
            while (await Company.findOne({ slug: newSlug })) {
                counter++;
                newSlug = `${slug}-${counter}`;
            }
            slug = newSlug;
            console.log("[createCompany] Final slug:", slug);
        }

        // Add custom industries to detectedKeywords
        const detectedKeywords = data.customIndustries ? data.customIndustries.map((ind) => sanitizeString(ind)) : [];

        const newCompany = {
            ...sanitizedData,
            slug,
            detectedKeywords,
            createdBy: user.id,
            createdAt: new Date(),
            reviews: [],
            averageRating: 0,
        };

        // Avoid logging full company object (may contain user ids). Keep a lightweight message.
        console.log("[createCompany] Creating company with slug:", slug);

        const result = await Company.create(newCompany);

        console.log("[createCompany] Company created with _id:", result._id, "slug:", result.slug);

        const cacheBucket = Math.floor(Date.now() / (5 * 60 * 1000));
        revalidateTag(`companies-list-${cacheBucket}`, "max");

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
        nick: string;
    },
) {
    const user = await requireAuth();

    // Check if user is banned
    await requireNotBanned();

    // Validate nick
    if (!data.nick || data.nick.trim().length < 2) {
        return { success: false, error: "Nickname must be at least 2 characters" };
    }

    if (data.nick.trim().length > 30) {
        return { success: false, error: "Nickname is too long (max 30 characters)" };
    }

    // Validate review data
    const validation = validateCompanyReview({
        rating: data.rating,
        role: data.role,
        comment: data.content,
    });

    if (!validation.valid) {
        return { success: false, error: validation.error };
    }

    // Sanitize input
    const sanitizedData = {
        title: sanitizeString(data.title),
        content: sanitizeString(data.content),
        rating: data.rating,
        role: sanitizeString(data.role),
        reviewType: data.reviewType,
        nick: sanitizeString(data.nick.trim()),
    };

    if (!sanitizedData.title || sanitizedData.title.length === 0) {
        return { success: false, error: "Review title is required" };
    }

    if (sanitizedData.title.length > 300) {
        return { success: false, error: "Review title must be less than 300 characters" };
    }

    try {
        await getClient();

        const company = await Company.findById(companyId);

        if (!company) {
            return { success: false, error: "Company not found" };
        }

        // Check if user already reviewed this company
        const existingReview = company.reviews.find((review: any) => review.user.toString() === user.id);

        if (existingReview) {
            return { success: false, error: "Już oceniłeś tę firmę" };
        }

        const newReview = {
            ...sanitizedData,
            user: user.id,
            createdAt: new Date(),
            likes: [],
            comments: [],
        };

        company.reviews.push(newReview);

        const totalRating = company.reviews.reduce((sum: number, review: any) => sum + review.rating, 0);
        company.averageRating = totalRating / company.reviews.length;

        await company.save();

        // Update company keywords based on new review content
        await updateCompanyKeywords(companyId);

        revalidateTag(`company-${companyId}`, "max");
        revalidateTag(`company-slug-${company.slug}`, "max");
        const cacheBucket = Math.floor(Date.now() / (5 * 60 * 1000));
        revalidateTag(`companies-list-${cacheBucket}`, "max");

        return { success: true };
    } catch (error) {
        console.error("Failed to add review:", error);
        return { success: false, error: "Failed to add review" };
    }
}

export async function deleteCompanyReview(companyId: string, reviewId: string) {
    const user = await requireAuth();

    // Check if user is banned
    await requireNotBanned();

    try {
        await getClient();

        const company = await Company.findById(companyId);

        if (!company) {
            return { success: false, error: "Company not found" };
        }

        // Find the review
        const review = company.reviews.id(reviewId);

        if (!review) {
            return { success: false, error: "Review not found" };
        }

        // Check if user owns this review
        if (review.user.toString() !== user.id) {
            return { success: false, error: "You can only delete your own reviews" };
        }

        // Remove the review
        company.reviews.pull(reviewId);

        // Recalculate average rating
        if (company.reviews.length > 0) {
            const totalRating = company.reviews.reduce((sum: number, review: any) => sum + review.rating, 0);
            company.averageRating = totalRating / company.reviews.length;
        } else {
            company.averageRating = 0;
        }

        await company.save();

        // Update company keywords based on remaining reviews
        await updateCompanyKeywords(companyId);

        revalidateTag(`company-${companyId}`, "max");
        revalidateTag(`company-slug-${company.slug}`, "max");
        const cacheBucket = Math.floor(Date.now() / (5 * 60 * 1000));
        revalidateTag(`companies-list-${cacheBucket}`, "max");

        return { success: true };
    } catch (error) {
        console.error("Failed to delete review:", error);
        return { success: false, error: "Failed to delete review" };
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
    },
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

        revalidateTag(`company-${companyId}`, "max");
        revalidateTag(`company-slug-${company.slug}`, "max");
        const cacheBucket = Math.floor(Date.now() / (5 * 60 * 1000));
        revalidateTag(`companies-list-${cacheBucket}`, "max");

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

        revalidateTag(`company-${companyId}`, "max");
        revalidateTag(`company-slug-${companySlug}`, "max");
        const cacheBucket = Math.floor(Date.now() / (5 * 60 * 1000));
        revalidateTag(`companies-list-${cacheBucket}`, "max");

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

        let isLiking = false;
        if (likeIndex > -1) {
            review.likes.splice(likeIndex, 1);
        } else {
            review.likes.push(userId);
            isLiking = true;
        }

        await company.save();

        // Track like interaction in user's profile
        if (isLiking) {
            try {
                const profile = await Profile.findOne({ userId });
                if (profile) {
                    profile.interactionHistory.push({
                        type: "like",
                        targetId: companyId,
                        targetType: "company",
                        timestamp: new Date(),
                    });

                    if (profile.interactionHistory.length > 100) {
                        profile.interactionHistory = profile.interactionHistory.slice(-100);
                    }

                    await profile.save();
                    console.log(`[toggleReviewLike] Tracked like on company ${companyId}`);
                }
            } catch (error) {
                console.error("[toggleReviewLike] Failed to track interaction:", error);
            }
        }

        revalidateTag(`company-${companyId}`, "max");
        revalidateTag(`company-slug-${company.slug}`, "max");
        return { success: true, isLiked: isLiking, likesCount: review.likes.length };
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
    },
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

        revalidateTag(`company-${companyId}`, "max");
        revalidateTag(`company-slug-${company.slug}`, "max");
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

        revalidateTag(`company-${companyId}`, "max");
        revalidateTag(`company-slug-${company.slug}`, "max");
        return { success: true };
    } catch (error) {
        console.error("Failed to delete review:", error);
        return { success: false, error: "Failed to delete review" };
    }
}

/**
 * Add comment to review with anonymous nickname
 */
export async function addCommentToReview(companyId: string, reviewId: string, content: string, nick: string) {
    const user = await requireAuth();
    await requireNotBanned();

    // Validate nick
    if (!nick || nick.trim().length < 2) {
        return { success: false, error: "Nickname must be at least 2 characters" };
    }

    if (nick.trim().length > 30) {
        return { success: false, error: "Nickname is too long (max 30 characters)" };
    }

    // Validate content
    if (!content || content.trim().length === 0) {
        return { success: false, error: "Comment content is required" };
    }

    if (content.length > 1000) {
        return { success: false, error: "Comment is too long (max 1000 characters)" };
    }

    const sanitizedContent = sanitizeString(content);
    const sanitizedNick = sanitizeString(nick.trim());

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

        // SECURITY: Prevent the author of the review from adding a comment to their own review
        // This blocks attempts to comment under a different nick using the same account
        if (review.user && review.user.toString() === user.id) {
            return { success: false, error: "Nie możesz komentować własnej opinii" };
        }

        // Prevent same user from adding multiple top-level comments under the same review
        if (Array.isArray(review.comments) && review.comments.some((c: any) => c.user && c.user.toString() === user.id)) {
            return { success: false, error: "Już skomentowałeś tę opinię" };
        }

        const newComment = {
            content: sanitizedContent,
            user: user.id,
            nick: sanitizedNick,
            likes: [],
            replies: [],
            createdAt: new Date(),
        };

        review.comments.push(newComment);
        await company.save();

        revalidateTag(`company-${companyId}`, "max");
        revalidateTag(`company-slug-${company.slug}`, "max");

        return { success: true };
    } catch (error) {
        console.error("Failed to add comment:", error);
        return { success: false, error: "Failed to add comment" };
    }
}

/**
 * Add reply to comment with anonymous nickname
 */
export async function addReplyToComment(
    companyId: string,
    reviewId: string,
    commentId: string | undefined,
    content: string,
    nick: string,
) {
    const user = await requireAuth();
    await requireNotBanned();

    // Validate nick
    if (!nick || nick.trim().length < 2) {
        return { success: false, error: "Nickname must be at least 2 characters" };
    }

    if (nick.trim().length > 30) {
        return { success: false, error: "Nickname is too long (max 30 characters)" };
    }

    // Validate content
    if (!content || content.trim().length === 0) {
        return { success: false, error: "Reply content is required" };
    }

    if (content.length > 1000) {
        return { success: false, error: "Reply is too long (max 1000 characters)" };
    }

    const sanitizedContent = sanitizeString(content);
    const sanitizedNick = sanitizeString(nick.trim());

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

        const comment = review.comments.id(commentId);
        if (!comment) {
            return { success: false, error: "Comment not found" };
        }

        // SECURITY: Prevent the author of the review from replying to comments under their own review
        if (review.user && review.user.toString() === user.id) {
            return { success: false, error: "Nie możesz odpowiadać na komentarze pod własną opinią" };
        }

        // Prevent same user from adding multiple replies to the same comment (per-account)
        if (Array.isArray(comment.replies) && comment.replies.some((r: any) => r.user && r.user.toString() === user.id)) {
            return { success: false, error: "Już odpowiedziałeś na ten komentarz" };
        }

        const newReply = {
            content: sanitizedContent,
            user: user.id,
            nick: sanitizedNick,
            likes: [],
            createdAt: new Date(),
        };

        comment.replies.push(newReply);
        await company.save();

        revalidateTag(`company-${companyId}`, "max");
        revalidateTag(`company-slug-${company.slug}`, "max");

        return { success: true };
    } catch (error) {
        console.error("Failed to add reply:", error);
        return { success: false, error: "Failed to add reply" };
    }
}

// Helper to sanitize company data for public consumption
// Accept an optional session (Better Auth) so callers can resolve session once and pass it in.
async function sanitizeCompany(company: any, session?: any): Promise<any> {
    const userId = session?.user?.id;
    const userRole = session?.user?.role;

    const plain: any = {
        _id: String(company._id || ""),
        name: String(company.name || ""),
        slug: String(company.slug || ""),
        logo: company.logo ? String(company.logo) : null,
        location: String(company.location || ""),
        industry: String(company.industry || ""),
        website: company.website ? String(company.website) : null,
        description: company.description ? String(company.description) : null,
        detectedKeywords: Array.isArray(company.detectedKeywords) ? company.detectedKeywords.map((k: any) => String(k)) : [],
        // DO NOT expose createdBy in public DTO
        averageRating: Number(company.averageRating || 0),
        createdAt: company.createdAt
            ? company.createdAt instanceof Date
                ? company.createdAt.toISOString()
                : String(company.createdAt)
            : new Date().toISOString(),
        updatedAt: company.updatedAt
            ? company.updatedAt instanceof Date
                ? company.updatedAt.toISOString()
                : String(company.updatedAt)
            : null,
        reviews: [],
        reviewCount: 0,
        lastReviewDate: null,
    };

    if (company.reviews && Array.isArray(company.reviews)) {
        plain.reviewCount = company.reviews.length;
        plain.lastReviewDate =
            company.reviews.length > 0
                ? company.reviews[company.reviews.length - 1].createdAt instanceof Date
                    ? company.reviews[company.reviews.length - 1].createdAt.toISOString()
                    : String(company.reviews[company.reviews.length - 1].createdAt)
                : null;

        plain.reviews = company.reviews.map((r: any) => {
            // owner id may be stored on r.user or r.author (various shapes). Resolve to string when possible but DO NOT expose it.
            let ownerId: string | undefined = undefined;
            if (r.user) {
                if (typeof r.user === "string") ownerId = r.user;
                else if (typeof r.user === "object") ownerId = String((r.user as any)._id ?? (r.user as any).id ?? "");
            } else if (r.author) {
                if (typeof r.author === "string") ownerId = r.author;
                else if (typeof r.author === "object") ownerId = String((r.author as any)._id ?? (r.author as any).id ?? "");
            }

            const computedOwn = !!(userId && ownerId && userId === ownerId);
            const computedIsAdmin = userRole === "admin";
            const canEdit = computedOwn || computedIsAdmin;
            const canDelete = computedOwn || computedIsAdmin;

            const likesCount = Array.isArray(r.likes) ? r.likes.length : 0;
            const isLiked = !!(userId && Array.isArray(r.likes) && r.likes.includes(userId));

            const comments = Array.isArray(r.comments)
                ? r.comments.map((c: any) => {
                      const commentLikesCount = Array.isArray(c.likes) ? c.likes.length : 0;
                      const commentIsLiked = !!(userId && Array.isArray(c.likes) && c.likes.includes(userId));

                      const replies = Array.isArray(c.replies)
                          ? c.replies.map((rep: any) => ({
                                id: String(rep._id || rep.id || ""),
                                _id: String(rep._id || rep.id || ""),
                                content: String(rep.content || ""),
                                likesCount: Array.isArray(rep.likes) ? rep.likes.length : 0,
                                isLiked: !!(userId && Array.isArray(rep.likes) && rep.likes.includes(userId)),
                                createdAt:
                                    rep.createdAt instanceof Date
                                        ? rep.createdAt.toISOString()
                                        : String(rep.createdAt || new Date().toISOString()),
                                author: { nick: String(rep.nick || (rep.author && rep.author.nick) || "Anonymous") },
                                permissions: {
                                    canEdit: !!(userId && rep.user && String(rep.user) === userId) || userRole === "admin",
                                    canDelete: !!(userId && rep.user && String(rep.user) === userId) || userRole === "admin",
                                },
                            }))
                          : [];

                      return {
                          id: String(c._id || c.id || ""),
                          _id: String(c._id || c.id || ""),
                          content: String(c.content || ""),
                          likesCount: commentLikesCount,
                          isLiked: commentIsLiked,
                          createdAt:
                              c.createdAt instanceof Date
                                  ? c.createdAt.toISOString()
                                  : String(c.createdAt || new Date().toISOString()),
                          replies,
                          author: { nick: String(c.nick || (c.author && c.author.nick) || "Anonymous") },
                          permissions: {
                              canEdit: !!(userId && c.user && String(c.user) === userId) || userRole === "admin",
                              canDelete: !!(userId && c.user && String(c.user) === userId) || userRole === "admin",
                          },
                      };
                  })
                : [];

            return {
                id: String(r._id || r.id || ""),
                _id: String(r._id || r.id || ""),
                title: String(r.title || ""),
                content: String(r.content || ""),
                rating: Number(r.rating || 0),
                role: String(r.role || ""),
                reviewType: String(r.reviewType || "work"),
                nick: String(r.nick || "Anonymous"),
                likesCount,
                isLiked,
                createdAt: r.createdAt
                    ? r.createdAt instanceof Date
                        ? r.createdAt.toISOString()
                        : String(r.createdAt)
                    : new Date().toISOString(),
                updatedAt: r.updatedAt ? (r.updatedAt instanceof Date ? r.updatedAt.toISOString() : String(r.updatedAt)) : null,
                comments,
                permissions: {
                    canEdit,
                    canDelete,
                },
            };
        });
    }

    // DEV RG: assert DTO doesn't contain sensitive user identifiers
    if (process.env.NODE_ENV !== "production") {
        try {
            assertNoSensitiveFields(plain);
        } catch (e) {
            // Throwing here helps catch regressions during development
            console.error("Sensitive field leak detected in sanitizeCompany:", e);
            throw e;
        }
    }

    return plain;
}

function assertNoSensitiveFields(obj: any, path = "") {
    if (!obj || typeof obj !== "object") return;
    const sensitiveKeys = ["user", "userId", "createdBy", "password"];
    for (const key of Object.keys(obj)) {
        const fullPath = path ? `${path}.${key}` : key;
        if (sensitiveKeys.includes(key)) {
            throw new Error(`Sensitive key found in DTO: ${fullPath}`);
        }
        const val = obj[key];
        if (Array.isArray(val)) {
            val.forEach((v, idx) => assertNoSensitiveFields(v, `${fullPath}[${idx}]`));
        } else if (val && typeof val === "object") {
            assertNoSensitiveFields(val, fullPath);
        }
    }
}

export async function getPersonalizedCompanies(limit: number = 20, skip: number = 0) {
    const session = await auth.api.getSession({
        headers: await import("next/headers").then((m) => m.headers()),
    });

    if (!session) {
        return getGenericCompanies(limit, skip);
    }

    try {
        await getClient();

        const profile = await Profile.findOne({ userId: session.user.id });

        if (!profile || !profile.preferences.onboardingCompleted) {
            return getGenericCompanies(limit, skip);
        }

        const interactionCount = profile.interactionHistory.length;

        // Cold start: mix generic and personalized
        if (interactionCount < 10) {
            const genericResult = await getGenericCompanies(Math.ceil(limit * 0.6), skip);
            const personalizedCompanies = await getPersonalizedCompaniesInternal(profile, Math.floor(limit * 0.4), 0);

            const genericCompanies = genericResult.success ? genericResult.companies : [];

            const allCompanies = [...personalizedCompanies, ...genericCompanies];
            const uniqueCompanies = Array.from(new Map(allCompanies.map((company) => [company._id, company])).values()).slice(
                0,
                limit,
            );

            return {
                success: true,
                companies: uniqueCompanies,
            };
        }

        // Get personalized companies (80% of feed)
        const personalizedCount = Math.floor(limit * 0.8);
        const explorationCount = limit - personalizedCount;

        const personalizedCompanies = await getPersonalizedCompaniesInternal(profile, personalizedCount, skip);
        const explorationResult = await getGenericCompanies(explorationCount, Math.floor(Math.random() * 10));
        const explorationCompanies = explorationResult.success ? explorationResult.companies : [];

        const allCompanies = [...personalizedCompanies, ...explorationCompanies];
        const uniqueCompanies = Array.from(new Map(allCompanies.map((company) => [company._id, company])).values());

        return {
            success: true,
            companies: uniqueCompanies,
        };
    } catch (error) {
        console.error("Failed to get personalized companies:", error);
        return getGenericCompanies(limit, skip);
    }
}

async function getPersonalizedCompaniesInternal(profile: any, limit: number, skip: number) {
    const companies = await Company.find().sort({ createdAt: -1 }).limit(100).lean();

    // when available, we may compute permissions for reviews using profile.userId
    const currentUserId = profile?.userId ?? null;
    const isAdmin = profile?.role === "admin";
    // We don't have the Better Auth session object here; sanitizeCompany without session will compute permisssions as false.
    // If this function is invoked from a server context where session is available, consider passing session down.
    const companiesPlain = await Promise.all(companies.map((company: any) => sanitizeCompany(company)));

    // Extract user data for matching
    const userExperience = profile.experience || [];
    const userSkills = (profile.skills || []).map((s: any) => s.name?.toLowerCase());
    const userPreferences = profile.preferences || {};
    const preferredIndustries = (userPreferences.industries || []).map((i: string) => i.toLowerCase());
    const preferredSkills = (userPreferences.skills || []).map((s: string) => s.toLowerCase());

    // === LEARN FROM INTERACTION HISTORY ===
    const learnedKeywords = new Set<string>();
    const learnedIndustries = new Set<string>();
    const viewedCompanyIds = new Set<string>();

    // Get companies user has interacted with (last 30 days)
    const recentCompanyInteractions = profile.interactionHistory.filter(
        (int: any) => int.targetType === "company" && Date.now() - new Date(int.timestamp).getTime() < 30 * 24 * 60 * 60 * 1000,
    );

    // Fetch those companies to learn preferences
    const interactedCompanyIds = recentCompanyInteractions.map((int: any) => int.targetId);
    const interactedCompanies = await Company.find({ _id: { $in: interactedCompanyIds } }).lean();

    interactedCompanies.forEach((company: any) => {
        viewedCompanyIds.add(company._id.toString());

        // Learn from company keywords
        if (company.detectedKeywords) {
            company.detectedKeywords.forEach((kw: string) => learnedKeywords.add(kw.toLowerCase()));
        }
        // Learn industries
        if (company.industry) {
            learnedIndustries.add(company.industry.toLowerCase());
        }
    });

    // Also learn from posts user has interacted with
    const recentPostInteractions = profile.interactionHistory.filter(
        (int: any) =>
            int.targetType === "post" &&
            int.type !== "view" &&
            Date.now() - new Date(int.timestamp).getTime() < 30 * 24 * 60 * 60 * 1000,
    );

    const interactedPostIds = recentPostInteractions.map((int: any) => int.targetId);
    const interactedPosts = await Post.find({ _id: { $in: interactedPostIds } }).lean();

    interactedPosts.forEach((post: any) => {
        if (post.detectedSkills) {
            post.detectedSkills.forEach((skill: string) => learnedKeywords.add(skill.toLowerCase()));
        }
        if (post.detectedIndustries) {
            post.detectedIndustries.forEach((ind: string) => learnedIndustries.add(ind.toLowerCase()));
        }
    });

    // Score each company
    const scoredCompanies = companiesPlain.map((company: any) => {
        let score = 0;
        const matchReasons: { reason: string; points: number }[] = [];

        const companyName = company.name?.toLowerCase() || "";
        const companyIndustry = company.industry?.toLowerCase() || "";
        const companyKeywords = (company.detectedKeywords || []).map((k: string) => k.toLowerCase());

        // 1. Experience match (highest priority) - +100 points
        const hasWorkedHere = userExperience.some((exp: any) => {
            const expCompany = exp.company?.toLowerCase() || "";
            const companyNameLower = companyName;

            if (expCompany === companyNameLower) {
                return true;
            }

            if (expCompany.includes(companyNameLower) || companyNameLower.includes(expCompany)) {
                return true;
            }

            const cleanExpCompany = expCompany.replace(/\s+(group|inc|ltd|llc|corporation|corp|company|co\.?)$/i, "").trim();
            const cleanCompanyName = companyNameLower
                .replace(/\s+(group|inc|ltd|llc|corporation|corp|company|co\.?)$/i, "")
                .trim();

            return (
                cleanExpCompany === cleanCompanyName ||
                cleanExpCompany.includes(cleanCompanyName) ||
                cleanCompanyName.includes(cleanExpCompany)
            );
        });

        if (hasWorkedHere) {
            score += 100;
            matchReasons.push({ reason: "You worked here", points: 100 });
        }

        // NEW: Boost companies user has viewed/interacted with recently
        if (viewedCompanyIds.has(company._id)) {
            score += 25;
            matchReasons.push({ reason: "You viewed this company", points: 25 });
        }

        // 2. Skills match with company keywords - +10 points per match
        const matchingSkills = userSkills.filter((skill: string) =>
            companyKeywords.some((keyword: string) => keyword.includes(skill) || skill.includes(keyword)),
        );

        if (matchingSkills.length > 0) {
            const points = matchingSkills.length * 10;
            score += points;
            matchReasons.push({
                reason: `Matches your skills: ${matchingSkills.slice(0, 3).join(", ")}`,
                points,
            });
        }

        // NEW: Match with learned keywords from interaction history (HIGHEST!)
        const learnedKeywordMatches = companyKeywords.filter((keyword: string) => learnedKeywords.has(keyword));

        if (learnedKeywordMatches.length > 0) {
            const points = learnedKeywordMatches.length * 15;
            score += points;
            matchReasons.push({
                reason: `Based on your activity: ${learnedKeywordMatches.slice(0, 3).join(", ")}`,
                points,
            });
        }

        // 3. Preferred skills match with company keywords - +8 points per match
        const matchingPreferredSkills = preferredSkills.filter((skill: string) =>
            companyKeywords.some((keyword: string) => keyword.includes(skill) || skill.includes(keyword)),
        );

        if (matchingPreferredSkills.length > 0) {
            const points = matchingPreferredSkills.length * 8;
            score += points;
            matchReasons.push({
                reason: `Matches your interests: ${matchingPreferredSkills.slice(0, 3).join(", ")}`,
                points,
            });
        }

        // 4. Industry match - +20 points
        const industryMatch = preferredIndustries.some(
            (industry: string) => companyIndustry.includes(industry) || industry.includes(companyIndustry),
        );

        if (industryMatch) {
            score += 20;
            matchReasons.push({ reason: "Industry match", points: 20 });
        }

        // NEW: Match with learned industries from interaction history
        if (learnedIndustries.has(companyIndustry)) {
            score += 12;
            matchReasons.push({ reason: "Industry you've shown interest in", points: 12 });
        }

        // 5. Experience in similar industry - +15 points
        const hasRelatedExperience = userExperience.some((exp: any) => {
            return (
                exp.title?.toLowerCase().includes(companyIndustry) || exp.description?.toLowerCase().includes(companyIndustry)
            );
        });

        if (hasRelatedExperience) {
            score += 15;
            matchReasons.push({ reason: "Related experience", points: 15 });
        }

        // 6. Education field match with company keywords - +5 points
        const userEducation = profile.education || [];
        const educationMatch = userEducation.some((edu: any) => {
            const field = edu.field?.toLowerCase() || "";
            return companyKeywords.some((keyword: string) => keyword.includes(field) || field.includes(keyword));
        });

        if (educationMatch) {
            score += 5;
            matchReasons.push({ reason: "Education match", points: 5 });
        }

        // 7. Company quality boost - +1-5 points
        const averageRating = company.averageRating || 0;
        const reviewCount = company.reviewCount || 0;

        let qualityBoost = 0;
        if (averageRating > 3.5 && reviewCount > 5) {
            qualityBoost = 5;
        } else if (averageRating > 3 && reviewCount > 2) {
            qualityBoost = 3;
        } else if (reviewCount > 0) {
            qualityBoost = 1;
        }

        if (qualityBoost > 0) {
            score += qualityBoost;
            matchReasons.push({
                reason: `High quality (${averageRating.toFixed(1)}⭐, ${reviewCount} reviews)`,
                points: qualityBoost,
            });
        }

        // Recency boost
        const daysSinceCreation = (Date.now() - new Date(company.createdAt).getTime()) / (24 * 60 * 60 * 1000);
        const recencyBoost = Math.max(0, 3 - daysSinceCreation * 0.3);
        if (recencyBoost > 0.5) {
            score += recencyBoost;
            matchReasons.push({
                reason: `New company (${Math.round(daysSinceCreation)} days old)`,
                points: Math.round(recencyBoost * 10) / 10,
            });
        }

        return { ...company, score, matchReasons };
    });

    return scoredCompanies
        .sort((a, b) => b.score - a.score)
        .slice(skip, skip + limit)
        .map((company) => ({
            ...company,
            matchScore: Math.round(company.score * 10) / 10,
        }));
}

export async function getGenericCompanies(limit: number = 20, skip: number = 0) {
    try {
        await getClient();

        const companies = await Company.find().sort({ createdAt: -1 }).limit(50).lean();

        // Try to resolve session to compute permissions; if not available, pass nulls
        let currentUserId: string | null = null;
        let isAdmin = false;
        let session: any = null;
        try {
            session = await auth.api.getSession({ headers: await import("next/headers").then((m) => m.headers()) });
            if (session) {
                currentUserId = (session as any).user.id;
                isAdmin = (session as any).user?.role === "admin";
            }
        } catch (e) {
            // ignore - unauthenticated
        }

        const companiesPlain = await Promise.all(companies.map((company: any) => sanitizeCompany(company, session)));

        // Score companies based on engagement and quality
        const scoredCompanies = companiesPlain.map((company: any) => {
            const reviewCount = company.reviewCount || 0;
            const averageRating = company.averageRating || 0;

            const engagementScore = reviewCount * 0.5 + averageRating * 2;

            const daysSinceCreation = (Date.now() - new Date(company.createdAt).getTime()) / (24 * 60 * 60 * 1000);
            const recencyScore = Math.max(0, 10 - daysSinceCreation) * 0.3;

            const totalScore = engagementScore + recencyScore;

            return { ...company, score: totalScore };
        });

        const sortedCompanies = scoredCompanies
            .sort((a, b) => b.score - a.score)
            .slice(skip, skip + limit)
            .map((company) => ({
                ...company,
                matchScore: Math.round(company.score * 10) / 10,
                matchReasons: [{ reason: "Generic feed (popularity-based)", points: Math.round(company.score * 10) / 10 }],
            }));

        return {
            success: true,
            companies: sortedCompanies,
        };
    } catch (error) {
        console.error("Failed to get generic companies:", error);
        return { success: false, error: "Failed to load companies", companies: [] };
    }
}

/**
 * Upload company logo
 */
export async function uploadCompanyLogo(formData: FormData, companyId: string): Promise<ActionResponse> {
    try {
        // Check authentication
        const user = await requireAuth();

        const file = formData.get("file") as File;
        if (!file) {
            return { success: false, error: "No file provided" };
        }

        // Validate file
        const validTypes = ["image/jpeg", "image/png", "image/webp", "image/svg+xml"];
        if (!validTypes.includes(file.type)) {
            return { success: false, error: "Invalid file type. Please upload JPG, PNG, WebP, or SVG" };
        }

        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            return { success: false, error: "File size exceeds 5MB limit" };
        }

        await getClient();
        const company = await Company.findById(companyId);

        if (!company) {
            return { success: false, error: "Company not found" };
        }

        // Check if user is creator of company or admin
        const isCreator = company.createdBy.toString() === user.id;
        const isAdmin = user.role === "admin";

        if (!isCreator && !isAdmin) {
            return { success: false, error: "You don't have permission to update this company's logo" };
        }

        // Delete old logo from Vercel Blob if exists
        if (company.logo && company.logo.includes("blob.vercel-storage.com")) {
            try {
                await del(company.logo, {
                    token: process.env.BLOB_READ_WRITE_TOKEN!,
                });
                console.log(`[Companies] Deleted old logo: ${company.logo}`);
            } catch (error) {
                console.warn("[Companies] Could not delete old logo:", error);
            }
        }

        // Upload new logo with timestamp to avoid cache issues
        const timestamp = Date.now();
        const filename = `companies/logos/${companyId}-${timestamp}.${file.name.split(".").pop()}`;

        const blob = await put(filename, file, {
            access: "public",
            token: process.env.BLOB_READ_WRITE_TOKEN!,
        });

        // Update company logo in DB
        company.logo = blob.url;
        await company.save();

        // Revalidate cache
        revalidateTag(`company-${companyId}`, "max");
        revalidateTag(`company-slug-${company.slug}`, "max");
        const cacheBucket = Math.floor(Date.now() / (5 * 60 * 1000));
        revalidateTag(`companies-list-${cacheBucket}`, "max");

        console.log(`[Companies] Updated logo for ${company.name}: ${blob.url}`);

        return {
            success: true,
            url: blob.url,
            message: "Company logo updated successfully",
        };
    } catch (error) {
        console.error("[Companies] Logo upload error:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to upload logo",
        };
    }
}

/**
 * Delete company logo
 */
export async function deleteCompanyLogo(companyId: string): Promise<ActionResponse> {
    try {
        // Check authentication and admin role
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session) {
            return { success: false, error: "Authentication required" };
        }

        const user = await requireAuth();
        if (user.role !== "admin") {
            return { success: false, error: "Admin access required" };
        }

        await getClient();
        const company = await Company.findById(companyId);

        if (!company) {
            return { success: false, error: "Company not found" };
        }

        // Delete from Vercel Blob if exists
        if (company.logo && company.logo.includes("blob.vercel-storage.com")) {
            try {
                await del(company.logo, {
                    token: process.env.BLOB_READ_WRITE_TOKEN!,
                });
                console.log(`[Companies] Deleted logo: ${company.logo}`);
            } catch (error) {
                console.warn("[Companies] Could not delete logo:", error);
            }
        }

        // Remove logo from company
        company.logo = undefined;
        await company.save();

        console.log(`[Companies] Removed logo for ${company.name}`);

        return {
            success: true,
            message: "Company logo removed successfully",
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to delete logo",
        };
    }
}

/**
 * Search companies by name and optionally by location
 */
export async function searchCompaniesByName(query: string, location?: string) {
    try {
        await getClient();

        // Validate query
        if (!query || query.trim().length < 2) {
            return {
                success: false,
                error: "Zapytanie musi mieć co najmniej 2 znaki",
                companies: [],
            };
        }

        // Sanitize inputs
        const sanitizedQuery = sanitizeString(query.trim());
        const sanitizedLocation = location ? sanitizeString(location.trim()) : undefined;

        // Build search filter
        const searchFilter: any = {
            name: { $regex: sanitizedQuery, $options: "i" },
        };

        if (sanitizedLocation) {
            searchFilter.location = { $regex: sanitizedLocation, $options: "i" };
        }

        // Search companies
        const companies = await Company.find(searchFilter)
            .select("name slug industry location averageRating logo reviews")
            .limit(50)
            .lean();

        // Format results
        const formattedCompanies = companies.map((company: any) => ({
            _id: (company._id as any).toString(),
            name: company.name,
            slug: company.slug,
            industry: company.industry,
            location: company.location,
            averageRating: company.averageRating || 0,
            reviewCount: company.reviews?.length || 0,
            logo: company.logo || null,
        }));

        return {
            success: true,
            companies: formattedCompanies,
            count: formattedCompanies.length,
        };
    } catch (error) {
        console.error("Failed to search companies:", error);
        return {
            success: false,
            error: "Nie udało się wyszukać firm",
            companies: [],
        };
    }
}
