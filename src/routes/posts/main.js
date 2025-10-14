import { Router } from "express";
import addPost from "./addPost.js";
import editPost from "./editPost.js";
import showUserPost from "./showUserPost.js";
import showPost from "./showPost.js";
import deletePost from "./deletePost.js";

const router = Router();

router.use(addPost);
router.use(editPost);
router.use(showUserPost);
router.use(showPost);
router.use(deletePost);

export default router;
