const userModel = require("../models/userModel");
const bcrypt = require("bcrypt");
const flatModel = require("../models/flatModel");
const { sendAccountDeletionEmail } = require("../utils/mailer");

const CHAIRMAN_ROLES = new Set(["chairman", "admin"]);
const OPERATIONAL_ROLES = new Set(["resident", "staff", "security"]);

function getSocietyIdFromRequest(req) {
  return req.user?.societyId || req.user?.society_id || req.societyId || null;
}

function isChairmanRole(role) {
  return CHAIRMAN_ROLES.has(String(role || "").toLowerCase());
}

function canApproveOperationalUser(user) {
  const role = String(user?.role || "").toLowerCase();
  if (!OPERATIONAL_ROLES.has(role)) return false;
  if (role === "resident") {
    return ["owner", "tenant"].includes(String(user?.resident_type || "").toLowerCase());
  }
  return true;
}

function getApprovalAuthorization({ approver, targetUser, nextStatus, requestSocietyId }) {
  const approverRole = String(approver?.role || "").toLowerCase();
  const targetRole = String(targetUser?.role || "").toLowerCase();
  const isApprovalDecision = ["active", "rejected"].includes(String(nextStatus || "").toLowerCase());
  const sameSociety =
    requestSocietyId &&
    targetUser?.society_id &&
    Number(targetUser.society_id) === Number(requestSocietyId);

  if (targetRole === "chairman" || targetRole === "admin") {
    return {
      allowed: false,
      message: "Chairman approval requires Super Admin.",
    };
  }

  if (targetRole === "secretary") {
    if (Number(targetUser.id) === Number(approver?.id || approver?.userId)) {
      return {
        allowed: false,
        message: "Secretary can be approved by Super Admin or Chairman.",
      };
    }

    if (isChairmanRole(approverRole) && sameSociety && isApprovalDecision) {
      return { allowed: true };
    }

    return {
      allowed: false,
      message: "Secretary can be approved by Super Admin or Chairman.",
    };
  }

  if (canApproveOperationalUser(targetUser)) {
    if ((isChairmanRole(approverRole) || approverRole === "secretary") && sameSociety && isApprovalDecision) {
      return { allowed: true };
    }

    return {
      allowed: false,
      message: "Chairman or Secretary can approve same-society owner, tenant, staff, and security registrations.",
    };
  }

  return {
    allowed: false,
    message: "Unauthorized approval target.",
  };
}

async function getUsers(req, res) {
  try {
    const search = req.query.search ? String(req.query.search).trim() : "";
    const requestedStatus = req.query.status ? String(req.query.status).trim() : "";
    const role = req.query.role ? String(req.query.role).trim().toLowerCase() : "";
    const wing = req.query.wing ? String(req.query.wing).trim().toUpperCase() : "";
    const floor = req.query.floor ? String(req.query.floor).trim() : "";
    const flatNumber = req.query.flatNumber ? String(req.query.flatNumber).trim() : "";
    const kyc = req.query.kyc ? String(req.query.kyc).trim() : "";
    const registrationFrom = req.query.registrationFrom ? String(req.query.registrationFrom).trim() : "";
    const registrationTo = req.query.registrationTo ? String(req.query.registrationTo).trim() : "";
    const page = req.query.page ? Number(req.query.page) : 1;
    const limit = req.query.limit ? Number(req.query.limit) : 20;
    const status = requestedStatus && requestedStatus !== "all" ? requestedStatus : "";

    const directory = await userModel.getUserDirectory({
      search,
      status,
      role,
      wing,
      floor,
      flatNumber,
      kyc,
      registrationFrom,
      registrationTo,
      page,
      limit,
      societyId: req.user?.societyId || null,
    });

    let rows = directory.rows;
    let total = directory.total;
    if (["pending", "pending_approval"].includes(String(status || "").toLowerCase())) {
      const requestSocietyId = getSocietyIdFromRequest(req);
      rows = rows.filter((item) => getApprovalAuthorization({
        approver: req.user,
        targetUser: item,
        nextStatus: "active",
        requestSocietyId,
      }).allowed);
      total = rows.length;
    }

    res.json({
      success: true,
      data: rows,
      summary: directory.summary,
      meta: {
        total,
        page: directory.page,
        limit: directory.limit,
        totalPages: Math.max(Math.ceil(total / directory.limit), 1),
      },
    });
  } catch (error) {
    console.error('[userController.getUsers] Error:', error && error.stack ? error.stack : error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}

async function getDeletedUsers(req, res) {
  try {
    const search = req.query.search ? String(req.query.search).trim() : "";
    const users = await userModel.getDeletedUsers({
      search,
      societyId: req.user?.societyId || null,
    });
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}

async function getUsersByCategory(req, res) {
  try {
    const category = req.params.category ? String(req.params.category).toLowerCase().trim() : "";
    const search = req.query.search ? String(req.query.search).trim() : "";
    const status = req.query.status ? String(req.query.status).trim() : "active";

    const VALID_CATEGORIES = ["residents", "staff", "security"];
    if (!VALID_CATEGORIES.includes(category)) {
      return res.status(400).json({
        success: false,
        message: "Invalid category. Must be residents, staff, or security",
      });
    }

    const users = await userModel.getUsersByCategory(category, {
      search,
      status,
      societyId: req.user?.societyId || null,
    });
    res.json({
      success: true,
      data: users,
      category,
      count: users.length,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}

async function createUser(req, res) {
  try {
    const { name, email, password, role, residentType, status, flatId, flatNumber, phone, department, designation } = req.body;

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "name, email and password are required" });
    }

    const existingUser = await userModel.getUserByEmail(email);
    if (existingUser) {
      return res
        .status(409)
        .json({ success: false, message: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await userModel.createUser({
      name,
      email,
      password: hashedPassword,
      role,
      residentType,
      status: role === "resident" ? "pending" : status || "active",
      isVerified: role === "resident" ? false : true,
      societyId: req.user?.societyId || null,
      flatId: flatId || null,
      flatNumber: flatNumber || null,
      phone: phone || null,
      department: department || null,
      designation: designation || null,
    });

    if (role === "resident" && residentType === "owner") {
      await userModel.syncOwnerPropertyMapping(user.id, user.flat_id || flatId || null);
    }

    res.status(201).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}

async function updateUserStatus(req, res) {
  try {
    const userId = Number(req.params.id);
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "status is required",
      });
    }

    const existingUser = await userModel.getUserById(userId);
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const requestSocietyId = getSocietyIdFromRequest(req);
    if (!requestSocietyId || Number(existingUser.society_id) !== Number(requestSocietyId)) {
      return res.status(403).json({
        success: false,
        message: "You can only manage users from your own society",
      });
    }

    const authorization = getApprovalAuthorization({
      approver: req.user,
      targetUser: existingUser,
      nextStatus: status,
      requestSocietyId,
    });

    if (!authorization.allowed) {
      return res.status(403).json({
        success: false,
        message: authorization.message,
      });
    }

    const updatedUser = await userModel.updateUserStatusById(userId, status);

      let assignedFlat = null;
      if (updatedUser && updatedUser.role === "resident" && status === "active") {
        const preferredFlatId = updatedUser.flat_id || existingUser.flat_id || null;
        assignedFlat = await flatModel.getNextAvailableFlat({
          societyId: req.user?.societyId || req.user?.society_id || existingUser.society_id || null,
          preferredFlatId,
        });

        if (assignedFlat) {
          await flatModel.assignResidentToFlat({
            flatId: assignedFlat.id,
            residentId: updatedUser.id,
            residentType: updatedUser.resident_type || existingUser.resident_type || "owner",
            assignedBy: req.user.id,
            moveInDate: new Date(),
          });

          await userModel.updateUserFlatAssignment({
            userId: updatedUser.id,
            flatId: assignedFlat.id,
            flatNumber: assignedFlat.flat_number,
          });
        }
      }

    return res.json({
      success: true,
      message: "User status updated successfully",
        data: assignedFlat ? { ...updatedUser, assigned_flat: assignedFlat } : updatedUser,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

async function updateUser(req, res) {
  try {
    const userId = Number(req.params.id);
    const { name, email, phone, department, designation, profile_photo_url, family_members } = req.body;

    const existingUser = await userModel.getUserById(userId);
    if (!existingUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const updated = await userModel.updateUserById(userId, {
      name: name === undefined ? undefined : String(name).trim(),
      email: email === undefined ? undefined : String(email).trim(),
      phone: phone === undefined ? undefined : String(phone).trim(),
      department: department === undefined ? undefined : String(department).trim(),
      designation: designation === undefined ? undefined : String(designation).trim(),
      profilePhotoUrl: profile_photo_url === undefined ? undefined : String(profile_photo_url).trim(),
      familyMembers: family_members === undefined ? undefined : family_members,
    });

    return res.json({ success: true, message: "User updated", data: updated });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

async function updateUserRole(req, res) {
  try {
    const userId = Number(req.params.id);
    const { role } = req.body;

    if (!role) {
      return res.status(400).json({
        success: false,
        message: "role is required",
      });
    }

    const existingUser = await userModel.getUserById(userId);
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (existingUser.id === req.user.id && role !== "admin") {
      return res.status(400).json({
        success: false,
        message: "You cannot remove your own admin role",
      });
    }

    const updatedUser = await userModel.updateUserRoleById(userId, role);

    return res.json({
      success: true,
      message: "User role updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

async function deleteUser(req, res) {
  try {
    const userId = Number(req.params.id);
    const reason = String(req.body.reason || "").trim();

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: "Delete reason is required",
      });
    }

    const existingUser = await userModel.getUserById(userId);
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (existingUser.deleted_at) {
      return res.status(400).json({
        success: false,
        message: "User is already deleted",
      });
    }

    if (existingUser.role === "admin" && existingUser.status === "active") {
      const remainingActiveAdmins = await userModel.countActiveAdmins(userId);
      if (remainingActiveAdmins < 1) {
        return res.status(400).json({
          success: false,
          message: "Cannot delete the last active admin",
        });
      }
    }

    try {
      await sendAccountDeletionEmail({
        to: existingUser.email,
        name: existingUser.name,
        reason,
      });
    } catch (_error) {
      return res.status(502).json({
        success: false,
        message: "Could not send deletion email. User was not deleted.",
      });
    }

    const result = await userModel.softDeleteUserById({
      userId,
      deletedBy: req.user.id,
      deleteReason: reason,
    });

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (result.alreadyInactive) {
      return res.status(400).json({
        success: false,
        message: "User is already deleted",
      });
    }

    return res.json({
      success: true,
      message: "User deleted successfully",
      data: {
        id: result.userId,
        status: "inactive",
        delete_reason: reason,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

async function restoreUser(req, res) {
  try {
    const userId = Number(req.params.id);

    const result = await userModel.restoreUserById({
      userId,
      restoredBy: req.user.id,
    });

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (result.notDeleted) {
      return res.status(400).json({
        success: false,
        message: "Only users in trash can be restored",
      });
    }

    if (result.cannotRestore) {
      return res.status(409).json({
        success: false,
        message: result.reason || "User cannot be restored",
      });
    }

    return res.json({
      success: true,
      message: "User restored successfully",
      data: {
        id: result.userId,
        email: result.email,
        status: "active",
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

async function permanentlyDeleteUser(req, res) {
  try {
    const userId = Number(req.params.id);

    const result = await userModel.permanentlyDeleteUserById({
      userId,
      deletedBy: req.user.id,
    });

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (result.notInTrash) {
      return res.status(400).json({
        success: false,
        message: "Only users in trash can be permanently deleted",
      });
    }

    return res.json({
      success: true,
      message: "User permanently deleted from trash",
      data: {
        id: result.userId,
        status: "inactive",
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

module.exports = {
  getUsers,
  getDeletedUsers,
  getUsersByCategory,
  createUser,
  updateUser,
  updateUserRole,
  updateUserStatus,
  deleteUser,
  restoreUser,
  permanentlyDeleteUser,
};
