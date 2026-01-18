import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getClient } from "@/lib/mongoose";
import Profile from "@/models/Profile";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Force dynamic rendering - NO CACHE

export default async function InteractionHistoryPage() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        return (
            <div className="container max-w-4xl mx-auto py-8">
                <h1 className="text-2xl font-bold mb-4">Zaloguj się, aby zobaczyć historię interakcji</h1>
            </div>
        );
    }

    await getClient();
    const profile = await Profile.findOne({ userId: session.user.id }).lean();

    if (!profile) {
        return (
            <div className="container max-w-4xl mx-auto py-8">
                <h1 className="text-2xl font-bold mb-4">Nie znaleziono profilu</h1>
            </div>
        );
    }

    const interactions = profile.interactionHistory || [];

    // Sort by timestamp descending
    const sortedInteractions = [...interactions].sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );

    // Group by type
    const likeCount = interactions.filter((i) => i.type === "like").length;
    const commentCount = interactions.filter((i) => i.type === "comment").length;
    const viewCount = interactions.filter((i) => i.type === "view").length;

    return (
        <div className="container max-w-4xl mx-auto py-8 space-y-6">
            <div>
                <h1 className="text-3xl font-bold mb-2">Twoja Historia Interakcji</h1>
                <p className="text-muted-foreground">Te interakcje są wykorzystywane do personalizacji Twojego kanału treści</p>
            </div>

            {/* Summary */}
            <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Podsumowanie</h2>
                <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                        <div className="text-3xl font-bold text-blue-600">{likeCount}</div>
                        <div className="text-sm text-muted-foreground">Polubień</div>
                    </div>
                    <div className="text-center">
                        <div className="text-3xl font-bold text-green-600">{commentCount}</div>
                        <div className="text-sm text-muted-foreground">Komentarzy</div>
                    </div>
                    <div className="text-center">
                        <div className="text-3xl font-bold text-gray-600">{viewCount}</div>
                        <div className="text-sm text-muted-foreground">Wyświetleń</div>
                    </div>
                </div>
            </Card>

            {/* Interaction List */}
            <div className="space-y-3">
                <h2 className="text-xl font-semibold">Ostatnie Interakcje (Ostatnie {sortedInteractions.length})</h2>
                {sortedInteractions.length === 0 ? (
                    <Card className="p-6">
                        <p className="text-muted-foreground text-center">
                            Brak interakcji. Zacznij polubić posty i przeglądać firmy!
                        </p>
                    </Card>
                ) : (
                    sortedInteractions.slice(0, 50).map((interaction, index) => {
                        const typeColor =
                            interaction.type === "like"
                                ? "bg-blue-100 text-blue-800"
                                : interaction.type === "comment"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-gray-100 text-gray-800";

                        const typeIcon = interaction.type === "like" ? "❤️" : interaction.type === "comment" ? "💬" : "👁️";

                        const targetIcon =
                            interaction.targetType === "post" ? "📝" : interaction.targetType === "company" ? "🏢" : "👤";

                        const timestamp = new Date(interaction.timestamp);
                        const timeAgo = formatTimeAgo(timestamp);

                        return (
                            <Card key={index} className="p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Badge className={typeColor}>
                                            {typeIcon} {interaction.type}
                                        </Badge>
                                        <span className="text-sm">
                                            {targetIcon} {interaction.targetType}
                                        </span>
                                        <span className="text-xs text-muted-foreground font-mono">
                                            {interaction.targetId.slice(0, 8)}...
                                        </span>
                                    </div>
                                    <span className="text-xs text-muted-foreground">{timeAgo}</span>
                                </div>
                            </Card>
                        );
                    })
                )}
            </div>

            {/* Info Box */}
            <Card className="p-6 bg-blue-50 border-blue-200">
                <h3 className="font-semibold mb-2 text-blue-900">💡 How This Affects Your Feed</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                    <li>
                        • <strong>Likes & Comments:</strong> Posts/companies with similar keywords get boosted (+15-20 points)
                    </li>
                    <li>
                        • <strong>Views:</strong> Company views help us learn your industry preferences
                    </li>
                    <li>
                        • <strong>Time Window:</strong> Only last 30 days count (keeps recommendations fresh)
                    </li>
                    <li>
                        • <strong>Max Storage:</strong> We keep your last 100 interactions
                    </li>
                </ul>
            </Card>
        </div>
    );
}

function formatTimeAgo(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 30) return `${diffDays}d ago`;

    return date.toLocaleDateString();
}
