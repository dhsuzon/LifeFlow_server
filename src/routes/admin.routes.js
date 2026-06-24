import { Router } from "express";
import { authenticate } from "../middlewares/authMiddleware.js"; // ফাইলের নাম ও পাথ চেক করে নেবেন
import * as controller from "../controllers/admin.controller.js";

const router = Router();

router.get("/users", authenticate, controller.getUsers);
router.patch("/users/:id", authenticate, controller.updateUser);
router.get("/requests", authenticate, controller.getRequests);
router.patch("/requests/:id", authenticate, controller.updateRequestStatus);
router.get("/stats", authenticate, controller.getStats);

export default router;
