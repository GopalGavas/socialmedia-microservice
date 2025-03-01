import { Router } from "express";
import {
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
} from "../controllers/auth.controller.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(registerUser);
router.route("/login").post(loginUser);

// [auth routes]
router.route("/refresh-accessToken").post(verifyJwt, refreshAccessToken);
router.route("/logout").post(verifyJwt, logoutUser);

export default router;
