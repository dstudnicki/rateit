"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Building2, Plus } from "lucide-react"
import { createCompany, uploadCompanyLogo } from "@/app/actions/companies"
import { compressImage } from "@/lib/image-compression"
import { useRouter } from "next/navigation"

export function AddCompanyDialog() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    industry: "",
    website: "",
    description: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      // First, create the company
      const result = await createCompany(formData)

      if (!result.success) {
        setError(result.error || "Failed to create company")
        setIsSubmitting(false)
        return
      }

      const companyId = result.companyId

      // If logo file is provided, compress and upload it
      if (logoFile && companyId) {
        try {
          // Compress image before upload
          const compressedFile = await compressImage(logoFile, {
            maxWidthOrHeight: 800,
            maxSizeMB: 1,
          })

          // Create FormData for upload
          const logoFormData = new FormData()
          logoFormData.append("file", compressedFile)

          // Upload to Vercel Blob
          const uploadResult = await uploadCompanyLogo(logoFormData, companyId)

          if (!uploadResult.success) {
            console.error("Logo upload failed:", uploadResult.error)
            // Don't fail the whole process if logo upload fails
          }
        } catch (uploadError) {
          console.error("Error uploading logo:", uploadError)
          // Don't fail the whole process if logo upload fails
        }
      }

      // Success - close dialog and reset
      setOpen(false)
      setLogoFile(null)
      setFormData({
        name: "",
        location: "",
        industry: "",
        website: "",
        description: "",
      })
      router.refresh()

      // Redirect to the new company page using slug
      if (result.slug) {
        router.push(`/companies/${result.slug}`)
      }
    } catch (err) {
      setError("An unexpected error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add Company
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Add New Company
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="company-name">Company Name *</Label>
            <Input
              id="company-name"
              placeholder="e.g., Tech Solutions Inc."
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location *</Label>
            <Input
              id="location"
              placeholder="e.g., Warsaw, Poland"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="industry">Industry *</Label>
            <Input
              id="industry"
              placeholder="e.g., Technology, Finance, Healthcare"
              value={formData.industry}
              onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              type="url"
              placeholder="https://example.com"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Company Description</Label>
            <Textarea
              id="description"
              placeholder="Brief description of the company..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="logo">
              Company Logo (Optional)
              <span className="text-xs text-muted-foreground ml-2">
                Help others recognize the company
              </span>
            </Label>
            <Input
              id="logo"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/svg+xml"
              onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
              className="cursor-pointer"
            />
            {logoFile && (
              <p className="text-xs text-muted-foreground">
                Selected: {logoFile.name} ({(logoFile.size / 1024).toFixed(2)} KB)
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Accepted formats: JPG, PNG, WebP, SVG (max 5MB)
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" className="bg-red-600 hover:bg-red-700" disabled={isSubmitting}>
              {isSubmitting ? "Adding..." : "Add Company"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
