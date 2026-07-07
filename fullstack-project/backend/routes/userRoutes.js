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
	authorizeRoles("chairman", "admin", "secretary"),
	userListQueryValidation,
	validationMiddleware,
	userController.getUsers
);
router.get(
	"/trash",
	authorizeRoles("chairman", "admin"),
	validationMiddleware,
	userController.getDeletedUsers
);
router.get(
	"/category/:category",
	authorizeRoles("chairman", "admin", "secretary"),
	userCategoryQueryValidation,
	validationMiddleware,
	userController.getUsersByCategory
);
router.post(
	"/",
	authorizeRoles("chairman", "admin"),
	userCreateValidation,
	validationMiddleware,
	userController.createUser
);
router.patch(
	"/:id",
	authorizeRoles("chairman", "admin"),
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
	authorizeRoles("chairman", "admin", "secretary"),
	idParamValidation,
	updateUserStatusValidation,
	validationMiddleware,
	userController.updateUserStatus
);
router.delete(
	"/:id",
	authorizeRoles("chairman", "admin"),
	idParamValidation,
	deleteUserValidation,
	validationMiddleware,
	userController.deleteUser
);
router.patch(
	"/:id/restore",
	authorizeRoles("chairman", "admin"),
	idParamValidation,
	validationMiddleware,
	userController.restoreUser
);
router.delete(
	"/:id/permanent",
	authorizeRoles("chairman", "admin"),
	idParamValidation,
	validationMiddleware,
	userController.permanentlyDeleteUser
);

module.exports = router;
