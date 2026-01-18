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
}

export function ReviewCommentSection({ companyId, reviewId, comments, onUpdate }: ReviewCommentSectionProps) {
    const [content, setContent] = useState("");
    const [nick, setNick] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [hasCommented, setHasCommented] = useState(false);
    const session = authClient.useSession();
    const currentUserId = session.data?.user?.id;

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

    useEffect(() => {
        async function fetchUserProfile() {
            if (session.data?.user) {
                try {
                    const profileResponse = await fetch("/api/profile/current");
                    const profileData = await profileResponse.json();
                } catch (error) {
                    // Error fetching profile
                }
            }
        }
        fetchUserProfile();
    }, [session.data?.user]);

    const handleAddComment = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();

        // Check if user has already commented
        if (hasCommented) {
            alert("You have already commented on this review. You can only add one comment per review to prevent spam.");
            return;
        }

        if (!content.trim()) return alert("Please write a comment.");
        if (!nick.trim()) return alert("Please enter a nickname.");

        setIsSubmitting(true);
        const result = await addCommentToReview(companyId, reviewId, content, nick);

        if (result.success) {
            setContent("");
            setNick("");
            setHasCommented(true); // Mark as commented
            onUpdate();
        } else {
            alert(result.error || "Failed to add comment");
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
                    {hasCommented && (
                        <div className="rounded-md bg-muted p-3 text-sm text-muted-foreground">
                            ℹ️ Już skomentowałeś tę opinię. Dozwolony jest tylko jeden komentarz na użytkownika, aby zapobiec
                            spamowi.
                        </div>
                    )}
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
                            disabled={isSubmitting || hasCommented}
                        />
                    </div>
                    <Textarea
                        placeholder="Dodaj komentarz..."
                        value={content}
                        onChange={(e) => setContent((e.target as HTMLTextAreaElement).value)}
                        className="min-h-[80px] resize-none"
                        disabled={isSubmitting || hasCommented}
                    />
                    <div className="flex justify-end">
                        <Button
                            onClick={handleAddComment}
                            size="sm"
                            disabled={!content.trim() || !nick.trim() || isSubmitting || hasCommented}
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
