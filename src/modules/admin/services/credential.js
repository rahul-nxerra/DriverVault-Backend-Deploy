const Credential = require("../../driver/models/credential.model");

exports.getCredentialById = async (id) => {
  return await Credential.findById({ _id: id }).populate("driver");
};

exports.updateCredentialStatus = async (id, status) => {
  const allowedStatuses = ["verified", "rejected", "disputed"];

  if (!allowedStatuses.includes(status)) {
    throw new Error("Invalid status");
  }
  await Credential.findByIdAndUpdate(
    { _id: id },
    { status: status },
    { returnDocument: "after" },
  );
};
