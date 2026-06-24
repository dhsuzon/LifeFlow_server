import { Router } from "express";
import { authenticate } from "../middlewares/authMiddleware.js";
import * as controller from "../controllers/funding.controller.js";

const router = Router();

router.post("/checkout", authenticate, controller.createCheckout);

export default router;
