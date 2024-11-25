import jwt from "jsonwebtoken";
import { z } from "zod";
import { JWT_SECRET } from "../config/config";
import User from "../models/User";
import { ApiError } from "../helpers/index";

export const userSchema = z.object({
    username: z.string().min(3).max(255),
    email: z.string().email(),
    password: z.string().min(6).max(255),
});
export const signup = async (req, res) => {
    try {
        const { username, email, password } = userSchema.parse(req.body);
        const avatarUrl = req.file
            ? `/api/images/avatar/${req.file.filename}`
            : null;

        const user = await User.create({
            username,
            email,
            password,
            avatarUrl,
        });

        const token = jwt.sign({ userId: user._id }, JWT_SECRET, {
            expiresIn: "7d",
        });
        res.cookie("token", token);
        return res.status(201).json({ user, token });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: true, message: error.errors });
        }
        return res
            .status(error.statusCode || 500)
            .json({ error: true, message: error.message || error });
    }
};

export const signin = async (req, res) => {
    try {
        const { email, password } = userSchema
            .omit({ username: true })
            .parse(req.body);

        const user = await User.findOne({ email });
        if (!user) throw new ApiError(404, "User not found");

        const isMatch = await user.comparePassword(password);
        if (!isMatch) throw new ApiError(400, "Invalid credentials");

        const token = jwt.sign({ userId: user._id }, JWT_SECRET, {
            expiresIn: "7d",
        });

        res.cookie("token", token);
        return res.status(200).json({ user, token });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: true, message: error.errors });
        }
        return res
            .status(error.statusCode || 500)
            .json({ error: true, message: error.message || error });
    }
};

export const logout = async (req, res) => {
    try {
        res.clearCookie("token");
        return res.status(200).json({ message: "Logout successful" });
    } catch (error) {
        return res
            .status(error.statusCode || 500)
            .json({ error: true, message: error.message || error });
    }
};
