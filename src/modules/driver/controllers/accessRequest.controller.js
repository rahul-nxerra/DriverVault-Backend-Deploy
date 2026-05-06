const AccessRequest = require("../../common/models/accessRequest.model");
const Driver = require("../models/driver.model");
const ConsentPreferences = require("../models/consentPreferences.model");
const { logAudit } = require("../../../utils/auditLogger");

// ================= HELPER =================
const getAccessType = (allowedData) => {
  if (!allowedData || Object.keys(allowedData).length === 0) return "No Access";

  const values = Object.values(allowedData);
  const allTrue = values.every(Boolean);

  if (allTrue) return "Full Profile";

  if (allowedData.cdl && !allowedData.performance) return "Credentials Only";

  if (allowedData.performance && !allowedData.cdl) return "Performance Records";

  return "Partial Access";
};

const DEFAULT_CONSENT = {
  personalInfo: true,
  cdl: true,
  safety: true,
  employment: true,
  performance: true,
  medical: false,
  financial: false,
};

const EMPTY_ALLOWED_DATA = {
  personalInfo: false,
  cdl: false,
  safety: false,
  employment: false,
  performance: false,
  medical: false,
  financial: false,
};

const canShare = (requestedData, preferences, field) =>
  Boolean(requestedData?.[field]) && Boolean(preferences?.[field]);

// ================= HANDLE ACCESS REQUEST =================
exports.handleAccessRequest = async (req, res) => {
  try {
    const { action, notes } = req.body;

    if (!["approve", "reject", "revoke"].includes(action)) {
      return res.status(400).json({ message: "Invalid action" });
    }

    const request = await AccessRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    const driver = await Driver.findOne({ user: req.user.id });
    if (!driver) {
      return res.status(404).json({ message: "Driver not found" });
    }

    if (request.driver.toString() !== driver._id.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // ================= APPROVE =================
    if (action === "approve") {
      request.status = "approved";
      request.notes = notes;

      request.expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000);

      //  GET DRIVER PREFERENCES
      const prefs = await ConsentPreferences.findOne({
        driverId: driver._id,
      });

      const preferences = {
        ...DEFAULT_CONSENT,
        ...(prefs ? prefs.toObject() : {}),
      };

      //  INTERSECTION LOGIC
      request.allowedData = {
        personalInfo: canShare(
          request.requestedData,
          preferences,
          "personalInfo",
        ),
        cdl: canShare(request.requestedData, preferences, "cdl"),
        safety: canShare(request.requestedData, preferences, "safety"),
        employment: canShare(request.requestedData, preferences, "employment"),
        performance: canShare(
          request.requestedData,
          preferences,
          "performance",
        ),
        medical: canShare(request.requestedData, preferences, "medical"),
        financial: canShare(request.requestedData, preferences, "financial"),
      };

      await logAudit({
        actorId: driver._id,
        actorType: "driver",
        action: "APPROVE_ACCESS",
        resource: "access",
        resourceId: request._id,
        targetDriverId: driver._id,
        req,
      });
    }

    // ================= REJECT =================
    if (action === "reject") {
      request.status = "rejected";
      request.allowedData = { ...EMPTY_ALLOWED_DATA };
      request.expiresAt = null;
      request.notes = notes;

      await logAudit({
        actorId: driver._id,
        actorType: "driver",
        action: "REJECT_ACCESS",
        resource: "access",
        resourceId: request._id,
        targetDriverId: driver._id,
        req,
      });
    }

    // ================= REVOKE =================
    if (action === "revoke") {
      request.status = "revoked";
      request.allowedData = { ...EMPTY_ALLOWED_DATA };
      request.expiresAt = null;
      request.notes = notes;

      await logAudit({
        actorId: driver._id,
        actorType: "driver",
        action: "REVOKE_ACCESS",
        resource: "access",
        resourceId: request._id,
        targetDriverId: driver._id,
        req,
      });
    }

    await request.save();

    return res.json({
      message: `Request ${action === "reject" ? "rejected" : `${action}ed`}`,
      data: request,
    });
  } catch (error) {
    console.error("Access request update error:", error);
    return res.status(500).json({
      message: error.message || "Failed to process access request",
    });
  }
};

// ================= GET ALL REQUESTS =================
exports.getDriverAccessRequests = async (req, res) => {
  try {
    const driver = await Driver.findOne({ user: req.user.id });

    if (!driver) {
      return res.status(404).json({ message: "Driver not found" });
    }

    const requests = await AccessRequest.find({
      driver: driver._id,
    })
      .populate("carrierProfile", "companyName")
      .sort({ createdAt: -1 });

    const now = new Date();

    const formatted = requests.map((r) => {
      let status = r.status;

      if (r.status === "approved" && r.expiresAt && r.expiresAt < now) {
        status = "expired";
      }

      return {
        id: r._id,
        companyName: r.carrierProfile?.companyName || "Carrier",
        status,
        accessType: getAccessType(r.allowedData),

        requestedData: r.requestedData,

        reason: r.reason || r.notes || null,
        notes: r.notes,

        createdAt: r.createdAt,
        expiresAt: r.expiresAt || null,
      };
    });

    const stats = {
      total: formatted.length,
      pending: formatted.filter((r) => r.status === "pending").length,
      approved: formatted.filter((r) => r.status === "approved").length,
      revoked: formatted.filter((r) => r.status === "revoked").length,
      expired: formatted.filter((r) => r.status === "expired").length,
    };

    return res.json({
      stats,
      requests: formatted,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch access requests",
    });
  }
};

// ================= GET SINGLE REQUEST =================
exports.getAccessRequestById = async (req, res) => {
  try {
    const request = await AccessRequest.findById(req.params.id).populate(
      "carrierProfile",
      "companyName",
    );

    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    const driver = await Driver.findOne({ user: req.user.id });

    if (!driver || request.driver.toString() !== driver._id.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    return res.json({
      id: request._id,
      companyName: request.carrierProfile?.companyName,
      status: request.status,
      accessType: getAccessType(request.allowedData),
      requestedData: request.requestedData,
      reason: request.reason || request.notes || null,
      createdAt: request.createdAt,
      expiresAt: request.expiresAt || null,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch request",
    });
  }
};
