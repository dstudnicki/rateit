import { type NextRequest, NextResponse } from "next/server";
import { getClient } from "@/lib/mongoose";
import Company from "@/models/Company";
import { generateSlug } from "@/lib/slug";
import Profile from "@/models/Profile";
import { toCommentPublicDTO, toCompanyPublicDTO } from "@/lib/dto/public";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
    try {
        await getClient();

        const { slug: companySlug } = await params;
        let company: any = await Company.findOne({ slug: companySlug })
            .select(
                "name slug logo location industry website description detectedKeywords reviews averageRating createdAt updatedAt",
            )
            .lean();

        // If not found by slug, try to find by matching generated slug from name
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

        // optional session
        let sessionUserId: string | undefined = undefined;
        try {
            const session = await auth.api.getSession({ headers: await headers() });
            sessionUserId = session?.user?.id;
        } catch {
            sessionUserId = undefined;
        }

        // const commentsPublic = await Promise.all(
        //     (post.comments || []).map(async (comment: any) => {
        //         let authorProfile = null;
        //         if (comment.user) {
        //             const userIdString = typeof comment.user === "string" ? comment.user : comment.user.toString();
        //             try {
        //                 authorProfile = await Profile.findOne({ userId: userIdString }).select("slug fullName image").lean();
        //             } catch {
        //                 authorProfile = null;
        //             }
        //         }
        //
        //         // Map comment and its replies to public DTO (no user/userId in output), pass session id
        //         return toCommentPublicDTO(comment, authorProfile, sessionUserId);
        //     }),
        // );

        // Build profileMap for reviews users
        const userIds = new Set<string>();
        (company.reviews || []).forEach((r: any) => {
            if (r.user) userIds.add(typeof r.user === "string" ? r.user : String(r.user));
        });

        const profileMap: Record<string, any> = {};
        if (userIds.size > 0) {
            const ids = Array.from(userIds);
            const profiles = await Profile.find({ userId: { $in: ids } })
                .select("userId slug fullName image")
                .lean();
            profiles.forEach((p: any) => {
                profileMap[p.userId] = p;
            });
        }

        const companyPublic = toCompanyPublicDTO(company, profileMap, sessionUserId);
        const companyWithMeta = {
            ...companyPublic,
            reviewCount: companyPublic.reviews?.length || 0,
            lastReviewDate:
                companyPublic.reviews?.length > 0 ? companyPublic.reviews[companyPublic.reviews.length - 1].createdAt : null,
        };

        return NextResponse.json(companyWithMeta, { status: 200 });
    } catch (_error) {
        return NextResponse.json({ message: "Internal server error." }, { status: 500 });
    }
}
