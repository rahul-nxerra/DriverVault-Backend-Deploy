const AccessRequest = require("../../common/models/accessRequest.model");

exports.handleAccessRequest = async (req, res) => {
  const { action } = req.body;

  const request = await AccessRequest.findById(req.params.id);

  if (!request) {
    return res.status(404).json({ message: "Request not found" });
  }

  // 🔐 ensure driver owns this request
  if (request.driver.toString() !== req.user.driverId) {
    return res.status(403).json({ message: "Unauthorized" });
  }

  if (action === "approve") {
    request.status = "approved";
    request.complianceAccepted = true;

    // ⏳ access valid for 24 hours
    request.expiresAt = new Date(
      Date.now() + 24 * 60 * 60 * 1000
    );
  }

  if (action === "reject") {
    request.status = "rejected";
  }

  await request.save();

  res.json({
    message: `Request ${action}ed`,
    request,
  });
};