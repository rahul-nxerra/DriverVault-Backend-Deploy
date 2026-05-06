const AccessRequest = require("../../common/models/accessRequest.model");
const Credential = require("../../driver/models/credential.model");
const Driver = require("../../driver/models/driver.model");

// import analytics
const { getCarrierAnalyticsData } = require("./analytics.service");
const {
  getDriverPerformanceData,
} = require("../../driver/services/performance.service");

// ================= MAIN SERVICE =================

// ================= TIME AGO HELPER =================
const getTimeAgo = (date) => {
  const diffMs = Date.now() - new Date(date).getTime();

  const minutes = Math.floor(diffMs / (1000 * 60));
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (minutes < 60) return `${minutes} min ago`;
  if (hours < 24) return `${hours}h ago`;

  return `${days}d ago`;
};

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

  // ================= 6. FLEET SCORE TREND =================

  const avgSafety = analytics?.stats?.avgSafety ?? 80;
  const avgReliability = analytics?.stats?.avgReliability ?? 85;

  const monthlyTrendMap = {};

  // get performance history for verified drivers
  for (const driverId of verifiedDrivers) {
    const performanceData = await getDriverPerformanceData(driverId);

    const history = performanceData.history || [];

    history.forEach((item) => {
      if (!monthlyTrendMap[item.month]) {
        monthlyTrendMap[item.month] = {
          safety: [],
          reliability: [],
        };
      }

      monthlyTrendMap[item.month].safety.push(item.safety);

      monthlyTrendMap[item.month].reliability.push(item.reliability);
    });
  }

  // build averaged fleet trend
  const scoreTrend = Object.entries(monthlyTrendMap).map(([month, values]) => {
    const safetyAvg = Math.round(
      values.safety.reduce((a, b) => a + b, 0) / values.safety.length,
    );

    const reliabilityAvg = Math.round(
      values.reliability.reduce((a, b) => a + b, 0) / values.reliability.length,
    );

    return {
      month,
      safety: safetyAvg,
      reliability: reliabilityAvg,
    };
  });

  // ================= 7. RECENT ACTIVITY =================
  const recentActivity = [];

  // ===== ACCESS REQUEST ACTIVITIES =====
  const recentRequests = await AccessRequest.find({
    carrierProfile: carrierId,
  })
    .populate("driver", "firstName lastName fullName")
    .sort({ updatedAt: -1 })
    .limit(5);

  recentRequests.forEach((r) => {
    const driverName =
      r.driver?.fullName ||
      `${r.driver?.firstName || ""} ${r.driver?.lastName || ""}`.trim() ||
      "Driver";

    // approved access
    if (r.status === "approved") {
      recentActivity.push({
        type: "approved",
        message: `Access approved by ${driverName}`,
        time: getTimeAgo(r.updatedAt),
        createdAt: r.updatedAt,
      });
    }

    // pending request
    if (r.status === "pending") {
      recentActivity.push({
        type: "request",
        message: `Access request sent to ${driverName}`,
        time: getTimeAgo(r.createdAt),
        createdAt: r.createdAt,
      });
    }

    // revoked request
    if (r.status === "revoked") {
      recentActivity.push({
        type: "revoked",
        message: `Access revoked for ${driverName}`,
        time: getTimeAgo(r.updatedAt),
        createdAt: r.updatedAt,
      });
    }
  });

  // ===== ACTIVE DRIVER ACTIVITY =====
  const recentApprovedDrivers = await AccessRequest.find({
    carrierProfile: carrierId,
    status: "approved",
    expiresAt: { $gt: now },
  })
    .populate("driver", "firstName lastName fullName")
    .sort({ updatedAt: -1 })
    .limit(2);

  recentApprovedDrivers.forEach((r) => {
    const driverName =
      r.driver?.fullName ||
      `${r.driver?.firstName || ""} ${r.driver?.lastName || ""}`.trim() ||
      "Driver";

    recentActivity.push({
      type: "active",
      message: `${driverName} added to active drivers`,
      time: getTimeAgo(r.updatedAt),
      createdAt: r.updatedAt,
    });
  });

  // ===== EXPIRING CREDENTIALS =====
  const next30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const expiringCredentials = await Credential.countDocuments({
    driver: { $in: verifiedDrivers },
    expiryDate: {
      $gte: now,
      $lte: next30Days,
    },
  });

  if (expiringCredentials > 0) {
    recentActivity.push({
      type: "warning",
      message: `${expiringCredentials} driver credentials expiring this month`,
      time: getTimeAgo(new Date()),
      createdAt: new Date(),
    });
  }

  // ===== FLEET PERFORMANCE ACTIVITY =====
  recentActivity.push({
    type: "performance",
    message: `Fleet safety average: ${avgSafety}`,
    time: getTimeAgo(new Date()),
    createdAt: new Date(),
  });

  // ===== SORT LATEST FIRST =====
  recentActivity.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  // ===== LIMIT TO TOP 6 =====
  const finalRecentActivity = recentActivity
    .slice(0, 6)
    .map(({ createdAt, ...rest }) => rest);

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
    recentActivity: finalRecentActivity,
  };
};

module.exports = {
  getDashboardData,
};
