"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Heart, MessageCircle, Send } from "lucide-react"
import { cn } from "@/lib/utils"
import { addReply, toggleCommentLike, toggleReplyLike } from "@/app/actions/comments"

interface ReplyData {
  _id: string
  user: {
    _id: string | undefined;
    name: string;
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
  };
  content: string
  likes: string[]
  replies: ReplyData[]
  createdAt: string
}

interface CommentItemProps {
  comment: CommentData
  postId: string
  currentUserId?: string
  depth?: number
  onUpdate?: () => void
  parentCommentId?: string // For nested replies
}

export function CommentItem({ comment, postId, currentUserId, depth = 0, onUpdate, parentCommentId }: CommentItemProps) {
  const [isLiked, setIsLiked] = useState(comment.likes.includes(currentUserId || ''))
  const [likesCount, setLikesCount] = useState(comment.likes.length)
  const [isReplying, setIsReplying] = useState(false)
  const [replyContent, setReplyContent] = useState("")
  const [replies, setReplies] = useState<ReplyData[]>(comment.replies || [])

  // Update replies when comment.replies changes (when parent fetches new data)
  useEffect(() => {
    setReplies(comment.replies || [])
  }, [comment.replies])

  // This is the comment ID to add replies to (either itself or its parent)
  const targetCommentId = parentCommentId || comment._id

  // Check if this is the current user's comment (cannot reply to own comment)
  const isOwnComment = comment.user._id === currentUserId

  const handleLike = async () => {
    // If this is a reply (has parentCommentId), use toggleReplyLike, otherwise toggleCommentLike
    const result = parentCommentId
      ? await toggleReplyLike(postId, parentCommentId, comment._id)
      : await toggleCommentLike(postId, comment._id)

    if (result.success) {
      setIsLiked(result.isLiked!)
      setLikesCount(result.likesCount!)
    }
  }

  const handleReply = async (replyToUsername?: string) => {
    if (!replyContent.trim()) return

    const result = await addReply(replyContent, postId, targetCommentId, replyToUsername)
    if (result.success) {
      setReplyContent("")
      setIsReplying(false)
      onUpdate?.()
    } else {
      // Show error message if validation fails
      alert(result.error || "Failed to add reply")
    }
  }

  return (
    <div className={cn("space-y-3", depth > 0 && "ml-10")}>
      <div className="flex gap-3">
        <div className="flex-1 min-w-0">
          <div className="bg-secondary/50 rounded-lg p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-sm">{comment.user.name}</h4>
              </div>
            </div>

            <p className="text-sm mt-1 leading-relaxed whitespace-pre-wrap text-balance">{comment.content}</p>
          </div>

          {/* Comment Actions */}
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

            {/* Only show Reply button if not own comment */}
            {!isOwnComment && (
              <button
                onClick={() => setIsReplying(!isReplying)}
                className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                <MessageCircle className="h-3.5 w-3.5" />
                <span>Reply</span>
              </button>
            )}
          </div>

          {/* Reply Form */}
          {isReplying && (
            <div className="mt-3 ml-2">
              <div className="flex gap-2">
                <Textarea
                  placeholder={`Reply to ${comment.user.name}...`}
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  className="min-h-[60px] resize-none text-sm"
                />
                <div className="flex flex-col gap-2">
                  <Button onClick={() => handleReply(comment.user.name)} size="sm" disabled={!replyContent.trim()} className="gap-2">
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
                <CommentItem
                  key={reply._id}
                  comment={reply as any}
                  postId={postId}
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
