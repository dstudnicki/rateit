"use server";

import { revalidateTag } from "next/cache";
import { updateTag} from "next/cache";
import { getClient } from "@/lib/mongoose";
import Profile, { IExperience, IEducation } from "@/models/Profile";
import { requireUser } from "@/app/data/user/require-user";
import { generateSlug } from "@/lib/slug";

export async function getProfile(userId: string) {
    try {
        await getClient();
        const db = await getClient();
        const { ObjectId } = require('mongodb');

        let profile = await Profile.findOne({ userId }).lean();

        if (!profile) {
            let user;
            try {
                user = await db.collection("user").findOne(
                    { _id: new ObjectId(userId) },
                    { projection: { name: 1, email: 1, _id: 1 } }
                );
            } catch (e) {
                user = await db.collection("user").findOne(
                    { _id: userId as any },
                    { projection: { name: 1, email: 1, _id: 1 } }
                );
            }

            if (!user) {
                return { success: false, error: "User not found" };
            }

            const slugBase = user?.name || user?.email?.split('@')[0] || userId;
            let slug = generateSlug(slugBase);

            let counter = 1;
            while (await Profile.findOne({ slug })) {
                slug = `${generateSlug(slugBase)}-${counter}`;
                counter++;
            }

            const newProfile = await Profile.create({
                userId,
                slug,
                fullName: "",
                headline: "",
                location: "",
                about: "",
                experience: [],
                education: [],
                skills: [],
                connections: 0,
                preferences: {
                    industries: [],
                    skills: [],
                    companies: [],
                    onboardingCompleted: false,
                },
                interactionHistory: [],
            });
            profile = newProfile.toObject() as any;
        } else {
            const hasNoSlug = !profile.slug;
            const isObjectId = profile.slug && /^[0-9a-f]{24}$/i.test(profile.slug);
            const isUUID = profile.slug && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(profile.slug);

            if (hasNoSlug || isObjectId || isUUID) {
                let user;
                try {
                    user = await db.collection("user").findOne(
                        { _id: new ObjectId(userId) },
                        { projection: { name: 1, email: 1, _id: 1 } }
                    );
                } catch (e) {
                    user = await db.collection("user").findOne(
                        { _id: userId as any },
                        { projection: { name: 1, email: 1, _id: 1 } }
                    );
                }

                if (!user) {
                    await Profile.findOneAndDelete({ userId });
                    return { success: false, error: "Profile was orphaned and has been removed" };
                }

                const slugBase = user.name || user.email?.split('@')[0] || 'user';
                let slug = generateSlug(slugBase);

                let counter = 1;
                while (await Profile.findOne({ slug, userId: { $ne: userId } })) {
                    slug = `${generateSlug(slugBase)}-${counter}`;
                    counter++;
                }

                profile = await Profile.findOneAndUpdate(
                    { userId },
                    { $set: { slug } },
                    { new: true }
                ).lean() as any;
            }
        }

        return { success: true, profile: JSON.parse(JSON.stringify(profile)) };
    } catch (error) {
        console.error("Error fetching profile:", error);
        return { success: false, error: "Failed to fetch profile" };
    }
}

export async function getProfileBySlug(slug: string) {
    try {
        await getClient();
        const db = await getClient();
        const { ObjectId } = require('mongodb');

        let profile = await Profile.findOne({ slug }).lean();

        if (!profile) {
            return { success: false, error: "Profile not found" };
        }

        let user;
        try {
            user = await db.collection("user").findOne(
                { _id: new ObjectId(profile.userId) },
                { projection: { name: 1, email: 1, _id: 1, image: 1, userImage: 1 } }
            );
        } catch (e) {
            user = await db.collection("user").findOne(
                { _id: profile.userId as any },
                { projection: { name: 1, email: 1, _id: 1, image: 1, userImage: 1 } }
            );
        }

        if (!user) {
            return { success: false, error: "User not found" };
        }

        return {
            success: true,
            profile: JSON.parse(JSON.stringify(profile)),
            user: { id: user._id.toString(), name: user.name, email: user.email, image: user.userImage || user.image }
        };
    } catch (error) {
        console.error("Error fetching profile by slug:", error);
        return { success: false, error: "Failed to fetch profile" };
    }
}

export async function updateProfile(data: {
    fullName?: string;
    headline?: string;
    location?: string;
    about?: string;
    image?: string;
    backgroundImage?: string;
}) {
    const session = await requireUser();

    try {
        await getClient();

        const updateData: any = { ...data };

        if (data.fullName && data.fullName.trim()) {
            let newSlug = generateSlug(data.fullName);

            let counter = 1;
            while (await Profile.findOne({ slug: newSlug, userId: { $ne: session.user.id } })) {
                newSlug = `${generateSlug(data.fullName)}-${counter}`;
                counter++;
            }

            updateData.slug = newSlug;
        }

        const profile = await Profile.findOneAndUpdate(
            { userId: session.user.id },
            { $set: updateData },
            { new: true, upsert: true, runValidators: true }
        );

        updateTag(`profile-${session.user.id}`);

        return { success: true, profile: JSON.parse(JSON.stringify(profile)) };
    } catch (error) {
        console.error("Error updating profile:", error);
        return { success: false, error: "Failed to update profile" };
    }
}

export async function addExperience(experienceData: Omit<IExperience, "_id">) {
    const session = await requireUser();

    try {
        await getClient();

        const profile = await Profile.findOneAndUpdate(
            { userId: session.user.id },
            { $push: { experience: experienceData } },
            { new: true, upsert: true }
        );

        updateTag(`profile-${session.user.id}`);

        return { success: true, profile: JSON.parse(JSON.stringify(profile)) };
    } catch (error) {
        console.error("Error adding experience:", error);
        return { success: false, error: "Failed to add experience" };
    }
}

export async function updateExperience(experienceId: string, experienceData: Partial<IExperience>) {
    const session = await requireUser();

    try {
        await getClient();

        const profile = await Profile.findOneAndUpdate(
            { userId: session.user.id, "experience._id": experienceId },
            { $set: { "experience.$": { _id: experienceId, ...experienceData } } },
            { new: true }
        );

        if (!profile) {
            return { success: false, error: "Experience not found" };
        }

        updateTag(`profile-${session.user.id}`);

        return { success: true, profile: JSON.parse(JSON.stringify(profile)) };
    } catch (error) {
        console.error("Error updating experience:", error);
        return { success: false, error: "Failed to update experience" };
    }
}

export async function deleteExperience(experienceId: string) {
    const session = await requireUser();

    try {
        await getClient();

        const profile = await Profile.findOneAndUpdate(
            { userId: session.user.id },
            { $pull: { experience: { _id: experienceId } } },
            { new: true }
        );

        if (!profile) {
            return { success: false, error: "Profile not found" };
        }

        updateTag(`profile-${session.user.id}`);

        return { success: true, profile: JSON.parse(JSON.stringify(profile)) };
    } catch (error) {
        console.error("Error deleting experience:", error);
        return { success: false, error: "Failed to delete experience" };
    }
}

export async function addEducation(educationData: Omit<IEducation, "_id">) {
    const session = await requireUser();

    try {
        await getClient();

        const profile = await Profile.findOneAndUpdate(
            { userId: session.user.id },
            { $push: { education: educationData } },
            { new: true, upsert: true }
        );

        updateTag(`profile-${session.user.id}`);

        return { success: true, profile: JSON.parse(JSON.stringify(profile)) };
    } catch (error) {
        console.error("Error adding education:", error);
        return { success: false, error: "Failed to add education" };
    }
}

export async function updateEducation(educationId: string, educationData: Partial<IEducation>) {
    const session = await requireUser();

    try {
        await getClient();

        const profile = await Profile.findOneAndUpdate(
            { userId: session.user.id, "education._id": educationId },
            { $set: { "education.$": { _id: educationId, ...educationData } } },
            { new: true }
        );

        if (!profile) {
            return { success: false, error: "Education not found" };
        }

        updateTag(`profile-${session.user.id}`);

        return { success: true, profile: JSON.parse(JSON.stringify(profile)) };
    } catch (error) {
        console.error("Error updating education:", error);
        return { success: false, error: "Failed to update education" };
    }
}

export async function deleteEducation(educationId: string) {
    const session = await requireUser();

    try {
        await getClient();

        const profile = await Profile.findOneAndUpdate(
            { userId: session.user.id },
            { $pull: { education: { _id: educationId } } },
            { new: true }
        );

        if (!profile) {
            return { success: false, error: "Profile not found" };
        }

        updateTag(`profile-${session.user.id}`);

        return { success: true, profile: JSON.parse(JSON.stringify(profile)) };
    } catch (error) {
        console.error("Error deleting education:", error);
        return { success: false, error: "Failed to delete education" };
    }
}

export async function addSkill(name: string) {
    const session = await requireUser();

    try {
        await getClient();

        const existingProfile = await Profile.findOne({ userId: session.user.id, "skills.name": name });
        if (existingProfile) {
            return { success: false, error: "Skill already exists" };
        }

        const profile = await Profile.findOneAndUpdate(
            { userId: session.user.id },
            { $push: { skills: { name, endorsements: 0 } } },
            { new: true, upsert: true }
        );

        updateTag(`profile-${session.user.id}`);

        return { success: true, profile: JSON.parse(JSON.stringify(profile)) };
    } catch (error) {
        console.error("Error adding skill:", error);
        return { success: false, error: "Failed to add skill" };
    }
}

export async function deleteSkill(skillName: string) {
    const session = await requireUser();

    try {
        await getClient();

        const profile = await Profile.findOneAndUpdate(
            { userId: session.user.id },
            { $pull: { skills: { name: skillName } } },
            { new: true }
        );

        if (!profile) {
            return { success: false, error: "Profile not found" };
        }

        updateTag(`profile-${session.user.id}`);

        return { success: true, profile: JSON.parse(JSON.stringify(profile)) };
    } catch (error) {
        console.error("Error deleting skill:", error);
        return { success: false, error: "Failed to delete skill" };
    }
}

export async function endorseSkill(userId: string, skillName: string) {
    const session = await requireUser();

    try {
        await getClient();

        if (session.user.id === userId) {
            return { success: false, error: "Cannot endorse your own skills" };
        }

        const profile = await Profile.findOneAndUpdate(
            { userId, "skills.name": skillName },
            { $inc: { "skills.$.endorsements": 1 } },
            { new: true }
        );

        if (!profile) {
            return { success: false, error: "Skill not found" };
        }

        updateTag(`profile-${userId}`);

        return { success: true, profile: JSON.parse(JSON.stringify(profile)) };
    } catch (error) {
        console.error("Error endorsing skill:", error);
        return { success: false, error: "Failed to endorse skill" };
    }
}

