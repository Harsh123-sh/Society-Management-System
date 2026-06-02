const express = require("express");
const productController = require("../controllers/productController");
const { authenticateToken } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");
const validationMiddleware = require("../middleware/validationMiddleware");
const { productCreateValidation } = require("../validators/requestValidators");

const router = express.Router();

router.use(authenticateToken);

router.get("/", authorizeRoles("admin", "secretary", "staff"), productController.getProducts);
router.post(
	"/",
	authorizeRoles("admin", "secretary", "staff"),
	productCreateValidation,
	validationMiddleware,
	productController.createProduct
);

module.exports = router;
