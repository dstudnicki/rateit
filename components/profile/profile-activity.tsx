import { Heart, MessageSquare } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ProfileActivityProps {
    userId: string;
}

export async function ProfileActivity({ userId }: ProfileActivityProps) {
    let posts = [];

    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/posts/user/${userId}`, {
            next: { tags: [`user-posts-${userId}`] },
        });

        if (response.ok) {
            posts = await response.json();
        }
    } catch (error) {
        console.error("Failed to fetch user posts:", error);
    }

    const formatTimeAgo = (date: string | Date) => {
        const now = new Date();
        const postDate = new Date(date);
        const diffInSeconds = Math.floor((now.getTime() - postDate.getTime()) / 1000);

        if (diffInSeconds < 60) return "Przed chwilą";

        const minutes = Math.floor(diffInSeconds / 60);
        if (diffInSeconds < 3600) {
            const minuteText = minutes === 1 ? "minutę" : minutes >= 2 && minutes <= 4 ? "minuty" : "minut";
            return `${minutes} ${minuteText} temu`;
        }

        const hours = Math.floor(diffInSeconds / 3600);
        if (diffInSeconds < 86400) {
            const hourText = hours === 1 ? "godzinę" : hours >= 2 && hours <= 4 ? "godziny" : "godzin";
            return `${hours} ${hourText} temu`;
        }

        const days = Math.floor(diffInSeconds / 86400);
        if (diffInSeconds < 604800) {
            const dayText = days === 1 ? "dzień" : "dni";
            return `${days} ${dayText} temu`;
        }

        return postDate.toLocaleDateString("pl-PL");
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Aktywność</CardTitle>
                <p className="text-sm text-muted-foreground">
                    {posts.length} {posts.length === 1 ? "post" : posts.length >= 2 && posts.length <= 4 ? "posty" : "postów"}
                </p>
            </CardHeader>
            <CardContent className="space-y-6">
                {posts.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic">Brak postów</p>
                ) : (
                    <>
                        {posts.slice(0, 3).map((post: any, index: number) => {
                            const displayName = post.user?.fullName || post.user?.name || "Użytkownik";
                            return (
                                <div key={post._id}>
                                    <div className="flex gap-3 mb-3">
                                        <Avatar className="h-10 w-10">
                                            <AvatarImage src={post.user?.image || undefined} />
                                            <AvatarFallback>{displayName.substring(0, 2).toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium">{displayName}</p>
                                            <p className="text-xs text-muted-foreground">{formatTimeAgo(post.createdAt)}</p>
                                        </div>
                                    </div>
                                    <p className="text-sm mb-3">{post.content}</p>
                                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                        <span className="flex items-center gap-1">
                                            <Heart className="h-4 w-4" />
                                            {post.likes?.length || 0}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <MessageSquare className="h-4 w-4" />
                                            {post.comments?.length || 0}
                                        </span>
                                    </div>
                                    {index < Math.min(posts.length, 3) - 1 && <div className="h-px bg-border mt-6" />}
                                </div>
                            );
                        })}

                        {posts.length > 3 && (
                            <button className="text-sm text-primary font-medium hover:underline">
                                Pokaż wszystkie {posts.length} postów →
                            </button>
                        )}
                    </>
                )}
            </CardContent>
        </Card>
    );
}
