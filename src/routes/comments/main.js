import { Router } from "express";
import addComment from "./addComment.js";
import editComment from "./editComment.js";
import deleteComment from "./deletecComment.js";

const router = Router();

router.use(addComment);
router.use(editComment);
router.use(deleteComment);

export default router;
