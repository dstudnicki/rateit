"use client";

import { useState, useEffect, useCallback } from "react";
import { CommentItem } from "./comment-item";
import { authClient } from "@/lib/auth-client";
import { CommentForm } from "@/components/comment-form";
import { getComments } from "@/app/data/posts/get-comments";

interface ReplyData {
    _id: string;
    user: {
        _id: string | undefined;
        name: string;
        slug?: string;
        fullName?: string | null;
        image?: string | null;
        userImage?: string | null;
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
        slug?: string;
        fullName?: string | null;
        image?: string | null;
        userImage?: string | null;
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
    const [userWithImage, setUserWithImage] = useState<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        email: string;
        emailVerified: boolean;
        name: string;
        image?: string | null;
        userImage?: string | null;
    } | null>(null);
    const session = authClient.useSession();
    const currentUser = session.data?.user;

    const fetchComments = useCallback(async () => {
        try {
            const data = await getComments(postId);
            setComments(data);
        } catch {
            // Error fetching comments
        } finally {
            setIsLoading(false);
        }
    }, [postId]);

    // Fetch user with userImage from database
    useEffect(() => {
        const fetchUserWithImage = async () => {
            if (!currentUser?.id) return;

            try {
                const response = await fetch(`/api/user/${currentUser.id}`);
                if (response.ok) {
                    const userData = await response.json();
                    setUserWithImage({
                        ...currentUser,
                        userImage: userData.userImage,
                    });
                }
            } catch {
                // If fetch fails, use currentUser without userImage
                setUserWithImage(currentUser);
            }
        };

        if (currentUser) {
            fetchUserWithImage();
        }
    }, [currentUser]);

    useEffect(() => {
        fetchComments();
    }, [fetchComments]);

    const handleCommentAdded = () => {
        fetchComments();
    };

    if (isLoading) {
        return <div className="text-center text-muted-foreground">Ładowanie komentarzy...</div>;
    }

    return (
        <div className="space-y-4">
            <CommentForm postId={postId} onCommentAdded={handleCommentAdded} user={{ user: userWithImage || undefined }} />

            {/* Comments List */}
            <div className="space-y-3">
                {comments.map((singleComment) => (
                    <CommentItem
                        key={singleComment._id}
                        comment={singleComment}
                        postId={postId}
                        currentUserId={currentUser?.id}
                        onUpdate={handleCommentAdded}
                    />
                ))}
            </div>
        </div>
    );
}
