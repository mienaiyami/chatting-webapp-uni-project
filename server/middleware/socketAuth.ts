import { Socket } from "socket.io";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { JWT_SECRET } from "../config/config";
import User from "../models/User";

export const socketAuth = async (
    socket: Socket,
    next: (err?: Error) => void
) => {
    const token = socket.handshake.auth.token;

    if (!token) {
        return next(new Error("Authentication error"));
    }

    try {
        const { userId } = jwt.verify(token, JWT_SECRET) as {
            userId: string;
        };
        if (!mongoose.Types.ObjectId.isValid(userId))
            throw new Error("Invalid user id");
        console.time("User.findById");
        const user = await User.findById(userId);
        console.timeEnd("User.findById");
        if (!user) throw new Error("User not found");
        socket.data.userId = userId;
        next();
    } catch (err) {
        next(new Error("Authentication error"));
    }
};
