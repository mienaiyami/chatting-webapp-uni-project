import { ApiError } from "../helpers/index";
import User from "../models/User";

export default async (req, res) => {
    try {
        const search = req.query.search;
        if (!search) {
            throw new ApiError(400, "Search query is required");
        }
        const users = await User.find({
            $or: [
                { username: { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } },
            ],
        }).select("_id username email avatarUrl");
        return res.status(200).json({ users });
    } catch (error) {
        console.error(error);
        return res
            .status(error.statusCode || 500)
            .json({ error: true, message: error.message || error });
    }
};
