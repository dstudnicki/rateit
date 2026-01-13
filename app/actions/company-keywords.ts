"use server";

import { getClient } from "@/lib/mongoose";
import Company from "@/models/Company";
import { analyzePostContent } from "@/lib/content-analyzer";

/**
 * Analyzes all reviews for a company and extracts keywords (skills, technologies, benefits)
 * Updates company.detectedKeywords field
 */
export async function updateCompanyKeywords(companyId: string) {
    try {
        await getClient();

        const company = await Company.findById(companyId);
        if (!company) {
            return { success: false, error: "Company not found" };
        }

        const allKeywords = new Set<string>();

        // Analyze company description
        if (company.description) {
            const analysis = analyzePostContent(company.description);
            analysis.detectedSkills.forEach(skill => allKeywords.add(skill));
            analysis.detectedIndustries.forEach(ind => allKeywords.add(ind));
        }

        // Analyze all reviews
        if (company.reviews && Array.isArray(company.reviews)) {
            company.reviews.forEach((review: any) => {
                // Analyze review title
                if (review.title) {
                    const titleAnalysis = analyzePostContent(review.title);
                    titleAnalysis.detectedSkills.forEach(skill => allKeywords.add(skill));
                }

                // Analyze review content
                if (review.content) {
                    const contentAnalysis = analyzePostContent(review.content);
                    contentAnalysis.detectedSkills.forEach(skill => allKeywords.add(skill));
                    contentAnalysis.detectedIndustries.forEach(ind => allKeywords.add(ind));
                }

                // Analyze review role (job title might contain skills)
                if (review.role) {
                    const roleAnalysis = analyzePostContent(review.role);
                    roleAnalysis.detectedSkills.forEach(skill => allKeywords.add(skill));
                }
            });
        }

        // Update company with detected keywords
        company.detectedKeywords = Array.from(allKeywords);
        await company.save();

        return {
            success: true,
            keywords: company.detectedKeywords,
            count: company.detectedKeywords.length
        };
    } catch (error) {
        console.error("Failed to update company keywords:", error);
        return { success: false, error: "Failed to update keywords" };
    }
}

/**
 * Updates keywords for all companies (migration/maintenance)
 */
export async function updateAllCompaniesKeywords() {
    try {
        await getClient();

        const companies = await Company.find();
        const results = [];

        for (const company of companies) {
            const result = await updateCompanyKeywords(company._id.toString());
            results.push({
                companyId: company._id.toString(),
                name: company.name,
                ...result
            });
        }

        return {
            success: true,
            processed: results.length,
            results
        };
    } catch (error) {
        console.error("Failed to update all companies:", error);
        return { success: false, error: "Failed to update companies" };
    }
}

