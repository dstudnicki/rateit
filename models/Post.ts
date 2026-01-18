import mongoose, { Schema, models } from "mongoose";

const commentSchema = new Schema({
    content: {
        type: String,
        required: [true, "Please provide content"],
    },
    user: {
        type: Schema.Types.Mixed, // Can be ObjectId or string "deleted-user"
        required: true,
    },
    likes: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "user",
        },
    ],
    replies: [
        {
            content: {
                type: String,
                required: [true, "Please provide content"],
            },
            user: {
                type: Schema.Types.Mixed, // Can be ObjectId or string "deleted-user"
                required: true,
            },
            likes: [
                {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "user",
                },
            ],
            createdAt: {
                type: Date,
                default: Date.now,
            },
        },
    ],
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const postSchema = new Schema({
    content: {
        type: String,
        required: [true, "Please provide content"],
    },
    user: {
        type: Schema.Types.Mixed, // Can be ObjectId or string "deleted-user"
        required: true,
    },
    images: [
        {
            type: String, // URLs to images in Vercel Blob
        },
    ],
    likes: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "user",
        },
    ],
    // Auto-detected tags for content matching
    detectedCompanies: [
        {
            type: String, // Company names mentioned in content
        },
    ],
    detectedSkills: [
        {
            type: String, // Skills mentioned (JavaScript, React, etc.)
        },
    ],
    detectedIndustries: [
        {
            type: String, // Industries mentioned (Technology, Finance, etc.)
        },
    ],
    comments: [commentSchema],
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
    },
});

export default models.Post || mongoose.model("Post", postSchema);
