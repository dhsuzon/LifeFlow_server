const router = require("express").Router();
const { authenticate } = require("../middlewares/authMiddleware");
const controller = require("../controllers/donationRequest.controller");

router.get("/public", controller.getPublicRequests);
router.get("/search/donors", controller.searchDonors);
router.post("/", authenticate, controller.createRequest);
router.get("/me", authenticate, controller.getMyRequests);
router.get("/:id", authenticate, controller.getRequestById);
router.put("/:id", authenticate, controller.updateRequest);
router.delete("/:id", authenticate, controller.deleteRequest);
router.patch("/:id/status", authenticate, controller.updateStatus);

module.exports = router;
