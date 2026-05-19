const {
  getUser,
  getUserById,
  getUserByEmail,
  createUser,
  createDriverProfile,
  createCarrierProfile,
  updateUserByAdmin,
} = require("../services/users");
const User = require("../../user/user.model");
const bcrypt = require("bcrypt");

exports.getUser = async (req, res) => {
  try {
    let loginUserId = req.user.id;
    const existingUser = await User.findOne({ _id: loginUserId });
    if (!existingUser) {
      return res
        .status(404)
        .json({ success: false, message: "User Not Found" });
    }

    let users = await getUser();

    if (!users || !users.length) {
      return res.status(404).json({ success: false, mesage: "User Not Found" });
    }

    res.status(200).json({
      success: true,
      users,
    });
  } catch (error) {
    console.log("error", error);
    return res
      .status(500)
      .json({ success: false, mesage: "Internal Servier error" });
  }
};

exports.getUserById = async (req, res) => {
  try {
    let userId = req.params.id;
    let user = await getUserById(userId);
    if (!user) {
      return res.status(404).json({ success: false, mesage: "User Not Found" });
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.log("error", error);
    return res
      .status(500)
      .json({ success: false, mesage: "Internal Servier error" });
  }
};

exports.createUserByAdmin = async (req, res) => {
  try {
    const { email, password, role, firstName, lastName, companyName } =
      req.body;

    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ msg: "User already exists" });
    }

    // ✅ Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    let data = {
      email,
      password: hashedPassword,
      role,
    };

    // ✅ Create user
    const user = await createUser(data);

    let profile = null;

    if (role === "driver") {
      let driverData = {
        user: user._id,
        firstName,
        lastName,
      };
      profile = await createDriverProfile(driverData);
    }

    if (role === "carrier") {
      let carrierData = {
        user: user._id,
        companyName,
      };
      profile = await createCarrierProfile(carrierData);
    }

    return res.status(200).json({
      success: true,
      message: "User registered successfully",
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

exports.updateUserByAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    // Find user first
    const user = await getUserById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    await updateUserByAdmin(user, id, status);

    res.status(200).json({
      success: true,
      message: `User ${status} successfully`,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
