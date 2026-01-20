import { type NextRequest, NextResponse } from "next/server";
import { getClient } from "@/lib/mongoose";
import Company from "@/models/Company";
import { toCompanyPublicDTO } from "@/lib/dto/public";
import Profile from "@/models/Profile";
import { requireSession } from "@/lib/auth/require-session";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET(request: NextRequest) {
    try {
        await getClient();

        const searchParams = request.nextUrl.searchParams;
        const query = searchParams.get("query") || "";
        const industry = searchParams.get("industry") || "";
        const location = searchParams.get("location") || "";
        const sortBy = searchParams.get("sortBy") || "recent"; // recent, rating, reviews

        const filter: any = {};

        if (query) {
            filter.name = { $regex: query, $options: "i" };
        }

        if (industry) {
            filter.industry = { $regex: industry, $options: "i" };
        }

        if (location) {
            filter.location = { $regex: location, $options: "i" };
        }

        let sortOptions: any = {};
        switch (sortBy) {
            case "rating":
                sortOptions = { averageRating: -1, "reviews.length": -1 };
                break;
            case "reviews":
                sortOptions = { "reviews.length": -1 };
                break;
            default:
                sortOptions = { createdAt: -1 };
        }

        // get optional session to compute permissions
        let sessionUserId: string | undefined = undefined;
        try {
            const session = await auth.api.getSession({ headers: await headers() });
            sessionUserId = session?.user?.id;
        } catch {
            sessionUserId = undefined;
        }

        // Allowlist select - DO NOT include createdBy
        const companies = await Company.find(filter)
            .select(
                "name slug logo location industry website description detectedKeywords reviews averageRating createdAt updatedAt",
            )
            .sort(sortOptions)
            .lean();

        // Bulk lookup profiles referenced by reviews
        const profileMap: Record<string, any> = {};
        const userIds = new Set<string>();
        companies.forEach((c: any) => {
            (c.reviews || []).forEach((r: any) => {
                if (r.user) userIds.add(typeof r.user === "string" ? r.user : String(r.user));
            });
        });

        if (userIds.size > 0) {
            const ids = Array.from(userIds);
            const profiles = await Profile.find({ userId: { $in: ids } })
                .select("userId slug fullName image")
                .lean();
            profiles.forEach((p: any) => {
                profileMap[p.userId] = p;
            });
        }

        const companiesPublic = companies.map((c: any) => toCompanyPublicDTO(c, profileMap, sessionUserId));

        // Add reviewCount and lastReviewDate to each company in DTO as metadata
        const companiesWithMeta = companiesPublic.map((company) => ({
            ...company,
            reviewCount: company.reviews?.length || 0,
            lastReviewDate: company.reviews?.length > 0 ? company.reviews[company.reviews.length - 1].createdAt : null,
        }));

        return NextResponse.json(companiesWithMeta, { status: 200 });
    } catch (_error) {
        return NextResponse.json({ message: "Internal server error." }, { status: 500 });
    }
}

// export async function POST(request: NextRequest) {
//     let session;
//     try {
//         session = await requireSession();
//     } catch {
//         return NextResponse.json({ message: "Missing authentication token." }, { status: 401 });
//     }
//
//     try {
//         await getClient();
//
//         const { name, location, industry, website, description } = await request.json();
//
//         if (!name || !location || !industry) {
//             return NextResponse.json({ message: "Missing required fields." }, { status: 400 });
//         }
//
//         // Check if company already exists
//         const existingCompany = await Company.findOne({
//             name: { $regex: new RegExp(`^${name}$`, "i") },
//         });
//
//         if (existingCompany) {
//             return NextResponse.json({ message: "Company already exists." }, { status: 409 });
//         }
//
//         const newCompany = {
//             name,
//             location,
//             industry,
//             website,
//             description,
//             createdBy: session.user.id,
//             createdAt: new Date(),
//             reviews: [],
//             averageRating: 0,
//         };
//
//         const result = await Company.create(newCompany);
//
//         if (result) {
//             return NextResponse.json(
//                 {
//                     message: "Company created successfully!",
//                     companyId: result._id,
//                 },
//                 { status: 201 },
//             );
//         } else {
//             return NextResponse.json({ message: "Failed to create company." }, { status: 500 });
//         }
//     } catch (_error) {
//         return NextResponse.json({ message: "Internal server error." }, { status: 500 });
//     }
// }
