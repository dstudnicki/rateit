"use client";

import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send } from "lucide-react";
import { CommentItem } from "./comment-item";
import { authClient } from "@/lib/auth-client";
import { addComment } from "@/app/actions/comments";

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

interface CommentSectionProps {
    postId: string;
}

export function CommentSection({ postId }: CommentSectionProps) {
    const [comments, setComments] = useState<CommentData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [content, setContent] = useState("");
    const session = authClient.useSession();
    const currentUserId = session.data?.user?.id;

    const fetchComments = async () => {
        try {
            const response = await fetch(`/api/posts/${postId}/comments`);
            const data = await response.json();
            setComments(data);
        } catch (error) {
            console.error("Failed to fetch comments:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchComments();
    }, [postId]);

    const handleCommentAdded = () => {
        fetchComments();
    };

    const handleAddComment = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!content.trim()) return alert("Please write a content.");

        const result = await addComment(content, postId);

        if (result.success) {
            setContent("");
            handleCommentAdded();
        } else {
            alert(result.error || "Failed to add comment");
        }
    };

    if (isLoading) {
        return <div className="text-center text-muted-foreground">Loading comments...</div>;
    }

    return (
        <div className="space-y-4">
            {/* Inline Comment Form */}
            <div className="flex gap-3">
                <Avatar className="h-9 w-9">
                    <AvatarImage src="/current-user.jpg" />
                    <AvatarFallback>You</AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-2">
                    <Textarea
                        placeholder="Add a comment..."
                        value={content}
                        onChange={(e) => setContent((e.target as HTMLTextAreaElement).value)}
                        className="min-h-[80px] resize-none"
                    />
                    <div className="flex justify-end">
                        <Button onClick={handleAddComment} size="sm" disabled={!content.trim()} className="gap-2">
                            <Send className="h-4 w-4" />
                            Post
                        </Button>
                    </div>
                </div>
            </div>

            {/* Comments List */}
            <div className="space-y-3">
                {comments.map((singleComment) => (
                    <CommentItem
                        key={singleComment._id}
                        comment={singleComment}
                        postId={postId}
                        currentUserId={currentUserId}
                        onUpdate={handleCommentAdded}
                    />
                ))}
            </div>
        </div>
    );
}
