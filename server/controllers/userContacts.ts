import { ApiError, getUserFromReq } from "../helpers/index";
import UserContacts from "../models/UserContacts";

export default async (req, res) => {
    try {
        const user = await getUserFromReq(req);
        if (!user) throw new ApiError(401, "Unauthorized");
        const userContacts = await UserContacts.findOne({ user: user._id });
        if (!userContacts || userContacts.contacts.length === 0)
            throw new ApiError(404, "No contacts found");
        return res.status(200).json({ contacts: userContacts.contacts });
    } catch (error) {
        return res
            .status(error.statusCode || 500)
            .json({ error: true, message: error.message || error });
    }
};
