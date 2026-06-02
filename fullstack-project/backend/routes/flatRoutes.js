const express = require("express");
const flatController = require("../controllers/flatController");
const { authenticateToken } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");
const validationMiddleware = require("../middleware/validationMiddleware");
const {
  addFlatValidation,
  flatListQueryValidation,
  assignResidentValidation,
  idParamValidation,
} = require("../validators/requestValidators");

const router = express.Router();

router.use(authenticateToken);

router.post(
  "/",
  authorizeRoles("admin", "secretary"),
  addFlatValidation,
  validationMiddleware,
  flatController.addFlat
);
router.post(
  "/bulk",
  authorizeRoles("admin", "secretary"),
  flatController.createFlatsBulk
);
router.get(
  "/",
  authorizeRoles("admin", "secretary"),
  flatListQueryValidation,
  validationMiddleware,
  flatController.getFlats
);
router.get(
  "/history",
  authorizeRoles("admin", "secretary"),
  flatController.getOccupancyHistory
);
router.get("/my", flatController.getMyFlats);
router.get("/my/property", authorizeRoles("resident"), flatController.getMyPropertySummary);
router.post(
  "/:id/assign",
  authorizeRoles("admin", "secretary"),
  assignResidentValidation,
  validationMiddleware,
  flatController.assignResident
);
router.patch(
  "/:id/unassign",
  authorizeRoles("admin", "secretary"),
  idParamValidation,
  validationMiddleware,
  flatController.unassignResident
);
router.patch(
  "/:id/approve",
  authorizeRoles("admin", "secretary"),
  idParamValidation,
  validationMiddleware,
  flatController.approveFlat
);
router.patch(
  "/:id",
  authorizeRoles("admin", "secretary"),
  idParamValidation,
  validationMiddleware,
  flatController.updateFlat
);
router.post(
  "/:id/archive",
  authorizeRoles("admin", "secretary"),
  idParamValidation,
  validationMiddleware,
  flatController.archiveFlat
);
router.delete(
  "/:id",
  authorizeRoles("admin", "secretary"),
  idParamValidation,
  validationMiddleware,
  flatController.deleteFlat
);

module.exports = router;
