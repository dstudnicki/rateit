"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Building2, MapPin, Star, Loader2 } from "lucide-react";
import Link from "next/link";

interface ProfileResult {
    _id: string;
    userId: string;
    slug: string;
    fullName: string;
    headline: string;
    location: string;
    user: {
        name: string;
        email: string;
        image: string | null;
    };
}

interface CompanyResult {
    _id: string;
    slug: string;
    name: string;
    industry: string;
    location: string;
    averageRating: number;
    reviewCount: number;
}

interface PostResult {
    _id: string;
    content: string;
    createdAt: string;
    author: {
        name: string;
        headline: string | null;
        slug: string;
        image: string | null;
    };
}

interface SearchResults {
    profiles: ProfileResult[];
    companies: CompanyResult[];
    posts: PostResult[];
    total: number;
    page?: number;
    hasMore?: boolean;
    message?: string;
}

export default function SearchPage() {
    const searchParams = useSearchParams();
    const query = searchParams.get("q") || "";
    const typeParam = searchParams.get("type");
    const [activeTab, setActiveTab] = useState(typeParam || "all");
    const [results, setResults] = useState<SearchResults | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [loadingMore, setLoadingMore] = useState(false);

    // Fetch search results from API
    useEffect(() => {
        // Reset page when query or tab changes
        setPage(1);

        const fetchResults = async () => {
            setLoading(true);
            setError(null);

            try {
                const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&type=${activeTab}&page=1`);

                if (!response.ok) {
                    throw new Error("Failed to fetch search results");
                }

                const data: SearchResults = await response.json();
                setResults(data);
            } catch (err) {
                console.error("Search error:", err);
                setError("Failed to load search results. Please try again.");
                setResults(null);
            } finally {
                setLoading(false);
            }
        };

        fetchResults();
    }, [query, activeTab]);

    // Load more results (pagination)
    const loadMore = async () => {
        if (!results?.hasMore || loadingMore) return;

        setLoadingMore(true);
        setError(null);

        try {
            const nextPage = page + 1;
            const response = await fetch(
                `/api/search?q=${encodeURIComponent(query)}&type=${activeTab}&page=${nextPage}`
            );

            if (!response.ok) {
                throw new Error("Failed to load more results");
            }

            const data: SearchResults = await response.json();

            // Append new results to existing ones
            setResults((prev) => {
                if (!prev) return data;

                return {
                    profiles: [...prev.profiles, ...data.profiles],
                    companies: [...prev.companies, ...data.companies],
                    posts: [...prev.posts, ...data.posts],
                    total: prev.total + data.total,
                    page: data.page,
                    hasMore: data.hasMore,
                    message: data.message,
                };
            });

            setPage(nextPage);
        } catch (err) {
            console.error("Load more error:", err);
            setError("Failed to load more results. Please try again.");
        } finally {
            setLoadingMore(false);
        }
    };

    // Helper function to format time ago
    const timeAgo = (date: string) => {
        const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);

        if (seconds < 60) return "just now";
        if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
        if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
        return new Date(date).toLocaleDateString();
    };

    const tabs = [
        { id: "all", label: "All" },
        { id: "user", label: "People" },
        { id: "post", label: "Posts" },
        { id: "company", label: "Companies" },
    ];

    const showUsers = activeTab === "all" || activeTab === "user";
    const showPosts = activeTab === "all" || activeTab === "post";
    const showCompanies = activeTab === "all" || activeTab === "company";

    const users = results?.profiles || [];
    const companies = results?.companies || [];
    const posts = results?.posts || [];

    return (
        <div className="min-h-screen bg-secondary/30">
            <div className="container max-w-5xl mx-auto px-4 py-6">
                {/* Search Header */}
                <div className="mb-6">
                    <h1 className="text-2xl font-bold mb-2">
                        {query.trim() ? `Search results for "${query}"` : "Browse all"}
                    </h1>
                    <p className="text-muted-foreground">
                        {loading ? "Loading..." : results ? `${results.total} results found` : "No results"}
                    </p>
                </div>

                {/* Filter Tabs */}
                <div className="mb-6 border-b">
                    <div className="flex gap-2 overflow-x-auto">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-4 py-3 font-medium border-b-2 transition-colors whitespace-nowrap ${
                                    activeTab === tab.id
                                        ? "border-primary text-primary"
                                        : "border-transparent text-muted-foreground hover:text-foreground"
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                )}

                {/* Error State */}
                {error && !loading && (
                    <Card className="p-8 text-center">
                        <p className="text-destructive mb-2">{error}</p>
                        <Button onClick={() => window.location.reload()} variant="outline" size="sm">
                            Try Again
                        </Button>
                    </Card>
                )}

                {/* Empty State */}
                {!loading && !error && results && results.total === 0 && (
                    <Card className="p-8 text-center">
                        {results.message ? (
                            <>
                                <p className="text-muted-foreground">{results.message}</p>
                                <p className="text-sm text-muted-foreground mt-2">
                                    Enter at least 2 characters to start searching
                                </p>
                            </>
                        ) : (
                            <>
                                <p className="text-muted-foreground">No results found for "{query}"</p>
                                <p className="text-sm text-muted-foreground mt-2">
                                    Try different keywords or check your spelling
                                </p>
                            </>
                        )}
                    </Card>
                )}

                {/* Results */}
                {!loading && !error && results && results.total > 0 && (
                    <div className="space-y-8">
                        {/* People Results */}
                        {showUsers && users.length > 0 && (
                            <section>
                                <h2 className="text-xl font-semibold mb-4">People</h2>
                                <div className="space-y-4">
                                    {users.map((user) => (
                                        <Card key={user._id} className="p-6">
                                            <div className="flex items-start gap-4">
                                                <Avatar className="h-16 w-16">
                                                    <AvatarImage src={user.user.image || "/placeholder.svg"} />
                                                    <AvatarFallback>{(user.fullName || user.user.name)[0]}</AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1">
                                                    <Link
                                                        href={`/${user.slug}`}
                                                        className="font-semibold text-lg hover:text-primary"
                                                    >
                                                        {user.fullName || user.user.name}
                                                    </Link>
                                                    <p className="text-muted-foreground mb-2">
                                                        {user.headline || "No headline"}
                                                    </p>
                                                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                                                        {user.location && (
                                                            <span className="flex items-center gap-1">
                                                                <MapPin className="h-4 w-4" />
                                                                {user.location}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <Button size="sm" className="rounded-full">
                                                        Connect
                                                    </Button>
                                                </div>
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Posts Results */}
                        {showPosts && posts.length > 0 && (
                            <section>
                                <h2 className="text-xl font-semibold mb-4">Posts</h2>
                                <div className="space-y-4">
                                    {posts.map((post) => (
                                        <Card key={post._id} className="p-6">
                                            <div className="flex items-start gap-3 mb-4">
                                                <Link href={`/${post.author.slug}`}>
                                                    <Avatar className="h-12 w-12 cursor-pointer">
                                                        <AvatarImage src={post.author.image || "/placeholder.svg"} />
                                                        <AvatarFallback>{post.author.name[0]}</AvatarFallback>
                                                    </Avatar>
                                                </Link>
                                                <div className="flex-1">
                                                    <Link
                                                        href={`/${post.author.slug}`}
                                                        className="font-semibold hover:text-primary"
                                                    >
                                                        {post.author.name}
                                                    </Link>
                                                    <div className="text-sm text-muted-foreground">
                                                        {post.author.headline || "No headline"}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {timeAgo(post.createdAt)}
                                                    </div>
                                                </div>
                                            </div>
                                            <p className="text-foreground whitespace-pre-wrap">{post.content}</p>
                                        </Card>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Companies Results */}
                        {showCompanies && companies.length > 0 && (
                            <section>
                                <h2 className="text-xl font-semibold mb-4">Companies</h2>
                                <div className="space-y-4">
                                    {companies.map((company) => (
                                        <Card key={company._id} className="p-6">
                                            <div className="flex items-start gap-4">
                                                <div className="h-16 w-16 bg-secondary rounded flex items-center justify-center flex-shrink-0">
                                                    <Building2 className="h-8 w-8 text-muted-foreground" />
                                                </div>
                                                <div className="flex-1">
                                                    <Link
                                                        href={`/companies/${company.slug}`}
                                                        className="font-semibold text-lg hover:text-primary"
                                                    >
                                                        {company.name}
                                                    </Link>
                                                    <p className="text-muted-foreground mb-2">{company.industry}</p>
                                                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-3">
                                                        <span className="flex items-center gap-1">
                                                            <MapPin className="h-4 w-4" />
                                                            {company.location}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                                            {company.averageRating.toFixed(1)}/5 ({company.reviewCount} reviews)
                                                        </span>
                                                    </div>
                                                    <Button size="sm" className="rounded-full">
                                                        Follow
                                                    </Button>
                                                </div>
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>
                )}

                {/* Load More Button */}
                {!loading && !error && results && results.total > 0 && results.hasMore && (
                    <div className="flex justify-center mt-8">
                        <Button
                            onClick={loadMore}
                            disabled={loadingMore}
                            variant="outline"
                            size="lg"
                            className="min-w-[200px]"
                        >
                            {loadingMore ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Loading more...
                                </>
                            ) : (
                                "Load More Results"
                            )}
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
