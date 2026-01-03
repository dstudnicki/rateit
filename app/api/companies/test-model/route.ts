import { NextResponse } from "next/server";
import { getClient } from "@/lib/mongoose";
import Company from "@/models/Company";

/**
 * Test endpoint to verify Company model schema
 * GET /api/companies/test-model
 */
export async function GET() {
    try {
        await getClient();

        // Get the schema paths to verify slug field exists
        const schema = Company.schema;
        const paths = schema.paths;

        const schemaInfo = {
            hasSlugField: 'slug' in paths,
            slugFieldConfig: paths.slug ? {
                type: paths.slug.instance,
                required: paths.slug.isRequired,
            } : null,
            allFields: Object.keys(paths).filter(p => !p.startsWith('_')),
        };

        // Try to create a test company with slug
        const testSlug = `test-company-${Date.now()}`;
        const testCompany = {
            name: "Test Company",
            slug: testSlug,
            location: "Test Location",
            industry: "Test Industry",
            createdBy: "000000000000000000000000", // Dummy ID
            reviews: [],
            averageRating: 0,
        };

        console.log('[Test] Creating test company with slug:', testSlug);

        try {
            const result = await Company.create(testCompany);
            console.log('[Test] Created company:', result._id, 'slug:', result.slug);

            // Delete the test company
            await Company.findByIdAndDelete(result._id);

            return NextResponse.json({
                success: true,
                message: "Model is working correctly",
                schema: schemaInfo,
                testResult: {
                    created: true,
                    savedSlug: result.slug,
                    slugMatches: result.slug === testSlug,
                }
            });
        } catch (createError: any) {
            console.error('[Test] Failed to create test company:', createError);
            return NextResponse.json({
                success: false,
                message: "Failed to create test company",
                error: createError.message,
                schema: schemaInfo,
            }, { status: 500 });
        }

    } catch (error: any) {
        console.error("Test endpoint error:", error);
        return NextResponse.json({
            success: false,
            message: "Internal server error",
            error: error.message
        }, { status: 500 });
    }
}

