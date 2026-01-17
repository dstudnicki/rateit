import { type NextRequest, NextResponse } from "next/server";
import { getClient } from "@/lib/mongoose";
import Company from "@/models/Company";
import { generateSlug } from "@/lib/slug";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const db = await getClient();
        const { ObjectId } = require('mongodb');

        const { slug: companySlug } = await params;
        let company: any = await Company.findOne({ slug: companySlug }).lean();

        // If not found by slug, try to find by matching generated slug from name
        // This handles companies created before slug field was added
        if (!company) {
            const allCompanies = await Company.find().lean();
            company = allCompanies.find((c: any) => generateSlug(c.name) === companySlug);

            // If found, update it with the slug
            if (company) {
                await Company.findByIdAndUpdate(company._id, { slug: companySlug });
                company.slug = companySlug;
            }
        }

        if (!company) {
            return NextResponse.json({ message: "Company not found." }, { status: 404 });
        }

        // Populate comments with user data (reviews now use nick, no need to populate user)
        const reviewsWithUsers = await Promise.all(
            (company.reviews || []).map(async (review: any) => {
                const reviewUserIdString = typeof review.user === 'string' ? review.user : review.user.toString();

                // Populate comments with user data
                const commentsWithUsers = await Promise.all(
                    (review.comments || []).map(async (comment: any) => {
                        const commentUserIdString = typeof comment.user === 'string' ? comment.user : comment.user.toString();

                        // Populate replies - no need for user data, we use nick
                        const repliesWithUsers = (comment.replies || []).map((reply: any) => {
                            const replyUserIdString = typeof reply.user === 'string' ? reply.user : reply.user.toString();

                            return {
                                _id: reply._id?.toString() || reply._id,
                                content: reply.content,
                                nick: reply.nick, // ✅ Explicitly pass nick
                                user: {
                                    _id: replyUserIdString,
                                },
                                likes: reply.likes || [],
                                createdAt: reply.createdAt,
                            };
                        });

                        return {
                            _id: comment._id?.toString() || comment._id,
                            content: comment.content,
                            nick: comment.nick, // ✅ Explicitly pass nick
                            user: {
                                _id: commentUserIdString,
                            },
                            likes: comment.likes || [],
                            createdAt: comment.createdAt,
                            replies: repliesWithUsers
                        };
                    })
                );

                return {
                    _id: review._id?.toString() || review._id,
                    title: review.title,
                    content: review.content,
                    rating: review.rating,
                    role: review.role,
                    reviewType: review.reviewType,
                    nick: review.nick, // ✅ Explicitly pass nick
                    user: {
                        _id: reviewUserIdString,
                    },
                    likes: review.likes || [],
                    createdAt: review.createdAt,
                    updatedAt: review.updatedAt,
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
                    { _id: creatorIdString as any },
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

