"use server";

import { getClient } from "@/lib/mongoose";
import Post from "@/models/Post";
import Profile from "@/models/Profile";
import Company from "@/models/Company";
import { auth } from "@/lib/auth";
import { analyzePostContent } from "@/lib/content-analyzer";
import { requireAuth, canModifyResource } from "@/lib/auth-helpers";
import { validatePostContent, sanitizeString } from "@/lib/validation";
import { requireNotBanned } from "@/lib/ban-check";

export async function createPost(content: string) {
    const user = await requireAuth();

    // Check if user is banned
    await requireNotBanned();

    // Validate and sanitize input
    const sanitizedContent = sanitizeString(content);
    const validation = validatePostContent(sanitizedContent);

    if (!validation.valid) {
        return { success: false, error: validation.error };
    }

    try {
        await getClient();

        // Analyze content for companies, skills, and industries
        const analysis = analyzePostContent(sanitizedContent);

        const newPost = {
            content: sanitizedContent,
            user: user.id,
            createdAt: new Date(),
            detectedCompanies: analysis.detectedCompanies,
            detectedSkills: analysis.detectedSkills,
            detectedIndustries: analysis.detectedIndustries,
        };

        await Post.create(newPost);


        return { success: true };
    } catch (error) {
        console.error("Failed to create post:", error);
        return { success: false, error: "Failed to create post" };
    }
}

export async function updatePost(postId: string, content: string) {
    await requireAuth(); // Ensure user is authenticated

    // Validate and sanitize input
    const sanitizedContent = sanitizeString(content);
    const validation = validatePostContent(sanitizedContent);

    if (!validation.valid) {
        return { success: false, error: validation.error };
    }

    try {
        await getClient();

        const post = await Post.findById(postId);

        if (!post) {
            return { success: false, error: "Post not found" };
        }

        // Check if user can modify (owner, moderator, or admin)
        const canModify = await canModifyResource(post.user.toString());
        if (!canModify) {
            return { success: false, error: "Not authorized to edit this post" };
        }

        post.content = sanitizedContent;
        post.updatedAt = new Date();
        await post.save();

        return { success: true };
    } catch (error) {
        console.error("Failed to update post:", error);
        return { success: false, error: "Failed to update post" };
    }
}

export async function deletePost(postId: string) {
    await requireAuth(); // Ensure user is authenticated

    try {
        await getClient();

        const post = await Post.findById(postId);

        if (!post) {
            return { success: false, error: "Post not found" };
        }

        // Check if user can modify (owner, moderator, or admin)
        const canModify = await canModifyResource(post.user.toString());
        if (!canModify) {
            return { success: false, error: "Not authorized to delete this post" };
        }

        await Post.findByIdAndDelete(postId);


        return { success: true };
    } catch (error) {
        console.error("Failed to delete post:", error);
        return { success: false, error: "Failed to delete post" };
    }
}

// Helper to sanitize post data and remove all Mongoose artifacts
function sanitizePost(post: any): any {
    // COMPLETE plain object - no references, no getters, no Mongoose
    const plain: any = {
        _id: String(post._id || ''),
        content: String(post.content || ''),
        user: String(post.user || ''),
        likes: Array.isArray(post.likes) ? post.likes.map((l: any) => String(l)) : [],
        createdAt: post.createdAt ? (post.createdAt instanceof Date ? post.createdAt.toISOString() : String(post.createdAt)) : new Date().toISOString(),
        updatedAt: post.updatedAt ? (post.updatedAt instanceof Date ? post.updatedAt.toISOString() : String(post.updatedAt)) : null,
        comments: [],
        // Add detected fields if present
        detectedCompanies: Array.isArray(post.detectedCompanies) ? post.detectedCompanies.map((c: any) => String(c)) : [],
        detectedSkills: Array.isArray(post.detectedSkills) ? post.detectedSkills.map((s: any) => String(s)) : [],
        detectedIndustries: Array.isArray(post.detectedIndustries) ? post.detectedIndustries.map((i: any) => String(i)) : [],
    };

    // Sanitize comments separately
    if (post.comments && Array.isArray(post.comments)) {
        plain.comments = post.comments.map((c: any) => {
            const comment: any = {
                _id: String(c._id || ''),
                content: String(c.content || ''),
                user: String(c.user || ''),
                likes: Array.isArray(c.likes) ? c.likes.map((l: any) => String(l)) : [],
                createdAt: c.createdAt ? (c.createdAt instanceof Date ? c.createdAt.toISOString() : String(c.createdAt)) : new Date().toISOString(),
                replies: [],
            };

            // Sanitize replies
            if (c.replies && Array.isArray(c.replies)) {
                comment.replies = c.replies.map((r: any) => ({
                    _id: String(r._id || ''),
                    content: String(r.content || ''),
                    user: String(r.user || ''),
                    likes: Array.isArray(r.likes) ? r.likes.map((l: any) => String(l)) : [],
                    createdAt: r.createdAt ? (r.createdAt instanceof Date ? r.createdAt.toISOString() : String(r.createdAt)) : new Date().toISOString(),
                }));
            }

            return comment;
        });
    }

    return plain;
}

export async function getPersonalizedFeed(limit: number = 10, skip: number = 0) {
    const session = await auth.api.getSession({
        headers: await import("next/headers").then(m => m.headers()),
    });

    if (!session) {
        // Fall back to generic feed for non-authenticated users
        return getGenericFeed(limit, skip);
    }

    try {
        await getClient();

        const profile = await Profile.findOne({ userId: session.user.id });

        if (!profile || !profile.preferences.onboardingCompleted) {
            // User hasn't completed onboarding, show generic feed
            return getGenericFeed(limit, skip);
        }

        const interactionCount = profile.interactionHistory.length;

        // Cold start: if user has less than 10 interactions, prioritize generic popular content
        if (interactionCount < 10) {
            const genericResult = await getGenericFeed(Math.ceil(limit * 0.6), skip);
            const personalizedPosts = await getPersonalizedPosts(profile, Math.floor(limit * 0.4), 0);

            const genericPosts = genericResult.success ? genericResult.posts : [];

            // Deduplicate by _id
            const allPosts = [...personalizedPosts, ...genericPosts];
            const uniquePosts = Array.from(
                new Map(allPosts.map(post => [post._id, post])).values()
            ).slice(0, limit);

            return {
                success: true,
                posts: uniquePosts,
            };
        }

        // Get personalized posts (80% of feed)
        const personalizedCount = Math.floor(limit * 0.8);
        const explorationCount = limit - personalizedCount;

        const personalizedPosts = await getPersonalizedPosts(profile, personalizedCount, skip);
        const explorationResult = await getGenericFeed(explorationCount, Math.floor(Math.random() * 20));
        const explorationPosts = explorationResult.success ? explorationResult.posts : [];

        // Deduplicate by _id
        const allPosts = [...personalizedPosts, ...explorationPosts];
        const uniquePosts = Array.from(
            new Map(allPosts.map(post => [post._id, post])).values()
        );

        return {
            success: true,
            posts: uniquePosts,
        };
    } catch (error) {
        console.error("Failed to get personalized feed:", error);
        // Fall back to generic feed on error
        return getGenericFeed(limit, skip);
    }
}

async function getPersonalizedPosts(profile: any, limit: number, skip: number) {
    const db = await getClient();
    const { ObjectId } = require('mongodb');

    const posts = await Post.find()
        .sort({ createdAt: -1 })
        .limit(100) // Get more posts to score
        .lean();

    // Sanitize all posts first
    const postsPlain = posts.map((post: any) => sanitizePost(post));

    // Collect all unique user IDs
    const userIds = [...new Set(postsPlain.map(p => p.user))];

    // Batch fetch all users
    const userObjectIds = userIds.map(id => {
        try {
            return new ObjectId(id);
        } catch {
            return id;
        }
    });

    const users = await db.collection("user").find(
        { _id: { $in: userObjectIds } },
        { projection: { name: 1, email: 1, _id: 1, image: 1 } }
    ).toArray();

    // Batch fetch all profiles
    const profiles = await db.collection("profiles").find(
        { userId: { $in: userIds } },
        { projection: { userId: 1, slug: 1, fullName: 1, headline: 1, location: 1, skills: 1 } }
    ).toArray();

    // Create lookup maps
    const userMap = new Map(users.map(u => [u._id.toString(), u]));
    const profileMapLookup = new Map(profiles.map(p => [p.userId, p]));

    console.log('[getPersonalizedPosts] Debug:', {
        totalPosts: postsPlain.length,
        totalUsers: users.length,
        totalProfiles: profiles.length,
        samplePostUserId: postsPlain[0]?.user,
        userMapKeys: Array.from(userMap.keys()).slice(0, 3),
    });

    // Populate user data for each post
    const postsWithUsers = postsPlain.map(post => {
        const user = userMap.get(post.user);
        const userProfile = profileMapLookup.get(post.user);

        if (!user) {
            console.warn('[getPersonalizedPosts] User not found for post:', post._id, 'userId:', post.user);
        }

        if (user) {
            return {
                ...post,
                user: {
                    name: user.name,
                    email: user.email,
                    _id: post.user,
                    slug: (userProfile?.slug && userProfile.slug.trim()) || null,
                    fullName: (userProfile?.fullName && userProfile.fullName.trim()) || null,
                    headline: (userProfile?.headline && userProfile.headline.trim()) || null,
                    location: (userProfile?.location && userProfile.location.trim()) || null,
                    image: user.image || null,
                }
            };
        }
        return post;
    });

    // Get user profiles and companies for matching
    const userProfiles = await Profile.find().lean();
    const companies = await Company.find().lean();

    // Create maps for quick lookup
    const profileMap = new Map(userProfiles.map(p => [p.userId, p]));
    const companyMap = new Map(companies.map(c => [(c._id as any).toString(), c]));

    // === LEARN FROM INTERACTION HISTORY ===
    // Extract keywords from posts user has interacted with
    const learnedKeywords = new Set<string>();
    const learnedCompanies = new Set<string>();
    const learnedIndustries = new Set<string>();
    
    // Get posts user has liked/commented on (last 30 days)
    // Note: we skip "view" interactions as they're too weak a signal
    const recentPostInteractions = profile.interactionHistory.filter((int: any) => 
        int.targetType === "post" && 
        int.type !== "view" && // Skip views, too weak signal
        Date.now() - new Date(int.timestamp).getTime() < 30 * 24 * 60 * 60 * 1000
    );

    // Fetch those posts to learn from their content
    const interactedPostIds = recentPostInteractions.map((int: any) => int.targetId);
    const interactedPosts = await Post.find({ _id: { $in: interactedPostIds } }).lean();
    
    interactedPosts.forEach((post: any) => {
        // Extract skills from posts user engaged with
        if (post.detectedSkills) {
            post.detectedSkills.forEach((skill: string) => learnedKeywords.add(skill.toLowerCase()));
        }
        // Extract companies
        if (post.detectedCompanies) {
            post.detectedCompanies.forEach((comp: string) => learnedCompanies.add(comp.toLowerCase()));
        }
        // Extract industries
        if (post.detectedIndustries) {
            post.detectedIndustries.forEach((ind: string) => learnedIndustries.add(ind.toLowerCase()));
        }
    });

    // Get companies user has viewed/interacted with (last 30 days)
    const recentCompanyInteractions = profile.interactionHistory.filter((int: any) => 
        int.targetType === "company" &&
        Date.now() - new Date(int.timestamp).getTime() < 30 * 24 * 60 * 60 * 1000
    );

    // Fetch those companies to learn from their keywords
    const interactedCompanyIds = recentCompanyInteractions.map((int: any) => int.targetId);
    const interactedCompanies = await Company.find({ _id: { $in: interactedCompanyIds } }).lean();
    
    interactedCompanies.forEach((company: any) => {
        // Learn from company keywords
        if (company.detectedKeywords) {
            company.detectedKeywords.forEach((kw: string) => learnedKeywords.add(kw.toLowerCase()));
        }
        // Remember company names
        learnedCompanies.add(company.name.toLowerCase());
        // Remember industries
        if (company.industry) {
            learnedIndustries.add(company.industry.toLowerCase());
        }
    });

    // Score each post
    const scoredPosts = postsWithUsers.map(post => {
        let score = 0;
        const matchReasons: { reason: string; points: number }[] = [];
        const userIdString = typeof post.user === 'string' ? post.user : (post.user?._id || post.user?.toString());
        const authorProfile = profileMap.get(userIdString);

        // === MATCH DETECTED CONTENT IN POST WITH USER'S PROFILE ===

        // 1. Match detected skills with user's profile skills (HIGHEST PRIORITY)
        if (post.detectedSkills && post.detectedSkills.length > 0) {
            // NEW: Match with learned keywords from interaction history (HIGHEST!)
            const learnedSkillMatches = post.detectedSkills.filter((skill: string) =>
                learnedKeywords.has(skill.toLowerCase())
            );
            if (learnedSkillMatches.length > 0) {
                const points = learnedSkillMatches.length * 15;
                score += points;
                matchReasons.push({
                    reason: `Learned from your activity: ${learnedSkillMatches.join(", ")}`,
                    points
                });
            }

            // Match with preferences skills
            const prefSkillMatches = post.detectedSkills.filter((skill: string) =>
                profile.preferences.skills.some((userSkill: string) =>
                    skill.toLowerCase().includes(userSkill.toLowerCase()) ||
                    userSkill.toLowerCase().includes(skill.toLowerCase())
                )
            );
            if (prefSkillMatches.length > 0) {
                const points = prefSkillMatches.length * 8;
                score += points;
                matchReasons.push({
                    reason: `Matches onboarding preferences: ${prefSkillMatches.join(", ")}`,
                    points
                });
            }

            // Match with actual profile skills (even higher priority!)
            if (profile.skills && Array.isArray(profile.skills)) {
                const profileSkillMatches = post.detectedSkills.filter((skill: string) =>
                    profile.skills.some((profileSkill: any) =>
                        skill.toLowerCase().includes(profileSkill.name?.toLowerCase() || '') ||
                        (profileSkill.name?.toLowerCase() || '').includes(skill.toLowerCase())
                    )
                );
                if (profileSkillMatches.length > 0) {
                    const points = profileSkillMatches.length * 12;
                    score += points;
                    matchReasons.push({
                        reason: `Matches your profile skills: ${profileSkillMatches.join(", ")}`,
                        points
                    });
                }
            }
        }

        // 2. Match with user's experience (job titles, companies)
        if (profile.experience && Array.isArray(profile.experience)) {
            profile.experience.forEach((exp: any) => {
                // Match job title with detected skills/industries
                if (exp.title) {
                    const titleLower = exp.title.toLowerCase();

                    if (post.detectedSkills) {
                        post.detectedSkills.forEach((skill: string) => {
                            if (titleLower.includes(skill.toLowerCase())) {
                                score += 6; // Job title mentions skill
                            }
                        });
                    }

                    if (post.detectedIndustries) {
                        post.detectedIndustries.forEach((industry: string) => {
                            if (titleLower.includes(industry.toLowerCase())) {
                                score += 4; // Job title relates to industry
                            }
                        });
                    }
                }

                // Match company from experience with detected companies
                if (exp.company && post.detectedCompanies) {
                    post.detectedCompanies.forEach((detectedComp: string) => {
                        if (exp.company.toLowerCase().includes(detectedComp.toLowerCase()) ||
                            detectedComp.toLowerCase().includes(exp.company.toLowerCase())) {
                            score += 15; // VERY HIGH: worked at mentioned company!
                        }
                    });
                }
            });
        }

        // 3. Match with user's education (field of study, school)
        if (profile.education && Array.isArray(profile.education)) {
            profile.education.forEach((edu: any) => {
                if (edu.fieldOfStudy) {
                    const fieldLower = edu.fieldOfStudy.toLowerCase();

                    if (post.detectedSkills) {
                        post.detectedSkills.forEach((skill: string) => {
                            if (fieldLower.includes(skill.toLowerCase())) {
                                score += 5; // Field of study mentions skill
                            }
                        });
                    }

                    if (post.detectedIndustries) {
                        post.detectedIndustries.forEach((industry: string) => {
                            if (fieldLower.includes(industry.toLowerCase())) {
                                score += 3; // Field relates to industry
                            }
                        });
                    }
                }
            });
        }

        // Match detected industries in post content with user's industries
        if (post.detectedIndustries && post.detectedIndustries.length > 0) {
            // NEW: Match with learned industries from interaction history
            const learnedIndustryMatches = post.detectedIndustries.filter((industry: string) =>
                learnedIndustries.has(industry.toLowerCase())
            );
            score += learnedIndustryMatches.length * 6; // +6 per learned industry match

            const matchingIndustries = post.detectedIndustries.filter((industry: string) =>
                profile.preferences.industries.some((userInd: string) =>
                    industry.toLowerCase().includes(userInd.toLowerCase()) ||
                    userInd.toLowerCase().includes(industry.toLowerCase())
                )
            );
            score += matchingIndustries.length * 4; // +4 per matching industry (increased from 3)
        }

        // Match detected companies in post with user's followed companies (VERY HIGH PRIORITY)
        if (post.detectedCompanies && post.detectedCompanies.length > 0) {
            // NEW: Match with learned companies from interaction history (HIGHEST!)
            const learnedCompanyMatches = post.detectedCompanies.filter((company: string) =>
                learnedCompanies.has(company.toLowerCase())
            );
            score += learnedCompanyMatches.length * 20; // +20 per learned company!

            // Check if user follows any of the mentioned companies
            const matchingCompanies = profile.preferences.companies.filter((companyId: string) => {
                const company = companyMap.get(companyId);
                if (!company) return false;

                return post.detectedCompanies.some((detected: string) => {
                    const companyNameLower = company.name.toLowerCase();
                    const detectedLower = detected.toLowerCase();

                    // Exact match or contains
                    return companyNameLower === detectedLower ||
                           companyNameLower.includes(detectedLower) ||
                           detectedLower.includes(companyNameLower);
                });
            });
            score += matchingCompanies.length * 15; // +15 per followed company mentioned!

            // Also check if any detected company matches user's experience companies
            if (profile.experience && Array.isArray(profile.experience)) {
                post.detectedCompanies.forEach((detectedComp: string) => {
                    const hasWorkedThere = profile.experience.some((exp: any) =>
                        exp.company && (
                            exp.company.toLowerCase().includes(detectedComp.toLowerCase()) ||
                            detectedComp.toLowerCase().includes(exp.company.toLowerCase())
                        )
                    );
                    if (hasWorkedThere) {
                        score += 15; // User has experience with this company!
                    }
                });
            }
        }

        // === OLD: Match author's profile (lower weight) ===

        // Match author's industries
        if (authorProfile?.headline) {
            const authorIndustries = profile.preferences.industries.filter((ind: string) =>
                authorProfile.headline?.toLowerCase().includes(ind.toLowerCase())
            );
            score += authorIndustries.length * 2; // Reduced from 3 to 2
        }

        // Match author's skills
        if (authorProfile?.skills) {
            const matchingSkills = authorProfile.skills.filter((skill: any) =>
                profile.preferences.skills.some((userSkill: string) =>
                    skill.name.toLowerCase().includes(userSkill.toLowerCase())
                )
            );
            score += matchingSkills.length * 1; // Reduced from 2 to 1
        }

        // Check recent interactions with this author
        const recentInteractions = profile.interactionHistory.filter(
            (interaction: any) =>
                interaction.targetType === "profile" &&
                interaction.targetId === userIdString &&
                Date.now() - new Date(interaction.timestamp).getTime() < 7 * 24 * 60 * 60 * 1000 // Last 7 days
        );
        score += recentInteractions.length;

        // Recency boost (newer posts get slight advantage)
        const daysSincePost = (Date.now() - new Date(post.createdAt).getTime()) / (24 * 60 * 60 * 1000);
        const recencyPoints = Math.max(0, 5 - daysSincePost * 0.5);
        score += recencyPoints;
        if (recencyPoints > 0.5) {
            matchReasons.push({
                reason: `Recent post (${Math.round(daysSincePost)} days ago)`,
                points: Math.round(recencyPoints * 10) / 10
            });
        }

        return { ...post, score, matchReasons };
    });

    // Sort by score and return top posts with match info
    return scoredPosts
        .sort((a, b) => b.score - a.score)
        .slice(skip, skip + limit)
        .map(post => ({
            ...post,
            matchScore: Math.round(post.score * 10) / 10,
        }));
}

export async function getGenericFeed(limit: number = 10, skip: number = 0) {
    try {
        const db = await getClient();
        const { ObjectId } = require('mongodb');

        const posts = await Post.find()
            .sort({ createdAt: -1 })
            .limit(50) // Get more posts to score
            .lean();

        // Sanitize all posts first
        const postsPlain = posts.map((post: any) => sanitizePost(post));

        // Collect all unique user IDs
        const userIds = [...new Set(postsPlain.map(p => p.user))];

        // Batch fetch all users
        const userObjectIds = userIds.map(id => {
            try {
                return new ObjectId(id);
            } catch {
                return id;
            }
        });

        const users = await db.collection("user").find(
            { _id: { $in: userObjectIds } },
            { projection: { name: 1, email: 1, _id: 1, image: 1 } }
        ).toArray();

        // Batch fetch all profiles
        const profiles = await db.collection("profiles").find(
            { userId: { $in: userIds } },
            { projection: { userId: 1, slug: 1, fullName: 1, headline: 1, location: 1 } }
        ).toArray();

        // Create lookup maps
        const userMap = new Map(users.map(u => [u._id.toString(), u]));
        const profileMapLookup = new Map(profiles.map(p => [p.userId, p]));

        console.log('[getGenericFeed] Debug:', {
            totalPosts: postsPlain.length,
            totalUsers: users.length,
            totalProfiles: profiles.length,
            samplePostUserId: postsPlain[0]?.user,
            userMapKeys: Array.from(userMap.keys()).slice(0, 3),
        });

        // Populate user data for each post
        const postsWithUsers = postsPlain.map(post => {
            const user = userMap.get(post.user);
            const profile = profileMapLookup.get(post.user);

            if (!user) {
                console.warn('[getGenericFeed] User not found for post:', post._id, 'userId:', post.user);
            }

            if (user) {
                return {
                    ...post,
                    user: {
                        name: user.name,
                        email: user.email,
                        _id: post.user,
                        slug: (profile?.slug && profile.slug.trim()) || null,
                        fullName: (profile?.fullName && profile.fullName.trim()) || null,
                        headline: (profile?.headline && profile.headline.trim()) || null,
                        location: (profile?.location && profile.location.trim()) || null,
                        image: user.image || null,
                    }
                };
            }
            return post;
        });

        // Score posts based on engagement and recency
        const scoredPosts = postsWithUsers.map(post => {
            const likesCount = post.likes?.length || 0;
            const commentsCount = post.comments?.length || 0;

            // Calculate engagement score
            const engagementScore = likesCount * 0.4 + commentsCount * 0.3;

            // Recency score (newer posts get boost)
            const daysSincePost = (Date.now() - new Date(post.createdAt).getTime()) / (24 * 60 * 60 * 1000);
            const recencyScore = Math.max(0, 10 - daysSincePost) * 0.3;

            const totalScore = engagementScore + recencyScore;

            return { ...post, score: totalScore };
        });

        // Sort by score
        const sortedPosts = scoredPosts
            .sort((a, b) => b.score - a.score)
            .slice(skip, skip + limit)
            .map(post => ({
                ...post,
                matchScore: Math.round(post.score * 10) / 10,
                matchReasons: [
                    { reason: `Generic feed (engagement-based)`, points: Math.round(post.score * 10) / 10 }
                ]
            }));

        return {
            success: true,
            posts: sortedPosts,
        };
    } catch (error) {
        console.error("Failed to get generic feed:", error);
        return { success: false, error: "Failed to load feed", posts: [] };
    }
}
