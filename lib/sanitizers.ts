// Helpery do sanitizacji obiektów przed zwróceniem publicznego JSON-a
// Zawracają tylko bezpieczne, publiczne pola — usuwają _id, email, image (opcjonalnie)

export function sanitizeReply(reply: any, currentUserId?: string) {
    const replyUserId = reply?.user ? (typeof reply.user === "string" ? reply.user : reply.user.toString()) : null;
    const likesCount = Array.isArray(reply?.likes) ? reply.likes.length : 0;
    const isLiked = currentUserId ? Array.isArray(reply?.likes) && reply.likes.includes(currentUserId) : false;
    return {
        _id: reply?._id?.toString ? reply._id.toString() : reply?._id,
        content: reply?.content ?? null,
        nick: reply?.nick ?? null,
        likesCount,
        isLiked,
        createdAt: reply?.createdAt ?? null,
        updatedAt: reply?.updatedAt ?? null,
        isMine: currentUserId ? currentUserId === replyUserId : false,
    };
}

export function sanitizeComment(comment: any, currentUserId?: string) {
    const commentUserId = comment?.user ? (typeof comment.user === "string" ? comment.user : comment.user.toString()) : null;
    const likesCount = Array.isArray(comment?.likes) ? comment.likes.length : 0;
    const isLiked = currentUserId ? Array.isArray(comment?.likes) && comment.likes.includes(currentUserId) : false;
    return {
        _id: comment?._id?.toString ? comment._id.toString() : comment?._id,
        content: comment?.content ?? null,
        nick: comment?.nick ?? null,
        likesCount,
        isLiked,
        createdAt: comment?.createdAt ?? null,
        replies: Array.isArray(comment?.replies) ? comment.replies.map((r: any) => sanitizeReply(r, currentUserId)) : [],
        isMine: currentUserId ? currentUserId === commentUserId : false,
    };
}

export function sanitizeReview(review: any, currentUserId?: string) {
    // review.user may exist in DB but we must not expose it. We only use it to set isMine flag.
    const reviewUserId = review?.user ? (typeof review.user === "string" ? review.user : review.user.toString()) : null;
    const likesCount = Array.isArray(review?.likes) ? review.likes.length : 0;
    const isLiked = currentUserId ? Array.isArray(review?.likes) && review.likes.includes(currentUserId) : false;
    return {
        _id: review?._id?.toString ? review._id.toString() : review?._id,
        title: review?.title ?? null,
        content: review?.content ?? null,
        rating: review?.rating ?? null,
        role: review?.role ?? null,
        reviewType: review?.reviewType ?? null,
        nick: review?.nick ?? null,
        likesCount,
        isLiked,
        comments: Array.isArray(review?.comments) ? review.comments.map((c: any) => sanitizeComment(c, currentUserId)) : [],
        createdAt: review?.createdAt ?? null,
        updatedAt: review?.updatedAt ?? null,
        // public flag for current user only; does not reveal the reviewUserId
        isMine: currentUserId ? currentUserId === reviewUserId : false,
    };
}

export function sanitizeReviewMeta(review: any) {
    const likesCount = Array.isArray(review?.likes) ? review.likes.length : 0;
    return {
        title: review?.title ?? null,
        rating: review?.rating ?? null,
        role: review?.role ?? null,
        reviewType: review?.reviewType ?? null,
        nick: review?.nick ?? null,
        likesCount,
        createdAt: review?.createdAt ?? null,
    };
}

export function sanitizeCompanyForList(company: any) {
    const publicFields = {
        _id: company?._id,
        name: company?.name ?? null,
        slug: company?.slug ?? null,
        logo: company?.logo ?? null,
        location: company?.location ?? null,
        industry: company?.industry ?? null,
        website: company?.website ?? null,
        description: company?.description ?? null,
        detectedKeywords: company?.detectedKeywords ?? [],
        averageRating: company?.averageRating ?? 0,
        createdAt: company?.createdAt ?? null,
        updatedAt: company?.updatedAt ?? null,
    };

    const reviews = Array.isArray(company?.reviews) ? company.reviews.map(sanitizeReviewMeta) : [];

    return {
        ...publicFields,
        reviews,
        reviewCount: reviews.length,
        lastReviewDate: reviews.length > 0 ? reviews[reviews.length - 1].createdAt : null,
    };
}

export function sanitizeCompanyForDetail(company: any, currentUserId?: string) {
    const publicFields = {
        _id: company?._id,
        name: company?.name ?? null,
        slug: company?.slug ?? null,
        logo: company?.logo ?? null,
        location: company?.location ?? null,
        industry: company?.industry ?? null,
        website: company?.website ?? null,
        description: company?.description ?? null,
        detectedKeywords: company?.detectedKeywords ?? [],
        averageRating: company?.averageRating ?? 0,
        createdAt: company?.createdAt ?? null,
        updatedAt: company?.updatedAt ?? null,
    };

    const reviews = Array.isArray(company?.reviews) ? company.reviews.map((r: any) => sanitizeReview(r, currentUserId)) : [];

    return {
        ...publicFields,
        reviews,
        reviewCount: reviews.length,
        lastReviewDate: reviews.length > 0 ? reviews[reviews.length - 1].createdAt : null,
    };
}
