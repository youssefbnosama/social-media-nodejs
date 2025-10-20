import { Router } from "express";
import editProfile from "./editProfile.js";
import deleteUser from "./deleteUser.js";
import profile from "./profile.js";
import showFriends from "./showFriends.js";
import showRequests from "./showFrinedRequests.js";

const router = Router();

router.use(editProfile);
router.use(deleteUser);
router.use(profile);
router.use(showFriends);
router.use(showRequests);

export default router;
