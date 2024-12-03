import mongoose from "mongoose";
import { memberSchema } from "./Group";

const chatSchema = new mongoose.Schema(
    {
        members: {
            type: [memberSchema],
            validate: [
                {
                    validator: (members: any[]) => members.length === 2,
                    message: "Chat must have exactly two members.",
                },
                {
                    validator: (members: any[]) => {
                        const uniqueMembers = new Set(
                            members.map((member) => member.user.toString())
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
