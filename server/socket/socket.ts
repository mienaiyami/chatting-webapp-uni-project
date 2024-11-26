import { Server, Socket } from "socket.io";
import cors from "cors";
import express from "express";
import cookieParser from "cookie-parser";
import { createServer } from "http";
import User from "../models/User";
import config from "../config/config";
import { socketAuth } from "../middleware/socketAuth";
import { SOCKET_EVENTS } from "./events";
import mongoose from "mongoose";
import Chat from "../models/Chat";
import ChatMessage from "../models/ChatMessage";
import UserContacts, { FormattedContact } from "../models/UserContacts";
import Group from "../models/Group";

const app = express();
app.use(cookieParser());
app.use(express.json());
const corsOptions = {
    origin: "*",
    // origin: config.FRONTEND_URL,
    credentials: true,
};
app.use(cors(corsOptions));
const server = createServer(app);
const io = new Server(server, {
    cors: corsOptions,
});
io.use(socketAuth);

const onlineUsers = new Set<string>();

io.on("connection", async (socket) => {
    const userId: string = socket.data.userId;
    console.log("User connected", userId);
    onlineUsers.add(userId);

    const userContacts = await UserContacts.findOne({ user: userId });
    if (userContacts) {
        const contactIds = userContacts.contacts.map((contact) =>
            contact.userId.toString()
        );
        contactIds.forEach((contactId) => {
            //todo test
            socket.to(contactId).emit(SOCKET_EVENTS.USER_ONLINE, { userId });
        });
    }

    socket.on(SOCKET_EVENTS.GET_ONLINE_CONTACTS, async () => {
        const userContacts = await UserContacts.findOne({ user: userId });
        if (userContacts) {
            const onlineContactIds = userContacts.contacts
                .map((contact) => contact.userId.toString())
                .filter((contactId) => onlineUsers.has(contactId));

            socket.emit(SOCKET_EVENTS.ONLINE_CONTACTS, { onlineContactIds });
        }
    });

    await User.findByIdAndUpdate(userId, { lastSeen: new Date() });

    socket.join(userId);

    socket.on(SOCKET_EVENTS.JOIN_ROOM, async (chatId: string) => {
        if (!mongoose.Types.ObjectId.isValid(chatId)) return;
        const chat = await Chat.findOne({
            _id: chatId,
            members: userId,
        }).populate({
            path: "messages",
            match: { deletedAt: null },
            populate: {
                path: "repliedTo",
                model: "ChatMessage",
            },
        });

        if (!chat) return;
        socket.join(chatId);
        socket.emit(SOCKET_EVENTS.MESSAGES, {
            messages: chat.messages || [],
        });
    });

    socket.on(
        SOCKET_EVENTS.NEW_MESSAGE,
        async (data: {
            chatId: string;
            text: string;
            tempId?: string;
            repliedTo?: string;
        }) => {
            if (!mongoose.Types.ObjectId.isValid(data.chatId)) return;
            const chat = await Chat.findOne({
                _id: data.chatId,
                members: userId,
            });
            if (!chat) return;

            const message = await ChatMessage.create({
                chatId: data.chatId,
                senderId: userId,
                text: data.text,
                repliedTo: data.repliedTo
                    ? new mongoose.Types.ObjectId(data.repliedTo)
                    : null,
            });
            await message.populate("repliedTo");
            await Chat.findByIdAndUpdate(data.chatId, {
                $push: { messages: message._id },
            });

            socket.emit(SOCKET_EVENTS.NEW_MESSAGE, {
                ...message.toJSON(),
                tempId: data.tempId,
            });

            chat.members.forEach((memberId) => {
                const memberIdString = memberId.toString();
                if (memberIdString !== userId) {
                    socket.to(memberIdString).emit(SOCKET_EVENTS.NEW_MESSAGE, {
                        ...message.toJSON(),
                    });
                }
            });
        }
    );

    socket.on(SOCKET_EVENTS.USER_TYPING, async (chatId: string) => {
        if (!mongoose.Types.ObjectId.isValid(chatId)) return;

        const chat = await Chat.findOne({ _id: chatId, members: userId });
        if (!chat) return;

        socket.to(chatId).emit(SOCKET_EVENTS.USER_TYPING, { userId });
    });

    socket.on(SOCKET_EVENTS.USER_STOP_TYPING, async (chatId: string) => {
        if (!mongoose.Types.ObjectId.isValid(chatId)) return;

        const chat = await Chat.findOne({ _id: chatId, members: userId });
        if (!chat) return;

        socket.to(chatId).emit(SOCKET_EVENTS.USER_STOP_TYPING, { userId });
    });

    socket.on(SOCKET_EVENTS.LEAVE_ROOM, (chatId: string) => {
        socket.leave(chatId);
    });

    socket.on("disconnect", async () => {
        onlineUsers.delete(userId);

        const userContacts = await UserContacts.findOne({ user: userId });
        if (userContacts) {
            const contactIds = userContacts.contacts.map((contact) =>
                contact.userId.toString()
            );
            contactIds.forEach((contactId) => {
                socket
                    .to(contactId)
                    .emit(SOCKET_EVENTS.USER_OFFLINE, { userId });
            });
        }

        await User.findByIdAndUpdate(userId, { lastSeen: new Date() });
    });

    socket.on(SOCKET_EVENTS.GET_CHATS_AND_GROUPS, async () => {
        try {
            const [chats, groups] = await Promise.all([
                Chat.find({ members: userId })
                    .populate({
                        path: "messages",
                        options: { sort: { createdAt: -1 }, limit: 1 },
                    })
                    .populate("members", "username avatarUrl")
                    .exec(),
                Group.find({ "members.user": userId })
                    .populate({
                        path: "messages",
                        options: { sort: { createdAt: -1 }, limit: 1 },
                    })
                    .populate("members.user", "username avatarUrl")
                    .exec(),
            ]);
            socket.emit(SOCKET_EVENTS.CHATS_AND_GROUPS, { chats, groups });
        } catch (error) {
            socket.emit("error", { message: error.message });
        }
    });

    socket.on(SOCKET_EVENTS.CREATE_CHAT, async ({ userId2 }) => {
        try {
            if (!mongoose.Types.ObjectId.isValid(userId2)) {
                throw new Error("Invalid User ID format");
            }

            const existingChat = await Chat.findOne({
                members: { $all: [userId, userId2] },
            });

            if (existingChat) {
                socket.emit(SOCKET_EVENTS.CHAT_CREATED, { chat: existingChat });
                return;
            }

            const newChat = await Chat.create({
                members: [userId, userId2],
            });
            await newChat.populate("members", "username avatarUrl");

            socket.emit(SOCKET_EVENTS.CHAT_CREATED, { chat: newChat });
            socket
                .to(userId2)
                .emit(SOCKET_EVENTS.CHAT_CREATED, { chat: newChat });
        } catch (error) {
            socket.emit("error", { message: error.message });
        }
    });

    socket.on(SOCKET_EVENTS.GET_MESSAGES, async ({ chatId }) => {
        try {
            const chat = await Chat.findOne({
                _id: chatId,
                members: userId,
            }).populate({
                path: "messages",
                match: { deletedAt: null },
                populate: {
                    path: "repliedTo",
                    model: "ChatMessage",
                },
            });
            socket.emit(SOCKET_EVENTS.MESSAGES, {
                messages: chat?.messages || [],
            });
        } catch (error) {
            socket.emit("error", { message: error.message });
        }
    });

    socket.on(SOCKET_EVENTS.GET_CONTACTS, async () => {
        try {
            const userContacts = await UserContacts.findOne({
                user: userId,
            }).populate<{ contacts: FormattedContact[] }>(
                "contacts.userId",
                "username email avatarUrl"
            );

            const formattedContacts =
                userContacts?.contacts?.map((contact) => ({
                    userId: contact.userId._id,
                    username: contact.userId.username,
                    email: contact.userId.email,
                    avatarUrl: contact.userId.avatarUrl,
                    nickname: contact.nickname,
                    note: contact.note,
                })) || [];

            socket.emit(SOCKET_EVENTS.CONTACTS, {
                contacts: formattedContacts,
            });
        } catch (error) {
            socket.emit("error", {
                message: error.message || "Failed to fetch contacts",
            });
        }
    });

    socket.on(
        SOCKET_EVENTS.UPDATE_CONTACT,
        async (data: {
            userId: string;
            action: "add" | "remove";
            nickname?: string;
            note?: string;
        }) => {
            try {
                const { userId: targetUserId, action, note, nickname } = data;

                if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
                    throw new Error("Invalid User ID format");
                }
                if (targetUserId === userId) {
                    throw new Error("Cannot add self as contact");
                }

                let update, message;
                if (action === "remove") {
                    update = { $pull: { contacts: { userId: targetUserId } } };
                    message = "Contact removed successfully";
                } else if (action === "add") {
                    const existingContact = await UserContacts.findOne({
                        user: userId,
                        "contacts.userId": targetUserId,
                    });

                    if (existingContact) {
                        message = "Contact already exists";
                        update = {};
                    } else {
                        update = {
                            $addToSet: {
                                contacts: {
                                    userId: targetUserId,
                                    note: note || "",
                                    nickname: nickname || "",
                                },
                            },
                        };
                        message = "Contact added successfully";
                    }
                }

                const contactsCol = await UserContacts.findOneAndUpdate(
                    { user: userId },
                    update,
                    { new: true, upsert: action === "add" }
                ).populate<{ contacts: FormattedContact[] }>(
                    "contacts.userId",
                    "username email avatarUrl"
                );

                const formattedContacts =
                    contactsCol.contacts?.map((contact) => ({
                        userId: contact.userId._id,
                        username: contact.userId.username,
                        email: contact.userId.email,
                        avatarUrl: contact.userId.avatarUrl,
                        nickname: contact.nickname,
                        note: contact.note,
                    })) || [];

                socket.emit(SOCKET_EVENTS.CONTACT_UPDATED, {
                    contacts: formattedContacts,
                    message,
                });

                // socket.to(targetUserId).emit(SOCKET_EVENTS.CONTACT_UPDATED, {
                //     userId,
                //     action,
                // });
            } catch (error) {
                socket.emit("error", { message: error.message });
            }
        }
    );

    socket.on(SOCKET_EVENTS.CLEAR_CHAT, async ({ chatId }) => {
        try {
            if (!mongoose.Types.ObjectId.isValid(chatId)) return;

            const chat = await Chat.findOne({
                _id: chatId,
                members: userId,
            });
            if (!chat) return;

            await ChatMessage.updateMany({ chatId }, { deletedAt: new Date() });

            chat.members.forEach((memberId) => {
                io.to(memberId.toString()).emit(SOCKET_EVENTS.CHAT_CLEARED, {
                    chatId,
                });
            });
        } catch (error) {
            socket.emit("error", { message: error.message });
        }
    });

    socket.on(
        SOCKET_EVENTS.DELETE_MESSAGE,
        async ({
            chatId,
            messageId,
        }: {
            chatId: string;
            messageId: string;
        }) => {
            try {
                if (
                    !mongoose.Types.ObjectId.isValid(chatId) ||
                    !mongoose.Types.ObjectId.isValid(messageId)
                ) {
                    return;
                }

                const chat = await Chat.findOne({
                    _id: chatId,
                    members: userId,
                });

                if (!chat) return;

                const message = await ChatMessage.findOne({
                    _id: messageId,
                    chatId,
                    senderId: userId,
                });

                if (!message) return;

                await ChatMessage.findByIdAndUpdate(messageId, {
                    deletedAt: new Date(),
                });

                io.to(chat.members.map((memberId) => memberId.toString())).emit(
                    SOCKET_EVENTS.MESSAGE_DELETED,
                    {
                        chatId,
                        messageId,
                    }
                );
            } catch (error) {
                socket.emit("error", { message: error.message });
            }
        }
    );
    socket.on(
        SOCKET_EVENTS.EDIT_MESSAGE,
        async ({
            chatId,
            messageId,
            text,
        }: {
            chatId: string;
            messageId: string;
            text: string;
        }) => {
            try {
                if (
                    !mongoose.Types.ObjectId.isValid(chatId) ||
                    !mongoose.Types.ObjectId.isValid(messageId)
                ) {
                    return;
                }

                const chat = await Chat.findOne({
                    _id: chatId,
                    members: userId,
                });

                if (!chat) return;

                const message = await ChatMessage.findOne({
                    _id: messageId,
                    chatId,
                    senderId: userId,
                });

                if (!message) return;

                const updatedMessage = await ChatMessage.findByIdAndUpdate(
                    messageId,
                    {
                        text,
                        modifiedAt: new Date(),
                    },
                    { new: true }
                ).populate("repliedTo");

                //todo check what happens when repliedTo message is edited, does it show up in chat
                io.to(chat.members.map((memberId) => memberId.toString())).emit(
                    SOCKET_EVENTS.MESSAGE_EDITED,
                    {
                        ...updatedMessage.toJSON(),
                    }
                );
            } catch (error) {
                socket.emit("error", { message: error.message });
            }
        }
    );
});

export { app, server, io };
