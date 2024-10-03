import { ApiError } from "../helpers/index";
import User from "../models/User";

export default async (req, res) => {
    try {
        if (req.method === "GET") {
            const userId = req.query.userId;
            if (!userId) throw new ApiError(400, "User ID is required");
            const user = await User.findById(userId);
            if (!user) throw new ApiError(404, "User not found");
            return res.status(200).json({ user });
        }
        const { userId } = req.body;
        if (!userId) throw new ApiError(400, "User ID is required");
        if (userId instanceof Array) {
            const users = await User.find({ _id: { $in: userId } });
            if (users.length === 0) throw new ApiError(404, "Users not found");
            return res.status(200).json({ users });
        }
        if (userId instanceof String) {
            const user = await User.findById(userId);
            if (!user) throw new ApiError(404, "User not found");
            return res.status(200).json({ user });
        }
        throw new ApiError(400, "Invalid User ID");
    } catch (error) {
        return res
            .status(error.statusCode || 500)
            .json({ error: true, message: error.message || error });
    }
};
