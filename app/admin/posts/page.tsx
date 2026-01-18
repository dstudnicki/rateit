"use client";

import { useState, useEffect } from "react";
import { checkMyRole } from "@/app/actions/admin";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Trash2, AlertTriangle, Eye, CheckCircle } from "lucide-react";

interface Post {
    _id: string;
    content: string;
    user: {
        _id: string;
        name: string;
        email: string;
    };
    likes: string[];
    comments: any[];
    createdAt: string;
}

export default function AdminPostsPage() {
    const [role, setRole] = useState<"user" | "moderator" | "admin" | null>(null);
    const [loading, setLoading] = useState(true);
    const [posts, setPosts] = useState<Post[]>([]);
    const [filter, setFilter] = useState<"all" | "flagged">("all");
    const router = useRouter();

    useEffect(() => {
        const checkRole = async () => {
            const result = await checkMyRole();
            if (!result.isAdmin) {
                router.push("/");
                return;
            }
            setRole(result.role);
            setLoading(false);
        };

        checkRole();
    }, [router]);

    useEffect(() => {
        if (role) {
            fetchPosts();
        }
    }, [role, filter]);

    const fetchPosts = async () => {
        try {
            const response = await fetch("/api/admin/posts");
            if (response.ok) {
                const data = await response.json();
                setPosts(data.posts);
            }
        } catch (error) {
            console.error("Failed to fetch posts:", error);
        }
    };

    const handleDeletePost = async (postId: string) => {
        if (!confirm("Czy na pewno chcesz usunąć ten post?")) return;

        try {
            const response = await fetch(`/api/admin/posts/${postId}`, {
                method: "DELETE",
            });

            if (response.ok) {
                setPosts(posts.filter((p) => p._id !== postId));
                alert("Post usunięty pomyślnie");
            } else {
                alert("Nie udało się usunąć posta");
            }
        } catch (error) {
            console.error("Failed to delete post:", error);
            alert("Nie udało się usunąć posta");
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-6xl">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold">Moderacja Postów</h1>
                    <p className="text-gray-600 mt-1">Zarządzaj i moderuj wszystkie posty</p>
                </div>
                <Button variant="outline" onClick={() => router.push("/admin")}>
                    Powrót do Panelu
                </Button>
            </div>

            <div className="flex gap-4 mb-6">
                <Button variant={filter === "all" ? "default" : "outline"} onClick={() => setFilter("all")}>
                    Wszystkie posty ({posts.length})
                </Button>
            </div>

            <div className="space-y-4">
                {posts.length === 0 ? (
                    <Card className="p-12 text-center">
                        <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No posts to moderate</h3>
                        <p className="text-gray-600">All posts are looking good!</p>
                    </Card>
                ) : (
                    posts.map((post) => (
                        <Card key={post._id} className="p-6">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded">
                                            Post
                                        </div>
                                        <span className="text-sm text-gray-600">
                                            by {post.user.name} ({post.user.email})
                                        </span>
                                    </div>

                                    <p className="text-gray-900 mb-4 whitespace-pre-wrap">{post.content}</p>

                                    <div className="flex items-center gap-4 text-sm text-gray-600">
                                        <span>{post.likes?.length || 0} likes</span>
                                        <span>{post.comments?.length || 0} comments</span>
                                        <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                                    </div>
                                </div>

                                <div className="flex gap-2 ml-4">
                                    <Button variant="outline" size="sm" onClick={() => window.open(`/`, "_blank")}>
                                        <Eye className="h-4 w-4" />
                                    </Button>
                                    <Button variant="destructive" size="sm" onClick={() => handleDeletePost(post._id)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
