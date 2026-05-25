const AccessRequest = require("../../common/models/accessRequest.model");
const Driver = require("../models/driver.model");
const Carrier = require ("../../carrier/models/carrier.model")
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

    // VALID ACTIONS
    if (!["approve", "reject", "revoke"].includes(action)) {
      return res.status(400).json({
        message: "Invalid action",
      });
    }

    const request = await AccessRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({
        message: "Request not found",
      });
    }

    // =========================================================
    // DRIVER ACTIONS (APPROVE / REJECT)
    // =========================================================
    if (["approve", "reject"].includes(action)) {
      const driver = await Driver.findOne({
        user: req.user.id,
      });

      if (!driver) {
        return res.status(404).json({
          message: "Driver not found",
        });
      }

      // ONLY REQUEST OWNER DRIVER CAN HANDLE
      if (request.driver.toString() !== driver._id.toString()) {
        return res.status(403).json({
          message: "Unauthorized",
        });
      }

      // ================= APPROVE =================
      if (action === "approve") {
        request.status = "approved";
        request.notes = notes;

        request.expiresAt = new Date(
          Date.now() + 72 * 60 * 60 * 1000
        );

        // DRIVER PREFERENCES
        const prefs = await ConsentPreferences.findOne({
          driverId: driver._id,
        });

        const preferences = {
          ...DEFAULT_CONSENT,
          ...(prefs ? prefs.toObject() : {}),
        };

        // INTERSECTION LOGIC
        request.allowedData = {
          personalInfo: canShare(
            request.requestedData,
            preferences,
            "personalInfo"
          ),

          cdl: canShare(
            request.requestedData,
            preferences,
            "cdl"
          ),

          safety: canShare(
            request.requestedData,
            preferences,
            "safety"
          ),

          employment: canShare(
            request.requestedData,
            preferences,
            "employment"
          ),

          performance: canShare(
            request.requestedData,
            preferences,
            "performance"
          ),

          medical: canShare(
            request.requestedData,
            preferences,
            "medical"
          ),

          financial: canShare(
            request.requestedData,
            preferences,
            "financial"
          ),
        };

        await logAudit({
          performedBy: driver._id,
          role: "driver",
          action: "APPROVE_ACCESS",
          resource: "access",
          resourceId: request._id,
          targetUser: driver._id,
          category: "Access",
          message: "Driver approved access request",
          metadata: {
            requestStatus: "approved",
          },
          req,
        });
      }

      // ================= REJECT =================
      if (action === "reject") {
        request.status = "rejected";
        request.allowedData = {
          ...EMPTY_ALLOWED_DATA,
        };

        request.expiresAt = null;
        request.notes = notes;

        await logAudit({
          performedBy: driver._id,
          role: "driver",
          action: "REJECT_ACCESS",
          resource: "access",
          resourceId: request._id,
          targetUser: driver._id,
          category: "Access",
          message: "Driver rejected access request",
          metadata: {
            requestStatus: "rejected",
          },
          req,
        });
      }
    }

    // =========================================================
    // CARRIER ACTION (REVOKE)
    // =========================================================
    if (action === "revoke") {
      const carrier = await Carrier.findOne({
        user: req.user.id,
      });

      if (!carrier) {
        return res.status(404).json({
          message: "Carrier not found",
        });
      }

      // ONLY REQUEST OWNER CARRIER CAN REVOKE
      if (
        request.carrierProfile.toString() !==
        carrier._id.toString()
      ) {
        return res.status(403).json({
          message: "Unauthorized",
        });
      }

      request.status = "revoked";

      request.allowedData = {
        ...EMPTY_ALLOWED_DATA,
      };

      request.expiresAt = null;
      request.notes = notes;

      await logAudit({
        performedBy: carrier._id,
        role: "carrier",
        action: "REVOKE_ACCESS",
        resource: "access",
        resourceId: request._id,
        targetUser: request.driver,
        category: "Access",
        message: "Carrier revoked access request",
        metadata: {
          requestStatus: "revoked",
        },
        req,
      });
    }

    await request.save();

    return res.json({
      success: true,
      message: `Request ${action}ed successfully`,
      data: request,
    });

  } catch (error) {
    console.error("Access request update error:", error);

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to process access request",
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

    const page = Math.max(parseInt(req.query.page, 10) || 0, 0);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 0, 0), 100);
    const shouldPaginate = page > 0 && limit > 0;

    const query = {
      driver: driver._id,
    };

    const total = await AccessRequest.countDocuments(query);

    let requestQuery = AccessRequest.find(query)
      .populate("carrierProfile", "companyName")
      .sort({ createdAt: -1 });

    if (shouldPaginate) {
      requestQuery = requestQuery.skip((page - 1) * limit).limit(limit);
    }

    const requests = await requestQuery;
    const allRequests = shouldPaginate
      ? await AccessRequest.find(query)
          .select("status expiresAt")
          .sort({ createdAt: -1 })
      : requests;

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

    const statsSource = allRequests.map((r) => {
      if (r.status === "approved" && r.expiresAt && r.expiresAt < now) {
        return "expired";
      }
      return r.status;
    });

    const stats = {
      total,
      pending: statsSource.filter((status) => status === "pending").length,
      approved: statsSource.filter((status) => status === "approved").length,
      revoked: statsSource.filter((status) => status === "revoked").length,
      expired: statsSource.filter((status) => status === "expired").length,
    };

    const response = {
      stats,
      requests: formatted,
    };

    if (shouldPaginate) {
      response.pagination = {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      };
    }

    return res.json(response);
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
