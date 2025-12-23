"use client"

import { useState, useTransition } from "react"
import { Camera, MapPin, Pencil } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { updateProfile } from "@/app/actions/profile"
import { useRouter } from "next/navigation"

interface ProfileHeaderProps {
  user: {
    id: string
    name: string
    email: string
  }
  profile: {
    fullName?: string
    headline?: string
    location?: string
    connections: number
  }
  isOwnProfile?: boolean
}

export function ProfileHeader({ user, profile, isOwnProfile = true }: ProfileHeaderProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    fullName: profile.fullName || user.name || "",
    headline: profile.headline || "",
    location: profile.location || "",
  })

  const handleSave = async () => {
    startTransition(async () => {
      const result = await updateProfile(formData)
      if (result.success) {
        setIsEditing(false)

        // If fullName was updated, redirect to new slug URL
        if (formData.fullName !== (profile.fullName || user.name) && result.profile?.slug) {
          router.push(`/${result.profile.slug}`)
        } else {
          router.refresh()
        }
      } else {
        console.error("Failed to update profile:", result.error)
      }
    })
  }

  const displayName = profile.fullName || user.name || "User"
  const connections = profile.connections > 500 ? "500+" : profile.connections.toString()

  return (
    <>
      <Card className="overflow-hidden">
        {/* Cover Photo */}
        <div className="relative h-48 bg-gradient-to-r from-primary/20 via-primary/10 to-accent/20">
          <Button variant="secondary" size="icon" className="absolute top-4 right-4 bg-card/80 hover:bg-card">
            <Camera className="h-4 w-4" />
          </Button>
        </div>

        {/* Profile Content */}
        <div className="relative px-6 pb-6">
          {/* Profile Picture */}
          <div className="relative -mt-16 mb-4">
            <Avatar className="h-32 w-32 border-4 border-card">
              <AvatarImage src={user.email ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}` : undefined} />
              <AvatarFallback className="text-2xl">
                {displayName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <Button variant="secondary" size="icon" className="absolute bottom-0 right-0 rounded-full h-10 w-10">
              <Camera className="h-4 w-4" />
            </Button>
          </div>

          {/* Profile Info */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h1 className="text-2xl font-bold mb-1">{displayName}</h1>
              {profile.headline && <p className="text-base text-foreground mb-2">{profile.headline}</p>}
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                {profile.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {profile.location}
                  </span>
                )}
                <span className="text-primary font-medium">{connections} connections</span>
              </div>
            </div>
            {isOwnProfile && (
              <Button onClick={() => setIsEditing(true)} variant="outline" size="sm">
                <Pencil className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            )}
          </div>

          {/* Action Buttons */}
          {isOwnProfile && (
            <div className="flex gap-2">
              <Button className="flex-1">Open to work</Button>
              <Button variant="outline" className="flex-1 bg-transparent">
                Add profile section
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>Make changes to your profile information here</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="fullName">Full Name *</Label>
              <Input
                id="fullName"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="Your full name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="headline">Headline</Label>
              <Input
                id="headline"
                value={formData.headline}
                onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
                placeholder="Software Engineer | React Enthusiast"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="San Francisco, CA"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditing(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isPending}>
              {isPending ? "Saving..." : "Save changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
