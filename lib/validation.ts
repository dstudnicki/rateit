/**
 * Input validation and sanitization helpers
 */

export interface ValidationResult {
    valid: boolean;
    error?: string;
}

/**
 * Validate post content
 */
export function validatePostContent(content: string): ValidationResult {
    if (!content || typeof content !== "string") {
        return { valid: false, error: "Content is required" };
    }

    const trimmed = content.trim();

    if (trimmed.length === 0) {
        return { valid: false, error: "Content cannot be empty" };
    }

    if (trimmed.length > 5000) {
        return { valid: false, error: "Content must be less than 5000 characters" };
    }

    // Check for malicious patterns
    if (containsSuspiciousPatterns(trimmed)) {
        return { valid: false, error: "Content contains suspicious patterns" };
    }

    return { valid: true };
}

/**
 * Validate comment content
 */
export function validateCommentContent(content: string): ValidationResult {
    if (!content || typeof content !== "string") {
        return { valid: false, error: "Comment is required" };
    }

    const trimmed = content.trim();

    if (trimmed.length === 0) {
        return { valid: false, error: "Comment cannot be empty" };
    }

    if (trimmed.length > 2000) {
        return { valid: false, error: "Comment must be less than 2000 characters" };
    }

    if (containsSuspiciousPatterns(trimmed)) {
        return { valid: false, error: "Comment contains suspicious patterns" };
    }

    return { valid: true };
}

/**
 * Validate company review
 */
export function validateCompanyReview(review: {
    rating: number;
    role: string;
    comment: string;
    pros?: string;
    cons?: string;
}): ValidationResult {
    if (typeof review.rating !== "number" || review.rating < 1 || review.rating > 5) {
        return { valid: false, error: "Rating must be between 1 and 5" };
    }

    if (!review.role || typeof review.role !== "string" || review.role.trim().length === 0) {
        return { valid: false, error: "Role is required" };
    }

    if (review.role.trim().length > 200) {
        return { valid: false, error: "Role must be less than 200 characters" };
    }

    if (!review.comment || typeof review.comment !== "string" || review.comment.trim().length === 0) {
        return { valid: false, error: "Comment is required" };
    }

    if (review.comment.trim().length > 5000) {
        return { valid: false, error: "Comment must be less than 5000 characters" };
    }

    if (review.pros && review.pros.length > 2000) {
        return { valid: false, error: "Pros must be less than 2000 characters" };
    }

    if (review.cons && review.cons.length > 2000) {
        return { valid: false, error: "Cons must be less than 2000 characters" };
    }

    if (containsSuspiciousPatterns(review.comment)) {
        return { valid: false, error: "Review contains suspicious patterns" };
    }

    return { valid: true };
}

/**
 * Validate search query
 */
export function validateSearchQuery(query: string): ValidationResult {
    if (!query || typeof query !== "string") {
        return { valid: false, error: "Search query is required" };
    }

    const trimmed = query.trim();

    if (trimmed.length > 200) {
        return { valid: false, error: "Search query must be less than 200 characters" };
    }

    return { valid: true };
}

/**
 * Sanitize string input (remove potentially dangerous characters)
 */
export function sanitizeString(input: string): string {
    if (!input || typeof input !== "string") {
        return "";
    }

    // Remove null bytes
    let sanitized = input.replace(/\0/g, "");

    // Trim whitespace
    sanitized = sanitized.trim();

    return sanitized;
}

/**
 * Check for suspicious patterns in content
 */
function containsSuspiciousPatterns(content: string): boolean {
    const suspiciousPatterns = [
        // Script tags
        /<script[^>]*>.*?<\/script>/gi,
        // Iframe tags
        /<iframe[^>]*>.*?<\/iframe>/gi,
        // Event handlers
        /on\w+\s*=\s*["'][^"']*["']/gi,
        // JavaScript protocol
        /javascript:/gi,
        // Data URLs
        /data:text\/html/gi,
    ];

    return suspiciousPatterns.some(pattern => pattern.test(content));
}


