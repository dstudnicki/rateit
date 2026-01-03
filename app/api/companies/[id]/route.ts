import { type NextRequest, NextResponse } from "next/server";
import { getClient } from "@/lib/mongoose";
import Company from "@/models/Company";

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const db = await getClient();
        const { ObjectId } = require('mongodb');

        const companyId = params.id;
        const company: any = await Company.findById(companyId).lean();

        if (!company) {
            return NextResponse.json({ message: "Company not found." }, { status: 404 });
        }

        // Populate user data for reviews and their comments
        const reviewsWithUsers = await Promise.all(
            (company.reviews || []).map(async (review: any) => {
                let reviewUser;
                const reviewUserIdString = typeof review.user === 'string' ? review.user : review.user.toString();

                try {
                    reviewUser = await db.collection("user").findOne(
                        { _id: new ObjectId(reviewUserIdString) },
                        { projection: { name: 1, email: 1, _id: 1, image: 1 } }
                    );
                } catch (e) {
                    reviewUser = await db.collection("user").findOne(
                        { _id: reviewUserIdString },
                        { projection: { name: 1, email: 1, _id: 1, image: 1 } }
                    );
                }

                // Populate profile data
                let profile = null;
                if (reviewUser) {
                    profile = await db.collection("profiles").findOne(
                        { userId: reviewUserIdString },
                        { projection: { slug: 1, fullName: 1, headline: 1 } }
                    );
                }

                // Populate comments with user data
                const commentsWithUsers = await Promise.all(
                    (review.comments || []).map(async (comment: any) => {
                        const commentUserIdString = typeof comment.user === 'string' ? comment.user : comment.user.toString();

                        let commentUser;
                        try {
                            commentUser = await db.collection("user").findOne(
                                { _id: new ObjectId(commentUserIdString) },
                                { projection: { name: 1, image: 1 } }
                            );
                        } catch (e) {
                            commentUser = await db.collection("user").findOne(
                                { _id: commentUserIdString },
                                { projection: { name: 1, image: 1 } }
                            );
                        }

                        // Populate replies with user data
                        const repliesWithUsers = await Promise.all(
                            (comment.replies || []).map(async (reply: any) => {
                                const replyUserIdString = typeof reply.user === 'string' ? reply.user : reply.user.toString();

                                let replyUser;
                                try {
                                    replyUser = await db.collection("user").findOne(
                                        { _id: new ObjectId(replyUserIdString) },
                                        { projection: { name: 1, image: 1 } }
                                    );
                                } catch (e) {
                                    replyUser = await db.collection("user").findOne(
                                        { _id: replyUserIdString },
                                        { projection: { name: 1, image: 1 } }
                                    );
                                }

                                return {
                                    ...reply,
                                    user: replyUser ? {
                                        name: replyUser.name,
                                        _id: replyUserIdString,
                                        image: replyUser.image || null,
                                    } : null
                                };
                            })
                        );

                        return {
                            ...comment,
                            user: commentUser ? {
                                name: commentUser.name,
                                _id: commentUserIdString,
                                image: commentUser.image || null,
                            } : null,
                            replies: repliesWithUsers
                        };
                    })
                );

                return {
                    ...review,
                    user: reviewUser ? {
                        name: reviewUser.name,
                        email: reviewUser.email,
                        _id: reviewUserIdString,
                        image: reviewUser.image || null,
                        slug: profile?.slug || reviewUser.name,
                        fullName: profile?.fullName || null,
                        headline: profile?.headline || null,
                    } : null,
                    comments: commentsWithUsers
                };
            })
        );

        // Populate creator data
        let creator = null;
        if (company.createdBy) {
            const creatorIdString = typeof company.createdBy === 'string' ? company.createdBy : company.createdBy.toString();

            try {
                creator = await db.collection("user").findOne(
                    { _id: new ObjectId(creatorIdString) },
                    { projection: { name: 1, email: 1 } }
                );
            } catch (e) {
                creator = await db.collection("user").findOne(
                    { _id: creatorIdString },
                    { projection: { name: 1, email: 1 } }
                );
            }
        }

        const companyWithData = {
            ...company,
            reviews: reviewsWithUsers,
            createdBy: creator,
            reviewCount: reviewsWithUsers.length,
        };

        return NextResponse.json(companyWithData, { status: 200 });
    } catch (error) {
        console.error("Error fetching company:", error);
        return NextResponse.json({ message: "Internal server error." }, { status: 500 });
    }
}

