const express = require("express");
const flatController = require("../controllers/flatController");
const structureController = require("../controllers/societyStructureController");
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

router.get(
  "/",
  authorizeRoles("admin", "secretary", "super_admin"),
  (req, res, next) => {
    if (req.query.floorId || req.query.floor_id || req.query.towerId || req.query.wingId) {
      return structureController.listFlats(req, res, next);
    }
    return next();
  },
  flatListQueryValidation,
  validationMiddleware,
  flatController.getFlats
);

router.post(
  "/",
  authorizeRoles("admin", "secretary", "super_admin"),
  (req, res, next) => {
    if (req.body.floorId || req.body.floor_id || req.body.towerId || req.body.wingId || req.body.houseNumber) {
      return structureController.createFlat(req, res, next);
    }
    return next();
  },
  addFlatValidation,
  validationMiddleware,
  flatController.addFlat
);
router.post(
  "/bulk",
  authorizeRoles("admin", "secretary"),
  flatController.createFlatsBulk
);
router.post(
  "/generate",
  authorizeRoles("admin", "secretary", "super_admin"),
  structureController.generateFlats
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
  authorizeRoles("admin", "secretary", "super_admin"),
  idParamValidation,
  validationMiddleware,
  (req, res, next) => {
    if (req.body.houseNumber || req.body.house_number || req.body.bedrooms || req.body.areaSqft || req.body.area_sqft) {
      return structureController.updateFlat(req, res, next);
    }
    return flatController.updateFlat(req, res, next);
  }
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
  authorizeRoles("admin", "secretary", "super_admin"),
  idParamValidation,
  validationMiddleware,
  (req, res, next) => {
    if (req.query.structure === "true" || req.user?.role === "super_admin") {
      return structureController.deleteFlat(req, res, next);
    }
    return flatController.deleteFlat(req, res, next);
  }
);

module.exports = router;
