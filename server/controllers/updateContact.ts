// import mongoose from "mongoose";
// import { ApiError, getUserFromReq } from "../helpers/index";
// import User from "../models/User";
// import UserContacts, { FormattedContact } from "../models/UserContacts";

// export default async (req, res) => {
//     try {
//         const user = await getUserFromReq(req);
//         if (!user) throw new ApiError(401, "Unauthorized");
//         const { userId, note, nickname, action } = req.body;
//         if (!userId) throw new ApiError(400, "User ID is required");
//         if (!action) throw new ApiError(400, "Action is required");
//         if (!mongoose.Types.ObjectId.isValid(userId)) {
//             throw new ApiError(400, "Invalid User ID format");
//         }
//         let update, message;
//         if (action === "remove") {
//             update = { $pull: { contacts: { userId } } };
//             message = "Contact removed successfully";
//         } else if (action === "add") {
//             if (
//                 await UserContacts.findOne({
//                     user: user._id,
//                     "contacts.userId": userId,
//                 })
//             ) {
//                 update = {};
//                 message = "Contact already exists";
//             } else {
//                 update = {
//                     $addToSet: {
//                         contacts: {
//                             userId,
//                             note: note || "",
//                             nickname: nickname || "",
//                         },
//                     },
//                 };
//                 message = "Contact added successfully";
//             }
//         } else {
//             throw new ApiError(400, "Invalid action");
//         }
//         const contactsCol = await UserContacts.findOneAndUpdate(
//             { user: user._id },
//             update,
//             { new: true, upsert: action === "add" }
//         ).populate<{ contacts: FormattedContact[] }>(
//             "contacts.userId",
//             "username email avatarUrl"
//         );

//         if (!contactsCol) {
//             throw new ApiError(500, "Failed to update contacts");
//         }
//         const formattedContacts =
//             contactsCol.contacts?.map((contact) => ({
//                 userId: contact.userId._id,
//                 username: contact.userId.username,
//                 email: contact.userId.email,
//                 avatarUrl: contact.userId.avatarUrl,
//                 nickname: contact.nickname,
//                 note: contact.note,
//             })) || [];
//         return res.status(200).json({
//             contacts: formattedContacts,
//             message,
//         });
//     } catch (error: any) {
//         return res.status(error.statusCode || 500).json({
//             error: true,
//             message: error.message || "Internal Server Error",
//         });
//     }
// };
