const router = require("express").Router();
const { authenticate } = require("../middlewares/authMiddleware");
const controller = require("../controllers/donationRequest.controller");

router.get("/:id", authenticate, controller.getPublicRequestById);

module.exports = router;
