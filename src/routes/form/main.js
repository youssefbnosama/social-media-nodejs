import { register, login, logout } from "./formController.js";
import { validateSignup } from "../../utilities/validation/signupValidation.js";
import { validateLogin } from "../../utilities/validation/loginValidation.js";
import { tryCatch } from "../../utilities/errorHandling/tryCatch.js";
import { Router } from "express";

const router = Router();

// POST /api/register
router.post("/api/register", validateSignup, tryCatch(register));

// POST /api/login
router.post("/api/login", validateLogin, tryCatch(login));

// POST /api/logout
router.post("/api/logout", tryCatch(logout));

export default router;
