const express = require("express");
const billController = require("../controllers/billController");
const { authenticateToken } = require("../middleware/authMiddleware");
const { requireSocietyAccess } = require("../middleware/societyAccessMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");
const validationMiddleware = require("../middleware/validationMiddleware");
const {
  billListQueryValidation,
  createBillValidation,
  idParamValidation,
} = require("../validators/requestValidators");

const router = express.Router();

router.use(authenticateToken);
router.use(requireSocietyAccess);

router.post(
  "/",
  authorizeRoles("admin", "secretary"),
  createBillValidation,
  validationMiddleware,
  billController.createBill
);
router.post("/auto-invoices", authorizeRoles("admin", "secretary"), billController.createAutoInvoices);
router.get(
  "/",
  authorizeRoles("admin", "secretary"),
  billListQueryValidation,
  validationMiddleware,
  billController.getAllBills
);
router.get("/dashboard", authorizeRoles("admin", "secretary"), billController.getBillingDashboard);
router.get("/analytics/financial", authorizeRoles("admin", "secretary"), billController.getFinancialAnalytics);
router.post("/automations/late-fees", authorizeRoles("admin", "secretary"), billController.runLateFeeAutomation);
router.post("/automations/reminders", authorizeRoles("admin", "secretary"), billController.runPaymentReminders);
router.get("/invoices/:id", idParamValidation, validationMiddleware, billController.generateInvoice);
router.get("/my", billListQueryValidation, validationMiddleware, billController.getMyBills);
router.get("/my/portal", billController.getMyPaymentPortal);
router.post("/:id/payments/order", idParamValidation, validationMiddleware, billController.createPaymentOrder);
router.post("/:id/payments/verify-razorpay", idParamValidation, validationMiddleware, billController.verifyRazorpayPayment);
router.post("/:id/payments/upi", idParamValidation, validationMiddleware, billController.payViaUpi);
router.patch("/:id/pay", idParamValidation, validationMiddleware, billController.markMyBillPaid);

module.exports = router;
