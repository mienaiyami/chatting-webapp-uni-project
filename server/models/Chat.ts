import mongoose from "mongoose";

const chatSchema = new mongoose.Schema(
    {
        members: {
            type: [
                {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "User",
                    required: true,
                },
            ],
            validate: [
                {
                    validator: (members: mongoose.Types.ObjectId[]) =>
                        members.length === 2,
                    message: "Chat must have exactly two members.",
                },
                {
                    validator: (members: mongoose.Types.ObjectId[]) => {
                        const uniqueMembers = new Set(
                            members.map((member) => member.toString())
                        );
                        return uniqueMembers.size === members.length;
                    },
                    message: "Members must be unique.",
                },
            ],
            required: true,
        },
        messages: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: `ChatMessage`,
            },
        ],
        mutedBy: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],
        closed: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

export default mongoose.model("Chat", chatSchema);
