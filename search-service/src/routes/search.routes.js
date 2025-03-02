import { Router } from "express";
import { authenticateRequest } from "../middlewares/auth.middleware.js";
import { handleSearch } from "../controllers/search.controller.js";
import { rateLimitingForFullTextSearch } from "../middlewares/rateLimiter.middleware.js";

const router = Router();

router.use(authenticateRequest);

router.route("/posts").get(rateLimitingForFullTextSearch, handleSearch);

export default router;
