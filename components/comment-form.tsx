"use client";

import React, { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send } from "lucide-react";
import { addComment } from "@/app/actions/comments";

interface CommentFormProps {
    postId: string;
    onCommentAdded?: () => void;
}

export function CommentForm({ postId, onCommentAdded }: CommentFormProps) {
    const [content, setContent] = useState("")

    const handleAddComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content) return alert("Please write a content.");

        const result = await addComment(content, postId);

        if (result.success) {
            setContent("");
            onCommentAdded?.();
        }
    };

    return (
        <div className="flex gap-3">
            <Avatar className="h-9 w-9">
                <AvatarImage src="/current-user.jpg" />
                <AvatarFallback>You</AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2">
                <Textarea
                    placeholder="Add a comment..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
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
    );
}
