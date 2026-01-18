"use server";

import { getClient } from "@/lib/mongoose";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getPersonalizedFeed } from "@/app/actions/posts";
import Profile from "@/models/Profile";
import Post from "@/models/Post";
import { getPersonalizedCompanies, searchCompaniesByName } from "@/app/actions/companies";
import { ObjectId } from "mongodb";

interface SearchResult {
    profiles: any[];
    companies: any[];
    posts: any[];
    total: number;
}

export async function getPersonalizedSearchResults(
    query: string,
    type: "all" | "user" | "company" | "post" = "all",
    limit: number = 20,
): Promise<SearchResult> {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        const db = await getClient();

        // Get user profile for personalization
        let userProfile = null;
        if (session?.user?.id) {
            userProfile = await Profile.findOne({ userId: session.user.id }).lean();
        }

        const MIN_QUERY_LENGTH = 2;
        const isSearchQuery = query.trim().length >= MIN_QUERY_LENGTH;

        let profiles: any[] = [];
        let companies: any[] = [];
        let posts: any[] = [];

        // Search Companies - USE SAME ALGORITHM AS /companies PAGE!
        // Search Companies - USE DEDICATED SEARCH (same as /companies!)
        if (type === "all" || type === "company") {
            if (isSearchQuery) {
                // Use optimized search - queries DB directly with regex
                const searchResult = await searchCompaniesByName(query, undefined);
                companies = (searchResult.companies || []).slice(0, limit);
            } else {
                // No query - show personalized list
                const companiesResult = await getPersonalizedCompanies(limit, 0);
                companies = companiesResult.companies || [];
            }
        }

        if (type === "all" || type === "post") {
            // Helper to safely build regex from user input
            const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

            if (isSearchQuery) {
                // Fast DB query: search posts content directly in DB with regex and limit fields
                const searchRegex = new RegExp(escapeRegExp(query), "i");

                const postDocs = await Post.find({ content: searchRegex })
                    .sort({ createdAt: -1 })
                    .limit(limit)
                    .select("content images likes comments createdAt user")
                    .lean();

                // If none found, return empty posts (do not fall back to full feed to avoid heavy work)
                if (!postDocs || postDocs.length === 0) {
                    posts = [];
                } else {
                    // Collect distinct user ids and fetch users in one go (avoid leaking email)
                    const userIdStrings = Array.from(
                        new Set(postDocs.map((p: any) => (p.user ? p.user.toString() : null)).filter(Boolean)),
                    );
                    const userObjectIds = userIdStrings.map((id) => {
                        try {
                            return new ObjectId(id);
                        } catch (e) {
                            return id as any; // fallback, though ObjectId should be valid
                        }
                    });

                    const usersArray = userObjectIds.length
                        ? await db
                              .collection("user")
                              .find({ _id: { $in: userObjectIds as any } })
                              .project({ name: 1, image: 1, slug: 1 })
                              .toArray()
                        : [];

                    const usersMap: Record<string, any> = {};
                    usersArray.forEach((u: any) => {
                        usersMap[u._id.toString()] = u;
                    });

                    // Map posts to API-friendly shape (minimal fields)
                    posts = postDocs.map((p: any) => {
                        const uid = p.user ? p.user.toString() : null;
                        const u = uid ? usersMap[uid] : null;

                        return {
                            _id: p._id.toString(),
                            content: p.content || "",
                            images: Array.isArray(p.images) ? p.images : [],
                            likesCount: Array.isArray(p.likes) ? p.likes.length : 0,
                            commentsCount: Array.isArray(p.comments) ? p.comments.length : 0,
                            createdAt: p.createdAt,
                            user: {
                                _id: uid,
                                name: u?.name || null,
                                image: u?.image || null,
                                slug: u?.slug || null,
                            },
                        };
                    });
                }
            } else {
                // No query - use personalized feed (existing heavy path)
                const postsResult = await getPersonalizedFeed(limit, 0);
                posts = postsResult.posts || [];
            }
        }

        // Search Posts - DIRECT DB QUERY (faster!)

        // Search Profiles
        if (type === "all" || type === "user") {
            let profileQuery: any = {};

            if (isSearchQuery) {
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

            const profileDocs = await Profile.find(profileQuery)
                .limit(limit) // ← Limit bezpośrednio w query!
                .lean();

            // ...

            // ...

            // Populate user data and score profiles
            const profileResults = await Promise.all(
                profileDocs.map(async (profile: any) => {
                    let user;
                    try {
                        user = await db
                            .collection("user")
                            .findOne({ _id: new ObjectId(profile.userId) }, { projection: { name: 1, email: 1, image: 1 } });
                    } catch (e) {
                        user = await db
                            .collection("user")
                            .findOne({ _id: profile.userId }, { projection: { name: 1, email: 1, image: 1 } });
                    }

                    if (!user) return null;

                    const result = {
                        _id: profile._id.toString(),
                        userId: profile.userId,
                        slug: profile.slug,
                        fullName: profile.fullName || "",
                        headline: profile.headline || "",
                        location: profile.location || "",
                        user: {
                            name: user.name,
                            email: user.email,
                            image: user.image || null,
                        },
                    };

                    // Calculate personalized score for profiles
                    const score = calculateProfileScore(result, query, userProfile);
                    return { ...result, score };
                }),
            );

            profiles = profileResults.filter((p): p is NonNullable<typeof p> => p !== null).sort((a, b) => b.score - a.score);
        }

        const total = profiles.length + companies.length + posts.length;

        return {
            profiles,
            companies,
            posts,
            total,
        };
    } catch (error) {
        console.error("Search error:", error);
        return {
            profiles: [],
            companies: [],
            posts: [],
            total: 0,
        };
    }
}

// Calculate profile match score (for people search)
function calculateProfileScore(profile: any, query: string, userProfile: any): number {
    let score = 0;

    const searchQuery = query.toLowerCase().trim();
    const profileName = (profile.fullName || profile.slug || "").toLowerCase();
    const headline = (profile.headline || "").toLowerCase();
    const location = (profile.location || "").toLowerCase();

    // Text matching score (0-100)
    if (profileName === searchQuery || profile.slug === searchQuery) {
        score += 100; // Exact match
    } else if (profileName.startsWith(searchQuery)) {
        score += 80; // Prefix match
    } else if (profileName.includes(searchQuery)) {
        score += 60; // Contains
    } else if (headline.includes(searchQuery) || location.includes(searchQuery)) {
        score += 40; // Secondary field match
    } else {
        score += 20; // Base score for any result
    }

    // Personalization boost (if user is logged in)
    if (userProfile) {
        // Match skills
        const profileSkills = profile.skills?.map((s: any) => s.name?.toLowerCase()) || [];
        const userSkills = userProfile.skills?.map((s: any) => s.name?.toLowerCase()) || [];
        const matchingSkills = profileSkills.filter((s: string) => userSkills.includes(s));
        score += matchingSkills.length * 5;

        // Match industry/headline
        const userIndustries = userProfile.preferences?.industries?.map((i: string) => i.toLowerCase()) || [];
        const headlineMatch = userIndustries.some((ind: string) => headline.includes(ind));
        if (headlineMatch) score += 10;

        // Same location
        if (userProfile.location && profile.location === userProfile.location) {
            score += 5;
        }
    }

    return score;
}
