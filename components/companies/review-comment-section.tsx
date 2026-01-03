"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send } from "lucide-react";
import { ReviewCommentItem } from "@/components/companies/review-comment-item";
import { authClient } from "@/lib/auth-client";
import { addReviewComment } from "@/app/actions/review-comments";

interface ReplyData {
    _id: string;
    user: {
        _id: string | undefined;
        name: string;
    };
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
    const [isSubmitting, setIsSubmitting] = useState(false);
    const session = authClient.useSession();
    const currentUserId = session.data?.user?.id;

    const handleAddComment = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!content.trim()) return alert("Please write a comment.");

        setIsSubmitting(true);
        const result = await addReviewComment(content, companyId, reviewId);

        if (result.success) {
            setContent("");
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
                    <AvatarImage src={session.data?.user?.image || "/current-user.jpg"} />
                    <AvatarFallback>You</AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-2">
                    <Textarea
                        placeholder="Add a comment..."
                        value={content}
                        onChange={(e) => setContent((e.target as HTMLTextAreaElement).value)}
                        className="min-h-[80px] resize-none"
                        disabled={isSubmitting}
                    />
                    <div className="flex justify-end">
                        <Button
                            onClick={handleAddComment}
                            size="sm"
                            disabled={!content.trim() || isSubmitting}
                            className="gap-2"
                        >
                            <Send className="h-4 w-4" />
                            {isSubmitting ? "Posting..." : "Post"}
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

