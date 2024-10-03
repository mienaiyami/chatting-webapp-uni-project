import express from "express";
import multer from "multer";
import { logout, signin, signup } from "../controllers/auth";
import userDetails from "../controllers/userDetails";
import searchUsers from "../controllers/searchUsers";
import updateUserDetails from "../controllers/updateUserDetails";
import updateContact from "../controllers/updateContact";
import userContacts from "../controllers/userContacts";
import path from "path";

const upload = multer({ dest: path.join(process.cwd(), "/storage/avatar") });
const router = express.Router();

// todo add group routes...
//todo split routes based on fn
router.post("/signup", upload.single("avatar"), signup);
router.post("/signin", signin);
router.get("/logout", logout);
router.get("/userDetails", userDetails);
router.get("/searchUser", searchUsers);
// details of any user
// router.get("/userDetailsById",);
router.post("/updateProfile", upload.single("avatar"), updateUserDetails);
router.get("/images/avatar/:filename", (req, res) => {
    res.sendFile(
        path.join(process.cwd(), `/storage/avatar/${req.params.filename}`)
    );
});
router.post("/updateContact", updateContact);
router.get("/userContacts", userContacts);

export default router;
