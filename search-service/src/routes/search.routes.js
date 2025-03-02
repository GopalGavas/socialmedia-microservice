import { Router } from "express";
import { authenticateRequest } from "../middlewares/auth.middleware.js";
import { handleSearch } from "../controllers/search.controller.js";

const router = Router();

router.route("/posts").get(authenticateRequest, handleSearch);

export default router;
