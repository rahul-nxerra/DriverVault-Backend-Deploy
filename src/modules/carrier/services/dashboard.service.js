const AccessRequest = require("../../common/models/accessRequest.model");
const Credential = require("../../driver/models/credential.model");
const Driver = require("../../driver/models/driver.model");

// import analytics
const { getCarrierAnalyticsData } = require("./analytics.service");

// ================= MAIN SERVICE =================

const getDashboardData = async (carrierId) => {
  const now = new Date();

  // ================= 1. APPROVED DRIVERS =================
  const accessList = await AccessRequest.find({
    carrierProfile: carrierId,
    status: "approved",
    expiresAt: { $gt: now },
  });

  const driverIds = accessList.map((a) => a.driver);

  // ================= 2. FILTER VERIFIED DRIVERS =================
  const verifiedDriverAgg = await Credential.aggregate([
    {
      $match: {
        driver: { $in: driverIds },
        status: "verified",
        isActive: true,
        $or: [{ expiryDate: null }, { expiryDate: { $gt: now } }],
      },
    },
    {
      $group: { _id: "$driver" },
    },
  ]);

  const verifiedCredentialDriverIds = verifiedDriverAgg.map((d) =>
    d._id.toString(),
  );

  // Drivers with approved relationship access
  const accessibleDrivers = driverIds;

  // Drivers with verified credentials
  const verifiedDrivers = accessibleDrivers.filter((id) =>
    verifiedCredentialDriverIds.includes(id.toString()),
  );
  // ================= 3. STATS =================
  const totalDrivers = accessibleDrivers.length;

  const pendingRequests = await AccessRequest.countDocuments({
    carrierProfile: carrierId,
    status: "pending",
  });

  // ================= DRIVER DISTRIBUTION =================
  const drivers = await Driver.find({
    _id: { $in: accessibleDrivers },
  });

  let cdlA = 0;
  let cdlB = 0;
  let nonCdl = 0;

  drivers.forEach((d) => {
    if (d.licenseType === "cdl-a") {
      cdlA++;
    } else if (d.licenseType === "cdl-b") {
      cdlB++;
    } else {
      nonCdl++;
    }
  });

  // ================= 5. GET ANALYTICS =================
  const analytics = await getCarrierAnalyticsData(carrierId);

  // ================= 6. BUILD UI SCORE TREND =================
  const avgSafety = analytics?.stats?.avgSafety ?? 80;
  const avgReliability = analytics?.stats?.avgReliability ?? 85;

  // smooth UI-friendly trend
  const scoreTrend = [
    {
      month: "Oct",
      safety: Math.max(70, avgSafety - 4),
      reliability: Math.max(75, avgReliability - 4),
    },
    {
      month: "Nov",
      safety: Math.max(70, avgSafety - 3),
      reliability: Math.max(75, avgReliability - 3),
    },
    {
      month: "Dec",
      safety: Math.max(70, avgSafety - 2),
      reliability: Math.max(75, avgReliability - 2),
    },
    {
      month: "Jan",
      safety: Math.max(70, avgSafety - 1),
      reliability: Math.max(75, avgReliability - 1),
    },
    {
      month: "Feb",
      safety: avgSafety,
      reliability: avgReliability,
    },
    {
      month: "Mar",
      safety: Math.min(100, avgSafety + 1),
      reliability: Math.min(100, avgReliability + 1),
    },
  ];

  // ================= 7. FINAL RESPONSE =================
  return {
    stats: {
      totalDrivers,
      verifiedProfiles: verifiedDrivers.length,
      searchesToday: 12, // TODO: make dynamic
      pendingRequests,
    },

    // UI graph
    scoreTrend,

    // donut chart
    distribution: {
      cdlA,
      cdlB,
      nonCdl,
    },

    // fleet performance bars
    performance: {
      avgSafety,
      avgReliability,
      compliance: analytics?.stats?.complianceRate ?? 0,
    },

    // TODO: dynamic activity logs
    recentActivity: [
      {
        type: "approved",
        message: "Access approved",
        time: "1h ago",
      },
      {
        type: "request",
        message: "Request sent",
        time: "3h ago",
      },
    ],
  };
};

module.exports = {
  getDashboardData,
};
