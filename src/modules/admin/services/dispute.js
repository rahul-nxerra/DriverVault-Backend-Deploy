const Dispute = require("../../common/models/dispute.model");

exports.getDisputeById = async (id) => {
  return await Dispute.findById({ _id: id }).populate("driver").populate('relatedRecord');
};

exports.updateDisputeStatus = async (id, status, resolution) => {
  const allowedStatuses = ["under_review", "resolved", "rejected"];

  if (!allowedStatuses.includes(status)) {
    throw new Error("Invalid status");
  }
  
   return await Dispute.findByIdAndUpdate(
    id,
    {
      $set: {
        status,
        resolution,
      },
    },
    {
      new: true,
    }
  );
};
