"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { X, Plus, Loader2, ArrowRight, ArrowLeft } from "lucide-react";
import { saveUserPreferences, type UserPreferences, getUserPreferences } from "@/app/actions/preferences";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

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

export default function OnboardingPage() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Form state
    const [industries, setIndustries] = useState<string[]>([]);
    const [customIndustry, setCustomIndustry] = useState("");
    const [skills, setSkills] = useState<string[]>([]);
    const [customSkill, setCustomSkill] = useState("");

    const totalSteps = 2;

    // Check if user already completed onboarding
    useEffect(() => {
        const checkOnboarding = async () => {
            try {
                const result = await getUserPreferences();

                if (!result.success) {
                    // Not authenticated - redirect to login
                    router.push("/login");
                    return;
                }

                if (result.preferences?.onboardingCompleted) {
                    // Already completed - redirect to home
                    router.push("/");
                    return;
                }
            } catch (error) {
                console.error("Error checking onboarding status:", error);
            } finally {
                setIsLoading(false);
            }
        };

        checkOnboarding();
    }, [router]);

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

    const handleSkip = async () => {
        setIsSubmitting(true);
        setError(null);

        try {
            const preferences: UserPreferences = {
                industries: [],
                skills: [],
                companies: [],
            };

            const result = await saveUserPreferences(preferences);

            if (result.success) {
                router.push("/");
            } else {
                setError(result.error || "Failed to save preferences");
            }
        } catch (err) {
            console.error("Error skipping onboarding:", err);
            setError("An unexpected error occurred");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        setError(null);

        try {
            const preferences: UserPreferences = {
                industries,
                skills,
                companies: [],
            };

            const result = await saveUserPreferences(preferences);

            if (result.success) {
                router.push("/");
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

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background py-12 px-4">
            <div className="container max-w-2xl mx-auto">
                <Card>
                    <CardHeader className="text-center">
                        <CardTitle className="text-3xl">Welcome to RateIT! 👋</CardTitle>
                        <CardDescription className="text-base mt-2">
                            Let's personalize your experience by learning about your interests
                        </CardDescription>
                        <div className="flex justify-center gap-2 mt-6">
                            {[1, 2].map((s) => (
                                <div
                                    key={s}
                                    className={`h-2 w-16 rounded-full transition-colors ${
                                        s <= step ? "bg-primary" : "bg-muted"
                                    }`}
                                />
                            ))}
                        </div>
                    </CardHeader>

                    <CardContent className="pt-6">
                        {error && (
                            <div className="mb-6 p-4 bg-destructive/10 border border-destructive rounded-lg">
                                <p className="text-sm text-destructive">{error}</p>
                            </div>
                        )}

                        {/* Step 1: Industries */}
                        {step === 1 && (
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-xl font-semibold mb-2">
                                        What industries interest you?
                                    </h3>
                                    <p className="text-sm text-muted-foreground mb-4">
                                        Select all that apply. We'll show you relevant content and connections.
                                    </p>
                                </div>

                                <div>
                                    <Label className="text-base font-medium mb-3 block">
                                        Choose from popular industries
                                    </Label>
                                    <div className="flex flex-wrap gap-2 mb-4">
                                        {SUGGESTED_INDUSTRIES.map(industry => (
                                            <Badge
                                                key={industry}
                                                variant={industries.includes(industry) ? "default" : "outline"}
                                                className="cursor-pointer hover:opacity-80 transition-opacity text-sm py-2 px-3"
                                                onClick={() => toggleIndustry(industry)}
                                            >
                                                {industry}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <Label htmlFor="custom-industry" className="text-sm font-medium mb-2 block">
                                        Or add your own
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
                                        <Label className="text-sm font-medium mb-2 block">
                                            Your selected industries ({industries.length})
                                        </Label>
                                        <div className="flex flex-wrap gap-2">
                                            {industries.map(industry => (
                                                <Badge key={industry} variant="secondary" className="gap-1 py-2 px-3">
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
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-xl font-semibold mb-2">
                                        What are your key skills?
                                    </h3>
                                    <p className="text-sm text-muted-foreground mb-4">
                                        Help us match you with relevant opportunities and content.
                                    </p>
                                </div>

                                <div>
                                    <Label className="text-base font-medium mb-3 block">
                                        Choose from popular skills
                                    </Label>
                                    <div className="flex flex-wrap gap-2 mb-4">
                                        {SUGGESTED_SKILLS.map(skill => (
                                            <Badge
                                                key={skill}
                                                variant={skills.includes(skill) ? "default" : "outline"}
                                                className="cursor-pointer hover:opacity-80 transition-opacity text-sm py-2 px-3"
                                                onClick={() => toggleSkill(skill)}
                                            >
                                                {skill}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <Label htmlFor="custom-skill" className="text-sm font-medium mb-2 block">
                                        Or add your own
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
                                        <Label className="text-sm font-medium mb-2 block">
                                            Your selected skills ({skills.length})
                                        </Label>
                                        <div className="flex flex-wrap gap-2">
                                            {skills.map(skill => (
                                                <Badge key={skill} variant="secondary" className="gap-1 py-2 px-3">
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

                        {/* Navigation */}
                        <div className="flex justify-between items-center mt-8 pt-6 border-t">
                            <div className="flex gap-2">
                                {step > 1 && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={handleBack}
                                        disabled={isSubmitting}
                                    >
                                        <ArrowLeft className="h-4 w-4 mr-2" />
                                        Back
                                    </Button>
                                )}
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={handleSkip}
                                    disabled={isSubmitting}
                                >
                                    Skip for now
                                </Button>
                            </div>

                            {step < totalSteps ? (
                                <Button
                                    type="button"
                                    onClick={handleNext}
                                    disabled={industries.length === 0}
                                >
                                    Next
                                    <ArrowRight className="h-4 w-4 ml-2" />
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
                                        <>
                                            Complete Setup
                                            <ArrowRight className="h-4 w-4 ml-2" />
                                        </>
                                    )}
                                </Button>
                            )}
                        </div>

                        <p className="text-xs text-center text-muted-foreground mt-6">
                            Step {step} of {totalSteps} • You can always change these later in your settings
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

