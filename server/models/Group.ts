import mongoose from "mongoose";

export const memberSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        joinedAt: {
            type: Date,
            default: Date.now,
        },
        role: {
            type: String,
            enum: ["admin", "member"],
            default: "member",
            index: true,
        },
    },
    { _id: false }
);

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
        members: {
            type: [memberSchema],
            validate: [
                {
                    validator: (members: any[]) => members.length > 0,
                    message: "Group must have at least 1 member.",
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
                ref: "Message",
            },
        ],
    },
    {
        timestamps: true,
        methods: {
            isMember(userId: string) {
                return this.members.some(
                    (member: any) => member.user.toString() === userId
                );
            },
            isAdmin(userId: string) {
                return this.members.some(
                    (member: any) =>
                        member.user.toString() === userId &&
                        member.role === "admin"
                );
            },
        },
    }
);

export default mongoose.model("Group", groupSchema);
