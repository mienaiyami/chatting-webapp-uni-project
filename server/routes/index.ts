import express from "express";
import multer from "multer";
import { logout, signin, signup } from "../controllers/auth";
import userDetails from "../controllers/userDetails";
import searchUsers from "../controllers/searchUsers";
import updateUserDetails from "../controllers/updateUserDetails";
// import updateContact from "../controllers/updateContact";
// import userContacts from "../controllers/userContacts";
import path from "path";
// need this coz it stays uninitialized otherwise and throws error when populating chat messages
import ChatMessage from "../models/ChatMessage";
ChatMessage;

const upload = multer({ dest: path.join(process.cwd(), "/storage/avatar") });
const router = express.Router();

//todo split routes later
router.post("/signup", upload.single("avatar"), signup);
router.post("/signin", signin);
router.get("/logout", logout);
router.get("/userDetails", userDetails);
router.get("/searchUser", searchUsers);

router.post("/updateProfile", upload.single("avatar"), updateUserDetails);
router.get("/images/avatar/:filename", (req, res) => {
    res.sendFile(
        path.join(process.cwd(), `/storage/avatar/${req.params.filename}`)
    );
});
// moved to socket
// router.post("/updateContact", updateContact);
// router.get("/userContacts", userContacts);

// router.get("/chat-groups", getAllChatsAndGroups);
// router.post("/chat-groups/create-chat", createNewChat);
// // for for all chat messages
// router.get("/chat-groups/messages/:chatId", getChatMessages);

export default router;
