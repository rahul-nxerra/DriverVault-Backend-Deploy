const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../../config/cloudinary");

const storage = new CloudinaryStorage({
  cloudinary,
  params: (req, file) => {
    let folder = "driver_vault/profile_photos";

    // 🔴 DISPUTE FILES
    if (file.fieldname === "evidence") {
      folder = "driver_vault/disputes";
    }

    // 🟡 CREDENTIAL FILES
    else if (file.fieldname === "document") {
      if (file.mimetype === "application/pdf") {
        folder = "driver_vault/credentials/documents";
      } else {
        folder = "driver_vault/credentials/images";
      }
    }

    return {
      folder,
      resource_type: "auto",
      allowed_formats: ["jpg", "jpeg", "png", "pdf"],
    };
  },
});

const upload = multer({ storage });

module.exports = upload;
