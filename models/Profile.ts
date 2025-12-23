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

export interface IProfile extends Document {
    userId: string; // Reference to Better Auth user ID
    slug?: string; // URL-friendly slug for profile (optional for backwards compatibility)
    fullName?: string;
    headline?: string;
    location?: string;
    about?: string;
    experience: IExperience[];
    education: IEducation[];
    skills: ISkill[];
    connections: number;
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

const ProfileSchema = new Schema(
    {
        userId: { type: String, required: true, unique: true, index: true },
        slug: { type: String, required: true, unique: true, index: true },
        fullName: { type: String },
        headline: { type: String },
        location: { type: String },
        about: { type: String },
        experience: [ExperienceSchema],
        education: [EducationSchema],
        skills: [SkillSchema],
        connections: { type: Number, default: 0 },
    },
    {
        timestamps: true,
    }
);

const Profile: Model<IProfile> = mongoose.models.Profile || mongoose.model<IProfile>("Profile", ProfileSchema);

export default Profile;

