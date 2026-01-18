import { type NextRequest, NextResponse } from "next/server";
import { getClient } from "@/lib/mongoose";
import Company from "@/models/Company";
import Profile from "@/models/Profile";
import Post from "@/models/Post";

// Types for search results
export interface ProfileSearchResult {
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
    score?: number;
}

export interface CompanySearchResult {
    _id: string;
    slug: string;
    name: string;
    industry: string;
    location: string;
    averageRating: number;
    reviewCount: number;
    score?: number;
}

export interface PostSearchResult {
    _id: string;
    content: string;
    createdAt: Date;
    author: {
        name: string;
        headline: string | null;
        slug: string;
        image: string | null;
    };
    score?: number;
}

export interface SearchResponse {
    profiles: ProfileSearchResult[];
    companies: CompanySearchResult[];
    posts: PostSearchResult[];
    total: number;
}

// Calculate match score for ranking
// Returns 0-100 based on match quality
// Structure prepared for future fuse.js integration
function calculateScore(item: any, query: string, type: "profile" | "company" | "post"): number {
    const searchQuery = query.toLowerCase().trim();

    // Get searchable fields based on type
    let mainField = "";
    let secondaryFields: string[] = [];

    switch (type) {
        case "profile":
            mainField = (item.fullName || item.slug || "").toLowerCase();
            secondaryFields = [
                (item.headline || "").toLowerCase(),
                (item.location || "").toLowerCase(),
                (item.user?.name || "").toLowerCase(),
            ];
            break;
        case "company":
            mainField = (item.name || item.slug || "").toLowerCase();
            secondaryFields = [(item.industry || "").toLowerCase(), (item.location || "").toLowerCase()];
            break;
        case "post":
            mainField = (item.content || "").toLowerCase();
            secondaryFields = [];
            break;
    }

    // Exact match on main field (highest priority)
    if (mainField === searchQuery || item.slug === searchQuery) {
        return 100;
    }

    // Prefix match on main field
    if (mainField.startsWith(searchQuery)) {
        return 80;
    }

    // Substring match on main field
    if (mainField.includes(searchQuery)) {
        return 60;
    }

    // Check secondary fields
    for (const field of secondaryFields) {
        if (field === searchQuery) {
            return 70;
        }
        if (field.startsWith(searchQuery)) {
            return 50;
        }
        if (field.includes(searchQuery)) {
            return 40;
        }
    }

    // TODO: If useFuzzy option enabled, integrate fuse.js here for better matching
    // const fuseOptions = {
    //   profile: { keys: ['fullName', 'headline', 'slug'], threshold: 0.4 },
    //   company: { keys: ['name', 'industry', 'slug'], threshold: 0.4 },
    //   post: { keys: ['content'], threshold: 0.5 }
    // }

    return 0;
}

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const query = searchParams.get("q") || "";
        const type = searchParams.get("type") || "all"; // all, user, company, post
        const limitParam = searchParams.get("limit");
        const pageParam = searchParams.get("page");

        // Default limit: 20 for search page, 5 for suggestions
        const limit = limitParam ? parseInt(limitParam) : 20;
        const page = pageParam ? parseInt(pageParam) : 1;
        const skip = (page - 1) * limit;

        // Minimum query length for search (but allow empty for "browse all")
        const MIN_QUERY_LENGTH = 2;
        const isSearchQuery = query.trim().length >= MIN_QUERY_LENGTH;

        // If query is too short but not empty, show error
        if (query.trim().length > 0 && query.trim().length < MIN_QUERY_LENGTH) {
            return NextResponse.json(
                {
                    profiles: [],
                    companies: [],
                    posts: [],
                    total: 0,
                    page: 1,
                    hasMore: false,
                    message: "Please enter at least 2 characters to search",
                } as SearchResponse & { page: number; hasMore: boolean; message?: string },
                { status: 200 },
            );
        }

        const db = await getClient();
        const { ObjectId } = require("mongodb");

        let profiles: ProfileSearchResult[] = [];
        let companies: CompanySearchResult[] = [];
        let posts: PostSearchResult[] = [];

        // Search Profiles
        if (type === "all" || type === "user") {
            let profileQuery: any = {};

            if (isSearchQuery) {
                // Search with regex if query exists
                const searchRegex = new RegExp(query, "i");
                profileQuery = {
                    $or: [
                        { fullName: searchRegex },
                        { headline: searchRegex },
                        { location: searchRegex },
                        { slug: searchRegex },
                    ],
                };
            }

            // If no search query, get recent profiles (sort by _id for most recent)
            const profileDocs = await Profile.find(profileQuery)
                .sort(isSearchQuery ? {} : { _id: -1 })
                .skip(skip)
                .limit(limit)
                .lean();

            // Populate user data
            const profileResults = await Promise.all(
                profileDocs.map(async (profile: any) => {
                    let user;
                    try {
                        user = await db
                            .collection("user")
                            .findOne(
                                { _id: new ObjectId(profile.userId) },
                                { projection: { name: 1, email: 1, image: 1, userImage: 1 } },
                            );
                    } catch (e) {
                        user = await db
                            .collection("user")
                            .findOne({ _id: profile.userId }, { projection: { name: 1, email: 1, image: 1, userImage: 1 } });
                    }

                    if (!user) return null;

                    const result: ProfileSearchResult = {
                        _id: profile._id.toString(),
                        userId: profile.userId,
                        slug: profile.slug,
                        fullName: profile.fullName || user.name || "",
                        headline: profile.headline || "",
                        location: profile.location || "",
                        user: {
                            name: user.name || "",
                            email: user.email || "",
                            image: user.userImage || user.image || null,
                        },
                        score: calculateScore({ ...profile, user }, query, "profile"),
                    };

                    return result;
                }),
            );

            profiles = profileResults.filter((p): p is ProfileSearchResult => p !== null);

            // Sort by score only if there's a search query
            if (isSearchQuery) {
                profiles.sort((a, b) => {
                    if (b.score !== a.score) {
                        return (b.score || 0) - (a.score || 0);
                    }
                    return a.fullName.localeCompare(b.fullName);
                });
            }
            // Otherwise already sorted by _id (most recent) from query
        }

        // Search Companies
        if (type === "all" || type === "company") {
            let companyQuery: any = {};

            if (isSearchQuery) {
                const searchRegex = new RegExp(query, "i");
                companyQuery = {
                    $or: [{ name: searchRegex }, { industry: searchRegex }, { location: searchRegex }, { slug: searchRegex }],
                };
            }

            const companyDocs = await Company.find(companyQuery)
                .sort(isSearchQuery ? {} : { averageRating: -1, _id: -1 })
                .skip(skip)
                .limit(limit)
                .lean();

            companies = companyDocs.map((company: any) => {
                const result: CompanySearchResult = {
                    _id: company._id.toString(),
                    slug: company.slug,
                    name: company.name,
                    industry: company.industry,
                    location: company.location,
                    averageRating: company.averageRating || 0,
                    reviewCount: company.reviews?.length || 0,
                    score: calculateScore(company, query, "company"),
                };
                return result;
            });

            // Sort by score only if there's a search query
            if (isSearchQuery) {
                companies.sort((a, b) => {
                    if (b.score !== a.score) {
                        return (b.score || 0) - (a.score || 0);
                    }
                    return b.averageRating - a.averageRating;
                });
            }
            // Otherwise already sorted by averageRating from query
        }

        // Search Posts
        if (type === "all" || type === "post") {
            let postQuery: any = {};

            if (isSearchQuery) {
                const searchRegex = new RegExp(query, "i");
                postQuery = { content: searchRegex };
            }

            const postDocs = await Post.find(postQuery).sort({ createdAt: -1 }).skip(skip).limit(limit).lean();

            // Populate author data
            const postResults = await Promise.all(
                postDocs.map(async (post: any) => {
                    const userIdString = typeof post.user === "string" ? post.user : post.user.toString();

                    let user;
                    try {
                        user = await db
                            .collection("user")
                            .findOne({ _id: new ObjectId(userIdString) }, { projection: { name: 1, image: 1, userImage: 1 } });
                    } catch (e) {
                        user = await db
                            .collection("user")
                            .findOne({ _id: userIdString as any }, { projection: { name: 1, image: 1, userImage: 1 } });
                    }

                    if (!user) return null;

                    // Get profile for headline and slug
                    const profile = await db
                        .collection("profiles")
                        .findOne({ userId: userIdString }, { projection: { slug: 1, headline: 1 } });

                    const result: PostSearchResult = {
                        _id: post._id.toString(),
                        content: post.content,
                        createdAt: post.createdAt,
                        author: {
                            name: user.name || "",
                            headline: profile?.headline || null,
                            slug: profile?.slug || user.name,
                            image: user.userImage || user.image || null,
                        },
                        score: calculateScore(post, query, "post"),
                    };

                    return result;
                }),
            );

            posts = postResults.filter((p): p is PostSearchResult => p !== null);

            // Sort by score only if there's a search query, then by createdAt
            if (isSearchQuery) {
                posts.sort((a, b) => {
                    if (b.score !== a.score) {
                        return (b.score || 0) - (a.score || 0);
                    }
                    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                });
            }
            // Otherwise already sorted by createdAt from query
        }

        const response: SearchResponse = {
            profiles,
            companies,
            posts,
            total: profiles.length + companies.length + posts.length,
        };

        // Add pagination metadata
        const hasMore =
            (type === "all" && (profiles.length === limit || companies.length === limit || posts.length === limit)) ||
            (type === "user" && profiles.length === limit) ||
            (type === "company" && companies.length === limit) ||
            (type === "post" && posts.length === limit);

        return NextResponse.json(
            {
                ...response,
                page,
                hasMore,
            },
            { status: 200 },
        );
    } catch (error) {
        console.error("Search error:", error);
        return NextResponse.json({ message: "Internal server error during search." }, { status: 500 });
    }
}
