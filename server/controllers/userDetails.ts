import { getUserFromReq, ApiError } from "../helpers/index";

export default async (req, res) => {
    try {
        const user = await getUserFromReq(req);
        if (!user) throw new ApiError(401, "Unauthorized");

        return res.status(200).json({ user });
    } catch (error) {
        return res
            .status(error.statusCode || 500)
            .json({ error: true, message: error.message || error });
    }
};
