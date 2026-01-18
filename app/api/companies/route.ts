import { type NextRequest, NextResponse } from "next/server";
import { getClient } from "@/lib/mongoose";
import Company from "@/models/Company";
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

        const companies = await Company.find(filter).sort(sortOptions).lean();

        // Add review count and last review time to each company
        const companiesWithMeta = companies.map((company) => ({
            ...company,
            reviewCount: company.reviews?.length || 0,
            lastReviewDate: company.reviews?.length > 0 ? company.reviews[company.reviews.length - 1].createdAt : null,
        }));

        return NextResponse.json(companiesWithMeta, { status: 200 });
    } catch (error) {
        console.error("Error fetching companies:", error);
        return NextResponse.json({ message: "Internal server error." }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        return NextResponse.json({ message: "Missing authentication token." }, { status: 401 });
    }

    try {
        await getClient();

        const { name, location, industry, website, description } = await request.json();

        if (!name || !location || !industry) {
            return NextResponse.json({ message: "Missing required fields." }, { status: 400 });
        }

        // Check if company already exists
        const existingCompany = await Company.findOne({
            name: { $regex: new RegExp(`^${name}$`, "i") },
        });

        if (existingCompany) {
            return NextResponse.json({ message: "Company already exists." }, { status: 409 });
        }

        const newCompany = {
            name,
            location,
            industry,
            website,
            description,
            createdBy: session.user.id,
            createdAt: new Date(),
            reviews: [],
            averageRating: 0,
        };

        const result = await Company.create(newCompany);

        if (result) {
            return NextResponse.json(
                {
                    message: "Company created successfully!",
                    companyId: result._id,
                },
                { status: 201 },
            );
        } else {
            return NextResponse.json({ message: "Failed to create company." }, { status: 500 });
        }
    } catch (error) {
        console.error("Company creation error:", error);
        return NextResponse.json({ message: "Internal server error." }, { status: 500 });
    }
}
