import { Router } from "express";
import { authenticate } from "../middlewares/authMiddleware.js";
import * as controller from "../controllers/funding.controller.js";

const router = Router();

router.get("/", authenticate, controller.getFunding);

export default router;
