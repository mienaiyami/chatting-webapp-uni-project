import User from "../models/User";
import { ApiError, getUserFromReq } from "../helpers/index";

export default async (req, res) => {
    try {
        const user = await getUserFromReq(req);
        if (!user) throw new ApiError(401, "Unauthorized");

        const { username, password } = req.body;
        if (!username && !password && !req.file) {
            throw new ApiError(400, "Missing required fields");
        }

        const avatarUrl = req.file
            ? `/api/images/avatar/${req.file.filename}`
            : undefined;
        const updatedUser = await User.findByIdAndUpdate(
            user._id,
            { username, password, avatarUrl },
            { new: true }
        );
        if (!updatedUser) throw new ApiError(500, "User not found");

        return res
            .status(200)
            .json({ user: updatedUser, message: "User updated" });
    } catch (error) {
        return res
            .status(error.statusCode || 500)
            .json({ error: true, message: error.message || error });
    }
};
