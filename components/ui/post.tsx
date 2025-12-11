"use client"

import React, { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Heart, MessageCircle, Repeat2, Send, MoreHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link";
import { CommentSection } from "@/components/comment-section";

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
    _id: string
    user: {
        _id: string | undefined;
        name: string
        // title: string
        // avatar: string
    }
    content: string
    // timestamp: string
    // likes: number
    comments: Comment[]
    // image?: string
    createdAt: string
}

interface PostCardProps {
    post: Post;
}

export function PostCard({post }:PostCardProps) {
    const [isLiked, setIsLiked] = useState(false)
    const [likesCount, setLikesCount] = useState(0)
    const [showComments, setShowComments] = useState(false)
    const [commentsCount, setCommentsCount] = useState(post.comments.length)

    const handleLike = () => {
        setIsLiked(!isLiked)
        setLikesCount(isLiked ? likesCount - 1 : likesCount + 1)
    }

    const handleCommentClick = () => {
        setShowComments(!showComments)
    }

    return (
        <Card className="p-4 hover:bg-secondary/50 transition-colors">
            {/* Post Header */}
            <div className="flex items-start gap-3">
                <Link href={`/${post.user.name}`}>
                    <Avatar>
                        <AvatarImage src={process.env.PUBLIC_URL + "/user.png"} alt={post.user.name} />
                        <AvatarFallback>{post.user.name.toUpperCase()}</AvatarFallback>
                    </Avatar>
                </Link>

                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                        <div>
                            <h3 className="font-semibold text-sm leading-tight">{post.user.name}</h3>
                            {/*<p className="text-xs text-muted-foreground leading-tight">{post.user.title}</p>*/}
                            {/* <p className="text-xs text-muted-foreground mt-0.5">{post.timestamp}</p>*/}
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
                        <Button variant="ghost" size="icon" className="h-8 w-8 -mt-1">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </div>

                    {/* Post Content */}
                    <div className="mt-3">
                        <p className="text-sm leading-relaxed whitespace-pre-wrap text-balance">{post.content}</p>

                        {/*  {post.image && (
              <div className="mt-3 rounded-lg overflow-hidden border">
                <img src={post.image || "/placeholder.svg"} alt="Post content" className="w-full h-auto" />
              </div>
            )}*/}
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
        </Card>
    )
}
