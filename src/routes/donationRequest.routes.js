import { Router } from "express";
import { authenticate } from "../middlewares/authMiddleware.js";
import * as controller from "../controllers/donationRequest.controller.js";

const router = Router();

router.get("/public", controller.getPublicRequests);
router.get("/search/donors", controller.searchDonors);
router.post("/", authenticate, controller.createRequest);
router.get("/me", authenticate, controller.getMyRequests);
router.get("/:id", authenticate, controller.getRequestById);
router.put("/:id", authenticate, controller.updateRequest);
router.delete("/:id", authenticate, controller.deleteRequest);
router.patch("/:id/status", authenticate, controller.updateStatus);

export default router;
