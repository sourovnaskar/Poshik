const transporter = require("../../config/emailConfig");


const sendVerificationEmail = async (user, token) => {
  const verificationLink = `${process.env.BASE_URL}/auth/verify-email/${token}`;

  await transporter.sendMail({
    from: `"Poshik 🐾" <${process.env.EMAIL_FROM}>`,
    to: user.email,
    subject: "✅ Verify Your Poshik Account",
    html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email</title>
</head>
<body style="margin:0;padding:0;background:#f4f6fb;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6fb;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#064e3b 0%,#059669 100%);padding:40px 48px;text-align:center;">
              <table cellpadding="0" cellspacing="0" style="margin:0 auto 16px;">
                <tr>
                  <td style="background:rgba(255,255,255,0.2);border-radius:14px;padding:14px 18px;">
                    <span style="font-size:28px;">🐾</span>
                  </td>
                </tr>
              </table>
              <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:800;letter-spacing:-0.5px;">Poshik</h1>
              <p style="margin:6px 0 0;color:rgba(255,255,255,0.75);font-size:13px;letter-spacing:0.5px;text-transform:uppercase;">India's #1 Pet Care Platform</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:48px 48px 32px;">
              <h2 style="margin:0 0 12px;color:#1a1a2e;font-size:24px;font-weight:700;">Welcome aboard, ${user.name}! 🎉</h2>
              <p style="margin:0 0 24px;color:#64748b;font-size:15px;line-height:1.7;">
                You're almost there! Just one more step to complete your Poshik registration.
                Click the button below to verify your email address and activate your account.
              </p>

              <!-- CTA Button -->
              <table cellpadding="0" cellspacing="0" style="margin:0 0 32px;">
                <tr>
                  <td style="background:linear-gradient(135deg,#059669,#10b981);border-radius:12px;box-shadow:0 8px 24px rgba(16,185,129,0.35);">
                    <a href="${verificationLink}"
                       style="display:inline-block;padding:16px 40px;color:#ffffff;text-decoration:none;font-size:16px;font-weight:700;letter-spacing:0.3px;">
                      ✅ Verify My Email Address
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Info box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;margin-bottom:28px;">
                <tr>
                  <td style="padding:16px 20px;">
                    <p style="margin:0;color:#166534;font-size:13px;line-height:1.6;">
                      ⏰ <strong>This link expires in 1 hour.</strong> If you didn't create a Poshik account, you can safely ignore this email.
                    </p>
                  </td>
                </tr>
              </table>

              <p style="margin:0;color:#94a3b8;font-size:12px;line-height:1.6;">
                If the button above doesn't work, copy and paste this link into your browser:<br>
                <a href="${verificationLink}" style="color:#059669;word-break:break-all;">${verificationLink}</a>
              </p>
            </td>
          </tr>

          <!-- Divider -->
          <tr><td style="padding:0 48px;"><hr style="border:none;border-top:1px solid #f1f5f9;"></td></tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 48px 40px;text-align:center;">
              <p style="margin:0 0 4px;color:#94a3b8;font-size:12px;">© 2025 Poshik. All rights reserved.</p>
              <p style="margin:0;color:#94a3b8;font-size:12px;">Caring for pets, one family at a time. 🐶🐱</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
  });
};


const sendPasswordResetEmail = async (user, token) => {
  const resetLink = `${process.env.BASE_URL}/auth/reset-password/${token}`;

  await transporter.sendMail({
    from: `"Poshik 🐾" <${process.env.EMAIL_FROM}>`,
    to: user.email,
    subject: "🔑 Reset Your Poshik Password",
    html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Password</title>
</head>
<body style="margin:0;padding:0;background:#f4f6fb;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6fb;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#1e3a5f 0%,#2563eb 100%);padding:40px 48px;text-align:center;">
              <table cellpadding="0" cellspacing="0" style="margin:0 auto 16px;">
                <tr>
                  <td style="background:rgba(255,255,255,0.2);border-radius:14px;padding:14px 18px;">
                    <span style="font-size:28px;">🔑</span>
                  </td>
                </tr>
              </table>
              <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:800;letter-spacing:-0.5px;">Poshik</h1>
              <p style="margin:6px 0 0;color:rgba(255,255,255,0.75);font-size:13px;letter-spacing:0.5px;text-transform:uppercase;">Password Reset Request</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:48px 48px 32px;">
              <h2 style="margin:0 0 12px;color:#1a1a2e;font-size:24px;font-weight:700;">Reset your password</h2>
              <p style="margin:0 0 24px;color:#64748b;font-size:15px;line-height:1.7;">
                Hi <strong>${user.name}</strong>, we received a request to reset your Poshik account password.
                Click the button below to choose a new password.
              </p>

              <!-- CTA Button -->
              <table cellpadding="0" cellspacing="0" style="margin:0 0 32px;">
                <tr>
                  <td style="background:linear-gradient(135deg,#2563eb,#3b82f6);border-radius:12px;box-shadow:0 8px 24px rgba(37,99,235,0.35);">
                    <a href="${resetLink}"
                       style="display:inline-block;padding:16px 40px;color:#ffffff;text-decoration:none;font-size:16px;font-weight:700;letter-spacing:0.3px;">
                      🔑 Reset My Password
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Warning box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#fef3c7;border:1px solid #fde68a;border-radius:10px;margin-bottom:28px;">
                <tr>
                  <td style="padding:16px 20px;">
                    <p style="margin:0;color:#92400e;font-size:13px;line-height:1.6;">
                      ⏰ <strong>This link expires in 15 minutes.</strong><br>
                      If you did not request a password reset, please ignore this email — your account is safe.
                    </p>
                  </td>
                </tr>
              </table>

              <p style="margin:0;color:#94a3b8;font-size:12px;line-height:1.6;">
                If the button above doesn't work, copy and paste this link:<br>
                <a href="${resetLink}" style="color:#2563eb;word-break:break-all;">${resetLink}</a>
              </p>
            </td>
          </tr>

          <tr><td style="padding:0 48px;"><hr style="border:none;border-top:1px solid #f1f5f9;"></td></tr>

          <tr>
            <td style="padding:24px 48px 40px;text-align:center;">
              <p style="margin:0 0 4px;color:#94a3b8;font-size:12px;">© 2025 Poshik. All rights reserved.</p>
              <p style="margin:0;color:#94a3b8;font-size:12px;">Caring for pets, one family at a time. 🐶🐱</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
  });
};


const sendOrderDeliveredEmail = async (user, order, shopName) => {
  await transporter.sendMail({
    from: `"Poshik 🐾" <${process.env.EMAIL_FROM}>`,
    to: user.email,
    subject: `📦 Your Order #${order.orderNumber} Has Been Delivered!`,
    html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Delivered</title>
</head>
<body style="margin:0;padding:0;background:#f4f6fb;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6fb;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#064e3b 0%,#059669 100%);padding:40px 48px;text-align:center;">
              <div style="font-size:52px;margin-bottom:12px;">📦</div>
              <h1 style="margin:0 0 6px;color:#ffffff;font-size:26px;font-weight:800;">Order Delivered!</h1>
              <p style="margin:0;color:rgba(255,255,255,0.8);font-size:14px;">Order #${order.orderNumber}</p>
            </td>
          </tr>

          <!-- Success Badge -->
          <tr>
            <td style="padding:0;text-align:center;">
              <table cellpadding="0" cellspacing="0" style="margin:-20px auto 0;background:#10b981;border-radius:50%;width:56px;height:56px;box-shadow:0 4px 12px rgba(16,185,129,0.4);">
                <tr><td style="text-align:center;vertical-align:middle;padding:0;line-height:56px;font-size:26px;">✓</td></tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 48px 32px;">
              <p style="margin:0 0 8px;color:#64748b;font-size:15px;">Hi <strong style="color:#1a1a2e;">${user.name}</strong>,</p>
              <p style="margin:0 0 28px;color:#64748b;font-size:15px;line-height:1.7;">
                Great news! Your order from <strong style="color:#059669;">${shopName}</strong> has been successfully delivered. We hope your furry friend loves their new goodies! 🐾
              </p>

              <!-- Order Summary Card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fffe;border:1px solid #d1fae5;border-radius:12px;margin-bottom:28px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <p style="margin:0 0 12px;color:#059669;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">Order Summary</p>
                    ${order.items
                      .map(
                        (item) => `
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:10px;">
                      <tr>
                        <td style="color:#374151;font-size:14px;font-weight:600;">${item.productName}</td>
                        <td style="color:#374151;font-size:14px;text-align:right;">x${item.quantity}</td>
                        <td style="color:#059669;font-size:14px;font-weight:700;text-align:right;padding-left:16px;">₹${item.subtotal}</td>
                      </tr>
                    </table>
                    `,
                      )
                      .join("")}
                    <hr style="border:none;border-top:1px solid #d1fae5;margin:12px 0;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="color:#1a1a2e;font-size:16px;font-weight:800;">Total Paid</td>
                        <td style="color:#059669;font-size:18px;font-weight:800;text-align:right;">₹${order.totalAmount}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Delivery Address -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;border-radius:10px;margin-bottom:28px;">
                <tr>
                  <td style="padding:16px 20px;">
                    <p style="margin:0 0 6px;color:#64748b;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">Delivered To</p>
                    <p style="margin:0;color:#374151;font-size:14px;line-height:1.6;">
                      ${order.shippingAddress.name}<br>
                      ${order.shippingAddress.address}, ${order.shippingAddress.city}<br>
                      ${order.shippingAddress.state} — ${order.shippingAddress.postalCode}
                    </p>
                  </td>
                </tr>
              </table>

              <p style="margin:0;color:#64748b;font-size:14px;line-height:1.7;">
                Thank you for shopping with Poshik! If you have any questions or concerns about your order, feel free to reach out to us.
              </p>
            </td>
          </tr>

          <tr><td style="padding:0 48px;"><hr style="border:none;border-top:1px solid #f1f5f9;"></td></tr>

          <tr>
            <td style="padding:24px 48px 40px;text-align:center;">
              <p style="margin:0 0 4px;color:#94a3b8;font-size:12px;">© 2025 Poshik. All rights reserved.</p>
              <p style="margin:0;color:#94a3b8;font-size:12px;">Caring for pets, one family at a time. 🐶🐱</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
  });
};

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendOrderDeliveredEmail,
};
