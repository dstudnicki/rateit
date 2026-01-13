"use client";

import { useState, useEffect } from "react";
import { checkMyRole } from "@/app/actions/admin";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Trash2, MessageSquare, Eye, CheckCircle } from "lucide-react";

interface Comment {
    _id: string;
    content: string;
    user: {
        _id: string;
        name: string;
        email: string;
    };
    postId?: string;
    companyId?: string;
    type: "post" | "company";
    createdAt: string;
}

export default function AdminCommentsPage() {
    const [role, setRole] = useState<"user" | "moderator" | "admin" | null>(null);
    const [loading, setLoading] = useState(true);
    const [comments, setComments] = useState<Comment[]>([]);
    const [filter, setFilter] = useState<"all" | "posts" | "companies">("all");
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
            fetchComments();
        }
    }, [role]);

    const fetchComments = async () => {
        try {
            const response = await fetch("/api/admin/comments");
            if (response.ok) {
                const data = await response.json();
                setComments(data.comments);
            }
        } catch (error) {
            console.error("Failed to fetch comments:", error);
        }
    };

    const handleDeleteComment = async (commentId: string, type: "post" | "company") => {
        if (!confirm("Are you sure you want to delete this comment?")) return;

        try {
            const response = await fetch(`/api/admin/comments/${commentId}?type=${type}`, {
                method: "DELETE",
            });

            if (response.ok) {
                setComments(comments.filter(c => c._id !== commentId));
                alert("Comment deleted successfully");
            } else {
                alert("Failed to delete comment");
            }
        } catch (error) {
            console.error("Failed to delete comment:", error);
            alert("Failed to delete comment");
        }
    };

    const filteredComments = comments.filter(comment => {
        if (filter === "all") return true;
        return comment.type === filter.slice(0, -1); // "posts" -> "post"
    });

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
                    <h1 className="text-3xl font-bold">Comment Moderation</h1>
                    <p className="text-gray-600 mt-1">Manage and moderate all comments</p>
                </div>
                <Button variant="outline" onClick={() => router.push("/admin")}>
                    Back to Admin
                </Button>
            </div>

            <div className="flex gap-4 mb-6">
                <Button
                    variant={filter === "all" ? "default" : "outline"}
                    onClick={() => setFilter("all")}
                >
                    All Comments ({comments.length})
                </Button>
                <Button
                    variant={filter === "posts" ? "default" : "outline"}
                    onClick={() => setFilter("posts")}
                >
                    Post Comments ({comments.filter(c => c.type === "post").length})
                </Button>
                <Button
                    variant={filter === "companies" ? "default" : "outline"}
                    onClick={() => setFilter("companies")}
                >
                    Company Reviews ({comments.filter(c => c.type === "company").length})
                </Button>
            </div>

            <div className="space-y-4">
                {filteredComments.length === 0 ? (
                    <Card className="p-12 text-center">
                        <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No comments to moderate</h3>
                        <p className="text-gray-600">All comments are looking good!</p>
                    </Card>
                ) : (
                    filteredComments.map((comment) => (
                        <Card key={comment._id} className="p-6">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-3">
                                        <MessageSquare className="h-4 w-4 text-gray-600" />
                                        <div className={`text-xs font-semibold px-2.5 py-0.5 rounded ${
                                            comment.type === "post" 
                                                ? "bg-blue-100 text-blue-800"
                                                : "bg-purple-100 text-purple-800"
                                        }`}>
                                            {comment.type === "post" ? "Post Comment" : "Company Review"}
                                        </div>
                                        <span className="text-sm text-gray-600">
                                            by {comment.user.name} ({comment.user.email})
                                        </span>
                                    </div>

                                    <p className="text-gray-900 mb-4 whitespace-pre-wrap">
                                        {comment.content}
                                    </p>

                                    <div className="flex items-center gap-4 text-sm text-gray-600">
                                        <span>
                                            {new Date(comment.createdAt).toLocaleDateString()} at{" "}
                                            {new Date(comment.createdAt).toLocaleTimeString()}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex gap-2 ml-4">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            // Navigate to source
                                            if (comment.type === "post") {
                                                window.open(`/`, '_blank');
                                            } else {
                                                window.open(`/companies`, '_blank');
                                            }
                                        }}
                                    >
                                        <Eye className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => handleDeleteComment(comment._id, comment.type)}
                                    >
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

