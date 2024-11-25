import mongoose, { now } from "mongoose";

const chatMessageSchema = new mongoose.Schema(
    {
        chatId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Chat",
            required: true,
        },
        senderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        repliedTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "ChatMessage",
            default: null,
            validate: {
                validator: async function (
                    value: mongoose.Types.ObjectId | undefined
                ) {
                    if (!value) return true;

                    const MessageModel = mongoose.model("ChatMessage");
                    const referencedMsg = await MessageModel.findById(value);
                    return referencedMsg && !referencedMsg.deletedAt;
                },
                message:
                    "Referenced message does not exist or has been deleted",
            },
        },
        text: {
            type: String,
            required: true,
        },
        mediaUrl: {
            type: String,
            default: "",
        },
        deletedAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

export default mongoose.model("ChatMessage", chatMessageSchema);
