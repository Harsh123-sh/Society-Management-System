const express = require("express");
const wingController = require("../controllers/wingController");
const { authenticateToken } = require("../middleware/authMiddleware");
const { resolveTenantContext } = require("../middleware/tenantMiddleware");

const router = express.Router();

router.use(authenticateToken);
router.use(resolveTenantContext);

router.get("/", wingController.listWings);
router.post("/", wingController.createWing);

module.exports = router;
