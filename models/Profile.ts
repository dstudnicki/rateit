import mongoose, { Schema, Document, Model } from "mongoose";

export interface IExperience {
    title: string;
    company: string;
    location: string;
    startDate: string;
    endDate?: string;
    current: boolean;
    description: string;
}

export interface IEducation {
    school: string;
    degree: string;
    field: string;
    startDate: string;
    endDate: string;
    grade?: string;
    activities?: string;
}

export interface ISkill {
    name: string;
    endorsements: number;
}

export interface IInteraction {
    type: "like" | "comment" | "view";
    targetId: string;
    targetType: "post" | "company" | "profile";
    timestamp: Date;
}

export interface IPreferences {
    industries: string[];
    skills: string[];
    companies: string[]; // Company IDs user wants to follow
    onboardingCompleted: boolean;
}

export interface IProfile extends Document {
    userId: string; // Reference to Better Auth user ID
    slug?: string; // URL-friendly slug for profile (optional for backwards compatibility)
    fullName?: string;
    image?: string; // Avatar URL (from OAuth or uploaded)
    userImage?: string;
    backgroundImage?: string; // Profile banner/background image
    headline?: string;
    location?: string;
    about?: string;
    experience: IExperience[];
    education: IEducation[];
    skills: ISkill[];
    connections: number;
    preferences: IPreferences;
    interactionHistory: IInteraction[];
    createdAt: Date;
    updatedAt: Date;
}

const ExperienceSchema = new Schema<IExperience>({
    title: { type: String, required: true },
    company: { type: String, required: true },
    location: { type: String, required: true },
    startDate: { type: String, required: true },
    endDate: { type: String },
    current: { type: Boolean, default: false },
    description: { type: String, required: true },
});

const EducationSchema = new Schema<IEducation>({
    school: { type: String, required: true },
    degree: { type: String, required: true },
    field: { type: String, required: true },
    startDate: { type: String, required: true },
    endDate: { type: String, required: true },
    grade: { type: String },
    activities: { type: String },
});

const SkillSchema = new Schema<ISkill>({
    name: { type: String, required: true },
    endorsements: { type: Number, default: 0 },
});

const InteractionSchema = new Schema<IInteraction>({
    type: { type: String, enum: ["like", "comment", "view"], required: true },
    targetId: { type: String, required: true },
    targetType: { type: String, enum: ["post", "company", "profile"], required: true },
    timestamp: { type: Date, default: Date.now },
});

const PreferencesSchema = new Schema<IPreferences>({
    industries: { type: [String], default: [] },
    skills: { type: [String], default: [] },
    companies: { type: [String], default: [] },
    onboardingCompleted: { type: Boolean, default: false },
});

const ProfileSchema = new Schema(
    {
        userId: { type: String, required: true, unique: true },
        slug: { type: String, required: true, unique: true },
        fullName: { type: String },
        image: { type: String },
        backgroundImage: { type: String },
        headline: { type: String },
        location: { type: String },
        about: { type: String },
        experience: [ExperienceSchema],
        education: [EducationSchema],
        skills: [SkillSchema],
        connections: { type: Number, default: 0 },
        preferences: {
            type: PreferencesSchema,
            default: () => ({ industries: [], skills: [], companies: [], onboardingCompleted: false }),
        },
        interactionHistory: { type: [InteractionSchema], default: [] },
        rodoConsent: { type: Boolean, default: false },
        rodoConsentSource: { type: String, enum: ["manual", "oauth"] },
    },
    {
        timestamps: true,
    },
);

const Profile: Model<IProfile> = mongoose.models.Profile || mongoose.model<IProfile>("Profile", ProfileSchema);

export default Profile;
