const AccessRequest = require("../../common/models/accessRequest.model");
const Driver = require("../models/driver.model");
const { logAudit } = require("../../../utils/auditLogger");

// ================= HELPER =================
const getAccessType = (allowedData) => {
  if (!allowedData) return "Limited";

  const values = Object.values(allowedData);
  const allTrue = values.every(Boolean);

  if (allTrue) return "Full Profile";

  if (allowedData.cdl && !allowedData.performance)
    return "Credentials Only";

  if (allowedData.performance && !allowedData.cdl)
    return "Performance Records";

  return "Partial Access";
};

// ================= HANDLE ACCESS REQUEST =================
exports.handleAccessRequest = async (req, res) => {
  try {
    const { action, notes } = req.body;

    if (!["approve", "revoke"].includes(action)) {
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

      // ✅ PLAN B CORE
      request.allowedData = { ...request.requestedData };

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

    // ================= REVOKE =================
    if (action === "revoke") {
      request.status = "revoked";
      request.allowedData = {}; // clear access
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
      message: `Request ${action}ed`,
      data: request,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to process access request",
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
        notes: r.notes,
        createdAt: r.createdAt,
        expiresAt: r.expiresAt,
      };
    });

    return res.json({
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
      "companyName"
    );

    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    return res.json({
      id: request._id,
      companyName: request.carrierProfile?.companyName,
      status: request.status,
      accessType: getAccessType(request.allowedData),
      requestedData: request.requestedData,
      createdAt: request.createdAt,
      expiresAt: request.expiresAt,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch request",
    });
  }
};