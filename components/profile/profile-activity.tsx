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

        if (diffInSeconds < 60) return "Just now";
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
        if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
        return postDate.toLocaleDateString();
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Activity</CardTitle>
                <p className="text-sm text-muted-foreground">{posts.length} posts</p>
            </CardHeader>
            <CardContent className="space-y-6">
                {posts.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic">No posts yet</p>
                ) : (
                    <>
                        {posts.slice(0, 3).map((post: any, index: number) => {
                            const displayName = post.user?.fullName || post.user?.name || "User";
                            return (
                                <div key={post._id}>
                                    <div className="flex gap-3 mb-3">
                                        <Avatar className="h-10 w-10">
                                            <AvatarImage
                                                src={
                                                    post.user?.image ||
                                                    `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.user?.email || post.user?.name}`
                                                }
                                            />
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
                                Show all {posts.length} posts →
                            </button>
                        )}
                    </>
                )}
            </CardContent>
        </Card>
    );
}
