"use client";

import React, { useState, useTransition, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Heart, MessageCircle, Send, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { CommentSection } from "@/components/comment-section";
import { authClient } from "@/lib/auth-client";
import { deletePost, updatePost } from "@/app/actions/posts";
import { togglePostLike } from "@/app/actions/comments";
import { trackInteraction } from "@/app/actions/preferences";
import { useRouter } from "next/navigation";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

interface Comment {
    _id: string;
    content: string;
    user: {
        _id: string | undefined;
        username: string;
    };
    createdAt: string;
}

interface Post {
    _id: string;
    user: {
        _id: string | undefined;
        name: string;
        slug?: string;
        fullName?: string | null;
        headline?: string | null;
        image?: string | null;
    };
    content: string;
    images?: string[];
    likes?: string[]; // Array of user IDs who liked the post
    comments: Comment[];
    createdAt: string;
}

interface PostCardProps {
    post: Post;
}

export function PostCard({ post }: PostCardProps) {
    const session = authClient.useSession();
    const currentUserId = session.data?.user?.id;

    // Initialize likes based on post data
    const initialLikesCount = Array.isArray(post.likes) ? post.likes.length : 0;
    const initialIsLiked = currentUserId ? Array.isArray(post.likes) && post.likes.includes(currentUserId) : false;

    const [isLiked, setIsLiked] = useState(initialIsLiked as boolean | undefined);
    const [likesCount, setLikesCount] = useState(initialLikesCount);
    const [showComments, setShowComments] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editedContent, setEditedContent] = useState(post.content);
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    // Debug: Check what data we're receiving
    useEffect(() => {
        console.log("[PostCard] Post data:", {
            userId: post.user._id,
            userName: post.user.name,
            userFullName: post.user.fullName,
            userSlug: post.user.slug,
            userHeadline: post.user.headline,
        });
    }, [post]);

    // Use fallbacks that handle empty strings (not just null/undefined)
    const displayName = (post.user.fullName && post.user.fullName.trim()) || post.user.name || "Anonymous User";
    const profileSlug = (post.user.slug && post.user.slug.trim()) || post.user.name || "user";
    const headline = (post.user.headline && post.user.headline.trim()) || "";
    const isOwnPost = currentUserId === post.user._id;

    // Update likes state when post data changes (after server refresh)
    useEffect(() => {
        const newLikesCount = Array.isArray(post.likes) ? post.likes.length : 0;
        const newIsLiked = currentUserId ? Array.isArray(post.likes) && post.likes.includes(currentUserId) : false;

        setLikesCount(newLikesCount);
        setIsLiked(newIsLiked);
    }, [post.likes, currentUserId]);

    const handleLike = async () => {
        if (!currentUserId) {
            alert("Please log in to like posts");
            return;
        }

        // Optimistic update
        const wasLiked = isLiked;
        const prevCount = likesCount;
        setIsLiked(!isLiked);
        setLikesCount(isLiked ? likesCount - 1 : likesCount + 1);

        try {
            // Save to database
            const result = await togglePostLike(post._id);

            if (result.success) {
                // Update with server response
                setIsLiked(result.isLiked);
                setLikesCount(result.likesCount);

                // Track interaction for personalization
                if (result.isLiked) {
                    trackInteraction(post._id, "post", "like").catch(console.error);
                }
            } else {
                // Revert on error
                setIsLiked(wasLiked);
                setLikesCount(prevCount);
                console.error("Failed to like post:", result.error);
            }
        } catch (error) {
            // Revert on error
            setIsLiked(wasLiked);
            setLikesCount(prevCount);
            console.error("Failed to like post:", error);
        }
    };

    const handleCommentClick = () => {
        setShowComments(!showComments);

        // Track interaction for personalization when opening comments
        if (!showComments && currentUserId) {
            trackInteraction(post._id, "post", "comment").catch(console.error);
        }
    };

    const handleEdit = () => {
        setIsEditing(true);
    };

    const handleSaveEdit = () => {
        startTransition(async () => {
            const result = await updatePost(post._id, editedContent);
            if (result.success) {
                setIsEditing(false);
                router.refresh();
            } else {
                alert(result.error || "Failed to update post");
            }
        });
    };

    const handleCancelEdit = () => {
        setEditedContent(post.content);
        setIsEditing(false);
    };

    const handleDelete = () => {
        if (confirm("Are you sure you want to delete this post?")) {
            startTransition(async () => {
                const result = await deletePost(post._id);
                if (result.success) {
                    router.refresh();
                } else {
                    alert(result.error || "Failed to delete post");
                }
            });
        }
    };

    return (
        <Card className="p-4 hover:bg-secondary/50 transition-colors">
            {/* Post Header */}
            <div className="flex items-start gap-3">
                <Link href={`/${profileSlug}`}>
                    <Avatar>
                        <AvatarImage
                            src={post.user.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.user.name}`}
                            alt={displayName}
                        />
                        <AvatarFallback>{displayName?.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                </Link>

                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                        <div>
                            <Link href={`/${profileSlug}`}>
                                <h3 className="font-semibold text-sm leading-tight hover:underline mb-0.5">{displayName}</h3>
                            </Link>
                            <p className="text-xs text-muted-foreground leading-tight">{headline}</p>
                            <span className="text-xs text-muted-foreground mt-0.5">
                                {new Intl.DateTimeFormat("en-US", {
                                    hour: "numeric",
                                    minute: "numeric",
                                    hour12: true,
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                }).format(new Date(post.createdAt))}
                            </span>
                        </div>
                        {isOwnPost && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 -mt-1">
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={handleEdit} disabled={isPending}>
                                        <Pencil className="h-4 w-4 mr-2" />
                                        Edit post
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={handleDelete}
                                        disabled={isPending}
                                        className="text-destructive focus:text-destructive"
                                    >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Delete post
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                    </div>

                    {/* Post Content */}
                    <div className="mt-3">
                        <p className="text-sm leading-relaxed whitespace-pre-wrap text-balance">{post.content}</p>

                        {/* Post Images */}
                        {post.images && post.images.length > 0 && (
                            <div
                                className={`mt-3 rounded-lg overflow-hidden border grid gap-1 ${
                                    post.images.length === 1
                                        ? "grid-cols-1"
                                        : post.images.length === 2
                                          ? "grid-cols-2"
                                          : post.images.length === 3
                                            ? "grid-cols-2"
                                            : "grid-cols-2"
                                }`}
                            >
                                {post.images.slice(0, 4).map((image, index) => (
                                    <div
                                        key={index}
                                        className={`relative ${
                                            post.images?.length === 3 && index === 0 ? "col-span-2" : ""
                                        } bg-muted/50`}
                                    >
                                        <img
                                            src={image}
                                            alt={`Post image ${index + 1}`}
                                            className={`w-full object-contain ${
                                                post.images?.length === 1
                                                    ? "max-h-[500px]"
                                                    : post.images?.length === 2
                                                      ? "max-h-[400px] aspect-square object-cover"
                                                      : "max-h-[300px] aspect-square object-cover"
                                            }`}
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Engagement Stats */}
                    <div className="flex items-center gap-4 mt-3 pt-2 border-t text-xs text-muted-foreground">
                        <button
                            onClick={handleLike}
                            className={cn(
                                "flex items-center gap-1.5 text-xs font-medium transition-colors hover:text-destructive",
                                isLiked ? "text-destructive" : "text-muted-foreground",
                            )}
                        >
                            <Heart className={cn("h-3.5 w-3.5", isLiked && "fill-current")} />
                            {likesCount > 0 && <span>{likesCount}</span>}
                        </button>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-1 mt-2 pt-2 border-t">
                        <Button
                            variant="ghost"
                            size="sm"
                            className={cn("flex-1 gap-2 h-9", isLiked && "text-destructive hover:text-destructive")}
                            onClick={handleLike}
                        >
                            <Heart className={cn("h-4 w-4", isLiked && "fill-current")} />
                            <span className="text-sm font-medium">Like</span>
                        </Button>

                        <Button
                            variant="ghost"
                            size="sm"
                            className={cn("flex-1 gap-2 h-9", showComments && "bg-secondary")}
                            onClick={handleCommentClick}
                        >
                            <MessageCircle className="h-4 w-4" />
                            <span className="text-sm font-medium">Comment</span>
                        </Button>
                        <Button variant="ghost" size="sm" className="flex-1 gap-2 h-9">
                            <Send className="h-4 w-4" />
                            <span className="text-sm font-medium">Share</span>
                        </Button>
                    </div>
                    {/* Comment Section */}
                    {showComments && (
                        <div className="mt-4 pt-4 border-t">
                            <CommentSection postId={post._id} />
                        </div>
                    )}
                </div>
            </div>

            {/* Edit Dialog */}
            <Dialog open={isEditing} onOpenChange={setIsEditing}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit post</DialogTitle>
                        <DialogDescription>Make changes to your post below.</DialogDescription>
                    </DialogHeader>
                    <Textarea
                        value={editedContent}
                        onChange={(e) => setEditedContent(e.target.value)}
                        placeholder="What do you want to talk about?"
                        className="min-h-[120px]"
                        disabled={isPending}
                    />
                    <DialogFooter>
                        <Button variant="outline" onClick={handleCancelEdit} disabled={isPending}>
                            Cancel
                        </Button>
                        <Button onClick={handleSaveEdit} disabled={isPending || !editedContent.trim()}>
                            {isPending ? "Saving..." : "Save changes"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Card>
    );
}
