const Credential = require("../../driver/models/credential.model");
const { getCredentialById, updateCredentialStatus } = require("../services/credential");

exports.getCredential = async (req, res) => {
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
      100
    );


    // ✅ Base query for admin
    const baseQuery = {
        isActive: true,
    };

    // ✅ Fetch credentials
    const credentials = await Credential.find(baseQuery)
      .populate({
        path: "driver",
        select: "firstName lastName email role licenseType",
      })
      .sort({ createdAt: -1 });

    // ✅ Transform credentials
    const updated = credentials.map((c) => {
      let status = c.status;

      // Auto-expiry handling
      if (c.status === "verified" && c.expiryDate) {
        const diffDays =
          (new Date(c.expiryDate) - new Date()) /
          (1000 * 60 * 60 * 24);

        if (diffDays < 0) {
          status = "expired";
        } else if (diffDays <= 30) {
          status = "expiringSoon";
        }
      }

      return {
        ...c.toObject(),
        status,
        category: "credential",
      };
    });

    // ✅ Pagination
    const start = (page - 1) * limit;
    const paginated = updated.slice(start, start + limit);

    return res.status(200).json({
      success: true,
      count: paginated.length,
      total: updated.length,
      // counts,
      pagination: {
        page,
        limit,
        total: updated.length,
        totalPages: Math.ceil(updated.length / limit) || 1,
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

exports.updateCredentialStatus = async (req, res) =>{
  try {
    const {id} = req.params
    const {status} = req.body
    const credential = await getCredentialById(id)
    if(!credential){
      return res.status(404).json({
        success:false,
        message:"Credential Not Found"
      })  
    }
    await updateCredentialStatus(id, status)
    return res.status(200).json({
        success:true,
        message:`Credential ${status} Successfully`
      })
  } catch (error) {
    console.log(error)
    return res.status(500).json({
        success:false,
        message:"Internal Server Error"
      })
  }
}