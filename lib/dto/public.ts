/* eslint-disable @typescript-eslint/no-explicit-any */

// Public DTO types
export type AuthorPublicPost = {
    fullName?: string | null;
    name?: string | null;
    nick?: string | null;
    avatar?: string | null;
};

export type AuthorPublicCompany = {
    nick?: string | null;
    avatar?: string | null;
};

export type Permissions = {
    canEdit: boolean;
    canDelete: boolean;
    canComment?: boolean;
    reason?: "AUTH_REQUIRED" | "FORBIDDEN";
};

export type CommentPublicDTO = {
    id: string;
    _id?: string; // compatibility for existing UI expecting _id
    content: string;
    likesCount: number;
    isLiked?: boolean;
    createdAt: string;
    replies: CommentPublicDTO[];
    author: AuthorPublicPost;
    permissions: Permissions;
};

export type ReviewPublicDTO = {
    id: string;
    _id?: string;
    title: string;
    content: string;
    rating: number;
    role: string;
    reviewType: string;
    nick?: string;
    likesCount: number;
    isLiked?: boolean;
    comments: CommentPublicDTO[];
    createdAt: string;
    updatedAt?: string;
    author: AuthorPublicCompany;
    permissions: Permissions;
};

export type CompanyPublicDTO = {
    id: string;
    _id?: string;
    name: string;
    slug?: string;
    logo?: string;
    location: string;
    industry: string;
    website?: string;
    description?: string;
    detectedKeywords: string[];
    reviews: ReviewPublicDTO[];
    averageRating: number;
    createdAt: string;
    updatedAt?: string;
};

export type PostPublicDTO = {
    id: string;
    _id?: string;
    content: string;
    images: string[];
    likesCount: number;
    isLiked?: boolean;
    detectedCompanies: string[];
    detectedSkills: string[];
    detectedIndustries: string[];
    comments: CommentPublicDTO[];
    createdAt: string;
    updatedAt?: string;
    author: AuthorPublicPost;
};

// Helper to safely convert a comment/reply doc to CommentPublicDTO
export function toCommentPublicDTO(commentDoc: any, authorProfile?: any, sessionUserId?: string): CommentPublicDTO {
    const id = commentDoc._id ? String(commentDoc._id) : commentDoc.id || "";
    const likesCount = Array.isArray(commentDoc.likes) ? commentDoc.likes.length : 0;
    const createdAt = commentDoc.createdAt ? new Date(commentDoc.createdAt).toISOString() : new Date().toISOString();

    // compute isLiked for current session (server-side) without exposing user ids
    const isLiked = !!(
        sessionUserId &&
        Array.isArray(commentDoc.likes) &&
        commentDoc.likes.map((x: any) => String(x)).includes(String(sessionUserId))
    );

    // author: prefer provided authorProfile, then comment.nick
    const author: AuthorPublicPost = {
        fullName: authorProfile?.fullName || commentDoc.fullName || undefined,
        name: undefined,
        nick: commentDoc.nick || authorProfile?.slug || undefined,
        avatar: authorProfile?.image || commentDoc.image || undefined,
    };

    // permissions: server should compute based on DB-user vs session.user.id
    const isOwner = !!(sessionUserId && commentDoc.user && String(commentDoc.user) === String(sessionUserId));
    const permissions: Permissions = {
        canEdit: !!isOwner,
        canDelete: !!isOwner,
        canComment: !!sessionUserId,
    };

    return {
        id,
        _id: id,
        content: commentDoc.content,
        likesCount,
        isLiked,
        createdAt,
        replies: Array.isArray(commentDoc.replies)
            ? commentDoc.replies.map((r: any) => toCommentPublicDTO(r, undefined, sessionUserId))
            : [],
        author,
        permissions,
    };
}

export function toReviewPublicDTO(reviewDoc: any, authorProfile?: any, sessionUserId?: string): ReviewPublicDTO {
    const id = reviewDoc._id ? String(reviewDoc._id) : reviewDoc.id || "";
    const likesCount = Array.isArray(reviewDoc.likes) ? reviewDoc.likes.length : 0;
    const isLiked = !!(
        sessionUserId &&
        Array.isArray(reviewDoc.likes) &&
        reviewDoc.likes.map((x: any) => String(x)).includes(String(sessionUserId))
    );

    const author: AuthorPublicCompany = {
        nick: reviewDoc.nick || authorProfile?.slug || undefined,
        avatar: authorProfile?.image || undefined,
    };
    const reviewUserId =
        typeof reviewDoc.user === "string"
            ? reviewDoc.user
            : reviewDoc.user?._id
              ? String(reviewDoc.user._id)
              : reviewDoc.user?.id
                ? String(reviewDoc.user.id)
                : reviewDoc.user
                  ? String(reviewDoc.user)
                  : undefined;

    const isOwner = !!(sessionUserId && reviewUserId && String(reviewUserId) === String(sessionUserId));
    const permissions: Permissions = {
        canEdit: !!isOwner,
        canDelete: !!isOwner,
        canComment: !!sessionUserId && !isOwner,
    };

    return {
        id,
        _id: id,
        title: reviewDoc.title,
        content: reviewDoc.content,
        rating: reviewDoc.rating || 0,
        role: reviewDoc.role || "",
        reviewType: reviewDoc.reviewType || "work",
        nick: reviewDoc.nick,
        likesCount,
        isLiked,
        comments: Array.isArray(reviewDoc.comments)
            ? reviewDoc.comments.map((c: any) => toCommentPublicDTO(c, undefined, sessionUserId))
            : [],
        createdAt: reviewDoc.createdAt ? new Date(reviewDoc.createdAt).toISOString() : new Date().toISOString(),
        updatedAt: reviewDoc.updatedAt ? new Date(reviewDoc.updatedAt).toISOString() : undefined,
        author,
        permissions,
    };
}

export function toCompanyPublicDTO(
    companyDoc: any,
    profileMap?: Record<string, any>,
    sessionUserId?: string,
): CompanyPublicDTO {
    const id = companyDoc._id ? String(companyDoc._id) : companyDoc.id || "";

    const reviews = Array.isArray(companyDoc.reviews)
        ? companyDoc.reviews.map((r: any) => {
              // authorProfile might be looked up in profileMap by r.user (userId) if provided by caller
              const authorProfile = r.user ? profileMap?.[String(r.user)] : undefined;
              return toReviewPublicDTO(r, authorProfile, sessionUserId);
          })
        : [];

    return {
        id,
        _id: id,
        name: companyDoc.name,
        slug: companyDoc.slug,
        logo: companyDoc.logo,
        location: companyDoc.location,
        industry: companyDoc.industry,
        website: companyDoc.website,
        description: companyDoc.description,
        detectedKeywords: Array.isArray(companyDoc.detectedKeywords) ? companyDoc.detectedKeywords : [],
        reviews,
        averageRating: companyDoc.averageRating || 0,
        createdAt: companyDoc.createdAt ? new Date(companyDoc.createdAt).toISOString() : new Date().toISOString(),
        updatedAt: companyDoc.updatedAt ? new Date(companyDoc.updatedAt).toISOString() : undefined,
    };
}

export function toPostPublicDTO(postDoc: any, authorProfile?: any, sessionUserId?: string): PostPublicDTO {
    const id = postDoc._id ? String(postDoc._1) : postDoc.id || "";
    const likesCount = Array.isArray(postDoc.likes) ? postDoc.likes.length : 0;
    const isLiked = !!(
        sessionUserId &&
        Array.isArray(postDoc.likes) &&
        postDoc.likes.map((x: any) => String(x)).includes(String(sessionUserId))
    );

    const author: AuthorPublicPost = {
        fullName: authorProfile?.fullName || null,
        name: undefined,
        nick: authorProfile?.slug || null,
        avatar: authorProfile?.image || null,
    };

    const permissions: Permissions = {
        canEdit: !!(sessionUserId && postDoc.user && String(postDoc.user) === String(sessionUserId)),
        canDelete: !!(sessionUserId && postDoc.user && String(postDoc.user) === String(sessionUserId)),
        canComment: !!sessionUserId,
    };

    return {
        id,
        _id: id,
        content: postDoc.content,
        images: Array.isArray(postDoc.images) ? postDoc.images : [],
        likesCount,
        isLiked,
        detectedCompanies: Array.isArray(postDoc.detectedCompanies) ? postDoc.detectedCompanies : [],
        detectedSkills: Array.isArray(postDoc.detectedSkills) ? postDoc.detectedSkills : [],
        detectedIndustries: Array.isArray(postDoc.detectedIndustries) ? postDoc.detectedIndustries : [],
        comments: Array.isArray(postDoc.comments)
            ? postDoc.comments.map((c: any) => toCommentPublicDTO(c, undefined, sessionUserId))
            : [],
        createdAt: postDoc.createdAt ? new Date(postDoc.createdAt).toISOString() : new Date().toISOString(),
        updatedAt: postDoc.updatedAt ? new Date(postDoc.updatedAt).toISOString() : undefined,
        author,
    };
}
