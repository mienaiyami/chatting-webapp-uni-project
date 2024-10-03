import mongoose from "mongoose";

const groupSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        displayPicture: {
            type: String,
            default: "",
        },
        description: {
            type: String,
            default: "",
        },
        members: [
            {
                userId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "User",
                    required: true,
                },
                isAdmin: {
                    type: Boolean,
                    default: false,
                },
                joinedAt: {
                    type: Date,
                    default: Date.now,
                },
            },
        ],
        messages: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Message",
            },
        ],
    },
    {
        timestamps: true,
    }
);

export default mongoose.model("Group", groupSchema);
