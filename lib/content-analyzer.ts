const KNOWN_COMPANIES = [
    "google",
    "microsoft",
    "apple",
    "amazon",
    "meta",
    "facebook",
    "netflix",
    "tesla",
    "ibm",
    "oracle",
    "salesforce",
    "adobe",
    "intel",
    "nvidia",
    "amd",
    "jpmorgan",
    "goldman sachs",
    "morgan stanley",
    "citigroup",
    "bank of america",
    "mckinsey",
    "bain",
    "bcg",
    "deloitte",
    "pwc",
    "ey",
    "kpmg",
    "accenture",
    "pfizer",
    "moderna",
    "johnson & johnson",
    "novartis",
    "roche",
    "coca-cola",
    "pepsi",
    "unilever",
    "procter & gamble",
    "nestle",
    "heineken",
    "heineken group",
    "bmw",
    "mercedes",
    "volkswagen",
    "toyota",
    "honda",
    "samsung",
    "lg",
    "sony",
    "panasonic",
    "siemens",
    "bosch",
    "walmart",
    "target",
    "ikea",
    "zara",
    "h&m",
    "nike",
    "adidas",
    "puma",
];

const KNOWN_SKILLS = [
    "javascript",
    "typescript",
    "python",
    "java",
    "c++",
    "c#",
    "go",
    "rust",
    "php",
    "ruby",
    "swift",
    "kotlin",
    "scala",
    "r",
    "matlab",
    "sql",
    "html",
    "css",

    // Frameworks & Libraries
    "react",
    "angular",
    "vue",
    "svelte",
    "next.js",
    "nextjs",
    "node.js",
    "nodejs",
    "express",
    "django",
    "flask",
    "spring",
    "laravel",
    "rails",
    ".net",
    "react native",
    "flutter",
    "ionic",

    // Tools & Technologies
    "docker",
    "kubernetes",
    "aws",
    "azure",
    "gcp",
    "terraform",
    "jenkins",
    "git",
    "mongodb",
    "postgresql",
    "mysql",
    "redis",
    "elasticsearch",
    "graphql",
    "rest api",

    // Soft Skills
    "leadership",
    "management",
    "communication",
    "teamwork",
    "problem solving",
    "critical thinking",
    "project management",
    "agile",
    "scrum",
    "kanban",
    "presentation",
    "negotiation",
    "sales",
    "marketing",
    "analytics",
    "strategy",
    "planning",
    "organization",
    "time management",

    // Business Skills
    "data analysis",
    "business intelligence",
    "financial analysis",
    "accounting",
    "hr",
    "recruitment",
    "training",
    "customer service",
    "operations",
    "supply chain",
    "logistics",
    "procurement",

    // Design
    "ui design",
    "ux design",
    "graphic design",
    "figma",
    "sketch",
    "adobe xd",
    "photoshop",
    "illustrator",
    "branding",
    "web design",
];

// Industries
const KNOWN_INDUSTRIES = [
    "technology",
    "tech",
    "software",
    "it",
    "information technology",
    "finance",
    "banking",
    "fintech",
    "investment",
    "insurance",
    "healthcare",
    "medical",
    "pharmaceutical",
    "biotech",
    "health",
    "education",
    "edtech",
    "e-learning",
    "training",
    "marketing",
    "advertising",
    "digital marketing",
    "social media",
    "design",
    "creative",
    "ux",
    "ui",
    "engineering",
    "mechanical",
    "electrical",
    "civil",
    "automotive",
    "sales",
    "business development",
    "crm",
    "human resources",
    "hr",
    "recruitment",
    "talent acquisition",
    "consulting",
    "management consulting",
    "strategy",
    "manufacturing",
    "production",
    "industrial",
    "retail",
    "e-commerce",
    "online shopping",
    "consumer goods",
    "real estate",
    "property",
    "construction",
    "energy",
    "renewable energy",
    "oil",
    "gas",
    "telecommunications",
    "telecom",
    "5g",
    "transportation",
    "logistics",
    "supply chain",
    "hospitality",
    "tourism",
    "travel",
    "hotel",
    "media",
    "entertainment",
    "gaming",
    "film",
    "music",
    "food",
    "beverage",
    "restaurant",
    "catering",
    "legal",
    "law",
    "compliance",
    "regulatory",
];

interface ContentAnalysis {
    detectedCompanies: string[];
    detectedSkills: string[];
    detectedIndustries: string[];
}

/**
 * Analyzes post content and detects companies, skills, and industries
 */
export function analyzePostContent(content: string): ContentAnalysis {
    const lowerContent = content.toLowerCase();
    const words = lowerContent.split(/\s+/);

    const detectedCompanies = new Set<string>();
    const detectedSkills = new Set<string>();
    const detectedIndustries = new Set<string>();

    // Detect companies
    KNOWN_COMPANIES.forEach((company) => {
        const companyLower = company.toLowerCase();
        // Check for exact word match or within phrases
        if (lowerContent.includes(companyLower)) {
            // Verify it's not part of another word
            const regex = new RegExp(`\\b${companyLower.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
            if (regex.test(lowerContent)) {
                detectedCompanies.add(company);
            }
        }
    });

    // Detect skills - check for multi-word skills first
    const multiWordSkills = KNOWN_SKILLS.filter((s) => s.includes(" "));
    multiWordSkills.forEach((skill) => {
        if (lowerContent.includes(skill.toLowerCase())) {
            detectedSkills.add(skill);
        }
    });

    // Then single-word skills
    const singleWordSkills = KNOWN_SKILLS.filter((s) => !s.includes(" "));
    singleWordSkills.forEach((skill) => {
        const skillLower = skill.toLowerCase();
        // Check for word boundaries to avoid partial matches
        const regex = new RegExp(`\\b${skillLower.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`);
        if (regex.test(lowerContent)) {
            detectedSkills.add(skill);
        }
    });

    // Detect industries
    KNOWN_INDUSTRIES.forEach((industry) => {
        const industryLower = industry.toLowerCase();
        if (lowerContent.includes(industryLower)) {
            // For multi-word industries, just check inclusion
            if (industry.includes(" ")) {
                detectedIndustries.add(industry);
            } else {
                // For single words, check word boundaries
                const regex = new RegExp(`\\b${industryLower}\\b`);
                if (regex.test(lowerContent)) {
                    detectedIndustries.add(industry);
                }
            }
        }
    });

    return {
        detectedCompanies: Array.from(detectedCompanies),
        detectedSkills: Array.from(detectedSkills),
        detectedIndustries: Array.from(detectedIndustries),
    };
}

/**
 * Calculates relevance score between user preferences and post content
 */
export function calculateRelevanceScore(
    userPreferences: {
        industries: string[];
        skills: string[];
        companies: string[];
    },
    postAnalysis: ContentAnalysis,
    authorProfile?: {
        headline?: string;
        skills?: Array<{ name: string }>;
    },
): number {
    let score = 0;

    // Match detected companies in post with user's followed companies
    userPreferences.companies.forEach((companyId) => {
        if (
            postAnalysis.detectedCompanies.some(
                (detected) =>
                    detected.toLowerCase().includes(companyId.toLowerCase()) ||
                    companyId.toLowerCase().includes(detected.toLowerCase()),
            )
        ) {
            score += 10; // Very high weight for company mentions
        }
    });

    // Match detected skills in post with user's skills
    const userSkillsLower = userPreferences.skills.map((s) => s.toLowerCase());
    postAnalysis.detectedSkills.forEach((skill) => {
        if (
            userSkillsLower.some(
                (userSkill) => skill.toLowerCase().includes(userSkill) || userSkill.includes(skill.toLowerCase()),
            )
        ) {
            score += 5; // High weight for skill matches
        }
    });

    // Match detected industries in post with user's industries
    const userIndustriesLower = userPreferences.industries.map((i) => i.toLowerCase());
    postAnalysis.detectedIndustries.forEach((industry) => {
        if (
            userIndustriesLower.some(
                (userInd) => industry.toLowerCase().includes(userInd) || userInd.includes(industry.toLowerCase()),
            )
        ) {
            score += 3; // Medium weight for industry matches
        }
    });

    // Match author's profile
    if (authorProfile) {
        // Check author headline for user's interests
        if (authorProfile.headline) {
            const headlineLower = authorProfile.headline.toLowerCase();
            userPreferences.industries.forEach((industry) => {
                if (headlineLower.includes(industry.toLowerCase())) {
                    score += 2;
                }
            });
            userPreferences.skills.forEach((skill) => {
                if (headlineLower.includes(skill.toLowerCase())) {
                    score += 2;
                }
            });
        }

        // Check author's skills
        if (authorProfile.skills) {
            authorProfile.skills.forEach((authorSkill) => {
                if (
                    userPreferences.skills.some(
                        (userSkill) =>
                            authorSkill.name.toLowerCase().includes(userSkill.toLowerCase()) ||
                            userSkill.toLowerCase().includes(authorSkill.name.toLowerCase()),
                    )
                ) {
                    score += 2;
                }
            });
        }
    }

    return score;
}

/**
 * Example usage for the post: "Byłem wczoraj na rekrutacji w Heineken Group, oto moje przemyślenia"
 * Would detect:
 * - detectedCompanies: ["heineken", "heineken group"]
 * - If user follows Heineken or has "beverage"/"food" industries → HIGH SCORE
 */
