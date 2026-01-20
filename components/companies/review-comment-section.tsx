"use client";

import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Send } from "lucide-react";
import { ReviewCommentItem } from "@/components/companies/review-comment-item";
import { authClient } from "@/lib/auth-client";
import { addCommentToReview } from "@/app/actions/companies";
import { toast } from "sonner";

interface ReplyData {
    id?: string;
    _id?: string;
    author?: { nick?: string | null };
    content?: string;
    likesCount?: number;
    isLiked?: boolean;
    createdAt?: string;
}

interface CommentData {
    id?: string;
    _id?: string;
    author?: { nick?: string | null; name?: string | null };
    nick?: string;
    content?: string;
    likesCount?: number;
    isLiked?: boolean;
    replies?: ReplyData[];
    createdAt?: string;
    permissions?: { canEdit?: boolean; canDelete?: boolean };
}

interface ReviewCommentSectionProps {
    companyId: string;
    reviewId: string;
    comments: CommentData[]; // sanitized DTO from server
    onUpdate: () => void;
    canComment: boolean;
}

export function ReviewCommentSection({ companyId, reviewId, comments, onUpdate, canComment }: ReviewCommentSectionProps) {
    const [content, setContent] = useState("");
    const [nick, setNick] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [hasCommented, setHasCommented] = useState(false);
    const session = authClient.useSession();
    const currentUserId = session.data?.user?.id;

    const isReviewAuthor = !canComment && !!currentUserId;

    // Helper: map legacy comment shape -> public DTO expected by ReviewCommentItem
    const mapComment = (c: any) => {
        const id = c.id ?? c._id ?? undefined;
        const author =
            c.author ??
            (c.user ? { name: c.user.name, fullName: c.user.fullName, nick: c.nick, avatar: c.user.image } : { nick: c.nick });
        const likesCount = c.likesCount ?? (Array.isArray(c.likes) ? c.likes.length : 0);
        const isLiked = c.isLiked ?? (currentUserId && Array.isArray(c.likes) ? c.likes.includes(currentUserId) : false);
        const replies = (c.replies ?? []).map((r: any) => ({
            id: r.id ?? r._id,
            author: r.author ?? (r.user ? { name: r.user.name, nick: r.nick, avatar: r.user.image } : { nick: r.nick }),
            content: r.content,
            likesCount: r.likesCount ?? (Array.isArray(r.likes) ? r.likes.length : 0),
            isLiked: r.isLiked ?? (currentUserId && Array.isArray(r.likes) ? r.likes.includes(currentUserId) : false),
            createdAt: r.createdAt,
        }));

        const permissions = c.permissions ?? {
            canEdit: !!(
                currentUserId &&
                ((c.user && c.user._id === currentUserId) || (c.author && c.author._id === currentUserId))
            ),
            canDelete: !!(
                currentUserId &&
                ((c.user && c.user._id === currentUserId) || (c.author && c.author._id === currentUserId))
            ),
        };

        return {
            id,
            _id: id,
            author,
            content: c.content,
            likesCount,
            isLiked,
            replies,
            createdAt: c.createdAt,
            permissions,
        };
    };

    const publicComments = (comments || []).map(mapComment);

    // Check if user has already commented on this review using the mapped public DTOs.
    // We prefer server-provided permissions; if not present, fall back to comparing session email/name with author names/nick.
    useEffect(() => {
        if (!currentUserId) {
            setHasCommented(false);
            return;
        }

        const found = publicComments.some((comment) => {
            if (!comment) return false;
            if (comment.permissions?.canEdit) return true;

            // If the server didn't provide permissions, fall back to comparing nick or author.name to session user
            const authorNick = comment.author?.nick || "";

            if (!authorNick) return false;

            return false;
        });

        setHasCommented(found);
    }, [currentUserId, publicComments, session.data]);

    const handleAddComment = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();

        // Prevent review author from commenting on their own review (client-side UX) - server also enforces this
        if (isReviewAuthor) {
            toast.error("Nie możesz komentować własnej opinii.");
            return;
        }

        // Check if user has already commented
        if (hasCommented) {
            toast.error("Proszę, napisz treść.");
            return;
        }

        if (!content.trim()) return toast.error("Proszę napisać komentarz.");
        if (!nick.trim()) return toast.error("Proszę wpisać pseudonim.");

        setIsSubmitting(true);
        const result = await addCommentToReview(companyId, reviewId, content, nick);

        if (result.success) {
            setContent("");
            setNick("");
            setHasCommented(true); // Mark as commented
            onUpdate();
        } else {
            toast.error("Nie udało się dodać komentarza");
        }
        setIsSubmitting(false);
    };
    console.log(isReviewAuthor);
    // Map incoming comments to public DTOs for child components

    return (
        <div className="space-y-4">
            {/* Inline Comment Form */}
            <div className="flex gap-3">
                <Avatar className="h-9 w-9">
                    <AvatarImage
                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${session.data?.user?.email || session.data?.user?.name}`}
                    />
                    <AvatarFallback>Ty</AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-2">
                    {isReviewAuthor ? (
                        <div className="rounded-md bg-muted p-3 text-sm text-muted-foreground">
                            Nie możesz komentować własnej opinii.
                        </div>
                    ) : hasCommented ? (
                        <div className="rounded-md bg-muted p-3 text-sm text-muted-foreground">
                            Już skomentowałeś tę opinię. Dozwolony jest tylko jeden komentarz na użytkownika, aby zapobiec
                            spamowi.
                        </div>
                    ) : (
                        <>
                            <div className="space-y-2">
                                <Label htmlFor="comment-nick" className="text-sm">
                                    Twój pseudonim (anonimowy)
                                </Label>
                                <Input
                                    id="comment-nick"
                                    value={nick}
                                    onChange={(e) => setNick(e.target.value)}
                                    placeholder="np. Recenzent42"
                                    maxLength={30}
                                    required
                                    disabled={isSubmitting || hasCommented || isReviewAuthor}
                                />
                            </div>
                            <Textarea
                                placeholder="Dodaj komentarz..."
                                value={content}
                                onChange={(e) => setContent((e.target as HTMLTextAreaElement).value)}
                                className="min-h-[80px] resize-none"
                                disabled={isSubmitting || hasCommented || isReviewAuthor}
                            />
                        </>
                    )}
                    <div className="flex justify-end">
                        <Button
                            onClick={handleAddComment}
                            size="sm"
                            disabled={!content.trim() || !nick.trim() || isSubmitting || hasCommented || isReviewAuthor}
                            className="gap-2"
                        >
                            <Send className="h-4 w-4" />
                            {isSubmitting ? "Wysyłanie..." : hasCommented ? "Już skomentowano" : "Opublikuj"}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Comments List */}
            <div className="space-y-3">
                {publicComments.map((singleComment) => (
                    <ReviewCommentItem
                        key={singleComment._id ?? singleComment.id}
                        comment={singleComment as any}
                        companyId={companyId}
                        reviewId={reviewId}
                        currentUserId={currentUserId}
                        onUpdate={onUpdate}
                    />
                ))}
            </div>
        </div>
    );
}
