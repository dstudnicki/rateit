"use server";

import { getClient } from "@/lib/mongoose";
import Company from "@/models/Company";
import { updateCompanyKeywords } from "./company-keywords";

/**
 * Migration script to update keywords for all existing companies
 */
export async function migrateCompanyKeywords() {
    try {
        await getClient();

        const companies = await Company.find({});
        const results = [];

        for (const company of companies) {
            console.log(`Processing company: ${company.name} (${company._id})`);
            
            const result = await updateCompanyKeywords(company._id.toString());
            
            results.push({
                companyId: company._id.toString(),
                name: company.name,
                slug: company.slug,
                keywordsCount: result.count || 0,
                success: result.success
            });

            console.log(`  - Keywords: ${result.count || 0}`);
        }

        return {
            success: true,
            processed: results.length,
            results
        };
    } catch (error) {
        console.error("Migration error:", error);
        return { success: false, error: "Migration failed" };
    }
}
