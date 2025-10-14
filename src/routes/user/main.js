import { Router } from "express";
import editProfile from "./editProfile.js";
import deleteUser from "./deleteUser.js";
import profile from "./profile.js";

const router = Router();

router.use(editProfile);
router.use(deleteUser);
router.use(profile);

export default router;
