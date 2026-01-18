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
import Link from "next/link";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface Review {
    _id: string;
    title: string;
    content: string;
    rating: number;
    role: string;
    reviewType: "work" | "interview";
    nick: string;
    user: {
        _id: string;
        name: string;
        slug?: string;
        fullName?: string | null;
        image?: string;
        email?: string;
    };
    likes: string[];
    comments: any[];
    createdAt: string;
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

function getTimeAgo(date: string): string {
    const now = new Date();
    const reviewDate = new Date(date);
    const diffMs = now.getTime() - reviewDate.getTime();
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

    const session = authClient.useSession();
    const currentUserId = session.data?.user?.id;

    // Filter reviews based on rating and type
    const filteredReviews = reviews.filter((review) => {
        if (filter === "all") return true;
        if (filter === "interviews") return review.reviewType === "interview";
        if (filter === "positive") return review.rating >= 4;
        if (filter === "mixed") return review.rating >= 3 && review.rating <= 4;
        if (filter === "negative") return review.rating <= 2;
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

    const handleDelete = async (reviewId: string) => {
        const confirmed = window.confirm("Are you sure you want to delete this review?");
        if (!confirmed) return;

        const result = await deleteCompanyReview(companyId, reviewId);

        if (result.success) {
            router.refresh();
        } else {
            alert("Failed to delete the review. Please try again.");
        }
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
                const isExpanded = expandedReview === review._id;
                const likesCount = review.likes?.length || 0;
                const commentsCount = review.comments?.length || 0;
                const isLiked = currentUserId ? review.likes?.includes(currentUserId) : false;
                const displayName = review.nick || "Anonymous";
                const isOwnReview = currentUserId === review.user._id;

                return (
                    <Card key={review._id} className="p-6">
                        <div className="flex items-start gap-4">
                            <Avatar className="h-10 w-10">
                                <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${review.nick}`} />
                                <AvatarFallback>{displayName?.slice(0, 2).toUpperCase() || "AN"}</AvatarFallback>
                            </Avatar>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-semibold">{displayName}</h3>
                                            <span className="text-sm text-muted-foreground">
                                                {getTimeAgo(review.createdAt)}
                                            </span>
                                        </div>
                                        <p className="text-sm text-muted-foreground">{review.role}</p>
                                    </div>

                                    {/* Dropdown menu for owner only */}
                                    {isOwnReview && (
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem
                                                    className="text-destructive focus:text-destructive cursor-pointer"
                                                    onClick={() => handleDelete(review._id)}
                                                >
                                                    <Trash2 className="h-4 w-4 mr-2" />
                                                    Usuń opinię
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    )}
                                </div>

                                <div className="flex items-center gap-2 mt-2">
                                    <StarRating rating={review.rating} />
                                    <span className="text-sm font-medium">{review.rating}/5</span>
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
                                    {review.rating >= 4 && (
                                        <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                                            Pozytywna
                                        </Badge>
                                    )}
                                    {review.rating <= 4 && review.rating >= 3 && (
                                        <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800">
                                            Mieszana
                                        </Badge>
                                    )}
                                    {review.rating <= 2 && (
                                        <Badge variant="secondary" className="text-xs bg-red-100 text-red-800">
                                            Negatywna
                                        </Badge>
                                    )}
                                </div>

                                {/* Engagement Stats */}
                                <div className="flex items-center gap-4 mt-3 pt-2 border-t text-xs text-muted-foreground">
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
                                        onClick={() => handleLike(review._id)}
                                        disabled={likingReviews.has(review._id)}
                                    >
                                        <Heart className={cn("h-4 w-4", isLiked && "fill-current")} />
                                        <span className="text-sm font-medium">Lubię to</span>
                                    </Button>

                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className={cn("flex-1 gap-2 h-9", isExpanded && "bg-secondary")}
                                        onClick={() => setExpandedReview(isExpanded ? null : review._id)}
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
                                            reviewId={review._id}
                                            comments={review.comments || []}
                                            onUpdate={() => router.refresh()}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </Card>
                );
            })}
        </div>
    );
}
