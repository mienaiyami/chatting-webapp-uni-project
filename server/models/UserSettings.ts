import mongoose from "mongoose";

const userSettingsSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        theme: {
            type: String,
            default: "dark",
        },
        accent: {
            type: String,
            default: "",
        },
        readReceipts: {
            type: Boolean,
            default: true,
        },
        lastSeen: {
            type: Boolean,
            default: true,
        },
        reducedMotion: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

export default mongoose.model("UserSettings", userSettingsSchema);
