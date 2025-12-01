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
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: true,
    },
    comments: [commentSchema],
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

export default models.Post || mongoose.model("Post", postSchema);
