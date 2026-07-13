const { body, param, query } = require("express-validator");

const ROLE_VALUES = ["super_admin", "admin", "chairman", "secretary", "resident", "staff", "security"];
const CREATE_ROLE_VALUES = ["chairman", "secretary", "resident", "staff", "security"];
const RESIDENT_TYPE_VALUES = ["owner", "tenant"];
const ACCOUNT_STATUS_VALUES = ["pending", "active", "rejected", "inactive"];
const REGISTRATION_ROLES = ["secretary", "owner", "tenant", "staff", "security"];

const registerValidation = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ min: 2, max: 80 })
    .withMessage("Name must be between 2 and 80 characters"),
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Email must be valid")
    .normalizeEmail(),
  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 8, max: 128 })
    .withMessage("Password must be between 8 and 128 characters"),
  body("role")
    .isIn(REGISTRATION_ROLES)
    .withMessage("Invalid role. Must be secretary, owner, tenant, staff, or security"),
  body("societyCode")
    .trim()
    .notEmpty()
    .withMessage("Society code is required")
    .isLength({ min: 2, max: 30 })
    .withMessage("Society code must be between 2 and 30 characters"),
];

const loginValidation = [
  body().custom((value) => {
    const identifier = String(value?.email || value?.username || "").trim();
    if (!identifier) {
      throw new Error("Email or username is required");
    }
    return true;
  }),
  body("password").notEmpty().withMessage("Password is required"),
  body().custom((value) => {
    const societyCode = String(value?.societyCode || value?.society_code || "").trim();
    if (!societyCode) {
      throw new Error("Society code is required");
    }
    if (societyCode.length < 2 || societyCode.length > 30) {
      throw new Error("Society code must be between 2 and 30 characters");
    }
    return true;
  }),
  body("role")
    .optional()
    .trim()
    .toLowerCase()
    .isIn(["admin", "chairman", "secretary", "resident", "owner", "tenant", "staff", "security"])
    .withMessage("Invalid role"),
];

const superAdminLoginValidation = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Email must be valid")
    .normalizeEmail(),
  body("password").notEmpty().withMessage("Password is required"),
];

const emailWithSocietyValidation = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Email must be valid")
    .normalizeEmail(),
  body("societyCode")
    .trim()
    .notEmpty()
    .withMessage("Society code is required")
    .isLength({ min: 2, max: 30 })
    .withMessage("Society code must be between 2 and 30 characters"),
];

const emailOnlyValidation = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Email must be valid")
    .normalizeEmail(),
];

const otpValidation = [
  ...emailWithSocietyValidation,
  body("otp")
    .trim()
    .notEmpty()
    .withMessage("OTP is required")
    .matches(/^\d{6}$/)
    .withMessage("OTP must be a 6-digit code"),
];

const superAdminOtpValidation = [
  ...emailOnlyValidation,
  body("otp")
    .trim()
    .notEmpty()
    .withMessage("OTP is required")
    .matches(/^\d{6}$/)
    .withMessage("OTP must be a 6-digit code"),
];

const resetPasswordValidation = [
  ...otpValidation,
  body("newPassword")
    .notEmpty()
    .withMessage("newPassword is required")
    .isLength({ min: 8, max: 128 })
    .withMessage("newPassword must be between 8 and 128 characters"),
];

const strongPasswordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,128}$/;

const superAdminResetPasswordValidation = [
  ...emailOnlyValidation,
  body("newPassword")
    .notEmpty()
    .withMessage("newPassword is required")
    .isLength({ min: 8, max: 128 })
    .withMessage("newPassword must be between 8 and 128 characters")
    .matches(strongPasswordPattern)
    .withMessage(
      "newPassword must include uppercase, lowercase, number, and special character"
    ),
  body("confirmPassword")
    .notEmpty()
    .withMessage("confirmPassword is required")
    .custom((value, { req }) => value === req.body.newPassword)
    .withMessage("confirmPassword must match newPassword"),
];

const idParamValidation = [
  param("id")
    .isInt({ min: 1 })
    .withMessage("id must be a positive integer")
    .toInt(),
];

const searchableQueryValidation = [
  query("search")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("search can be at most 100 characters"),
];

const userListQueryValidation = [
  ...searchableQueryValidation,
  query("role")
    .optional()
    .isIn([...ROLE_VALUES, "chairman", "owner", "tenant", "all"])
    .withMessage("role must be chairman, secretary, owner, tenant, staff, security, admin, or all"),
  query("status")
    .optional()
    .isIn([...ACCOUNT_STATUS_VALUES, "all"])
    .withMessage("status must be pending, active, rejected, inactive, or all"),
  query("wing")
    .optional()
    .isLength({ max: 20 })
    .withMessage("wing must be at most 20 characters"),
  query("floor")
    .optional()
    .isLength({ max: 20 })
    .withMessage("floor must be at most 20 characters"),
  query("flatNumber")
    .optional()
    .isLength({ max: 40 })
    .withMessage("flatNumber must be at most 40 characters"),
  query("kyc")
    .optional()
    .isIn(["pending", "verified", "rejected", "all"])
    .withMessage("kyc must be pending, verified, rejected, or all"),
  query("registrationFrom")
    .optional()
    .isISO8601()
    .withMessage("registrationFrom must be a valid date"),
  query("registrationTo")
    .optional()
    .isISO8601()
    .withMessage("registrationTo must be a valid date"),
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("page must be a positive integer"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("limit must be between 1 and 100"),
];

const userCreateValidation = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ min: 2, max: 80 })
    .withMessage("Name must be between 2 and 80 characters"),
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Email must be valid")
    .normalizeEmail(),
  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 8, max: 128 })
    .withMessage("Password must be between 8 and 128 characters"),
  body("role")
    .optional()
    .isIn(CREATE_ROLE_VALUES)
    .withMessage("Invalid role"),
  body("residentType")
    .optional()
    .isIn(RESIDENT_TYPE_VALUES)
    .withMessage("Invalid resident type"),
  body("status")
    .optional()
    .isIn(ACCOUNT_STATUS_VALUES)
    .withMessage("Invalid account status"),
];

const updateUserRoleValidation = [
  body("role")
    .trim()
    .notEmpty()
    .withMessage("role is required")
    .isIn(ROLE_VALUES)
    .withMessage("Invalid role"),
];

const updateUserStatusValidation = [
  body("status")
    .trim()
    .notEmpty()
    .withMessage("status is required")
    .isIn(ACCOUNT_STATUS_VALUES)
    .withMessage("Invalid account status"),
];

const deleteUserValidation = [
  body("reason")
    .trim()
    .notEmpty()
    .withMessage("reason is required")
    .isLength({ min: 3, max: 500 })
    .withMessage("reason must be between 3 and 500 characters"),
];

const societyValidation = [
  body("code")
    .trim()
    .notEmpty()
    .withMessage("code is required")
    .isLength({ min: 2, max: 30 })
    .withMessage("code must be between 2 and 30 characters"),
  body("name")
    .trim()
    .notEmpty()
    .withMessage("name is required")
    .isLength({ min: 2, max: 120 })
    .withMessage("name must be between 2 and 120 characters"),
];

const productCreateValidation = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("name is required")
    .isLength({ min: 2, max: 120 })
    .withMessage("name must be between 2 and 120 characters"),
  body("price")
    .isFloat({ gt: 0 })
    .withMessage("price must be greater than 0")
    .toFloat(),
  body("stock")
    .isInt({ min: 0 })
    .withMessage("stock must be 0 or greater")
    .toInt(),
  body("category")
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 80 })
    .withMessage("category can be at most 80 characters"),
];

const billListQueryValidation = [
  ...searchableQueryValidation,
  query("status")
    .optional()
    .isIn(["draft", "paid", "unpaid", "overdue", "partially_paid"])
    .withMessage("status must be draft, paid, unpaid, overdue, or partially_paid"),
  query("billType")
    .optional()
    .isIn(["maintenance", "parking", "utility", "other"])
    .withMessage("billType must be maintenance, parking, utility, or other"),
  query("paymentStatus")
    .optional()
    .isIn(["pending", "partial", "paid", "failed", "refunded"])
    .withMessage("paymentStatus must be pending, partial, paid, failed, or refunded"),
];

const createBillValidation = [
  body("residentId")
    .isInt({ min: 1 })
    .withMessage("residentId must be a positive integer")
    .toInt(),
  body("title")
    .trim()
    .notEmpty()
    .withMessage("title is required")
    .isLength({ min: 3, max: 120 })
    .withMessage("title must be between 3 and 120 characters"),
  body("dueDate")
    .notEmpty()
    .withMessage("dueDate is required")
    .isISO8601()
    .withMessage("dueDate must be a valid date")
    .toDate(),
  body("billType")
    .optional()
    .isIn(["maintenance", "parking", "utility", "other"])
    .withMessage("billType must be maintenance, parking, utility, or other"),
  body("billingMonth")
    .optional({ nullable: true })
    .isISO8601()
    .withMessage("billingMonth must be a valid date"),
  body("charges")
    .isArray({ min: 1 })
    .withMessage("charges must be a non-empty array"),
  body("charges.*.charge_name")
    .trim()
    .notEmpty()
    .withMessage("charge_name is required")
    .isLength({ min: 2, max: 120 })
    .withMessage("charge_name must be between 2 and 120 characters"),
  body("charges.*.amount")
    .isFloat({ gt: 0 })
    .withMessage("amount must be greater than 0")
    .toFloat(),
  body("charges.*.charge_type")
    .optional({ nullable: true })
    .isIn(["maintenance", "parking", "utility", "late_fee", "misc"])
    .withMessage("charge_type must be maintenance, parking, utility, late_fee, or misc"),
];

const raiseComplaintValidation = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("title is required")
    .isLength({ min: 3, max: 150 })
    .withMessage("title must be between 3 and 150 characters"),
  body("description")
    .trim()
    .notEmpty()
    .withMessage("description is required")
    .isLength({ min: 10, max: 2000 })
    .withMessage("description must be between 10 and 2000 characters"),
  body("category")
    .optional()
    .trim()
    .isLength({ min: 2, max: 80 })
    .withMessage("category must be between 2 and 80 characters"),
];

const complaintListQueryValidation = [
  ...searchableQueryValidation,
  query("status")
    .optional()
    .isIn(["open", "assigned", "in_progress", "resolved", "closed", "archived", "deleted", "all"])
    .withMessage("status must be open, assigned, in_progress, resolved, closed, archived, deleted, or all"),
  query("category")
    .optional()
    .trim()
    .isLength({ max: 80 })
    .withMessage("category must be at most 80 characters"),
  query("flatNumber")
    .optional()
    .trim()
    .isLength({ max: 40 })
    .withMessage("flatNumber must be at most 40 characters"),
  query("residentId")
    .optional()
    .isInt({ min: 1 })
    .withMessage("residentId must be a positive integer")
    .toInt(),
  query("fromDate")
    .optional()
    .isISO8601()
    .withMessage("fromDate must be a valid date"),
  query("toDate")
    .optional()
    .isISO8601()
    .withMessage("toDate must be a valid date"),
];

const updateComplaintStatusValidation = [
  ...idParamValidation,
  body("status")
    .notEmpty()
    .withMessage("status is required")
    .isIn(["open", "assigned", "in_progress", "resolved", "closed", "archived"])
    .withMessage("status must be open, assigned, in_progress, resolved, closed, or archived"),
  body("category")
    .optional()
    .trim()
    .isLength({ min: 2, max: 80 })
    .withMessage("category must be between 2 and 80 characters"),
];

const archiveDeleteValidation = [
  ...idParamValidation,
  body("reason")
    .trim()
    .notEmpty()
    .withMessage("reason is required")
    .isLength({ min: 3, max: 500 })
    .withMessage("reason must be between 3 and 500 characters"),
];

const createNoticeValidation = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("title is required")
    .isLength({ min: 3, max: 200 })
    .withMessage("title must be between 3 and 200 characters"),
  body("message")
    .trim()
    .notEmpty()
    .withMessage("message is required")
    .isLength({ min: 5, max: 4000 })
    .withMessage("message must be between 5 and 4000 characters"),
  body("expiresAt")
    .optional({ nullable: true })
    .isISO8601()
    .withMessage("expiresAt must be a valid date"),
];

const addCommentValidation = [
  ...idParamValidation,
  body("comment")
    .trim()
    .notEmpty()
    .withMessage("comment is required")
    .isLength({ min: 2, max: 1000 })
    .withMessage("comment must be between 2 and 1000 characters"),
];

const addVisitorEntryValidation = [
  body("visitorName")
    .trim()
    .notEmpty()
    .withMessage("Full name is required")
    .isLength({ min: 2, max: 120 })
    .withMessage("Full name must be between 2 and 120 characters"),
  body("visitorEmail")
    .optional({ nullable: true })
    .trim()
    .isEmail()
    .withMessage("visitorEmail must be valid")
    .normalizeEmail(),
  body("phone")
    .trim()
    .notEmpty()
    .withMessage("Mobile number is required")
    .isLength({ min: 7, max: 20 })
    .withMessage("Mobile number must be between 7 and 20 characters"),
  body("gender")
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 30 })
    .withMessage("gender can be at most 30 characters"),
  body("visitorCount")
    .optional({ nullable: true })
    .isInt({ min: 1, max: 50 })
    .withMessage("Number of visitors must be between 1 and 50")
    .toInt(),
  body("purpose")
    .optional({ nullable: true })
    .trim()
    .custom((value, { req }) => {
      if (req.body.preapprovalId) {
        return true;
      }
      return true;
    })
    .isLength({ min: 2, max: 200 })
    .withMessage("purpose must be between 2 and 200 characters"),
  body("wing")
    .optional({ nullable: true })
    .trim()
    .custom((value, { req }) => {
      // wing required if flatId/preapprovalId not provided and request is not from security guard
      if (req.body.flatId || req.body.preapprovalId || (req.user && req.user.role === 'security')) return true;
      if (!value) throw new Error('wing is required');
      return true;
    })
    .isLength({ min: 1, max: 40 })
    .withMessage("wing must be between 1 and 40 characters"),
  body("floor")
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 40 })
    .withMessage("floor can be at most 40 characters"),
  body("flatNumber")
    .optional({ nullable: true })
    .trim()
    .custom((value, { req }) => {
      if (req.body.flatId || req.body.preapprovalId || (req.user && req.user.role === 'security')) return true;
      if (!value) throw new Error('flatNumber is required');
      return true;
    })
    .isLength({ min: 1, max: 40 })
    .withMessage("flatNumber must be between 1 and 40 characters"),
  body("photoBase64")
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .custom((value, { req }) => {
      if (req.file || value) return true;
      throw new Error("Please capture or upload visitor face before check-in.");
    }),
  body("visitorPhoto").custom((_value, { req }) => {
    if (req.file || String(req.body.photoBase64 || "").trim()) return true;
    throw new Error("Please capture or upload visitor face before check-in.");
  }),
  body("faceDetectionConfidence")
    .optional({ nullable: true })
    .isFloat({ min: 0, max: 1 })
    .withMessage("faceDetectionConfidence must be between 0 and 1")
    .toFloat(),
  body("isFaceValid")
    .optional({ nullable: true })
    .isBoolean()
    .withMessage("isFaceValid must be a boolean")
    .toBoolean(),
  body("personToMeet")
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 120 })
    .withMessage("personToMeet can be at most 120 characters"),
  body("vehicleNumber")
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 30 })
    .withMessage("vehicleNumber can be at most 30 characters"),
  body("flatId")
    .optional({ nullable: true })
    .isInt({ min: 1 })
    .withMessage("flatId must be a positive integer")
    .toInt(),
  body("residentId")
    .optional({ nullable: true })
    .isInt({ min: 1 })
    .withMessage("residentId must be a positive integer")
    .toInt()
    .custom((value, { req }) => {
      // residentId is required for security guards
      if (req.user && req.user.role === 'security' && !value) {
        throw new Error('residentId is required for security check-ins');
      }
      return true;
    }),
  body("preapprovalId")
    .optional({ nullable: true })
    .isInt({ min: 1 })
    .withMessage("preapprovalId must be a positive integer")
    .toInt(),
];

const ownerVisitorPreapprovalValidation = [
  body("flatId")
    .isInt({ min: 1 })
    .withMessage("flatId must be a positive integer")
    .toInt(),
  body("visitorName")
    .trim()
    .notEmpty()
    .withMessage("visitorName is required")
    .isLength({ min: 2, max: 120 })
    .withMessage("visitorName must be between 2 and 120 characters"),
  body("phone")
    .optional({ nullable: true })
    .trim()
    .isLength({ min: 7, max: 20 })
    .withMessage("phone must be between 7 and 20 characters"),
  body("purpose")
    .trim()
    .notEmpty()
    .withMessage("purpose is required")
    .isLength({ min: 2, max: 200 })
    .withMessage("purpose must be between 2 and 200 characters"),
  body("visitDate")
    .isISO8601()
    .withMessage("visitDate must be a valid date")
    .toDate(),
  body("expectedArrivalTime")
    .optional({ nullable: true })
    .matches(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/)
    .withMessage("expectedArrivalTime must be in HH:MM or HH:MM:SS format"),
  body("vehicleNumber")
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 30 })
    .withMessage("vehicleNumber can be at most 30 characters"),
  body("notes")
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 500 })
    .withMessage("notes can be at most 500 characters"),
];

const addFlatValidation = [
  body("buildingName")
    .trim()
    .notEmpty()
    .withMessage("buildingName is required")
    .isLength({ min: 1, max: 80 })
    .withMessage("buildingName can be at most 80 characters"),
  body("wing")
    .trim()
    .notEmpty()
    .withMessage("wing is required")
    .isIn(["A", "B", "C"])
    .withMessage("wing must be one of A, B, or C"),
  body("flatNumber")
    .trim()
    .notEmpty()
    .withMessage("flatNumber is required")
    .isLength({ min: 1, max: 40 })
    .withMessage("flatNumber can be at most 40 characters"),
  body("floor")
    .optional({ nullable: true })
    .isInt({ min: 0, max: 300 })
    .withMessage("floor must be between 0 and 300")
    .toInt(),
  body("flatType")
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 40 })
    .withMessage("flatType can be at most 40 characters"),
];

const assignResidentValidation = [
  ...idParamValidation,
  body("residentId")
    .isInt({ min: 1 })
    .withMessage("residentId must be a positive integer")
    .toInt(),
  body("moveInDate")
    .optional({ nullable: true })
    .isISO8601()
    .withMessage("moveInDate must be a valid date")
    .toDate(),
];

const flatListQueryValidation = [
  query("wing")
    .optional()
    .trim()
    .isIn(["A", "B", "C", "D"])
    .withMessage("wing must be one of A, B, C, or D"),
  query("search")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("search can be at most 100 characters"),
  query("approvalStatus")
    .optional()
    .trim()
    .isIn(["pending", "approved"])
    .withMessage("approvalStatus must be pending or approved"),
];

const chatMemberQueryValidation = [
  query("search")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("search can be at most 100 characters"),
];

const chatMemberParamValidation = [
  param("memberId")
    .isInt({ min: 1 })
    .withMessage("memberId must be a positive integer")
    .toInt(),
];

const chatMessageCreateValidation = [
  body("message")
    .trim()
    .notEmpty()
    .withMessage("message is required")
    .isLength({ min: 1, max: 2000 })
    .withMessage("message must be between 1 and 2000 characters"),
];

const documentCreateValidation = [
  body("documentType")
    .trim()
    .notEmpty()
    .withMessage("documentType is required")
    .isLength({ min: 2, max: 80 })
    .withMessage("documentType must be between 2 and 80 characters"),
  body("fileUrl")
    .trim()
    .notEmpty()
    .withMessage("fileUrl is required")
    .isLength({ max: 500 })
    .withMessage("fileUrl can be at most 500 characters"),
];

const documentReviewValidation = [
  ...idParamValidation,
  body("status")
    .trim()
    .notEmpty()
    .withMessage("status is required")
    .isIn(["approved", "rejected"])
    .withMessage("status must be approved or rejected"),
  body("notes")
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 2000 })
    .withMessage("notes can be at most 2000 characters"),
];

const userCategoryParamValidation = [
  param("category")
    .trim()
    .notEmpty()
    .withMessage("category is required")
    .isIn(["residents", "staff", "security"])
    .withMessage("category must be residents, staff, or security"),
];

const userCategoryQueryValidation = [
  ...userCategoryParamValidation,
  ...searchableQueryValidation,
  query("status")
    .optional()
    .isIn(ACCOUNT_STATUS_VALUES)
    .withMessage("status must be pending, active, rejected, or inactive"),
];

module.exports = {
  registerValidation,
  loginValidation,
  superAdminLoginValidation,
  emailOnlyValidation,
  emailWithSocietyValidation,
  otpValidation,
  superAdminOtpValidation,
  resetPasswordValidation,
  superAdminResetPasswordValidation,
  idParamValidation,
  userListQueryValidation,
  userCreateValidation,
  updateUserRoleValidation,
  updateUserStatusValidation,
  deleteUserValidation,
  userCategoryParamValidation,
  userCategoryQueryValidation,
  societyValidation,
  productCreateValidation,
  billListQueryValidation,
  createBillValidation,
  raiseComplaintValidation,
  complaintListQueryValidation,
  updateComplaintStatusValidation,
  archiveDeleteValidation,
  addCommentValidation,
  createNoticeValidation,
  addVisitorEntryValidation,
  ownerVisitorPreapprovalValidation,
  addFlatValidation,
  flatListQueryValidation,
  assignResidentValidation,
  chatMemberQueryValidation,
  chatMemberParamValidation,
  chatMessageCreateValidation,
  documentCreateValidation,
  documentReviewValidation,
};
