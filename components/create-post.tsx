"use client"

import React, { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { ImageIcon, Video, FileText, Smile } from "lucide-react"
import { createPost } from "@/app/actions/posts";
import { useRouter } from "next/navigation"

export function CreatePost() {
  const [content, setContent] = useState("")
  const [isExpanded, setIsExpanded] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return alert("Please write a content.");

    setIsSubmitting(true)

    // Optimistic update - clear form immediately for better UX
    const postContent = content
    setContent("")
    setIsExpanded(false)

    try {
      const result = await createPost(postContent);

      if (result.success) {
        // Refresh the page to show the new post (cache is invalidated server-side)
        router.refresh()
      } else {
        // Restore content on error
        setContent(postContent)
        setIsExpanded(true)
        alert("Failed to create post. Please try again.")
      }
    } catch (error) {
      // Restore content on error
      setContent(postContent)
      setIsExpanded(true)
      alert("Failed to create post. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  };

  return (
    <Card className="p-4">
      <div className="flex gap-3">
        <Avatar className="h-12 w-12">
          <AvatarImage src="/diverse-user-avatars.png" />
          <AvatarFallback>ME</AvatarFallback>
        </Avatar>

        <div className="flex-1">
          <Textarea
            placeholder="What's on your mind?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onFocus={() => setIsExpanded(true)}
            className="min-h-[60px] resize-none border-none p-0 focus-visible:ring-0 text-base"
            disabled={isSubmitting}
          />

          {isExpanded && (
            <div className="mt-4 space-y-4">
              {/* Media Options */}
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" className="gap-2" disabled={isSubmitting}>
                  <ImageIcon className="h-4 w-4" />
                  <span className="hidden sm:inline">Photo</span>
                </Button>
              </div>

              {/* Post Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setIsExpanded(false)
                    setContent("")
                  }}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button size="sm" onClick={handleSubmit} disabled={!content.trim() || isSubmitting}>
                  {isSubmitting ? "Posting..." : "Post"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}
