import mongoose, { Schema, models } from "mongoose";

const commentSchema = new Schema({
    content: {
        type: String,
        required: [true, "Please provide content"],
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        indedx: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const photoSchema = new Schema({
    filename: {
        type: String,
        required: true,
    },
    description: {
        type: String,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    comments: [commentSchema],
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

export default models.Photo || mongoose.model("Photo", photoSchema);
