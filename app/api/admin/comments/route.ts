import { NextRequest, NextResponse } from "next/server";
import { getClient } from "@/lib/mongoose";
import Post from "@/models/Post";
import Company from "@/models/Company";
import { requireAdmin } from "@/lib/auth-helpers";

export async function GET() {
    try {
        await requireAdmin();
        await getClient();

        const db = await getClient();
        const { ObjectId } = require('mongodb');

        // Get all post comments
        const posts = await Post.find({ comments: { $exists: true, $ne: [] } })
            .select('comments')
            .lean();

        const postComments = [];
        for (const post of posts) {
            if (post.comments && post.comments.length > 0) {
                for (const comment of post.comments) {
                    const userId = (comment as any).user;
                    let user;
                    try {
                        user = await db.collection("user").findOne(
                            { _id: new ObjectId(userId) },
                            { projection: { name: 1, email: 1 } }
                        );
                    } catch (e) {
                        user = await db.collection("user").findOne(
                            { _id: userId as any },
                            { projection: { name: 1, email: 1 } }
                        );
                    }

                    if (user) {
                        postComments.push({
                            _id: (comment as any)._id.toString(),
                            content: (comment as any).content,
                            user: {
                                _id: userId,
                                name: user.name,
                                email: user.email,
                            },
                            postId: (post as any)._id.toString(),
                            type: "post",
                            createdAt: (comment as any).createdAt,
                        });
                    }
                }
            }
        }

        // Get all company reviews
        const companies = await Company.find({ reviews: { $exists: true, $ne: [] } })
            .select('reviews name')
            .lean();

        const companyReviews = [];
        for (const company of companies) {
            if ((company as any).reviews && (company as any).reviews.length > 0) {
                for (const review of (company as any).reviews) {
                    const userId = review.user;
                    let user;
                    try {
                        user = await db.collection("user").findOne(
                            { _id: new ObjectId(userId) },
                            { projection: { name: 1, email: 1 } }
                        );
                    } catch (e) {
                        user = await db.collection("user").findOne(
                            { _id: userId as any },
                            { projection: { name: 1, email: 1 } }
                        );
                    }

                    if (user) {
                        companyReviews.push({
                            _id: review._id.toString(),
                            content: review.comment,
                            user: {
                                _id: userId,
                                name: user.name,
                                email: user.email,
                            },
                            companyId: (company as any)._id.toString(),
                            type: "company",
                            createdAt: review.createdAt,
                        });
                    }
                }
            }
        }

        const allComments = [...postComments, ...companyReviews].sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        return NextResponse.json({ comments: allComments });
    } catch (error: any) {
        console.error("Admin comments fetch error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to fetch comments" },
            { status: error.message === "Admin access required" ? 403 : 500 }
        );
    }
}

