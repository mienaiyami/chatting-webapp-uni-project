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

export default mongoose.model("UserContacts", userContactsSchema);
