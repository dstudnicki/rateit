"use client"

import React, { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { ImageIcon, Video, FileText, Smile } from "lucide-react"
import { createPost } from "@/app/actions/posts";

export function CreatePost() {
  const [content, setContent] = useState("")
  const [isExpanded, setIsExpanded] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content) return alert("Please write a content.");

        const result = await createPost(content);

        setIsExpanded(false)
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
          />

          {isExpanded && (
            <div className="mt-4 space-y-4">
              {/* Media Options */}
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" className="gap-2">
                  <ImageIcon className="h-4 w-4" />
                  <span className="hidden sm:inline">Photo</span>
                </Button>
                <Button variant="ghost" size="sm" className="gap-2">
                  <Video className="h-4 w-4" />
                  <span className="hidden sm:inline">Video</span>
                </Button>
                <Button variant="ghost" size="sm" className="gap-2">
                  <FileText className="h-4 w-4" />
                  <span className="hidden sm:inline">Article</span>
                </Button>
                <Button variant="ghost" size="sm" className="gap-2">
                  <Smile className="h-4 w-4" />
                  <span className="hidden sm:inline">Feeling</span>
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
                >
                  Cancel
                </Button>
                <Button size="sm" onClick={handleSubmit} disabled={!content.trim()}>
                  Post
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}
