/**
 * Migration Script: Add Slugs to Existing Companies
 *
 * This script adds slug fields to companies that don't have them.
 * Run this once to migrate existing data.
 *
 * Usage:
 * 1. Import this in a server action or API route
 * 2. Call migrateCompanySlugs()
 * 3. It will update all companies without slugs
 */

import { getClient } from "@/lib/mongoose";
import Company from "@/models/Company";
import { generateSlug } from "@/lib/slug";

export async function migrateCompanySlugs() {
    try {
        await getClient();

        // Find all companies without slugs
        const companies = await Company.find({
            $or: [
                { slug: { $exists: false } },
                { slug: null },
                { slug: "" }
            ]
        });

        console.log(`Found ${companies.length} companies without slugs`);

        let updatedCount = 0;
        let errorCount = 0;

        for (const company of companies) {
            try {
                // Generate slug from company name
                let slug = generateSlug(company.name);

                // Check if slug already exists
                let counter = 1;
                let finalSlug = slug;

                while (await Company.findOne({ slug: finalSlug, _id: { $ne: company._id } })) {
                    finalSlug = `${slug}-${counter}`;
                    counter++;
                }

                // Update company with slug
                company.slug = finalSlug;
                await company.save();

                updatedCount++;
                console.log(`✓ Updated: ${company.name} → ${finalSlug}`);
            } catch (error) {
                errorCount++;
                console.error(`✗ Failed to update ${company.name}:`, error);
            }
        }

        return {
            success: true,
            message: `Migration complete: ${updatedCount} companies updated, ${errorCount} errors`,
            updated: updatedCount,
            errors: errorCount
        };
    } catch (error) {
        console.error("Migration failed:", error);
        return {
            success: false,
            message: "Migration failed",
            error: error instanceof Error ? error.message : String(error)
        };
    }
}

/**
 * Alternative: Fix a single company's slug
 */
export async function fixCompanySlug(companyId: string) {
    try {
        await getClient();

        const company = await Company.findById(companyId);
        if (!company) {
            return { success: false, error: "Company not found" };
        }

        if (company.slug) {
            return { success: true, message: "Company already has a slug", slug: company.slug };
        }

        let slug = generateSlug(company.name);
        let counter = 1;

        while (await Company.findOne({ slug, _id: { $ne: company._id } })) {
            slug = `${generateSlug(company.name)}-${counter}`;
            counter++;
        }

        company.slug = slug;
        await company.save();

        return { success: true, message: "Slug added", slug };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
}

