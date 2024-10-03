import { ApiError, getUserFromReq } from "../helpers/index";
import UserContacts from "../models/UserContacts";

export default async (req, res) => {
    try {
        const user = await getUserFromReq(req);
        if (!user) throw new ApiError(401, "Unauthorized");
        const { userId, note, nickname, action } = req.body;
        if (!userId) throw new ApiError(400, "User ID is required");
        if (!action) throw new ApiError(400, "Action is required");
        let contact = await UserContacts.findOne({ user: user._id });
        if (!contact)
            contact = await UserContacts.create({
                user: user._id,
                contacts: [],
            });
        if (action === "remove") {
            //todo test
            contact.contacts.remove({ userId });
            // contact.contacts = contact.contacts.filter(
            //     (contact) => !contact.userId.equals(userId)
            // );
            await contact.save();
            return res.status(200).json({
                contacts: contact.contacts,
                message: "Contact removed successfully",
            });
        }
        if (contact.contacts.find((contact) => contact.userId.equals(userId)))
            throw new ApiError(400, "Contact already exists");
        contact.contacts.push({ userId, note, nickname });
        await contact.save();
        return res.status(200).json({
            contacts: contact.contacts,
            message: "Contact added successfully",
        });
    } catch (error) {
        return res
            .status(error.statusCode || 500)
            .json({ error: true, message: error.message || error });
    }
};
