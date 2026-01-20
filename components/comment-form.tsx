"use client";

import React, { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import { addComment } from "@/app/actions/comments";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface UserData {
    user:
        | {
              id: string;
              createdAt: Date;
              updatedAt: Date;
              email: string;
              emailVerified: boolean;
              name: string;
              image?: string | null | undefined;
              userImage?: string | null | undefined;
          }
        | undefined;
}

interface CommentFormProps {
    user: UserData | undefined;
    postId: string;
    onCommentAdded?: () => void;
}

export function CommentForm({ user, postId, onCommentAdded }: CommentFormProps) {
    const [content, setContent] = useState("");
    const displayName = user?.user?.name || "User";
    const userAvatar = user?.user?.userImage || user?.user?.image;
    const router = useRouter();

    // Jeśli użytkownik nie jest zalogowany, pokaż CTA do logowania
    if (!user?.user) {
        return (
            <div className="flex items-center gap-2 sm:gap-3">
                <div className="flex-1">
                    <div className="text-sm text-muted-foreground">Zaloguj się, aby dodać komentarz.</div>
                </div>
            </div>
        );
    }

    const handleAddComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content) return toast.error("Napisz treść komentarza.");

        const result = await addComment(content, postId);

        if (result.success) {
            setContent("");
            onCommentAdded?.();
        }
    };

    return (
        <div className="flex items-center gap-2 sm:gap-3">
            <Avatar className="h-8 w-8 shrink-0">
                <AvatarImage src={userAvatar || undefined} alt={displayName || "User"} />
                <AvatarFallback>
                    {displayName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()}
                </AvatarFallback>
            </Avatar>
            <div className="flex-1 flex items-center gap-1 sm:gap-2  px-2 sm:px-4 py-1.5 sm:py-2 focus-within:border-primary/50 transition-colors min-w-0">
                <input
                    type="text"
                    placeholder="Dodaj komentarz..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" && content.trim()) {
                            handleAddComment(e);
                        }
                    }}
                    className="flex-1 flex items-center gap-1 sm:gap-2 rounded-full border border-muted-foreground/30 bg-background px-2 sm:px-4 py-1.5 sm:py-2 focus-within:border-primary/50 transition-colors min-w-0"
                />
                <div className="flex justify-end">
                    <Button onClick={handleAddComment} size="sm" disabled={!content.trim()} className="gap-2">
                        <Send className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
