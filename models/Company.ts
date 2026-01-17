import mongoose, { Schema, models } from "mongoose";

const commentSchema = new Schema({
    content: {
        type: String,
        required: [true, "Please provide content"],
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: true,
    },
    nick: {
        type: String,
        required: true,
        trim: true,
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
                type: mongoose.Schema.Types.ObjectId,
                ref: "user",
                required: true,
            },
            nick: {
                type: String,
                required: true,
                trim: true,
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

const reviewSchema = new Schema({
    title: {
        type: String,
        required: [true, "Please provide a title"],
    },
    content: {
        type: String,
        required: [true, "Please provide review content"],
    },
    rating: {
        type: Number,
        required: [true, "Please provide a rating"],
        min: 1,
        max: 5,
    },
    role: {
        type: String,
        required: [true, "Please provide your role"],
    },
    reviewType: {
        type: String,
        enum: ["work", "interview"],
        default: "work",
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: true,
    },
    nick: {
        type: String,
        required: true,
        trim: true,
    },
    likes: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "user",
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

const companySchema = new Schema({
    name: {
        type: String,
        required: [true, "Please provide company name"],
        trim: true,
    },
    slug: {
        type: String,
        unique: true,
        sparse: true, // Allows null/undefined values, but enforces uniqueness when set
        trim: true,
        lowercase: true,
    },
    logo: {
        type: String, // Company logo URL from Vercel Blob
    },
    location: {
        type: String,
        required: [true, "Please provide location"],
        trim: true,
    },
    industry: {
        type: String,
        required: [true, "Please provide industry"],
        trim: true,
    },
    website: {
        type: String,
        trim: true,
    },
    description: {
        type: String,
        trim: true,
    },
    // Auto-detected keywords for content matching from reviews
    detectedKeywords: [
        {
            type: String, // Skills, technologies, benefits mentioned in reviews
        },
    ],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: true,
    },
    reviews: [reviewSchema],
    averageRating: {
        type: Number,
        default: 0,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
    },
});

// Index for search and filtering
companySchema.index({ name: 1 });
companySchema.index({ industry: 1 });
companySchema.index({ location: 1 });
companySchema.index({ averageRating: -1 });

// Use proper model pattern for Next.js hot reload
const Company = models.Company || mongoose.model("Company", companySchema);

export default Company;
