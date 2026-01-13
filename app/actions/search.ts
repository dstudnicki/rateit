"use server";

import { getClient } from "@/lib/mongoose";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import Profile from "@/models/Profile";
import { getPersonalizedCompanies } from "@/app/actions/companies";
import { getPersonalizedFeed } from "@/app/actions/posts";

interface SearchResult {
    profiles: any[];
    companies: any[];
    posts: any[];
    total: number;
}

export async function getPersonalizedSearchResults(
    query: string,
    type: "all" | "user" | "company" | "post" = "all",
    limit: number = 20
): Promise<SearchResult> {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        const db = await getClient();
        const { ObjectId } = require('mongodb');

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
        if (type === "all" || type === "company") {
            const companiesResult = await getPersonalizedCompanies(100, 0);
            const allCompanies = companiesResult.companies || [];

            console.log('[Search] Companies from feed:', {
                total: allCompanies.length,
                query,
                isSearchQuery,
                sample: allCompanies[0]?.name
            });

            // Filter by search query
            if (isSearchQuery) {
                const searchRegex = new RegExp(query, "i");
                companies = allCompanies
                    .filter((company: any) =>
                        searchRegex.test(company.name) ||
                        searchRegex.test(company.industry) ||
                        searchRegex.test(company.location) ||
                        searchRegex.test(company.slug)
                    )
                    .slice(0, limit);

                console.log('[Search] Companies after filter:', companies.length);
            } else {
                companies = allCompanies.slice(0, limit);
            }
        }

        // Search Posts - USE SAME ALGORITHM AS HOME FEED!
        if (type === "all" || type === "post") {
            const postsResult = await getPersonalizedFeed(100, 0);
            let allPosts = postsResult.posts || [];

            console.log('[Search] Posts from feed:', {
                total: allPosts.length,
                query,
                isSearchQuery,
                sample: allPosts[0]?.content?.substring(0, 50)
            });

            // If no posts from personalized feed, try generic
            if (allPosts.length === 0) {
                console.log('[Search] No posts from personalized feed, trying generic...');
                const { getGenericFeed } = await import("@/app/actions/posts");
                const genericResult = await getGenericFeed(100, 0);
                allPosts = genericResult.posts || [];
                console.log('[Search] Posts from generic feed:', allPosts.length);
            }

            // Filter by search query
            if (isSearchQuery) {
                const searchRegex = new RegExp(query, "i");
                posts = allPosts
                    .filter((post: any) => {
                        const matches = post.content && searchRegex.test(post.content);
                        if (!matches && allPosts.length < 5) {
                            console.log('[Search] Post filtered out:', {
                                content: post.content?.substring(0, 50),
                                query,
                                hasContent: !!post.content
                            });
                        }
                        return matches;
                    })
                    .slice(0, limit);

                console.log('[Search] Posts after filter:', posts.length);
            } else {
                posts = allPosts.slice(0, limit);
            }
        }

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
                    ]
                };
            }

            const profileDocs = await Profile.find(profileQuery)
                .limit(100)
                .lean();

            // Populate user data and score profiles
            const profileResults = await Promise.all(
                profileDocs.map(async (profile: any) => {
                    let user;
                    try {
                        user = await db.collection("user").findOne(
                            { _id: new ObjectId(profile.userId) },
                            { projection: { name: 1, email: 1, image: 1 } }
                        );
                    } catch (e) {
                        user = await db.collection("user").findOne(
                            { _id: profile.userId },
                            { projection: { name: 1, email: 1, image: 1 } }
                        );
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
                })
            );

            profiles = profileResults
                .filter((p): p is NonNullable<typeof p> => p !== null)
                .sort((a, b) => b.score - a.score)
                .slice(0, limit);
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
    const profileName = (profile.fullName || profile.slug || '').toLowerCase();
    const headline = (profile.headline || '').toLowerCase();
    const location = (profile.location || '').toLowerCase();

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

