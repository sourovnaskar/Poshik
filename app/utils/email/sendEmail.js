const transporter = require("../../config/emailConfig");

const sendVerificationEmail = async (user, token) => {
  const verificationLink = `${process.env.BASE_URL}/api/auth/verify-email/${token}`;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: user.email,
    subject: "Verify Your Email",

    html: `
      <h2>Hello ${user.name}</h2>

      <p>Click the button below to verify your account.</p>

      <a href="${verificationLink}"
      style="
      background:#4CAF50;
      color:white;
      padding:12px 20px;
      text-decoration:none;
      border-radius:5px;">
      Verify Email
      </a>

      <p>This link will expire in 1 hour.</p>
    `,
  });
};

module.exports = sendVerificationEmail;