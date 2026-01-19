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
    _id: string;
    user: {
        _id: string | undefined;
        name: string;
    };
    nick: string;
    content: string;
    likes: string[];
    createdAt: string;
}

interface CommentData {
    _id: string;
    user: {
        _id: string | undefined;
        name: string;
    };
    nick: string;
    content: string;
    likes: string[];
    replies: ReplyData[];
    createdAt: string;
}

interface ReviewCommentSectionProps {
    companyId: string;
    reviewId: string;
    comments: CommentData[];
    onUpdate: () => void;
    reviewAuthorId?: string; // ID autora opinii (opcjonalne)
}

export function ReviewCommentSection({ companyId, reviewId, comments, onUpdate, reviewAuthorId }: ReviewCommentSectionProps) {
    const [content, setContent] = useState("");
    const [nick, setNick] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [hasCommented, setHasCommented] = useState(false);
    const session = authClient.useSession();
    const currentUserId = session.data?.user?.id;

    const isReviewAuthor = !!(currentUserId && reviewAuthorId && currentUserId === reviewAuthorId);

    // Check if user has already commented on this review
    useEffect(() => {
        if (currentUserId && comments) {
            const userComment = comments.find((comment) => comment.user._id === currentUserId);
            if (userComment) {
                setHasCommented(true);
            } else {
                setHasCommented(false);
            }
        }
    }, [currentUserId, comments]);

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
                {comments.map((singleComment) => (
                    <ReviewCommentItem
                        key={singleComment._id}
                        comment={singleComment}
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
