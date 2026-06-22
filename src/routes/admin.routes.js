const router = require("express").Router();
const { authenticate } = require("../middlewares/authMiddleware");
const controller = require("../controllers/admin.controller");

router.get("/users", authenticate, controller.getUsers);
router.patch("/users/:id", authenticate, controller.updateUser);
router.get("/requests", authenticate, controller.getRequests);
router.patch("/requests/:id", authenticate, controller.updateRequestStatus);
router.get("/stats", authenticate, controller.getStats);

module.exports = router;
