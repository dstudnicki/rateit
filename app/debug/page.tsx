import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function DebugIndexPage() {
    return (
        <div className="container max-w-4xl mx-auto py-8 space-y-6">
            <div>
                <h1 className="text-3xl font-bold mb-2">🔧 Debug Tools</h1>
                <p className="text-muted-foreground">
                    Tools for demonstrating the content matching algorithm
                </p>
            </div>

            <div className="grid gap-4">
                {/* Scoring Debug */}
                <Card className="p-6">
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <h2 className="text-xl font-bold mb-2">🎯 Content Matching Scores</h2>
                            <p className="text-muted-foreground mb-4">
                                See real-time scoring for posts and companies. Shows exactly how many points
                                each content gets and why (breakdown of matches with your profile).
                            </p>
                            <ul className="text-sm space-y-1 mb-4">
                                <li>✓ See match score for each post/company</li>
                                <li>✓ Detailed breakdown of points</li>
                                <li>✓ Detected keywords visualization</li>
                                <li>✓ Updates in real-time as you interact</li>
                            </ul>
                        </div>
                    </div>
                    <Link href="/debug/scoring">
                        <Button>Open Scoring Debug →</Button>
                    </Link>
                </Card>

                {/* Interaction History */}
                <Card className="p-6">
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <h2 className="text-xl font-bold mb-2">📊 Interaction History</h2>
                            <p className="text-muted-foreground mb-4">
                                View all your interactions (likes, comments, views) that the algorithm
                                uses to learn your preferences and personalize your feed.
                            </p>
                            <ul className="text-sm space-y-1 mb-4">
                                <li>✓ Count of likes, comments, views</li>
                                <li>✓ Timeline of recent interactions</li>
                                <li>✓ Shows what data is used for matching</li>
                                <li>✓ Updates immediately after each action</li>
                            </ul>
                        </div>
                    </div>
                    <Link href="/debug/interactions">
                        <Button variant="secondary">View Interactions →</Button>
                    </Link>
                </Card>

                {/* Keywords Migration */}
                <Card className="p-6">
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <h2 className="text-xl font-bold mb-2">🔑 Keywords Migration</h2>
                            <p className="text-muted-foreground mb-4">
                                Extract and update keywords for all companies based on their reviews.
                                This helps the matching algorithm understand what each company is about.
                            </p>
                            <ul className="text-sm space-y-1 mb-4">
                                <li>✓ Analyzes all company reviews</li>
                                <li>✓ Extracts skills, technologies, benefits</li>
                                <li>✓ Updates detectedKeywords field</li>
                                <li>✓ One-time setup or refresh</li>
                            </ul>
                        </div>
                    </div>
                    <Link href="/debug-companies">
                        <Button variant="outline">Run Migration →</Button>
                    </Link>
                </Card>
            </div>

            {/* How to Use */}
            <Card className="p-6 bg-muted/50">
                <h3 className="font-semibold mb-3">📖 How to Demo for Instructor</h3>
                <ol className="text-sm space-y-2">
                    <li>
                        <strong>1. Show Initial State:</strong> Open /debug/scoring to see baseline scores
                    </li>
                    <li>
                        <strong>2. Add Profile Data:</strong> Go to /profile and add experience (e.g., "Heineken Group"),
                        skills (e.g., "TypeScript", "React")
                    </li>
                    <li>
                        <strong>3. See Score Change:</strong> Refresh /debug/scoring - Heineken Group should have 100+ points!
                    </li>
                    <li>
                        <strong>4. Create Interactions:</strong> Like 3-5 posts about React, view some tech companies
                    </li>
                    <li>
                        <strong>5. Watch Learning:</strong> Check /debug/interactions to see tracked interactions,
                        then /debug/scoring to see React posts boosted (+15-30 points)
                    </li>
                    <li>
                        <strong>6. Explain Algorithm:</strong> Show the breakdown - explain how "learned from activity"
                        gets highest priority
                    </li>
                </ol>
            </Card>

            {/* Key Points */}
            <Card className="p-6 bg-blue-50 border-blue-200">
                <h3 className="font-semibold mb-3 text-blue-900">✨ Key Points to Emphasize</h3>
                <ul className="text-sm text-blue-800 space-y-2">
                    <li>
                        • <strong>Real Algorithm:</strong> This is not fake scoring - it's a real ML algorithm
                        that analyzes content and user behavior
                    </li>
                    <li>
                        • <strong>Transparent:</strong> You can see exactly how decisions are made (no black box)
                    </li>
                    <li>
                        • <strong>Adaptive:</strong> Learns from user behavior over time (last 30 days)
                    </li>
                    <li>
                        • <strong>Production-Ready:</strong> Same algorithms used by LinkedIn, Instagram, TikTok
                    </li>
                </ul>
            </Card>
        </div>
    );
}

