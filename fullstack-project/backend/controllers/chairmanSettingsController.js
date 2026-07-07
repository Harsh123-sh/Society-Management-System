const path = require("path");
const chairmanSettingsModel = require("../models/chairmanSettingsModel");

const VALID_THEMES = new Set(["light", "dark", "auto"]);
const VALID_LANGUAGES = new Set(["en", "hi", "gu", "english", "hindi", "gujarati"]);

function getContext(req) {
  return {
    userId: Number(req.user?.id || req.user?.userId),
    societyId: Number(req.user?.societyId || req.user?.society_id || req.societyId),
  };
}

function requireContext(req, res) {
  const context = getContext(req);
  if (!context.userId || !context.societyId) {
    res.status(400).json({ success: false, message: "Chairman and society context are required" });
    return null;
  }
  return context;
}

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
}

function isPhone(value) {
  return /^[+()0-9\s-]{7,18}$/.test(String(value || "").trim());
}

function normalizeLanguage(value) {
  const map = { english: "en", hindi: "hi", gujarati: "gu" };
  return map[value] || value;
}

function publicUploadUrl(req, file) {
  const relativePath = path.relative(path.join(__dirname, "..", "uploads"), file.path).replace(/\\/g, "/");
  return `${req.protocol}://${req.get("host")}/uploads/${relativePath}`;
}

async function getSettings(req, res) {
  try {
    const context = requireContext(req, res);
    if (!context) return;
    const settings = await chairmanSettingsModel.getChairmanSettings(context);
    return res.json({ success: true, data: settings });
  } catch (error) {
    console.error("[chairmanSettings.getSettings]", error);
    return res.status(500).json({ success: false, message: "Could not load chairman settings" });
  }
}

async function patchProfile(req, res) {
  try {
    const context = requireContext(req, res);
    if (!context) return;
    const profile = req.body || {};
    if (!String(profile.fullName || "").trim()) {
      return res.status(400).json({ success: false, message: "Full name is required" });
    }
    if (!isEmail(profile.email)) {
      return res.status(400).json({ success: false, message: "Valid email is required" });
    }
    if (!isPhone(profile.mobile)) {
      return res.status(400).json({ success: false, message: "Valid mobile number is required" });
    }

    const updated = await chairmanSettingsModel.updateProfile({ ...context, profile });
    if (!updated) {
      return res.status(404).json({ success: false, message: "Chairman profile not found" });
    }
    return res.json({ success: true, message: "Profile updated", data: updated });
  } catch (error) {
    console.error("[chairmanSettings.patchProfile]", error);
    return res.status(500).json({ success: false, message: "Could not update profile" });
  }
}

async function patchSociety(req, res) {
  try {
    const context = requireContext(req, res);
    if (!context) return;
    const society = req.body || {};
    if (!String(society.name || "").trim()) {
      return res.status(400).json({ success: false, message: "Society name is required" });
    }
    if (society.email && !isEmail(society.email)) {
      return res.status(400).json({ success: false, message: "Valid society email is required" });
    }
    if (society.phone && !isPhone(society.phone)) {
      return res.status(400).json({ success: false, message: "Valid society phone is required" });
    }

    const updated = await chairmanSettingsModel.updateSocietyProfile({ societyId: context.societyId, society });
    return res.json({ success: true, message: "Society profile updated", data: updated });
  } catch (error) {
    console.error("[chairmanSettings.patchSociety]", error);
    return res.status(500).json({ success: false, message: "Could not update society profile" });
  }
}

async function patchNotifications(req, res) {
  try {
    const context = requireContext(req, res);
    if (!context) return;
    const allowed = ["notices", "complaints", "visitors", "billing", "email", "push"];
    const notifications = Object.fromEntries(
      allowed.map((key) => [key, Boolean(req.body?.[key])])
    );
    const updated = await chairmanSettingsModel.updateNotificationSettings({ ...context, notifications });
    return res.json({ success: true, message: "Notification settings saved", data: updated });
  } catch (error) {
    console.error("[chairmanSettings.patchNotifications]", error);
    return res.status(500).json({ success: false, message: "Could not update notification settings" });
  }
}

async function patchAppearance(req, res) {
  try {
    const context = requireContext(req, res);
    if (!context) return;
    const theme = req.body?.theme || "auto";
    const language = normalizeLanguage(req.body?.language || "en");
    if (!VALID_THEMES.has(theme)) {
      return res.status(400).json({ success: false, message: "Invalid theme" });
    }
    if (!VALID_LANGUAGES.has(language)) {
      return res.status(400).json({ success: false, message: "Invalid language" });
    }
    const updated = await chairmanSettingsModel.updateAppearanceSettings({
      ...context,
      appearance: { theme, language },
    });
    return res.json({ success: true, message: "Appearance settings saved", data: updated });
  } catch (error) {
    console.error("[chairmanSettings.patchAppearance]", error);
    return res.status(500).json({ success: false, message: "Could not update appearance settings" });
  }
}

async function uploadProfileImage(req, res) {
  try {
    const context = requireContext(req, res);
    if (!context) return;
    if (!req.file) {
      return res.status(400).json({ success: false, message: "Profile image is required" });
    }
    const imageUrl = publicUploadUrl(req, req.file);
    const updated = await chairmanSettingsModel.updateProfileImage({ ...context, imageUrl });
    if (!updated) {
      return res.status(404).json({ success: false, message: "Chairman profile not found" });
    }
    return res.json({ success: true, message: "Profile image uploaded", data: { imageUrl, profile: updated } });
  } catch (error) {
    console.error("[chairmanSettings.uploadProfileImage]", error);
    return res.status(500).json({ success: false, message: error.message || "Could not upload profile image" });
  }
}

async function uploadSocietyLogo(req, res) {
  try {
    const context = requireContext(req, res);
    if (!context) return;
    if (!req.file) {
      return res.status(400).json({ success: false, message: "Society logo is required" });
    }
    const logoUrl = publicUploadUrl(req, req.file);
    const updated = await chairmanSettingsModel.updateSocietyLogo({ societyId: context.societyId, logoUrl });
    return res.json({ success: true, message: "Society logo uploaded", data: { logoUrl, society: updated } });
  } catch (error) {
    console.error("[chairmanSettings.uploadSocietyLogo]", error);
    return res.status(500).json({ success: false, message: error.message || "Could not upload society logo" });
  }
}

module.exports = {
  getSettings,
  patchProfile,
  patchSociety,
  patchNotifications,
  patchAppearance,
  uploadProfileImage,
  uploadSocietyLogo,
};
