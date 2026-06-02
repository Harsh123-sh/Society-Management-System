const express = require("express");
const userController = require("../controllers/userController");
const { authenticateToken } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");
const validationMiddleware = require("../middleware/validationMiddleware");
const {
	userListQueryValidation,
	userCreateValidation,
	idParamValidation,
	updateUserRoleValidation,
	updateUserStatusValidation,
	deleteUserValidation,
	userCategoryQueryValidation,
} = require("../validators/requestValidators");

const router = express.Router();

router.use(authenticateToken);

router.get(
	"/",
	authorizeRoles("admin", "secretary"),
	userListQueryValidation,
	validationMiddleware,
	userController.getUsers
);
router.get(
	"/trash",
	authorizeRoles("admin"),
	validationMiddleware,
	userController.getDeletedUsers
);
router.get(
	"/category/:category",
	authorizeRoles("admin", "secretary"),
	userCategoryQueryValidation,
	validationMiddleware,
	userController.getUsersByCategory
);
router.post(
	"/",
	authorizeRoles("admin"),
	userCreateValidation,
	validationMiddleware,
	userController.createUser
);
router.patch(
	"/:id",
	authorizeRoles("admin"),
	idParamValidation,
	validationMiddleware,
	userController.updateUser
);
router.patch(
	"/:id/role",
	authorizeRoles("admin"),
	idParamValidation,
	updateUserRoleValidation,
	validationMiddleware,
	userController.updateUserRole
);
router.patch(
	"/:id/status",
	authorizeRoles("admin", "secretary"),
	idParamValidation,
	updateUserStatusValidation,
	validationMiddleware,
	userController.updateUserStatus
);
router.delete(
	"/:id",
	authorizeRoles("admin"),
	idParamValidation,
	deleteUserValidation,
	validationMiddleware,
	userController.deleteUser
);
router.patch(
	"/:id/restore",
	authorizeRoles("admin"),
	idParamValidation,
	validationMiddleware,
	userController.restoreUser
);
router.delete(
	"/:id/permanent",
	authorizeRoles("admin"),
	idParamValidation,
	validationMiddleware,
	userController.permanentlyDeleteUser
);

module.exports = router;
