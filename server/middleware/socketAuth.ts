import { Socket } from "socket.io";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

export const socketAuth = (socket: Socket, next: (err?: Error) => void) => {
    const token = socket.handshake.auth.token;

    if (!token) {
        return next(new Error("Authentication error"));
    }

    try {
        const { userId } = jwt.verify(token, process.env.JWT_SECRET!) as {
            userId: string;
        };
        if (!mongoose.Types.ObjectId.isValid(userId))
            throw new Error("Invalid user id");
        socket.data.userId = userId;
        next();
    } catch (err) {
        next(new Error("Authentication error"));
    }
};
