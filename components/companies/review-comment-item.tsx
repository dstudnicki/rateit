"use client"

import { useState, useEffect, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Heart, MessageCircle, Send, MoreHorizontal, Pencil, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import {
    addReviewReply,
    toggleReviewCommentLike,
    toggleReviewReplyLike,
    updateReviewComment,
    deleteReviewComment,
    updateReviewReply,
    deleteReviewReply
} from "@/app/actions/review-comments"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Link from "next/link"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface ReplyData {
  _id: string
  user: {
    _id: string | undefined;
    name: string;
    slug?: string;
    fullName?: string | null;
    image?: string | null;
  };
  content: string
  likes: string[]
  createdAt: string
}

interface CommentData {
  _id: string
  user: {
    _id: string | undefined;
    name: string;
    slug?: string;
    fullName?: string | null;
    image?: string | null;
  };
  content: string
  likes: string[]
  replies: ReplyData[]
  createdAt: string
}

interface ReviewCommentItemProps {
  comment: CommentData
  companyId: string
  reviewId: string
  currentUserId?: string
  depth?: number
  onUpdate?: () => void
  parentCommentId?: string
}

export function ReviewCommentItem({
    comment,
    companyId,
    reviewId,
    currentUserId,
    depth = 0,
    onUpdate,
    parentCommentId
}: ReviewCommentItemProps) {
  const [isLiked, setIsLiked] = useState(comment.likes.includes(currentUserId || ''))
  const [likesCount, setLikesCount] = useState(comment.likes.length)
  const [isReplying, setIsReplying] = useState(false)
  const [replyContent, setReplyContent] = useState("")
  const [replies, setReplies] = useState<ReplyData[]>(comment.replies || [])
  const [isEditing, setIsEditing] = useState(false)
  const [editedContent, setEditedContent] = useState(comment.content)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    setReplies(comment.replies || [])
  }, [comment.replies])

  const targetCommentId = parentCommentId || comment._id
  const isOwnComment = currentUserId === comment.user._id
  const displayName = comment.user.fullName || comment.user.name
  const profileSlug = comment.user.slug || comment.user.name

  const handleLike = async () => {
    const result = parentCommentId
      ? await toggleReviewReplyLike(companyId, reviewId, parentCommentId, comment._id)
      : await toggleReviewCommentLike(companyId, reviewId, comment._id)

    if (result.success) {
      setIsLiked(result.isLiked!)
      setLikesCount(result.likesCount!)
    }
  }

  const handleReply = async (replyToUsername?: string) => {
    if (!replyContent.trim()) return

    const result = await addReviewReply(replyContent, companyId, reviewId, targetCommentId, replyToUsername)
    if (result.success) {
      setReplyContent("")
      setIsReplying(false)
      onUpdate?.()
    } else {
      alert(result.error || "Failed to add reply")
    }
  }

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleSaveEdit = () => {
    startTransition(async () => {
      const result = parentCommentId
        ? await updateReviewReply(companyId, reviewId, parentCommentId, comment._id, editedContent)
        : await updateReviewComment(companyId, reviewId, comment._id, editedContent)

      if (result.success) {
        setIsEditing(false)
        onUpdate?.()
      } else {
        alert(result.error || "Failed to update")
      }
    })
  }

  const handleCancelEdit = () => {
    setEditedContent(comment.content)
    setIsEditing(false)
  }

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this comment?")) {
      startTransition(async () => {
        const result = parentCommentId
          ? await deleteReviewReply(companyId, reviewId, parentCommentId, comment._id)
          : await deleteReviewComment(companyId, reviewId, comment._id)

        if (result.success) {
          onUpdate?.()
        } else {
          alert(result.error || "Failed to delete")
        }
      })
    }
  }

  return (
    <div className={cn("space-y-3", depth > 0 && "ml-10")}>
      <div className="flex gap-3">
        <Link href={`/${profileSlug}`}>
          <Avatar className="h-8 w-8">
            <AvatarImage
              src={comment.user.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.user.name}`}
              alt={displayName}
            />
            <AvatarFallback>{displayName.charAt(0).toUpperCase()}</AvatarFallback>
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
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={handleDelete}
                      disabled={isPending}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-2" />
                      Delete
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
                    {isPending ? "Saving..." : "Save"}
                  </Button>
                  <Button onClick={handleCancelEdit} size="sm" variant="outline" disabled={isPending}>
                    Cancel
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
                <span>Reply</span>
              </button>
            </div>
          )}

          {/* Reply Form */}
          {isReplying && (
            <div className="mt-3 ml-2">
              <div className="flex gap-2">
                <Textarea
                  placeholder={`Reply to ${displayName}...`}
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  className="min-h-[60px] resize-none text-sm"
                />
                <div className="flex flex-col gap-2">
                  <Button onClick={() => handleReply(displayName)} size="sm" disabled={!replyContent.trim()} className="gap-2">
                    <Send className="h-4 w-4" />
                  </Button>
                  <Button onClick={() => setIsReplying(false)} size="sm" variant="outline">
                    Cancel
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
                  key={reply._id}
                  comment={reply as any}
                  companyId={companyId}
                  reviewId={reviewId}
                  currentUserId={currentUserId}
                  onUpdate={onUpdate}
                  depth={1}
                  parentCommentId={comment._id}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
