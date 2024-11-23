import { z } from "zod";
import { JWT_SECRET } from "../config/config";
import User from "../models/User";
import jwt from "jsonwebtoken";
import { clearLine } from "readline";

export class ApiError extends Error {
    statusCode: number;
    isOperational: boolean;
    constructor(statusCode, message, isOperational = true, stack = "") {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        if (stack) {
            this.stack = stack;
        } else {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}

export const getUserFromToken = async (token) => {
    if (!token) {
        return null;
    }
    try {
        const { userId } = jwt.verify(token, JWT_SECRET);
        const user = await User.findById(userId).select("-password");
        return user;
    } catch (error) {
        return null;
    }
};
export const getUserFromReq = async (req) => {
    console.log("req.cookies.token", req.cookies);
    const token =
        req.cookies.token ||
        req.body.token ||
        req.headers["authorization"]?.replace("Bearer ", "");
    return getUserFromToken(token);
};
