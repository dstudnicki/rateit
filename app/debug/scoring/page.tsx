import { getPersonalizedFeed } from "@/app/actions/posts";
import { getPersonalizedCompanies } from "@/app/actions/companies";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getClient } from "@/lib/mongoose";
import Profile from "@/models/Profile";



export default async function ScoringDebugPage() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        return (
            <div className="container max-w-4xl mx-auto py-8">
                <h1 className="text-2xl font-bold mb-4">Please login to see scoring debug</h1>
            </div>
        );
    }

    // Get user profile for debugging
    await getClient();
    const profile = await Profile.findOne({ userId: session.user.id }).lean();

    const postsResult = await getPersonalizedFeed(10, 0);
    const companiesResult = await getPersonalizedCompanies(10, 0);

    const posts = postsResult.posts || [];
    const companies = companiesResult.companies || [];

    return (
        <div className="container max-w-6xl mx-auto py-8 space-y-8">
            <div>
                <h1 className="text-3xl font-bold mb-2">Content Matching Scoring Debug</h1>
                <p className="text-muted-foreground">
                    This page shows the actual scoring algorithm in action. Each post/company gets a score
                    based on how well it matches your profile, experience, skills, and interaction history.
                </p>
            </div>

            {/* Profile Debug Info */}
            <Card className="p-6 bg-blue-50 border-blue-200">
                <h3 className="font-semibold mb-3 text-blue-900">👤 Your Profile Data</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <p className="font-semibold mb-1">Skills ({profile?.skills?.length || 0})</p>
                        <p className="text-muted-foreground">
                            {profile?.skills?.length > 0
                                ? profile.skills.map((s: any) => s.name).join(", ")
                                : "None"}
                        </p>
                    </div>
                    <div>
                        <p className="font-semibold mb-1">Experience ({profile?.experience?.length || 0})</p>
                        <p className="text-muted-foreground">
                            {profile?.experience?.length > 0
                                ? profile.experience.map((e: any) => e.company).join(", ")
                                : "None"}
                        </p>
                    </div>
                    <div>
                        <p className="font-semibold mb-1">Preferences - Skills ({profile?.preferences?.skills?.length || 0})</p>
                        <p className="text-muted-foreground">
                            {profile?.preferences?.skills?.length > 0
                                ? profile.preferences.skills.join(", ")
                                : "None"}
                        </p>
                    </div>
                    <div>
                        <p className="font-semibold mb-1">Preferences - Industries ({profile?.preferences?.industries?.length || 0})</p>
                        <p className="text-muted-foreground">
                            {profile?.preferences?.industries?.length > 0
                                ? profile.preferences.industries.join(", ")
                                : "None"}
                        </p>
                    </div>
                    <div>
                        <p className="font-semibold mb-1">Interactions (Last 30 days)</p>
                        <p className="text-muted-foreground">
                            {profile?.interactionHistory?.filter((i: any) =>
                                Date.now() - new Date(i.timestamp).getTime() < 30 * 24 * 60 * 60 * 1000
                            ).length || 0} total
                        </p>
                    </div>
                    <div>
                        <p className="font-semibold mb-1">Onboarding</p>
                        <Badge variant={profile?.preferences?.onboardingCompleted ? "default" : "destructive"}>
                            {profile?.preferences?.onboardingCompleted ? "✓ Completed" : "✗ Not completed"}
                        </Badge>
                    </div>
                </div>
                {(!profile?.skills?.length && !profile?.experience?.length && !profile?.preferences?.skills?.length) && (
                    <div className="mt-4 p-3 bg-yellow-100 border border-yellow-300 rounded text-sm text-yellow-900">
                        ⚠️ <strong>Low scores expected!</strong> Your profile is empty. Add skills, experience, and complete onboarding to see better matches.
                    </div>
                )}
            </Card>

            {/* Posts Section */}
            <section>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold">📝 Personalized Posts Feed</h2>
                    {(!profile?.preferences?.onboardingCompleted || posts.some((p: any) => p.matchReasons?.[0]?.reason?.includes('Generic'))) && (
                        <Badge variant="outline" className="text-yellow-700 border-yellow-400">
                            ⚠️ Generic Feed (not personalized)
                        </Badge>
                    )}
                </div>
                <div className="space-y-4">
                    {posts.length === 0 ? (
                        <p className="text-muted-foreground">No posts available</p>
                    ) : (
                        posts.map((post: any, index: number) => (
                            <Card key={post._id} className="p-4">
                                <div className="flex items-start justify-between gap-4 mb-3">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Badge variant="default" className="font-mono">
                                                #{index + 1}
                                            </Badge>
                                            <Badge
                                                variant={post.matchScore > 0 ? "secondary" : "outline"}
                                                className={`font-mono text-lg ${post.matchScore === 0 ? 'border-red-300 text-red-700' : ''}`}
                                            >
                                                Score: {post.matchScore !== undefined ? post.matchScore : 'N/A'}
                                            </Badge>
                                            {post.matchScore === 0 && (
                                                <Badge variant="destructive" className="text-xs">
                                                    No matches
                                                </Badge>
                                            )}
                                        </div>
                                        <p className="text-sm line-clamp-2">{post.content}</p>

                                        {/* Show why score is 0 */}
                                        {post.matchScore === 0 && (
                                            <p className="text-xs text-yellow-700 mt-2 bg-yellow-50 p-2 rounded">
                                                💡 This post doesn't match your profile keywords. Content contains: {post.detectedSkills?.join(", ") || post.detectedIndustries?.join(", ") || "no detected keywords"}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Match Reasons Breakdown */}
                                {post.matchReasons && post.matchReasons.length > 0 && (
                                    <div className="mt-3 pt-3 border-t">
                                        <p className="text-xs font-semibold text-muted-foreground mb-2">
                                            Scoring Breakdown:
                                        </p>
                                        <div className="space-y-1">
                                            {post.matchReasons.map((match: any, idx: number) => (
                                                <div
                                                    key={idx}
                                                    className="flex items-center justify-between text-xs"
                                                >
                                                    <span className="text-muted-foreground">{match.reason}</span>
                                                    <Badge variant="outline" className="font-mono">
                                                        +{match.points}
                                                    </Badge>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Detected Keywords */}
                                <div className="mt-3 pt-3 border-t">
                                    <div className="flex flex-wrap gap-2">
                                        {post.detectedSkills?.map((skill: string) => (
                                            <Badge key={skill} variant="outline" className="text-xs">
                                                💡 {skill}
                                            </Badge>
                                        ))}
                                        {post.detectedCompanies?.map((company: string) => (
                                            <Badge key={company} variant="outline" className="text-xs bg-blue-50">
                                                🏢 {company}
                                            </Badge>
                                        ))}
                                        {post.detectedIndustries?.map((industry: string) => (
                                            <Badge key={industry} variant="outline" className="text-xs bg-green-50">
                                                🏭 {industry}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            </Card>
                        ))
                    )}
                </div>
            </section>

            {/* Companies Section */}
            <section>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold">🏢 Personalized Companies</h2>
                    {(!profile?.preferences?.onboardingCompleted || companies.some((c: any) => c.matchReasons?.[0]?.reason?.includes('Generic'))) && (
                        <Badge variant="outline" className="text-yellow-700 border-yellow-400">
                            ⚠️ Generic Feed (not personalized)
                        </Badge>
                    )}
                </div>
                <div className="space-y-4">
                    {companies.length === 0 ? (
                        <p className="text-muted-foreground">No companies available</p>
                    ) : (
                        companies.map((company: any, index: number) => (
                            <Card key={company._id} className="p-4">
                                <div className="flex items-start justify-between gap-4 mb-3">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Badge variant="default" className="font-mono">
                                                #{index + 1}
                                            </Badge>
                                            <Badge
                                                variant={company.matchScore > 0 ? "secondary" : "outline"}
                                                className={`font-mono text-lg ${company.matchScore === 0 ? 'border-red-300 text-red-700' : ''}`}
                                            >
                                                Score: {company.matchScore !== undefined ? company.matchScore : 'N/A'}
                                            </Badge>
                                            {company.matchScore === 0 && (
                                                <Badge variant="destructive" className="text-xs">
                                                    No matches
                                                </Badge>
                                            )}
                                        </div>
                                        <h3 className="font-semibold">{company.name}</h3>
                                        <p className="text-sm text-muted-foreground">
                                            {company.industry} • {company.location}
                                        </p>

                                        {/* Show why score is 0 */}
                                        {company.matchScore === 0 && (
                                            <p className="text-xs text-yellow-700 mt-2 bg-yellow-50 p-2 rounded">
                                                💡 This company doesn't match your profile. Industry: {company.industry}, Keywords: {company.detectedKeywords?.join(", ") || "none"}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Match Reasons Breakdown */}
                                {company.matchReasons && company.matchReasons.length > 0 && (
                                    <div className="mt-3 pt-3 border-t">
                                        <p className="text-xs font-semibold text-muted-foreground mb-2">
                                            Scoring Breakdown:
                                        </p>
                                        <div className="space-y-1">
                                            {company.matchReasons.map((match: any, idx: number) => (
                                                <div
                                                    key={idx}
                                                    className="flex items-center justify-between text-xs"
                                                >
                                                    <span className="text-muted-foreground">{match.reason}</span>
                                                    <Badge variant="outline" className="font-mono">
                                                        +{match.points}
                                                    </Badge>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Detected Keywords */}
                                {company.detectedKeywords && company.detectedKeywords.length > 0 && (
                                    <div className="mt-3 pt-3 border-t">
                                        <p className="text-xs font-semibold text-muted-foreground mb-2">
                                            Company Keywords:
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {company.detectedKeywords.map((keyword: string) => (
                                                <Badge key={keyword} variant="outline" className="text-xs">
                                                    {keyword}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </Card>
                        ))
                    )}
                </div>
            </section>

            {/* Legend */}
            <Card className="p-6 bg-muted/50">
                <h3 className="font-semibold mb-3">📖 How Scoring Works</h3>
                <div className="space-y-2 text-sm text-muted-foreground">
                    <p>
                        <strong>Posts:</strong> Scored based on skills, companies, industries detected in content
                        matched against your profile, experience, and interaction history.
                    </p>
                    <p>
                        <strong>Companies:</strong> Scored based on your work experience, skills, preferred
                        industries, and companies you've viewed.
                    </p>
                    <p>
                        <strong>Higher score = Better match</strong>. The algorithm learns from your likes,
                        comments, and views over the last 30 days.
                    </p>
                </div>
            </Card>
        </div>
    );
}

