const AccessRequest = require("../../common/models/accessRequest.model");
const PerformanceRecord = require("../../driver/models/performanceRecord.model");
const Credential = require("../../driver/models/credential.model");

const {
  activePerformanceRecordFilter,
  calculateScores,
} = require("../../driver/services/performance.service");

// ================= MAIN SERVICE =================

exports.getCarrierAnalyticsData = async (carrierProfileId) => {
  const now = new Date();

  // ================= GET APPROVED DRIVERS =================
  const approvedRequests = await AccessRequest.find({
    carrierProfile: carrierProfileId,
    status: "approved",
    expiresAt: { $gt: now },
  });

  // Separate drivers based on access permissions
  const performanceDriverIds = [];
  const credentialDriverIds = [];

  approvedRequests.forEach((req) => {
    if (req.allowedData?.performance) {
      performanceDriverIds.push(req.driver);
    }

    if (req.allowedData?.cdl || req.allowedData?.employment) {
      credentialDriverIds.push(req.driver);
    }
  });

  // ================= NO DRIVERS CASE =================
  if (!approvedRequests.length) {
    return {
      stats: {
        totalDrivers: 0,
        avgSafety: 0,
        avgReliability: 0,
        complianceRate: 0,
      },
      scoreDistribution: {
        "90-100": 0,
        "80-89": 0,
        "70-79": 0,
        "<70": 0,
      },
      credentialStatus: {
        verified: 0,
        expiring: 0,
        expired: 0,
        pending: 0,
      },
      driverTurnover: [],
      complianceTrend: [],
      scoreTrend: [],
    };
  }

  // ================= FETCH PERFORMANCE DATA =================
  const performanceAgg = await PerformanceRecord.aggregate([
    {
      $match: {
        driver: { $in: performanceDriverIds },
        status: "verified",
        ...activePerformanceRecordFilter,
      },
    },
    {
      $project: {
        driver: 1,
        category: 1,
        impact: 1,
        date: 1,
      },
    },
  ]);

  // ================= GROUP BY DRIVER =================
  const driverMap = {};

  performanceAgg.forEach((r) => {
    const id = r.driver.toString();
    if (!driverMap[id]) driverMap[id] = [];
    driverMap[id].push(r);
  });

  // ================= CALCULATE DRIVER SCORES =================
  const driverScores = performanceDriverIds.map((id) => {
    const records = driverMap[id.toString()] || [];
    return calculateScores(records);
  });

  // ================= BASIC STATS =================
  const totalDrivers = approvedRequests.length;

  let totalSafety = 0;
  let totalReliability = 0;

  driverScores.forEach((d) => {
    totalSafety += d.safety;
    totalReliability += d.reliability;
  });

  const count = driverScores.length;

  const avgSafety = count ? Math.round(totalSafety / count) : 0;
  const avgReliability = count ? Math.round(totalReliability / count) : 0;

  // ================= SCORE DISTRIBUTION =================
  const scoreDistribution = {
    "90-100": 0,
    "80-89": 0,
    "70-79": 0,
    "<70": 0,
  };

  driverScores.forEach((d) => {
    const score = d.safety;

    if (score >= 90) scoreDistribution["90-100"]++;
    else if (score >= 80) scoreDistribution["80-89"]++;
    else if (score >= 70) scoreDistribution["70-79"]++;
    else scoreDistribution["<70"]++;
  });

  // ================= CREDENTIAL STATUS =================
  const credentials = await Credential.find({
    driver: { $in: credentialDriverIds },
  });

  const credentialStatus = {
    verified: 0,
    expiring: 0,
    expired: 0,
    pending: 0,
  };

  credentials.forEach((c) => {
    if (c.status === "verified" && c.isActive) {
      if (c.expiryDate && c.expiryDate < now) {
        credentialStatus.expired++;
      } else if (
        c.expiryDate &&
        c.expiryDate - now < 30 * 24 * 60 * 60 * 1000
      ) {
        credentialStatus.expiring++;
      } else {
        credentialStatus.verified++;
      }
    } else if (c.status === "pending") {
      credentialStatus.pending++;
    }
  });

  // ================= COMPLIANCE RATE =================
  const totalCredentials = credentials.length;

  const validCredentials = credentials.filter((c) => {
    if (!(c.status === "verified" && c.isActive)) return false;
    if (c.expiryDate && c.expiryDate < now) return false;
    return true;
  }).length;

  const complianceRate = totalCredentials
    ? Math.round((validCredentials / totalCredentials) * 100)
    : 0;

  // ================= GENERATE LAST 6 MONTHS =================
  const months = [];

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(d.toLocaleString("default", { month: "short" }));
  }

  // ================= PERFORMANCE TREND (USING SCORING ENGINE) =================
  const monthlyMap = {};

  performanceAgg.forEach((r) => {
    const month = new Date(r.date).toLocaleString("default", {
      month: "short",
    });

    if (!monthlyMap[month]) {
      monthlyMap[month] = [];
    }

    monthlyMap[month].push(r);
  });

  let lastSafety = 80;
  let lastReliability = 80;

  const scoreTrend = months.map((month) => {
    const records = monthlyMap[month] || [];

    if (records.length > 0) {
      const scores = calculateScores(records);

      lastSafety = scores.safety;
      lastReliability = scores.reliability;
    }

    return {
      month,
      safety: lastSafety,
      reliability: lastReliability,
    };
  });

  // ================= COMPLIANCE TREND =================
  const credentialTrendAgg = await Credential.aggregate([
    { $match: { driver: { $in: credentialDriverIds } } },
    {
      $addFields: {
        month: {
          $dateToString: { format: "%b", date: "$createdAt" },
        },
        isValid: {
          $cond: [
            {
              $and: [
                { $eq: ["$status", "verified"] },
                { $eq: ["$isActive", true] },
                {
                  $or: [
                    { $eq: ["$expiryDate", null] },
                    { $gt: ["$expiryDate", new Date()] },
                  ],
                },
              ],
            },
            1,
            0,
          ],
        },
      },
    },
    {
      $group: {
        _id: "$month",
        total: { $sum: 1 },
        valid: { $sum: "$isValid" },
      },
    },
    {
      $project: {
        _id: 0,
        month: "$_id",
        rate: {
          $round: [
            { $multiply: [{ $divide: ["$valid", "$total"] }, 100] },
            0,
          ],
        },
      },
    },
  ]);

  const trendMap = {};
  credentialTrendAgg.forEach((t) => {
    trendMap[t.month] = t.rate;
  });

  let lastValue = 80;

  const complianceTrend = months.map((month) => {
    if (trendMap[month] !== undefined) {
      lastValue = trendMap[month];
    }

    return {
      month,
      rate: lastValue,
    };
  });

  // ================= DRIVER TURNOVER (TEMP) =================
  const driverTurnover = [
    { month: "Oct", hired: 2, left: 1 },
    { month: "Nov", hired: 3, left: 0 },
    { month: "Dec", hired: 1, left: 2 },
    { month: "Jan", hired: 4, left: 1 },
  ];

  // ================= FINAL RESPONSE =================
  return {
    stats: {
      totalDrivers,
      avgSafety,
      avgReliability,
      complianceRate,
    },
    scoreDistribution,
    credentialStatus,
    driverTurnover,
    complianceTrend,
    scoreTrend,
  };
};
