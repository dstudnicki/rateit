"use client";

import { useState, useEffect, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Heart, MessageCircle, Send, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
    toggleReviewCommentLike,
    toggleReviewReplyLike,
    updateReviewComment,
    deleteReviewComment,
    updateReviewReply,
    deleteReviewReply,
} from "@/app/actions/review-comments";
import { addReplyToComment } from "@/app/actions/companies";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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

interface AuthorPublic {
    fullName?: string | null;
    name?: string | null;
    nick?: string | null;
    avatar?: string | null;
}

interface ReplyData {
    id: string;
    _id?: string;
    author: AuthorPublic;
    content: string;
    likesCount: number;
    isLiked?: boolean;
    createdAt: string;
}

interface CommentData {
    id: string;
    _id?: string;
    author: AuthorPublic;
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

interface ReviewCommentItemProps {
    comment: CommentData;
    companyId: string;
    reviewId: string;
    currentUserId?: string;
    depth?: number;
    onUpdate?: () => void;
    parentCommentId?: string;
}

export function ReviewCommentItem({
    comment,
    companyId,
    reviewId,
    currentUserId,
    depth = 0,
    onUpdate,
    parentCommentId,
}: ReviewCommentItemProps) {
    const [isLiked, setIsLiked] = useState(!!comment.isLiked);
    const [likesCount, setLikesCount] = useState(comment.likesCount || 0);
    const [isReplying, setIsReplying] = useState(false);
    const [replyContent, setReplyContent] = useState("");
    const [replyNick, setReplyNick] = useState("");
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

    const targetCommentId = parentCommentId || comment.id || comment._id;
    const isOwnComment = !!comment.permissions?.canEdit || !!comment.permissions?.canDelete;
    const displayName = comment.author?.fullName || comment.author?.name || comment.author?.nick || "Anonymous";

    const handleLike = async () => {
        const result = parentCommentId
            ? await toggleReviewReplyLike(companyId, reviewId, parentCommentId, comment.id || comment._id || "")
            : await toggleReviewCommentLike(companyId, reviewId, comment.id || comment._id || "");

        if (result.success) {
            setIsLiked(!!result.isLiked);
            setLikesCount(result.likesCount ?? likesCount);
        }
    };

    const handleReplyClick = () => {
        setIsReplying(!isReplying);
        // Auto-fill with @nickname when starting to reply
        if (!isReplying) {
            setReplyContent(`@${displayName} `);
        } else {
            setReplyContent("");
        }
    };

    const handleReply = async () => {
        if (!replyContent.trim()) return toast.error("Proszę napisz odpowiedź");
        if (!replyNick.trim()) return toast.error("Proszę wpisz nick");

        const result = await addReplyToComment(companyId, reviewId, targetCommentId, replyContent, replyNick);
        if (result.success) {
            setReplyContent("");
            setReplyNick("");
            setIsReplying(false);
            onUpdate?.();
        } else {
            toast.error("Nie udało się dodać odpowiedzi");
        }
    };

    // Disable replies on replies - only allow replies to top-level comments
    // Also disable replying to own comments to prevent abuse
    const canReply = !parentCommentId && !isOwnComment;

    const handleEdit = () => {
        setIsEditing(true);
    };

    const handleSaveEdit = () => {
        startTransition(async () => {
            const result = parentCommentId
                ? await updateReviewReply(companyId, reviewId, parentCommentId, comment.id || comment._id || "", editedContent)
                : await updateReviewComment(companyId, reviewId, comment.id || comment._id || "", editedContent);

            if (result.success) {
                setIsEditing(false);
                onUpdate?.();
            } else {
                toast.error("Nie udało się zaktualizować");
            }
        });
    };

    const handleCancelEdit = () => {
        setEditedContent(comment.content);
        setIsEditing(false);
    };

    const handleDelete = () => {
        setShowDeleteDialog(true);
    };

    const confirmDelete = async () => {
        setShowDeleteDialog(false);
        setIsDeleting(true);
        startTransition(async () => {
            const result = parentCommentId
                ? await deleteReviewReply(companyId, reviewId, parentCommentId, comment.id || comment._id || "")
                : await deleteReviewComment(companyId, reviewId, comment.id || comment._id || "");

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
                <Avatar className="h-8 w-8">
                    <AvatarImage
                        src={comment.author?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${displayName}`}
                        alt={displayName}
                    />
                    <AvatarFallback>{displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                    <div className="bg-secondary/50 rounded-lg p-3">
                        <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-sm">{displayName}</h4>
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
                                <span>{likesCount}</span>
                            </button>

                            {/* Only show Reply button for top-level comments, not for replies */}
                            {canReply && (
                                <button
                                    onClick={handleReplyClick}
                                    className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    <MessageCircle className="h-3.5 w-3.5" />
                                    <span>Odpowiedz</span>
                                </button>
                            )}
                        </div>
                    )}

                    {/* Reply Form */}
                    {isReplying && (
                        <div className="mt-3 ml-2 space-y-2">
                            <div className="space-y-2">
                                <Label htmlFor="reply-nick" className="text-xs">
                                    Twój pseudonim
                                </Label>
                                <Input
                                    id="reply-nick"
                                    value={replyNick}
                                    onChange={(e) => setReplyNick(e.target.value)}
                                    placeholder="np. Komentator99"
                                    maxLength={30}
                                    required
                                    className="text-sm"
                                />
                            </div>
                            <div className="flex gap-2">
                                <Textarea
                                    placeholder={`Odpowiedz ${displayName}...`}
                                    value={replyContent}
                                    onChange={(e) => setReplyContent(e.target.value)}
                                    className="min-h-[60px] resize-none text-sm"
                                />
                                <div className="flex flex-col gap-2">
                                    <Button
                                        onClick={handleReply}
                                        size="sm"
                                        disabled={!replyContent.trim() || !replyNick.trim()}
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
                                <ReviewCommentItem
                                    key={reply.id || reply._id}
                                    comment={reply as any}
                                    companyId={companyId}
                                    reviewId={reviewId}
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
