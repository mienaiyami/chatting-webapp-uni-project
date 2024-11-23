import mongoose from "mongoose";
import { ApiError, getUserFromReq } from "../helpers/index";
import UserContacts, { FormattedContact } from "../models/UserContacts";

export default async (req, res) => {
    try {
        const user = await getUserFromReq(req);
        if (!user) throw new ApiError(401, "Unauthorized");
        const userContacts = await UserContacts.findOne({
            user: user._id,
        }).populate<{ contacts: FormattedContact[] }>(
            "contacts.userId",
            "username email avatarUrl"
        );
        const formattedContacts =
            userContacts.contacts?.map((contact) => ({
                userId: contact.userId._id,
                username: contact.userId.username,
                email: contact.userId.email,
                avatarUrl: contact.userId.avatarUrl,
                nickname: contact.nickname,
                note: contact.note,
            })) || [];
        // if (!userContacts || userContacts.contacts.length === 0)
        //     throw new ApiError(404, "No contacts found");
        console.log(formattedContacts);
        return res.status(200).json({ contacts: formattedContacts });
    } catch (error) {
        return res
            .status(error.statusCode || 500)
            .json({ error: true, message: error.message || error });
    }
};
