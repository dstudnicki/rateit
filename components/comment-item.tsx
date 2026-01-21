"use client";

import React, { useState, useEffect, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Heart, MessageCircle, Send, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
    addReply,
    toggleCommentLike,
    toggleReplyLike,
    updateComment,
    deleteComment,
    updateReply,
    deleteReply,
} from "@/app/actions/comments";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogFooter,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogAction,
    AlertDialogCancel,
} from "@/components/ui/alert-dialog";

interface ReplyData {
    id: string;
    _id?: string;
    author: {
        fullName?: string | null;
        name?: string | null;
        nick?: string | null;
        avatar?: string | null;
    };
    content: string;
    likesCount: number;
    isLiked?: boolean;
    replies: ReplyData[];
    createdAt: string;
}

interface CommentData {
    id: string;
    _id?: string;
    author: {
        fullName?: string | null;
        name?: string | null;
        nick?: string | null;
        avatar?: string | null;
        userImage?: string | null | undefined;
    };
    content: string;
    likesCount: number;
    isLiked?: boolean;
    replies: ReplyData[];
    createdAt: string;
    permissions?: {
        canEdit: boolean;
        canDelete: boolean;
        canComment?: boolean;
    };
}

interface CommentItemProps {
    comment: CommentData;
    postId: string;
    currentUserId?: string;
    depth?: number;
    onUpdate?: () => void;
    parentCommentId?: string; // For nested replies
}

export function CommentItem({ comment, postId, currentUserId, depth = 0, onUpdate, parentCommentId }: CommentItemProps) {
    // use DTO fields (likesCount, isLiked)
    const [isLiked, setIsLiked] = useState(!!comment.isLiked);
    const [likesCount, setLikesCount] = useState(comment.likesCount || 0);
    const [isReplying, setIsReplying] = useState(false);
    const [replyContent, setReplyContent] = useState("");
    const [replies, setReplies] = useState<ReplyData[]>(comment.replies || []);
    const [isEditing, setIsEditing] = useState(false);
    const [editedContent, setEditedContent] = useState(comment.content);
    const [isPending, startTransition] = useTransition();
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        setReplies(comment.replies || []);
        setIsLiked(!!comment.isLiked);
        setLikesCount(comment.likesCount || 0);
    }, [comment.replies, comment.isLiked, comment.likesCount]);
    console.log(comment);
    const targetCommentId = parentCommentId || comment.id || comment._id;
    const isOwnComment = !!(comment.permissions?.canEdit || comment.permissions?.canDelete);
    const displayName = comment.author?.fullName || comment.author?.name || comment.author?.nick || "Anonymous";
    const profileSlug = comment.author?.nick || comment.author?.name || "";
    const userAvatar = comment.author?.avatar ?? undefined;
    console.log(displayName);

    const handleLike = async () => {
        const result = parentCommentId
            ? await toggleReplyLike(postId, parentCommentId, comment.id || comment._id || "")
            : await toggleCommentLike(postId, comment.id || comment._id || "");

        if (result.success) {
            setIsLiked(!!result.isLiked);
            setLikesCount(result.likesCount ?? likesCount);
        }
    };

    const handleReply = async (replyToUsername?: string) => {
        if (!replyContent.trim()) return;

        const result = await addReply(replyContent, postId, targetCommentId!, replyToUsername);
        if (result.success) {
            setReplyContent("");
            setIsReplying(false);
            onUpdate?.();
        } else {
            toast.error("Nie udało się dodać recenzji. Proszę, spróbuj ponownie.");
        }
    };

    const handleEdit = () => {
        setIsEditing(true);
    };

    const handleSaveEdit = () => {
        startTransition(async () => {
            const result = parentCommentId
                ? await updateReply(postId, parentCommentId, comment.id || comment._id || "", editedContent)
                : await updateComment(postId, comment.id || comment._id || "", editedContent);

            if (result.success) {
                setIsEditing(false);
                onUpdate?.();
            } else {
                toast.error("Nie udało się usunąć");
            }
        });
    };

    const handleCancelEdit = () => {
        setEditedContent(comment.content);
        setIsEditing(false);
    };

    const handleDelete = () => {
        // Otwórz dialog potwierdzenia zamiast natywnego confirm
        setShowDeleteDialog(true);
    };

    const confirmDelete = async () => {
        setShowDeleteDialog(false);
        setIsDeleting(true);
        startTransition(async () => {
            const result = parentCommentId
                ? await deleteReply(postId, parentCommentId, comment.id || comment._id || "")
                : await deleteComment(postId, comment.id || comment._id || "");

            setIsDeleting(false);

            if (result.success) {
                onUpdate?.();
            } else {
                toast.error("Nie udało się usunąć");
            }
        });
    };

    return (
        <div className={cn("space-y-3", depth > 0 && "ml-10")}>
            <div className="flex gap-3">
                <Link href={`/${profileSlug}`}>
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={userAvatar || undefined} alt={displayName} />
                        <AvatarFallback>
                            {displayName
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                </Link>

                <div className="flex-1 min-w-0">
                    <div className="bg-secondary/50 rounded-lg p-3">
                        <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                                <Link href={`/${profileSlug}`}>
                                    <h4 className="font-semibold text-sm hover:underline">{displayName}</h4>
                                </Link>
                            </div>
                            {isOwnComment && !isEditing && (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-6 w-6">
                                            <MoreHorizontal className="h-3.5 w-3.5" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={handleEdit} disabled={isPending}>
                                            <Pencil className="h-3.5 w-3.5 mr-2" />
                                            Edytuj
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={handleDelete}
                                            disabled={isPending || isDeleting}
                                            className="text-destructive focus:text-destructive"
                                        >
                                            <Trash2 className="h-3.5 w-3.5 mr-2" />
                                            Usuń
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            )}
                        </div>

                        {isEditing ? (
                            <div className="mt-2 space-y-2">
                                <Textarea
                                    value={editedContent}
                                    onChange={(e) => setEditedContent(e.target.value)}
                                    className="min-h-[60px] text-sm"
                                    disabled={isPending}
                                />
                                <div className="flex gap-2">
                                    <Button onClick={handleSaveEdit} size="sm" disabled={isPending || !editedContent.trim()}>
                                        {isPending ? "Zapisywanie..." : "Zapisz"}
                                    </Button>
                                    <Button onClick={handleCancelEdit} size="sm" variant="outline" disabled={isPending}>
                                        Anuluj
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <p className="text-sm mt-1 leading-relaxed whitespace-pre-wrap text-balance">{comment.content}</p>
                        )}
                    </div>

                    {/* Comment Actions */}
                    {!isEditing && (
                        <div className="flex items-center gap-4 mt-2 px-2">
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

                            <button
                                onClick={() => setIsReplying(!isReplying)}
                                className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <MessageCircle className="h-3.5 w-3.5" />
                                <span>Odpowiedz</span>
                            </button>
                        </div>
                    )}

                    {/* Reply Form */}
                    {isReplying && (
                        <div className="mt-3 ml-2">
                            <div className="flex gap-2">
                                <Textarea
                                    placeholder={`Odpowiedz ${displayName}...`}
                                    value={replyContent}
                                    onChange={(e) => setReplyContent(e.target.value)}
                                    className="min-h-[60px] resize-none text-sm"
                                />
                                <div className="flex flex-col gap-2">
                                    <Button
                                        onClick={() => handleReply(displayName)}
                                        size="sm"
                                        disabled={!replyContent.trim()}
                                        className="gap-2"
                                    >
                                        <Send className="h-4 w-4" />
                                    </Button>
                                    <Button onClick={() => setIsReplying(false)} size="sm" variant="outline">
                                        Anuluj
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Render Replies */}
                    {!parentCommentId && replies.length > 0 && (
                        <div className="mt-3 space-y-3">
                            {replies.map((reply) => (
                                <CommentItem
                                    key={reply.id || reply._id}
                                    comment={reply as unknown as ReplyData}
                                    postId={postId}
                                    currentUserId={currentUserId}
                                    onUpdate={onUpdate}
                                    depth={1}
                                    parentCommentId={comment.id || comment._id}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* AlertDialog potwierdzenia usunięcia */}
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Usuń komentarz</AlertDialogTitle>
                        <AlertDialogDescription>
                            Jesteś pewien, że chcesz usunąć ten komentarz? Ta operacja jest nieodwracalna.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setShowDeleteDialog(false)}>Anuluj</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-destructive">
                            Usuń
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
