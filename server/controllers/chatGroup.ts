// FILE: controllers/chatGroupController.ts

import { Request, Response } from "express";
import mongoose from "mongoose";
import Group from "../models/Group";
import { ApiError, getUserFromReq } from "../helpers/index";
import Chat from "../models/Chat";

export const getAllChatsAndGroups = async (req: Request, res: Response) => {
    try {
        const user = await getUserFromReq(req);
        if (!user) throw new ApiError(401, "Unauthorized");

        const [chats, groups] = await Promise.all([
            Chat.find({ members: user._id })
                .populate({
                    path: "messages",
                    options: { sort: { createdAt: -1 }, limit: 1 },
                })
                // .populate("members", "username email avatarUrl")
                // .populate("messages")
                .exec(),
            Group.find({ "members.user": user._id })
                .populate({
                    path: "messages",
                    options: { sort: { createdAt: -1 }, limit: 1 },
                })
                // .populate("members.user", "username email avatarUrl")
                // .populate("messages")
                .exec(),
        ]);
        console.log(chats, groups);
        return res.status(200).json({ chats, groups });
    } catch (error: any) {
        return res.status(error.statusCode || 500).json({
            error: true,
            message: error.message || "Internal Server Error",
        });
    }
};

export const createNewChat = async (req: Request, res: Response) => {
    try {
        const user = await getUserFromReq(req);
        if (!user) throw new ApiError(401, "Unauthorized");
        const userId1 = user._id;
        const { userId2 } = req.body;
        if (!userId2) {
            throw new ApiError(400, "Both user IDs are required");
        }
        if (
            !mongoose.Types.ObjectId.isValid(userId1) ||
            !mongoose.Types.ObjectId.isValid(userId2)
        ) {
            throw new ApiError(400, "Invalid User ID format");
        }
        if (userId1 === userId2) {
            throw new ApiError(400, "Cannot create chat with the same user");
        }
        // todo test
        const existingChat = await Chat.findOne({
            members: { $all: [userId1, userId2] },
        });
        if (existingChat) {
            return res.status(200).json({
                chat: existingChat,
                message: "Chat already exists",
            });
        }

        const newChat = new Chat({
            members: [userId1, userId2],
        });

        await newChat.save();
        return res.status(201).json({
            chat: newChat,
            message: "Chat created successfully",
        });
    } catch (error: any) {
        return res.status(error.statusCode || 500).json({
            error: true,
            message: error.message || "Internal Server Error",
        });
    }
};
