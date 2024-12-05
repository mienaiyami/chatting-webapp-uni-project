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
import path from "path";
import fs from "fs";
import { group } from "console";

const UPLOAD_DIR = path.join(process.cwd(), "/storage/uploads");
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const MAX_FILE_SIZE = 100 * 1024 * 1024;

const app = express();
app.use(cookieParser());
app.use(express.json());

app.use("/uploads", express.static(UPLOAD_DIR));

const corsOptions = {
    origin: "*",
    // origin: config.FRONTEND_URL,
    credentials: true,
};
app.use(cors(corsOptions));
const server = createServer(app);
const io = new Server(server, {
    cors: corsOptions,
    maxHttpBufferSize: MAX_FILE_SIZE,
});
io.use(socketAuth);

const onlineUsers = new Set<string>();

io.on("connection", async (socket) => {
    const userId: string = socket.data.userId;
    onlineUsers.add(userId);

    const userContacts = await UserContacts.findOne({ user: userId });
    if (userContacts) {
        const contactIds = userContacts.contacts.map((contact) =>
            contact.userId.toString()
        );
        contactIds.forEach((contactId) => {
            socket.to(contactId).emit(SOCKET_EVENTS.USER_ONLINE, { userId });
        });
    }
    socket.onAny((a) => {
        console.log(`EVENT: ${a} FROM : ${userId}`);
    });

    await User.findByIdAndUpdate(userId, { lastSeen: new Date() });

    socket.join(userId);

    socket.on(SOCKET_EVENTS.JOIN_ROOM, async (chatId: string) => {
        try {
            if (!mongoose.Types.ObjectId.isValid(chatId)) return;

            const [chat, group] = await Promise.all([
                Chat.findOne({
                    _id: chatId,
                    "members.user": userId,
                }).populate({
                    path: "messages",
                    match: { deletedAt: null },
                    populate: {
                        path: "repliedTo",
                        model: "ChatMessage",
                    },
                }),
                Group.findOne({
                    _id: chatId,
                    "members.user": userId,
                }).populate({
                    path: "messages",
                    match: { deletedAt: null },
                    populate: {
                        path: "repliedTo",
                        model: "ChatMessage",
                    },
                }),
            ]);

            const conversation = chat || group;
            if (!conversation) {
                socket.emit("error", {
                    message: "Conversation not found or access denied.",
                });
                return;
            }

            socket.join(chatId);
            socket.emit(SOCKET_EVENTS.MESSAGES, {
                messages: conversation.messages || [],
            });
        } catch (error) {
            socket.emit("error", { message: error.message });
        }
    });

    socket.on(SOCKET_EVENTS.GET_ONLINE_CONTACTS, async () => {
        const userContacts = await UserContacts.findOne({ user: userId });
        if (userContacts) {
            const onlineContactIds = userContacts.contacts
                .map((contact) => contact.userId.toString())
                .filter((contactId) => onlineUsers.has(contactId));

            socket.emit(SOCKET_EVENTS.ONLINE_CONTACTS, { onlineContactIds });
        }
    });
    socket.on(
        SOCKET_EVENTS.NEW_MESSAGE,
        async (
            data: {
                chatId: string;
                text: string;
                tempId?: string;
                repliedTo?: string;
                attachment?: {
                    fType: "image" | "video" | "audio" | "file";
                    name: string;
                    mimeType?: string;
                    size?: number;
                };
            },
            file: Buffer | null
        ) => {
            let filePath: string | null = null;
            try {
                const { chatId, text, tempId, repliedTo, attachment } = data;

                if (!mongoose.Types.ObjectId.isValid(chatId)) return;
                const [chat, group] = await Promise.all([
                    Chat.findOne({
                        _id: chatId,
                        "members.user": userId,
                    }),
                    Group.findOne({
                        _id: chatId,
                        "members.user": userId,
                    }),
                ]);
                const conversation = chat || group;
                if (!conversation) {
                    socket.emit("error", {
                        message: "Conversation not found or access denied.",
                    });
                    return;
                }
                let attachmentUrl: string | null = null;
                let mimeType: string | null = null;
                let size: number | null = null;
                if (attachment && file) {
                    // const allowedTypes = [
                    //     "image/",
                    //     "video/",
                    //     "audio/",
                    //     "application/",
                    // ];
                    // const isValidType = allowedTypes.some((type) =>
                    //     attachment.mimeType.startsWith(type)
                    // );
                    // if (!isValidType) {
                    //     socket.emit("error", {
                    //         message: "Unsupported file type.",
                    //     });
                    //     return;
                    // }

                    if (attachment.size > MAX_FILE_SIZE) {
                        socket.emit("error", {
                            message: "File size exceeds the limit of 100MB.",
                        });
                        return;
                    }

                    mimeType = attachment.mimeType;
                    size = attachment.size;

                    const fileExt = path.extname(attachment.name);
                    const uniqueFileName = `${globalThis.crypto.randomUUID()}${fileExt}`;
                    filePath = path.join(UPLOAD_DIR, uniqueFileName);
                    fs.writeFileSync(filePath, file);

                    attachmentUrl = `/uploads/${uniqueFileName}`;
                }
                const message = await ChatMessage.create({
                    chatId: chatId,
                    senderId: userId,
                    text: text || attachment.name,
                    repliedTo: repliedTo
                        ? new mongoose.Types.ObjectId(repliedTo)
                        : null,
                    attachment: attachment
                        ? {
                              fType: attachment.fType,
                              url: attachmentUrl || null,
                              mimeType: mimeType,
                              size: size,
                              name: attachment.name,
                          }
                        : null,
                });
                await message.populate("repliedTo");

                if (chat) {
                    await Chat.findByIdAndUpdate(chatId, {
                        $push: { messages: message._id },
                    });
                } else if (group) {
                    await Group.findByIdAndUpdate(chatId, {
                        $push: { messages: message._id },
                    });
                }

                socket.emit(SOCKET_EVENTS.NEW_MESSAGE, {
                    ...message.toJSON(),
                    tempId: tempId || null,
                });

                socket
                    .to(
                        conversation.members
                            .filter(
                                (member) => member.user.toString() !== userId
                            )
                            .map((member) => member.user.toString())
                    )
                    .emit(SOCKET_EVENTS.NEW_MESSAGE, {
                        ...message.toJSON(),
                    });
            } catch (error) {
                if (filePath) {
                    if (fs.existsSync(filePath)) {
                        fs.unlinkSync(filePath);
                    }
                }
                socket.emit("error", { message: error.message });
            }
        }
    );
    socket.on(SOCKET_EVENTS.GET_MESSAGES, async ({ chatId }) => {
        try {
            console.time("get messages");
            const [chat, group] = await Promise.all([
                Chat.findOne({
                    _id: chatId,
                    "members.user": userId,
                }),
                Group.findOne({
                    _id: chatId,
                    "members.user": userId,
                }),
            ]);
            const conversation = chat || group;
            if (!conversation) {
                socket.emit("error", {
                    message: "Conversation not found or access denied.",
                });
                return;
            }
            const messages = await ChatMessage.find({
                chatId: conversation._id,
                deletedAt: null,
            }).populate("repliedTo");

            console.timeEnd("get messages");
            socket.emit(SOCKET_EVENTS.MESSAGES, {
                messages: messages || [],
            });
        } catch (error) {
            socket.emit("error", { message: error.message });
        }
    });

    socket.on(SOCKET_EVENTS.USER_TYPING, async (chatId: string) => {
        if (!mongoose.Types.ObjectId.isValid(chatId)) return;
        const [chat, group] = await Promise.all([
            Chat.findOne({
                _id: chatId,
                "members.user": userId,
            }),
            Group.findOne({
                _id: chatId,
                "members.user": userId,
            }),
        ]);
        const conversation = chat || group;
        if (!conversation) {
            socket.emit("error", {
                message: "Conversation not found or access denied.",
            });
            return;
        }
        // console.log(chatId, socket.rooms, io.sockets.adapter.rooms.get(chatId));
        socket.to(chatId).emit(SOCKET_EVENTS.USER_TYPING, { userId });
    });

    socket.on(SOCKET_EVENTS.USER_STOP_TYPING, async (chatId: string) => {
        if (!mongoose.Types.ObjectId.isValid(chatId)) return;
        const [chat, group] = await Promise.all([
            Chat.findOne({
                _id: chatId,
                "members.user": userId,
            }),
            Group.findOne({
                _id: chatId,
                "members.user": userId,
            }),
        ]);

        const conversation = chat || group;
        if (!conversation) {
            socket.emit("error", {
                message: "Conversation not found or access denied.",
            });
            return;
        }

        socket.to(chatId).emit(SOCKET_EVENTS.USER_STOP_TYPING, { userId });
    });

    socket.on(SOCKET_EVENTS.GET_CHATS_AND_GROUPS, async () => {
        try {
            const [chats, groups] = await Promise.all([
                Chat.find({ "members.user": userId })
                    .populate({
                        path: "messages",
                        options: { sort: { createdAt: -1 }, limit: 1 },
                    })
                    .populate("members.user", "username avatarUrl")
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
            console.error(error);
            socket.emit("error", { message: error.message });
        }
    });

    socket.on(
        SOCKET_EVENTS.CREATE_CHAT,
        async (
            { userId2 },
            cb?: (response: { chat?: any; error?: string }) => void
        ) => {
            try {
                if (!mongoose.Types.ObjectId.isValid(userId2)) {
                    throw new Error("Invalid User ID format");
                }

                const existingChat = await Chat.findOne({
                    "members.user": { $all: [userId, userId2] },
                });

                if (existingChat) {
                    throw new Error("Chat already exists");
                }

                const newChat = await Chat.create({
                    members: [{ user: userId }, { user: userId2 }],
                });
                await newChat.populate({
                    path: "members.user",
                    select: "username avatarUrl",
                });
                if (cb) cb({ chat: newChat });
                socket.emit(SOCKET_EVENTS.CHAT_CREATED, { chat: newChat });
                socket
                    .to(userId2)
                    .emit(SOCKET_EVENTS.CHAT_CREATED, { chat: newChat });
            } catch (error) {
                if (cb) cb({ error: error.message });
                socket.emit("error", { message: error.message });
            }
        }
    );

    socket.on(
        SOCKET_EVENTS.CREATE_GROUP,
        async (
            data: {
                name: string;
                members: string[];
                displayPicture?: string;
            },
            cb?: (response: { group?: any; error?: string }) => void
        ) => {
            try {
                const { name, members, displayPicture } = data;
                if (!name.trim()) {
                    throw new Error("Group name is required");
                }
                if (!members.length) {
                    throw new Error("At least one member is required");
                }
                const validMembers = members.every((id) =>
                    mongoose.Types.ObjectId.isValid(id)
                );
                if (!validMembers) {
                    throw new Error("Invalid member ID format");
                }

                let displayPictureUrl = "";
                if (displayPicture) {
                    const base64Data = displayPicture.replace(
                        /^data:image\/\w+;base64,/,
                        ""
                    );
                    const buffer = Buffer.from(base64Data, "base64");
                    const fileExt =
                        displayPicture.match(/^data:image\/(\w+);base64,/)[1] ||
                        "jpg";
                    const uniqueFileName = `${globalThis.crypto.randomUUID()}.${fileExt}`;
                    const filePath = path.join(UPLOAD_DIR, uniqueFileName);
                    fs.writeFileSync(filePath, buffer);

                    displayPictureUrl = `/uploads/${uniqueFileName}`;
                }

                const newGroup = await Group.create({
                    name,
                    displayPicture: displayPictureUrl,
                    members: [
                        { user: userId, role: "admin" },
                        ...members.map((memberId) => ({
                            user: memberId,
                            role: "member",
                        })),
                    ],
                });

                await newGroup.populate({
                    path: "members.user",
                    select: "username avatarUrl",
                });

                const memberIds = [userId, ...members];
                io.to(memberIds).emit(SOCKET_EVENTS.GROUP_CREATED, {
                    group: newGroup,
                });

                if (cb) cb({ group: newGroup });
            } catch (error) {
                if (cb) cb({ error: error.message });
                socket.emit("error", { message: error.message });
            }
        }
    );
    socket.on(
        SOCKET_EVENTS.EDIT_GROUP,
        async (
            data: {
                groupId: string;
                name?: string;
                newMembers?: string[];
                displayPicture?: string;
            },
            cb?: (response: { group?: any; error?: string }) => void
        ) => {
            // members can only be added.
            try {
                const { groupId, name, newMembers, displayPicture } = data;
                if (!mongoose.Types.ObjectId.isValid(groupId)) {
                    throw new Error("Invalid Group ID format");
                }
                if (!name && !newMembers && !displayPicture) {
                    throw new Error("No changes made.");
                }
                const validMembers = newMembers?.every((id) =>
                    mongoose.Types.ObjectId.isValid(id)
                );
                if (!validMembers) {
                    throw new Error("Invalid member ID format");
                }

                let displayPictureUrl = "";
                if (displayPicture) {
                    const base64Data = displayPicture.replace(
                        /^data:image\/\w+;base64,/,
                        ""
                    );
                    const buffer = Buffer.from(base64Data, "base64");
                    const fileExt =
                        displayPicture.match(/^data:image\/(\w+);base64,/)[1] ||
                        "jpg";
                    const uniqueFileName = `${globalThis.crypto.randomUUID()}.${fileExt}`;
                    const filePath = path.join(UPLOAD_DIR, uniqueFileName);
                    fs.writeFileSync(filePath, buffer);
                    displayPictureUrl = `/uploads/${uniqueFileName}`;
                }
                const updatedGroup = await Group.findByIdAndUpdate(
                    groupId,
                    {
                        ...(name && { name }),
                        ...(displayPictureUrl && {
                            displayPicture: displayPictureUrl,
                        }),
                        ...(newMembers?.length && {
                            $push: {
                                members: {
                                    $each: newMembers.map((id) => ({
                                        user: id,
                                        role: "member",
                                    })),
                                },
                            },
                        }),
                    },
                    { new: true }
                );
                await updatedGroup.populate([
                    {
                        path: "members.user",
                        select: "username avatarUrl",
                    },
                    {
                        path: "messages",
                        options: { sort: { createdAt: -1 }, limit: 1 },
                    },
                ]);
                const memberIds = [userId, ...newMembers];
                io.to(memberIds).emit(SOCKET_EVENTS.GROUP_EDITED, {
                    group: updatedGroup,
                });

                if (cb) cb({ group: updatedGroup });
            } catch (error) {
                console.log(error);
                if (cb) cb({ error: error.message });
                socket.emit("error", { message: error.message });
            }
        }
    );
    socket.on(
        SOCKET_EVENTS.REMOVE_MEMBER,
        async ({
            groupId,
            userId: targetUserId,
        }: {
            groupId: string;
            userId: string;
        }) => {
            try {
                if (!mongoose.Types.ObjectId.isValid(groupId)) return;

                const group = await Group.findOne({
                    _id: groupId,
                    "members.user": userId,
                });

                if (!group) {
                    socket.emit("error", { message: "Group not found" });
                    return;
                }

                const isAdmin = group.members.find(
                    (m) => m.user.toString() === userId && m.role === "admin"
                );
                const isSelfRemoval = targetUserId === userId;

                if (!isAdmin && !isSelfRemoval) {
                    socket.emit("error", {
                        message: "Not authorized to remove members",
                    });
                    return;
                }

                const isLastAdmin =
                    group.members.filter((m) => m.role === "admin").length ===
                        1 &&
                    group.members.find(
                        (m) =>
                            m.user.toString() === targetUserId &&
                            m.role === "admin"
                    );

                if (isLastAdmin && group.members.length > 1) {
                    socket.emit("error", {
                        message:
                            "Cannot remove the last admin. Make someone else admin first.",
                    });
                    return;
                }

                await Group.updateOne(
                    { _id: groupId },
                    { $pull: { members: { user: targetUserId } } }
                );

                const memberIds = group.members.map((m) => m.user.toString());
                io.to(memberIds).emit(SOCKET_EVENTS.MEMBER_REMOVED, {
                    groupId,
                    userId: targetUserId,
                    removedBy: userId,
                });
                io.sockets.sockets.get(targetUserId)?.leave(groupId);
            } catch (error) {
                socket.emit("error", { message: error.message });
            }
        }
    );

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
            console.error(error);
            socket.emit("error", {
                message: "Failed to fetch contacts",
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
                "members.user": userId,
            });
            if (!chat) return;

            await ChatMessage.updateMany({ chatId }, { deletedAt: new Date() });

            chat.members.forEach(({ user }) => {
                io.to(user.toString()).emit(SOCKET_EVENTS.CHAT_CLEARED, {
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

                const [chat, group] = await Promise.all([
                    Chat.findOne({
                        _id: chatId,
                        "members.user": userId,
                    }),
                    Group.findOne({
                        _id: chatId,
                        "members.user": userId,
                    }),
                ]);
                const conversation = chat || group;
                if (!conversation) {
                    socket.emit("error", {
                        message: "Conversation not found or access denied.",
                    });
                    return;
                }

                const member = conversation.members.find(
                    (m) => m.user.toString() === userId
                );
                const isAdmin = member?.role === "admin";
                const message = await ChatMessage.findOneAndUpdate(
                    {
                        _id: messageId,
                        chatId,
                        $or: [
                            { senderId: userId },
                            { $expr: { $eq: [isAdmin, true] } },
                        ],
                    },
                    { deletedAt: new Date() }
                );

                if (!message) {
                    socket.emit("error", {
                        message:
                            "Message not found or you don't have permission to delete",
                    });
                    return;
                }

                io.to(
                    conversation.members.map((member) => member.user.toString())
                ).emit(SOCKET_EVENTS.MESSAGE_DELETED, {
                    chatId,
                    messageId,
                });
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
                    "members.user": userId,
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
                io.to(
                    chat.members.map((member) => member.user.toString())
                ).emit(SOCKET_EVENTS.MESSAGE_EDITED, {
                    ...updatedMessage.toJSON(),
                });
            } catch (error) {
                socket.emit("error", { message: error.message });
            }
        }
    );

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
});

export { app, server, io };
