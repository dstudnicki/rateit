"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, MessageSquare, Star, MoreHorizontal, Trash2 } from "lucide-react";
import { toggleReviewLike, deleteCompanyReview } from "@/app/actions/companies";
import { useRouter } from "next/navigation";
import { ReviewCommentSection } from "./review-comment-section";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogFooter,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogAction,
    AlertDialogCancel,
} from "@/components/ui/alert-dialog";

interface CommentDTO {
    id?: string;
    _id?: string;
    content?: string;
    likesCount?: number;
    isLiked?: boolean;
    createdAt?: string;
    replies?: CommentDTO[];
    author?: { nick?: string | null };
    permissions?: { canEdit?: boolean; canDelete?: boolean };
}

interface Review {
    _id?: string;
    id?: string;
    title?: string;
    content?: string;
    rating?: number;
    role?: string;
    reviewType?: "work" | "interview";
    nick?: string | null;
    author?: { nick?: string | null } | null;
    user: {
        _id: string | undefined;
        name: string;
        slug?: string;
        fullName?: string | null;
        headline?: string | null;
        image?: string | null;
    }; // internal use only, not exposed in DTO
    likes?: string[]; // legacy
    likesCount?: number; // DTO
    isLiked?: boolean; // DTO
    comments?: CommentDTO[];
    commentsCount?: number;
    createdAt?: string;
    updatedAt?: string | null;
    permissions?: { canEdit?: boolean; canDelete?: boolean; canComment?: boolean };
}

interface ReviewListProps {
    companyId: string;
    reviews: Review[];
    filter: string;
}

function StarRating({ rating }: { rating: number }) {
    return (
        <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
                <Star
                    key={star}
                    className={`h-4 w-4 ${star <= rating ? "fill-yellow-500 text-yellow-500" : "fill-muted text-muted"}`}
                />
            ))}
        </div>
    );
}

function getTimeAgo(date?: string): string {
    if (!date) return "just now";
    const now = new Date();
    const reviewDate = new Date(date);
    const diffMs = Math.max(0, now.getTime() - reviewDate.getTime());
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? "s" : ""} ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
    if (diffDays < 30) {
        const weeks = Math.floor(diffDays / 7);
        return `${weeks} week${weeks !== 1 ? "s" : ""} ago`;
    }
    const diffMonths = Math.floor(diffDays / 30);
    return `${diffMonths} month${diffMonths !== 1 ? "s" : ""} ago`;
}

export function ReviewList({ companyId, reviews, filter }: ReviewListProps) {
    const router = useRouter();
    const [expandedReview, setExpandedReview] = useState<string | null>(null);
    const [likingReviews, setLikingReviews] = useState<Set<string>>(new Set());
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const session = authClient.useSession();
    const currentUserId = session.data?.user?.id;

    // Filter reviews based on rating and type
    const filteredReviews = reviews.filter((review) => {
        const rating = review.rating ?? 0;
        if (filter === "all") return true;
        if (filter === "interviews") return review.reviewType === "interview";
        if (filter === "positive") return rating >= 4;
        if (filter === "mixed") return rating >= 3 && rating <= 4;
        if (filter === "negative") return rating <= 2;
        return true;
    });

    const handleLike = async (reviewId: string) => {
        if (likingReviews.has(reviewId)) return;

        setLikingReviews((prev) => new Set(prev).add(reviewId));

        const result = await toggleReviewLike(companyId, reviewId);

        setLikingReviews((prev) => {
            const next = new Set(prev);
            next.delete(reviewId);
            return next;
        });

        if (result.success) {
            router.refresh();
        }
    };

    const handleDelete = (reviewId: string) => {
        setDeleteTarget(reviewId);
        setShowDeleteDialog(true);
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        setShowDeleteDialog(false);
        setIsDeleting(true);
        const result = await deleteCompanyReview(companyId, deleteTarget);
        setIsDeleting(false);

        if (result.success) {
            router.refresh();
        } else {
            toast.error("Nie udało się usunąć recenzji. Proszę, spróbuj ponownie.");
        }
        setDeleteTarget(null);
    };

    if (filteredReviews.length === 0) {
        return (
            <Card className="p-8 text-center">
                <p className="text-muted-foreground">
                    {filter === "all" ? "Nie ma jeszcze opinii. Bądz pierwszy!" : "No reviews found for this filter."}
                </p>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            {filteredReviews.map((review) => {
                const reviewId = String((review as any)._id ?? (review as any).id ?? "");
                if (!reviewId) return null;

                const isExpanded = expandedReview === reviewId;

                // support both legacy shape (likes array, user._id) and new public DTO (likesCount, isLiked, permissions)
                const likesCount =
                    (review as any).likesCount ?? (Array.isArray((review as any).likes) ? (review as any).likes.length : 0);
                const commentsCount =
                    (review as any).commentsCount ??
                    (Array.isArray((review as any).comments) ? (review as any).comments.length : 0);
                const isLiked =
                    (review as any).isLiked ??
                    (currentUserId && Array.isArray((review as any).likes)
                        ? (review as any).likes.includes(currentUserId)
                        : false);

                const displayName = (review as any).nick || (review as any).author?.nick || "Anonymous";

                // Normalize possible owner id shapes: review.user can be an object {_id}, a string id, or missing; author likewise
                const rawUser = (review as any).user;
                const rawAuthor = (review as any).author;
                const userIdFromReview =
                    rawUser && typeof rawUser === "object" && rawUser._id
                        ? String(rawUser._id)
                        : typeof rawUser === "string"
                          ? rawUser
                          : undefined;
                const userIdFromAuthor =
                    rawAuthor && typeof rawAuthor === "object" && rawAuthor._id
                        ? String(rawAuthor._id)
                        : typeof rawAuthor === "string"
                          ? rawAuthor
                          : undefined;

                const resolvedAuthorId = userIdFromReview ?? userIdFromAuthor ?? undefined;

                // Prefer permissions computed on server (no userId leaked). Fall back to client-side id compare only if permissions missing.
                const isOwnReview = !!(
                    (review as any).permissions?.canDelete ||
                    (review as any).permissions?.canEdit ||
                    (currentUserId && resolvedAuthorId && currentUserId === resolvedAuthorId)
                );

                // Pass normalized author id down only for legacy shapes; keep it undefined if permissions are present (no userId leak)
                const reviewAuthorId = review.permissions ? undefined : resolvedAuthorId;

                return (
                    <Card key={reviewId} className="p-6">
                        <div className="flex items-start gap-4">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-semibold">{displayName}</h3>
                                            <span className="text-sm text-muted-foreground">
                                                {getTimeAgo(review.createdAt)}
                                            </span>
                                        </div>
                                        <p className="text-sm text-muted-foreground">{(review as any).role}</p>
                                    </div>

                                    {/* Dropdown menu for owner only */}
                                    {isOwnReview && (
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8"
                                                    aria-label="Opcje opinii"
                                                >
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem
                                                    className="text-destructive focus:text-destructive cursor-pointer"
                                                    onClick={() => handleDelete(reviewId)}
                                                    disabled={isDeleting}
                                                >
                                                    <Trash2 className="h-4 w-4 mr-2" />
                                                    Usuń opinię
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    )}
                                </div>

                                <div className="flex items-center gap-2 mt-2">
                                    <StarRating rating={review.rating ?? 0} />
                                    <span className="text-sm font-medium">{review.rating ?? 0}/5</span>
                                </div>

                                <h4 className="font-semibold mt-3">{review.title}</h4>
                                <p className="text-sm leading-relaxed mt-2 text-balance whitespace-pre-wrap">
                                    {review.content}
                                </p>

                                <div className="flex flex-wrap gap-2 mt-3">
                                    <Badge variant="secondary" className="text-xs">
                                        {review.reviewType === "interview"
                                            ? "Doświadczenie rekrutacyjne"
                                            : "Doświadczenie zawodowe"}
                                    </Badge>
                                    {(review.rating ?? 0) >= 4 && (
                                        <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                                            Pozytywna
                                        </Badge>
                                    )}
                                    {(review.rating ?? 0) < 4 && (review.rating ?? 0) >= 3 && (
                                        <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800">
                                            Mieszana
                                        </Badge>
                                    )}
                                    {(review.rating ?? 0) <= 2 && (
                                        <Badge variant="secondary" className="text-xs bg-red-100 text-red-800">
                                            Negatywna
                                        </Badge>
                                    )}
                                </div>

                                {/* Engagement Stats */}
                                <div className="flex items-center gap-4 mt-3 pt-2  text-xs text-muted-foreground">
                                    {likesCount > 0 && (
                                        <span className="flex items-center gap-1.5">
                                            <Heart className="h-3.5 w-3.5 fill-current text-destructive" />
                                            {likesCount}
                                        </span>
                                    )}
                                    {commentsCount > 0 && (
                                        <span className="flex items-center gap-1.5">
                                            <MessageSquare className="h-3.5 w-3.5" />
                                            {commentsCount}{" "}
                                            {commentsCount === 1
                                                ? "komentarz"
                                                : commentsCount >= 2 && commentsCount <= 4
                                                  ? "komentarze"
                                                  : "komentarzy"}
                                        </span>
                                    )}
                                </div>

                                {/* Action Buttons */}
                                <div className="flex items-center gap-1 mt-2 pt-2 border-t">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className={cn("flex-1 gap-2 h-9", isLiked && "text-destructive hover:text-destructive")}
                                        onClick={() => handleLike(reviewId)}
                                        disabled={likingReviews.has(reviewId)}
                                    >
                                        <Heart className={cn("h-4 w-4", isLiked && "fill-current")} />
                                        <span className="text-sm font-medium">Lubię to</span>
                                    </Button>

                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className={cn("flex-1 gap-2 h-9", isExpanded && "bg-secondary")}
                                        onClick={() => setExpandedReview(isExpanded ? null : reviewId)}
                                    >
                                        <MessageSquare className="h-4 w-4" />
                                        <span className="text-sm font-medium">Komentuj</span>
                                    </Button>
                                </div>

                                {/* Comment Section */}
                                {isExpanded && (
                                    <div className="mt-4 pt-4 border-t">
                                        <ReviewCommentSection
                                            companyId={companyId}
                                            reviewId={reviewId}
                                            comments={review.comments || []}
                                            onUpdate={() => router.refresh()}
                                            canComment={review.permissions?.canComment ?? false}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </Card>
                );
            })}

            {/* AlertDialog for deleting review */}
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Usuń opinię</AlertDialogTitle>
                        <AlertDialogDescription>
                            Czy na pewno chcesz usunąć tę opinię? Ta operacja jest nieodwracalna.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setShowDeleteDialog(false)}>Anuluj</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-destructive">
                            Usuń
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
