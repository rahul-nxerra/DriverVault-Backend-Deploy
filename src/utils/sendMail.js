const crypto = require("crypto");
const nodemailer = require("nodemailer");
require("dotenv").config();

exports.sendMail = async (email, resetToken) => {
  const resetUrl = `${process.env.BASE_URL}/reset-password/${resetToken}`;

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  // mail options
  await transporter.sendMail({
    from: process.env.EMAIL,
    to: email,
    subject: "Reset Password",
    html: `
    <h2>Password Reset</h2>
    <p>Click below link to reset your password:</p>
    <a href="${resetUrl}">
        Reset Password
    </a>
    `,
  });
};
