"use client";

import type React from "react";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Building2, Plus, X, Upload } from "lucide-react";
import { createCompany, uploadCompanyLogo } from "@/app/actions/companies";
import { compressImage } from "@/lib/image-compression";
import { useRouter } from "next/navigation";
import { Image } from "next/dist/client/image-component";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

const INDUSTRIES = [
    "Technology",
    "Finance",
    "Healthcare",
    "Education",
    "Marketing",
    "Design",
    "Engineering",
    "Sales",
    "Human Resources",
    "Consulting",
    "Manufacturing",
    "Retail",
    "Real Estate",
    "Legal",
    "Media & Entertainment",
    "Transportation",
    "Energy",
    "Agriculture",
    "Hospitality",
    "Other",
];

export function AddCompanyDialog() {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [formData, setFormData] = useState({
        name: "",
        location: "",
        industry: "",
        website: "",
        description: "",
    });
    const [customIndustries, setCustomIndustries] = useState<string[]>([]);
    const [customIndustryInput, setCustomIndustryInput] = useState("");

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setLogoFile(file);
            };
            reader.readAsDataURL(file);
        }
    };

    const removeImage = () => {
        setLogoFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const removeIndustry = (industryToRemove: string) => {
        setCustomIndustries(customIndustries.filter((ind) => ind !== industryToRemove));
    };

    const addCustomIndustry = () => {
        const trimmed = customIndustryInput.trim();
        if (trimmed && !customIndustries.includes(trimmed)) {
            setCustomIndustries([...customIndustries, trimmed]);
            setCustomIndustryInput("");
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        try {
            // Create the company with main industry + custom industries as keywords
            const result = await createCompany({
                ...formData,
                customIndustries: customIndustries.length > 0 ? customIndustries : undefined,
            });

            if (!result.success) {
                setError(result.error || "Failed to create company");
                setIsSubmitting(false);
                return;
            }

            const companyId = result.companyId;

            // If logo file is provided, compress and upload it
            if (logoFile && companyId) {
                try {
                    // Compress image before upload
                    const compressedFile = await compressImage(logoFile, {
                        maxWidthOrHeight: 800,
                        maxSizeMB: 1,
                    });

                    // Create FormData for upload
                    const logoFormData = new FormData();
                    logoFormData.append("file", compressedFile);

                    // Upload to Vercel Blob
                    const uploadResult = await uploadCompanyLogo(logoFormData, companyId);

                    if (!uploadResult.success) {
                        console.error("Logo upload failed:", uploadResult.error);
                        // Don't fail the whole process if logo upload fails
                    }
                } catch (uploadError) {
                    console.error("Error uploading logo:", uploadError);
                    // Don't fail the whole process if logo upload fails
                }
            }

            // Success - close dialog and reset
            setOpen(false);
            setLogoFile(null);
            setCustomIndustries([]);
            setCustomIndustryInput("");
            setFormData({
                name: "",
                location: "",
                industry: "",
                website: "",
                description: "",
            });
            router.refresh();

            // Redirect to the new company page using slug
            if (result.slug) {
                router.push(`/companies/${result.slug}`);
            }
        } catch (err) {
            setError("An unexpected error occurred");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Dodaj opinię o firmie
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Building2 className="w-5 h-5" />
                        Dodaj nową firmę
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">{error}</div>}
                    <div className="space-y-2">
                        <Label>Logo Firmy</Label>
                        <div className="flex items-center gap-4">
                            {logoFile ? (
                                <div className="relative">
                                    <Image
                                        src={URL.createObjectURL(logoFile)}
                                        alt="Podgląd logo firmy"
                                        width={80}
                                        height={80}
                                        className="w-20 h-20 rounded-lg object-cover border border-border"
                                    />
                                    <button
                                        type="button"
                                        onClick={removeImage}
                                        className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/90"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-20 h-20 rounded-lg border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center gap-1 hover:border-primary hover:bg-muted/50 transition-colors"
                                >
                                    <Upload className="w-5 h-5 text-muted-foreground" />
                                    <span className="text-xs text-muted-foreground">Prześlij</span>
                                </button>
                            )}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                className="hidden"
                            />
                            <div className="text-sm text-muted-foreground">
                                <p>Prześlij logo firmy</p>
                                <p className="text-xs">PNG, JPG do 2MB</p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="company-name">Nazwa Firmy *</Label>
                        <Input
                            id="company-name"
                            placeholder="np. Tech Solutions Sp. z o.o."
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="location">Lokalizacja *</Label>
                        <Input
                            id="location"
                            placeholder="np. Warszawa, Polska"
                            value={formData.location}
                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="industry">
                            Główna branża/kategoria *
                            <span className="text-xs text-muted-foreground ml-2">(Główny sektor działalności)</span>
                        </Label>
                        <Select
                            value={formData.industry}
                            onValueChange={(value) => setFormData({ ...formData, industry: value })}
                            required
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Wybierz główną branżę" />
                            </SelectTrigger>
                            <SelectContent>
                                {INDUSTRIES.map((industry) => (
                                    <SelectItem key={industry} value={industry}>
                                        {industry}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                            Wybierz główną kategorię, która najlepiej opisuje tę firmę
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="custom-industry">Dodatkowe specjalizacje/Tagi (Opcjonalne)</Label>
                        <p className="text-xs text-muted-foreground mb-2">
                            Dodaj konkretne obszary lub technologie, z którymi pracuje firma
                            <br />
                            <span className="italic">
                                Przykład: Firma logistyczna zatrudniająca programistów może dodać: &quot;Rozwój
                                oprogramowania&quot;, &quot;SI&quot;, &quot;Chmura&quot;
                            </span>
                        </p>
                        <div className="flex gap-2">
                            <Input
                                id="custom-industry"
                                placeholder="np. Sztuczna inteligencja, Chmura obliczeniowa, FinTech"
                                value={customIndustryInput}
                                onChange={(e) => setCustomIndustryInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        e.preventDefault();
                                        addCustomIndustry();
                                    }
                                }}
                            />
                            <Button
                                type="button"
                                size="icon"
                                variant="outline"
                                onClick={addCustomIndustry}
                                disabled={!customIndustryInput.trim()}
                                title="Dodaj tag"
                            >
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>
                        {customIndustries.length > 0 && (
                            <div className="mt-2">
                                <Label className="text-sm font-medium mb-2 block">
                                    Dodane tagi ({customIndustries.length})
                                </Label>
                                <div className="flex flex-wrap gap-2">
                                    {customIndustries.map((industry) => (
                                        <Badge key={industry} variant="secondary" className="gap-1 py-2 px-3">
                                            {industry}
                                            <X className="h-3 w-3 cursor-pointer" onClick={() => removeIndustry(industry)} />
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="website">Strona internetowa</Label>
                        <Input
                            id="website"
                            type="url"
                            placeholder="https://przyklad.pl"
                            value={formData.website}
                            onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Opis firmy</Label>
                        <Textarea
                            id="description"
                            placeholder="Krótki opis firmy..."
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            rows={4}
                        />
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
                            Anuluj
                        </Button>
                        <Button type="submit" className="bg-red-600 hover:bg-red-700" disabled={isSubmitting}>
                            {isSubmitting ? "Dodawanie..." : "Dodaj firmę"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
