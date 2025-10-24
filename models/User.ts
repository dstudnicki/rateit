import mongoose, { Schema, models } from "mongoose";

const userSchema = new Schema({
    email: {
        type: String,
        required: [true, "Please provide an email"],
        unique: true,
    },
    password: {
        type: String,
        required: [true, "Please provide a password"],
    },
});

export default models.User || mongoose.model("User", userSchema);
