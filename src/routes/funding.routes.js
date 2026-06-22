const router = require("express").Router();
const { authenticate } = require("../middlewares/authMiddleware");
const controller = require("../controllers/funding.controller");

router.get("/", authenticate, controller.getFunding);

module.exports = router;
