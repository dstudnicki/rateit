"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { X, Plus, Loader2 } from "lucide-react";
import { saveUserPreferences, type UserPreferences } from "@/app/actions/preferences";
import { useRouter } from "next/navigation";

interface OnboardingDialogProps {
    isOpen: boolean;
    onComplete: () => void;
}

const SUGGESTED_INDUSTRIES = [
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
];

const SUGGESTED_SKILLS = [
    "JavaScript",
    "Python",
    "React",
    "Node.js",
    "TypeScript",
    "Project Management",
    "Marketing Strategy",
    "Data Analysis",
    "UI/UX Design",
    "Leadership",
    "Communication",
    "Problem Solving",
];

export function OnboardingDialog({ isOpen, onComplete }: OnboardingDialogProps) {
    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    // Form state
    const [industries, setIndustries] = useState<string[]>([]);
    const [customIndustry, setCustomIndustry] = useState("");
    const [skills, setSkills] = useState<string[]>([]);
    const [customSkill, setCustomSkill] = useState("");

    const totalSteps = 2;

    const toggleIndustry = (industry: string) => {
        setIndustries(prev =>
            prev.includes(industry)
                ? prev.filter(i => i !== industry)
                : [...prev, industry]
        );
    };

    const addCustomIndustry = () => {
        if (customIndustry.trim() && !industries.includes(customIndustry.trim())) {
            setIndustries(prev => [...prev, customIndustry.trim()]);
            setCustomIndustry("");
        }
    };

    const removeIndustry = (industry: string) => {
        setIndustries(prev => prev.filter(i => i !== industry));
    };

    const toggleSkill = (skill: string) => {
        setSkills(prev =>
            prev.includes(skill)
                ? prev.filter(s => s !== skill)
                : [...prev, skill]
        );
    };

    const addCustomSkill = () => {
        if (customSkill.trim() && !skills.includes(customSkill.trim())) {
            setSkills(prev => [...prev, customSkill.trim()]);
            setCustomSkill("");
        }
    };

    const removeSkill = (skill: string) => {
        setSkills(prev => prev.filter(s => s !== skill));
    };

    const handleNext = () => {
        if (step < totalSteps) {
            setStep(step + 1);
        }
    };

    const handleBack = () => {
        if (step > 1) {
            setStep(step - 1);
        }
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        setError(null);

        try {
            const preferences: UserPreferences = {
                industries,
                skills,
                companies: [], // Can be populated later
            };

            const result = await saveUserPreferences(preferences);

            if (result.success) {
                onComplete();
                router.refresh();
            } else {
                setError(result.error || "Failed to save preferences");
            }
        } catch (err) {
            console.error("Error saving preferences:", err);
            setError("An unexpected error occurred");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={() => {}}>
            <DialogContent className="sm:max-w-[600px]" onInteractOutside={(e) => e.preventDefault()}>
                <DialogHeader>
                    <DialogTitle>
                        {step === 1 && "Welcome! Let's personalize your feed"}
                        {step === 2 && "What are your skills and interests?"}
                    </DialogTitle>
                    <DialogDescription>
                        {step === 1 && "Select the industries you're interested in to see relevant content"}
                        {step === 2 && "Tell us about your skills to connect with the right people"}
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    {/* Step 1: Industries */}
                    {step === 1 && (
                        <div className="space-y-4">
                            <div>
                                <Label className="text-sm font-medium mb-3 block">
                                    Select Industries ({industries.length} selected)
                                </Label>
                                <div className="flex flex-wrap gap-2 mb-4">
                                    {SUGGESTED_INDUSTRIES.map(industry => (
                                        <Badge
                                            key={industry}
                                            variant={industries.includes(industry) ? "default" : "outline"}
                                            className="cursor-pointer hover:opacity-80 transition-opacity"
                                            onClick={() => toggleIndustry(industry)}
                                        >
                                            {industry}
                                        </Badge>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="custom-industry" className="text-sm font-medium mb-2 block">
                                    Add Custom Industry
                                </Label>
                                <div className="flex gap-2">
                                    <Input
                                        id="custom-industry"
                                        placeholder="e.g., Artificial Intelligence"
                                        value={customIndustry}
                                        onChange={(e) => setCustomIndustry(e.target.value)}
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
                                        disabled={!customIndustry.trim()}
                                    >
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            {industries.length > 0 && (
                                <div>
                                    <Label className="text-sm font-medium mb-2 block">Your Industries</Label>
                                    <div className="flex flex-wrap gap-2">
                                        {industries.map(industry => (
                                            <Badge key={industry} variant="secondary" className="gap-1">
                                                {industry}
                                                <X
                                                    className="h-3 w-3 cursor-pointer"
                                                    onClick={() => removeIndustry(industry)}
                                                />
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Step 2: Skills */}
                    {step === 2 && (
                        <div className="space-y-4">
                            <div>
                                <Label className="text-sm font-medium mb-3 block">
                                    Select Skills ({skills.length} selected)
                                </Label>
                                <div className="flex flex-wrap gap-2 mb-4">
                                    {SUGGESTED_SKILLS.map(skill => (
                                        <Badge
                                            key={skill}
                                            variant={skills.includes(skill) ? "default" : "outline"}
                                            className="cursor-pointer hover:opacity-80 transition-opacity"
                                            onClick={() => toggleSkill(skill)}
                                        >
                                            {skill}
                                        </Badge>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="custom-skill" className="text-sm font-medium mb-2 block">
                                    Add Custom Skill
                                </Label>
                                <div className="flex gap-2">
                                    <Input
                                        id="custom-skill"
                                        placeholder="e.g., Machine Learning"
                                        value={customSkill}
                                        onChange={(e) => setCustomSkill(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                                e.preventDefault();
                                                addCustomSkill();
                                            }
                                        }}
                                    />
                                    <Button
                                        type="button"
                                        size="icon"
                                        variant="outline"
                                        onClick={addCustomSkill}
                                        disabled={!customSkill.trim()}
                                    >
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            {skills.length > 0 && (
                                <div>
                                    <Label className="text-sm font-medium mb-2 block">Your Skills</Label>
                                    <div className="flex flex-wrap gap-2">
                                        {skills.map(skill => (
                                            <Badge key={skill} variant="secondary" className="gap-1">
                                                {skill}
                                                <X
                                                    className="h-3 w-3 cursor-pointer"
                                                    onClick={() => removeSkill(skill)}
                                                />
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {error && (
                    <div className="text-sm text-destructive mb-2">
                        {error}
                    </div>
                )}

                <DialogFooter className="flex justify-between sm:justify-between">
                    <div className="text-sm text-muted-foreground">
                        Step {step} of {totalSteps}
                    </div>
                    <div className="flex gap-2">
                        {step > 1 && (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleBack}
                                disabled={isSubmitting}
                            >
                                Back
                            </Button>
                        )}
                        {step < totalSteps ? (
                            <Button
                                type="button"
                                onClick={handleNext}
                                disabled={step === 1 && industries.length === 0}
                            >
                                Next
                            </Button>
                        ) : (
                            <Button
                                type="button"
                                onClick={handleSubmit}
                                disabled={isSubmitting || (skills.length === 0 && industries.length === 0)}
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    "Complete"
                                )}
                            </Button>
                        )}
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

