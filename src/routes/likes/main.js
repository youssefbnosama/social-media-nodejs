import { Router } from "express";
import toggleLike from "./toggleLike.js";

const router = Router();

router.use(toggleLike);

export default router;
