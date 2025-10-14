import { Router } from "express";
import sendRequest from "./sendRequest.js";
import acceptRequest from "./acceptRequest.js";

const router = Router();

router.use(sendRequest);
router.use(acceptRequest);

export default router;
