// using ChatMessage schema for now
// import mongoose from "mongoose";

// const groupMessageSchema = new mongoose.Schema(
//     {
//         groupId: {
//             type: mongoose.Schema.Types.ObjectId,
//             ref: "Group",
//             required: true,
//         },
//         senderId: {
//             type: mongoose.Schema.Types.ObjectId,
//             ref: "User",
//             required: true,
//         },
//         text: {
//             type: String,
//             required: true,
//         },
//         mediaUrl: {
//             type: String,
//             default: "",
//         },
//         deletedAt: {
//             type: Date,
//             default: null,
//         },
//     },
//     {
//         timestamps: true,
//     }
// );

// export default mongoose.model("GroupMessage", groupMessageSchema);
