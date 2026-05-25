const Dispute = require("../../common/models/dispute.model");
const {
  updateDisputeStatus,
} = require("../services/dispute");
const { logAudit } = require("../../../utils/auditLogger");
const { getDisputeById } = require("../services/dispute");

exports.getdispute = async (req, res) => {
  try {
    // ✅ Auth check
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // ✅ Query params
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);

    const limit = Math.min(
      Math.max(parseInt(req.query.limit, 10) || 10, 1),
      100,
    );

    // ✅ Base query for admin
    const baseQuery = {
     
    };

    // ✅ Fetch credentials
    const result = await Dispute.find(baseQuery)
      .populate({
        path: "driver",
        select: "firstName lastName email role licenseType",
      }).populate('relatedRecord')
      .sort({ createdAt: -1 });


    // ✅ Pagination
    const start = (page - 1) * limit;
    const paginated = result.slice(start, start + limit);

    return res.status(200).json({
      success: true,
      count: paginated.length,
      total: result.length,
      // counts,
      pagination: {
        page,
        limit,
        total: result.length,
        totalPages: Math.ceil(result.length / limit) || 1,
      },
      data: paginated,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch credentials",
      error: error.message,
    });
  }
};

exports.updatedispute = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, resolution} = req.body;
    
    const dispute = await getDisputeById(id);
   
    if (!dispute) {
      return res.status(404).json({
        success: false,
        message: "dispute Not Found",
      });
    }
    await updateDisputeStatus(id, status, resolution);

    let action = "";
    if (status === "under_review") {
      action = "under_review";
    }

    if (status === "resolved") {
      action = "resolved";
    }

     if (status === "rejected") {
      action = "rejected";
    }
    await logAudit({
      performedBy: req.user.id,
      role: req.user.role,

      action,

      resource: "dispute",

      resourceId: dispute._id,

      targetUser: dispute.driver.user,

      category: "Data",

      message: `${status} dispute By Admin`,

      metadata: {
        disputeId: dispute._id,
        title: dispute.title,
        driverProfileId: dispute.driver._id,
      },

      req,
    });

    return res.status(200).json({
      success: true,
      message: `Dispute ${status} Successfully`,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
