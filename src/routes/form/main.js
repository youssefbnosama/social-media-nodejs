import { Router } from "express";
import register from "./register.js";
import login from "./login.js";
import logout from "./logout.js";
const router = Router();

router.use(register);
router.use(login);
router.use(logout);

export default router;
