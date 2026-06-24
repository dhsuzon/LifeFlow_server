import { Router } from "express";
import { authenticate } from "../middlewares/authMiddleware.js";
import * as controller from "../controllers/donationRequest.controller.js";

const router = Router();

router.get("/:id", authenticate, controller.getPublicRequestById);

export default router;
