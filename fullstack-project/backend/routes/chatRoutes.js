const express = require("express");
const chatController = require("../controllers/chatController");
const { authenticateToken } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");
const validationMiddleware = require("../middleware/validationMiddleware");
const {
  chatMemberQueryValidation,
  chatMemberParamValidation,
  chatMessageCreateValidation,
  idParamValidation,
} = require("../validators/requestValidators");

const router = express.Router();

router.use(authenticateToken);
router.use(authorizeRoles("super_admin", "admin", "secretary", "resident", "staff", "security"));

router.get(
  "/members",
  chatMemberQueryValidation,
  validationMiddleware,
  chatController.getMembers
);
router.get("/conversations", chatController.getConversations);
router.get("/threads/:threadId", chatController.getThreadMessages);
router.get(
  "/messages/:memberId",
  chatMemberParamValidation,
  validationMiddleware,
  chatController.getMessages
);
router.post("/threads", chatController.createThread);
router.post("/threads/:threadId/messages", chatController.sendThreadMessage);
router.patch("/threads/:threadId/read", chatController.markThreadDelivered);
router.post(
  "/messages/:memberId",
  chatMemberParamValidation,
  chatMessageCreateValidation,
  validationMiddleware,
  chatController.sendMessage
);
router.patch("/messages/:id/read", chatController.markMessageDelivered);
router.post("/messages/:id/react", chatController.reactToMessage);
router.post("/messages/:id/pin", chatController.pinMessage);
router.get("/search", chatController.searchMessages);
router.patch(
  "/messages/:id/delete-for-me",
  idParamValidation,
  validationMiddleware,
  chatController.deleteMessageForMe
);
router.patch(
  "/messages/:id/delete-for-everyone",
  idParamValidation,
  validationMiddleware,
  chatController.deleteMessageForEveryone
);

module.exports = router;
