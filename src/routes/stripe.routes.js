const router = require("express").Router();
const { authenticate } = require("../middlewares/authMiddleware");
const controller = require("../controllers/funding.controller");

router.post("/checkout", authenticate, controller.createCheckout);

module.exports = router;
