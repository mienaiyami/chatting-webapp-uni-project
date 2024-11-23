import mongoose from "mongoose";

const userContactsSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        contacts: [
            {
                userId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "User",
                },
                nickname: {
                    type: String,
                    default: "",
                },
                note: {
                    type: String,
                    default: "",
                },
            },
        ],
    },
    {
        timestamps: true,
    }
);

export type FormattedContact = {
    userId: {
        _id: mongoose.Types.ObjectId;
        username: string;
        avatarUrl: string;
        email: string;
    };
    nickname: string;
    note: string;
};
export default mongoose.model("UserContacts", userContactsSchema);
