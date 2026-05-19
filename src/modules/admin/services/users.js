const mongoose = require("mongoose");

const User = require("../../user/user.model");
const Driver = require("../../driver/models/driver.model");
const Carrier = require("../../carrier/models/carrier.model");

exports.getUser = async () => {
  return await User.aggregate([
    {
      $match: {
        role: { $ne: "admin" },
        status: { $in: ["active", "suspend"] },
      },
    },
    // DRIVER PROFILE
    {
      $lookup: {
        from: "drivers",
        localField: "_id",
        foreignField: "user",
        as: "driverProfile",
      },
    },

    // CARRIER PROFILE
    {
      $lookup: {
        from: "carriers",
        localField: "_id",
        foreignField: "user",
        as: "carrierProfile",
      },
    },

    // Convert arrays to object
    {
      $addFields: {
        driverProfile: {
          $arrayElemAt: ["$driverProfile", 0],
        },
        carrierProfile: {
          $arrayElemAt: ["$carrierProfile", 0],
        },
      },
    },

    // COMMON PROFILE FIELD
    {
      $addFields: {
        profile: {
          $cond: [
            { $eq: ["$role", "driver"] },
            "$driverProfile",
            "$carrierProfile",
          ],
        },
      },
    },

    // REMOVE EXTRA DATA
    {
      $project: {
        password: 0,
        driverProfile: 0,
        carrierProfile: 0,
        __v: 0,
      },
    },

    // SORT NEWEST FIRST
    {
      $sort: {
        createdAt: -1,
      },
    },
  ]);
};

exports.getUserById = async (id) => {
  return await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(id),
        role: { $ne: "admin" },
      },
    },
    // DRIVER PROFILE
    {
      $lookup: {
        from: "drivers",
        localField: "_id",
        foreignField: "user",
        as: "driverProfile",
      },
    },

    // CARRIER PROFILE
    {
      $lookup: {
        from: "carriers",
        localField: "_id",
        foreignField: "user",
        as: "carrierProfile",
      },
    },

    // Convert arrays to object
    {
      $addFields: {
        driverProfile: {
          $arrayElemAt: ["$driverProfile", 0],
        },
        carrierProfile: {
          $arrayElemAt: ["$carrierProfile", 0],
        },
      },
    },

    // COMMON PROFILE FIELD
    {
      $addFields: {
        profile: {
          $cond: [
            { $eq: ["$role", "driver"] },
            "$driverProfile",
            "$carrierProfile",
          ],
        },
      },
    },

    // REMOVE EXTRA DATA
    {
      $project: {
        password: 0,
        driverProfile: 0,
        carrierProfile: 0,
        __v: 0,
      },
    },

    // SORT NEWEST FIRST
    {
      $sort: {
        createdAt: -1,
      },
    },
  ]);
};

exports.getUserByEmail = async (email) => {
  return await User.findOne({ email });
};

exports.createUser = async (data) => {
  return await User.create(data);
};

exports.createDriverProfile = async (data) => {
  return Driver.create(data);
};

exports.createCarrierProfile = async (data) => {
  return Carrier.create(data);
};

exports.updateUserByAdmin = async (user, id, status) => {
  const allowedStatuses = ["active", "suspend", "delete"];

  if (!allowedStatuses.includes(status)) {
    throw new Error("Invalid status");
  }
  // Delete related profile based on role
  if (user[0].role === "driver") {
    await Driver.findOneAndUpdate(
      { user: id },
      { status },
      { returnDocument: "after" },
    );
  }

  if (user[0].role === "carrier") {
    await Carrier.findOneAndUpdate(
      { user: id },
      { status },
      { returnDocument: "after" },
    );
  }

  // Delete user
  await User.findOneAndUpdate({ _id: id }, { status }, { returnDocument: "after" });
};
