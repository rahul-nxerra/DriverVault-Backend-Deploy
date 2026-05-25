const AccessRequest = require("../../common/models/accessRequest.model");
const Carrier = require("../models/carrier.model");
const Driver = require("../../driver/models/driver.model");
const Credential = require("../../driver/models/credential.model");
const {
  getDriverPerformanceData,
} = require("../../driver/services/performance.service");
const { logCarrierSearch } = require("../services/search.service");
const { logAudit } = require("../../../utils/auditLogger");

const toDriverCard = async (driver, request = null) => {
  const performanceData = await getDriverPerformanceData(driver._id);

  const scores = performanceData?.scores || {};

  return {
    // ================= DRIVER INFO =================
    _id: driver._id,

    name: `${driver.firstName} ${driver.lastName}`,

    firstName: driver.firstName || null,

    lastName: driver.lastName || null,

    email: driver.email || null,

    phone: driver.phone || null,

    profileImage: driver.profileImage || null,

    type: driver.licenseType,

    availability: driver.availability || null,

    available: driver.availability === "available",

    experienceYears: driver.experienceYears || 0,

    bio: driver.bio || null,

    createdAt: driver.createdAt || null,

    // ================= LOCATION =================
    location: {
      city: driver.location?.city || null,
      state: driver.location?.state || null,
    },

    // ================= PERFORMANCE =================
    safetyScore: scores.safety || 0,

    reliabilityScore: scores.reliability || 0,

    trainingScore: scores.training || 0,

    overallScore: scores.overall || 0,

    // ================= ACCESS REQUEST =================
    requestId: request?._id || null,

    requestStatus: request?.status || null,

    accessType: request?.accessType || null,

    requestedData: request?.requestedData || {},

    allowedData: request?.allowedData || {},

    expiresAt: request?.expiresAt || null,

    requestedAt: request?.createdAt || null,
  };
};

const isActiveApproved = (request) =>
  request?.status === "approved" &&
  (!request.expiresAt || request.expiresAt > new Date());

const escapeRegex = (value = "") =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

exports.requestAccess = async (req, res) => {
  const { driverId, requestedData, accessType, reason } = req.body;

  const driver = await Driver.findById(driverId);
  if (!driver) {
    return res.status(400).json({ message: "Invalid driver." });
  }

  const carrierProfile = await Carrier.findOne({
    user: req.user.id,
  });

  if (!carrierProfile) {
    return res.status(404).json({
      message: "Carrier profile not found",
    });
  }

  if (
    !requestedData ||
    Object.values(requestedData).every((v) => v === false)
  ) {
    return res.status(400).json({
      message: "Select at least one data type",
    });
  }

  const activeApproved = await AccessRequest.findOne({
    driver: driverId,
    carrierProfile: carrierProfile._id,
    status: "approved",
    $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
  }).sort({ createdAt: -1 });
  
  if (activeApproved) {
    return res.status(400).json({
      message: "Access already approved",
    });
  }

  const existing = await AccessRequest.findOne({
    driver: driverId,
    carrierProfile: carrierProfile._id,
    status: "pending",
  }).sort({ createdAt: -1 });

  if (existing) {
    return res.status(400).json({
      message: "Request already pending",
    });
  }

  const request = await AccessRequest.create({
    driver: driverId,
    carrierProfile: carrierProfile._id,
    requestedData,
    accessType: accessType || "view",
    reason,
  });

  await logAudit({
    performedBy: req.user.id,
    role: req.user.role,
    action: "SEND_ACCESS",
    resource: "accessRequest",
    resourceId: request._id,
    targetUser: driver._id,
    category: "Access",
    message: "Access Request Send",
    metadata: {
      accessTypeId: request._id,
      accessType: accessType,
    },
    req,
  });

  res.status(201).json({
    message: "Access request sent",
    data: request,
  });
};

// exports.getVerifiedDrivers = async (req, res) => {
//   const carrierProfile = await Carrier.findOne({
//     user: req.user.id,
//   });

//   if (!carrierProfile) {
//     return res.status(404).json({
//       message: "Carrier profile not found",
//     });
//   }

//   // ================= QUERY PARAMS =================
//   const {
//     search = "",
//     licenseType = "all",
//     availability = "all",
//     minExperience = "0",
//     minSafety = "0",
//   } = req.query;

//   const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
//   const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 50);
//   const skip = (page - 1) * limit;

//   // ================= VERIFIED DRIVERS =================
//   const verifiedDriverIds = await Credential.distinct("driver", {
//     status: "verified",
//     isActive: true,
//   });

//   // ================= BUILD QUERY =================
//   const query = {
//     _id: { $in: verifiedDriverIds },
//   };

//   const trimmedSearch = String(search).trim();
//   if (trimmedSearch) {
//     if (["1", "true"].includes(String(req.query.trackSearch))) {
//       await logCarrierSearch({
//         carrierProfileId: carrierProfile._id,
//         query: trimmedSearch,
//         source: req.searchSource || "driver_search",
//       });
//     }

//     const regex = new RegExp(escapeRegex(trimmedSearch), "i");
//     query.$or = [
//       { firstName: regex },
//       { lastName: regex },
//       { "location.city": regex },
//       { "location.state": regex },
//     ];
//   }

//   if (licenseType && licenseType !== "all") {
//     query.licenseType = licenseType;
//   }

//   if (availability && availability !== "all") {
//     query.availability = availability;
//   }

//   const minExperienceNumber = Number(minExperience);
//   if (!Number.isNaN(minExperienceNumber) && minExperienceNumber > 0) {
//     query.experienceYears = { $gte: minExperienceNumber };
//   }

//   // ================= FETCH DATA =================
//   const drivers = await Driver.find(query).sort({ createdAt: -1 });

//   // ================= ACCESS REQUEST STATUS =================
//   const requests = await AccessRequest.find({
//     carrierProfile: carrierProfile._id,
//     driver: { $in: drivers.map((d) => d._id) },
//     //  status: "approved",
//     status: { $in: ["revoked", "pending"] },
//   }).sort({ createdAt: -1 });

//   const latestRequestByDriver = new Map();
//   requests.forEach((request) => {
//     const key = request.driver.toString();
//     const current = latestRequestByDriver.get(key);

//     if (!current || (!isActiveApproved(current) && isActiveApproved(request))) {
//       latestRequestByDriver.set(key, request);
//     }
//   });

//   // ================= RESPONSE =================
//   const data = await Promise.all(
//     drivers.map((driver) =>
//       toDriverCard(driver, latestRequestByDriver.get(driver._id.toString())),
//     ),
//   );

//   const minSafetyNumber = Number(minSafety);
//   const filteredData =
//     !Number.isNaN(minSafetyNumber) && minSafetyNumber > 0
//       ? data.filter((driver) => (driver.safetyScore || 0) >= minSafetyNumber)
//       : data;
//   const total = filteredData.length;
//   const paginatedData = filteredData.slice(skip, skip + limit);

//   return res.status(200).json({
//     success:true,
//     message:"Fetch All Driver Data",
//     count: paginatedData.length,
//     data: paginatedData,
//     pagination: {
//       page,
//       limit,
//       total,
//       totalPages: Math.ceil(total / limit) || 1,
//     },
//   });
// };


exports.getVerifiedDrivers = async (req, res) => {
  try {
    // ================= CARRIER PROFILE =================
    const carrierProfile = await Carrier.findOne({
      user: req.user.id,
    });

    if (!carrierProfile) {
      return res.status(404).json({
        success: false,
        message: "Carrier profile not found",
      });
    }

    // ================= QUERY PARAMS =================
    const {
      search = "",
      licenseType = "all",
      availability = "all",
      minExperience = "0",
      minSafety = "0",
    } = req.query;

    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);

    const limit = Math.min(
      Math.max(parseInt(req.query.limit, 10) || 10, 1),
      50,
    );

    const skip = (page - 1) * limit;

    // ================= VERIFIED DRIVER IDS =================
    const verifiedDriverIds = await Credential.distinct("driver", {
      status: "verified",
      isActive: true,
    });

    // ================= REMOVE APPROVED DRIVERS =================
    const approvedRequests = await AccessRequest.find({
      carrierProfile: carrierProfile._id,
      status: "approved",
      $or: [
        { expiresAt: null },
        { expiresAt: { $gt: new Date() } },
      ],
    }).select("driver");

    const approvedDriverIds = approvedRequests.map((r) =>
      r.driver.toString(),
    );

    // ================= DRIVER QUERY =================
    const query = {
      _id: {
        $in: verifiedDriverIds,
        $nin: approvedDriverIds,
      },
    };

    // ================= SEARCH =================
    const trimmedSearch = String(search).trim();

    if (trimmedSearch) {
      if (["1", "true"].includes(String(req.query.trackSearch))) {
        await logCarrierSearch({
          carrierProfileId: carrierProfile._id,
          query: trimmedSearch,
          source: req.searchSource || "driver_search",
        });
      }

      const regex = new RegExp(
        escapeRegex(trimmedSearch),
        "i",
      );

      query.$or = [
        { firstName: regex },
        { lastName: regex },
        { "location.city": regex },
        { "location.state": regex },
      ];
    }

    // ================= LICENSE FILTER =================
    if (licenseType && licenseType !== "all") {
      query.licenseType = licenseType;
    }

    // ================= AVAILABILITY FILTER =================
    if (availability && availability !== "all") {
      query.availability = availability;
    }

    // ================= EXPERIENCE FILTER =================
    const minExperienceNumber = Number(minExperience);

    if (
      !Number.isNaN(minExperienceNumber) &&
      minExperienceNumber > 0
    ) {
      query.experienceYears = {
        $gte: minExperienceNumber,
      };
    }

    // ================= FETCH DRIVERS =================
    const drivers = await Driver.find(query).sort({
      createdAt: -1,
    });

    // ================= ACCESS REQUESTS =================
    const requests = await AccessRequest.find({
      carrierProfile: carrierProfile._id,
      driver: {
        $in: drivers.map((d) => d._id),
      },
      status: {
        $in: ["pending", "revoked", "rejected"],
      },
    }).sort({
      createdAt: -1,
    });

    // ================= LATEST REQUEST MAP =================
    const latestRequestByDriver = new Map();

    requests.forEach((request) => {
      const key = request.driver.toString();

      // Since sorted newest first,
      // first request is latest request
      if (!latestRequestByDriver.has(key)) {
        latestRequestByDriver.set(key, request);
      }
    });

    // ================= FORMAT RESPONSE =================
    const data = await Promise.all(
      drivers.map((driver) =>
        toDriverCard(
          driver,
          latestRequestByDriver.get(driver._id.toString())
        ),
      ),
    );
    // ================= SAFETY FILTER =================
    const minSafetyNumber = Number(minSafety);

    const filteredData =
      !Number.isNaN(minSafetyNumber) &&
      minSafetyNumber > 0
        ? data.filter(
            (driver) =>
              (driver.safetyScore || 0) >=
              minSafetyNumber,
          )
        : data;

    // ================= PAGINATION =================
    const total = filteredData.length;

    const paginatedData = filteredData.slice(
      skip,
      skip + limit,
    );

    // ================= RESPONSE =================
    return res.status(200).json({
      success: true,

      message: "Fetch All Driver Data",

      count: paginatedData.length,

      data: paginatedData,

      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error) {
    console.error("Get Verified Drivers Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

exports.searchDriversForAccessRequest = async (req, res) => {
  req.searchSource = "access_request_search";
  req.query = {
    ...req.query,
    limit: req.query.limit || "8",
  };

  return exports.getVerifiedDrivers(req, res);
};

exports.getCarrierAccessRequests = async (req, res) => {
  const carrierProfile = await Carrier.findOne({
    user: req.user.id,
  });

  if (!carrierProfile) {
    return res.status(404).json({
      message: "Carrier profile not found",
    });
  }

  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 50);
  const skip = (page - 1) * limit;

  const query = {
    carrierProfile: carrierProfile._id,
  };

  const [requests, total] = await Promise.all([
    AccessRequest.find(query)
      .populate("driver")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    AccessRequest.countDocuments(query),
  ]);

  const allStatusRequests =
    await AccessRequest.find(query).select("status expiresAt");

  const now = new Date();

  const data = await Promise.all(
    requests.map(async (request) => {
      const driver = request.driver;
      let status = request.status;

      if (
        request.status === "approved" &&
        request.expiresAt &&
        request.expiresAt < now
      ) {
        status = "expired";
      }

      const driverData = driver ? await toDriverCard(driver, request) : null;

      return {
        id: request._id,
        driverId: driver?._id || null,
        driverName: driver
          ? `${driver.firstName} ${driver.lastName}`
          : "Driver",
        driver: driverData,
        status,
        accessType: request.accessType,
        requestedData: request.requestedData,
        allowedData: request.allowedData,
        reason: request.reason || null,
        notes: request.notes || null,
        createdAt: request.createdAt,
        expiresAt: request.expiresAt || null,
      };
    }),
  );

  const normalizedStatus = (request) => {
    if (
      request.status === "approved" &&
      request.expiresAt &&
      request.expiresAt < now
    ) {
      return "expired";
    }

    return request.status;
  };

  const stats = {
    total,
    pending: allStatusRequests.filter(
      (request) => normalizedStatus(request) === "pending",
    ).length,
    approved: allStatusRequests.filter(
      (request) => normalizedStatus(request) === "approved",
    ).length,
    rejected: allStatusRequests.filter(
      (request) => normalizedStatus(request) === "rejected",
    ).length,
    revoked: allStatusRequests.filter(
      (request) => normalizedStatus(request) === "revoked",
    ).length,
    expired: allStatusRequests.filter(
      (request) => normalizedStatus(request) === "expired",
    ).length,
  };

  return res.json({
    stats,
    requests: data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  });
};

exports.getMyDrivers = async (req, res) => {
  try{
     const carrierProfile = await Carrier.findOne({
    user: req.user.id,
  });

  if (!carrierProfile) {
    return res.status(404).json({
      message: "Carrier profile not found",
    });
  }

  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 6, 1), 50);
  const skip = (page - 1) * limit;

  const requests = await AccessRequest.find({
    carrierProfile: carrierProfile._id,
    status: "approved",
    $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
  })
    .populate("driver")
    .sort({ createdAt: -1 });

  const seenDrivers = new Set();
  const data = [];

  for (const request of requests) {
    if (!request.driver) continue;

    const driverId = request.driver._id.toString();
    if (seenDrivers.has(driverId)) continue;

    seenDrivers.add(driverId);
    data.push({
      requestId: request._id,
      id: request._id,
      driverId: request.driver._id,
      createdAt: request.createdAt,
      approvedAt: request.updatedAt || request.createdAt,
      expiresAt: request.expiresAt || null,
      requestedData: request.requestedData,
      allowedData: request.allowedData,
      driver: await toDriverCard(request.driver, request),
    });
  }

  const total = data.length;
  const paginatedData = data.slice(skip, skip + limit);

  return res.status(200).json({
    success:true,
    message:"Fetch All Driver Data",
    count: paginatedData.length,
    data: paginatedData,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  });
  }catch(error){
    console.log(error);
    return res.status(200).json({
      success:false,
      message:"Internal Server Error"
    })
  }
};
