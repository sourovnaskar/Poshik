const User = require("../models/userModel");
const VerificationToken = require("../models/verificationModel");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const path = require("path");
const cloudinary = require("../config/cloudinary");
const fs = require("fs/promises");
const crypto = require("crypto");

const sendVerificationEmail = require("../utils/email/sendEmail").sendVerificationEmail;
const sendPasswordResetEmail = require("../utils/email/sendEmail").sendPasswordResetEmail;

class AuthController {
  registerView(req, res) {
    res.render("register", { Title: "Register" });
  }

  async register(req, res) {
    try {
      const { name, email, password, confirmPassword, role } = req.body;

      if (confirmPassword !== password) {
        req.flash("error", "Password is not same");
        return res.redirect("/auth/register");
      }

      if (role === "Admin" || role === "Super Admin") {
        req.flash(
          "error",
          "You don't have permission to register as an Admin.",
        );
        return res.redirect("/register");
      }

      const existuser = await User.findOne({ email });
      if (existuser) {
        if (req.file) {
          await fs.unlink(req.file.path);
        }

        req.flash("error", "User Already Exists.");
        return res.redirect("/auth/register");
      }

      let kycStatus = "Not Applicable";
      if (role === "Doctor" || role === "Shop") {
        kycStatus = "Not Submitted";
      }

      let profileImage;
      if (req.file) {
        const uplaodImage = await cloudinary.uploader.upload(req.file.path, {
          folder: "Poshik/User-image",
        });
        profileImage = uplaodImage.secure_url;
        await fs.unlink(req.file.path);
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPasssword = await bcrypt.hash(password, salt);

      const user = new User({
        name,
        email,
        password: hashedPasssword,
        role,
        kycStatus,
        ...(profileImage && { profileImage }),
      });

      await user.save();
      const token = crypto.randomBytes(32).toString("hex");
      await VerificationToken.create({
        userId: user._id,
        token,
      });

      await sendVerificationEmail(user, token);

      req.flash("success", "User Registered SuccessFully ");
      return res.redirect("/auth/login");
    } catch (error) {
      if (req.file) {
        try {
          await fs.unlink(req.file.path);
        } catch (unlinkError) {
          console.error("File deletion error:", unlinkError);
        }
      }
      console.error("Not registered : ", error.message);

      req.flash("error", "Something Went wrong , Please try Again ");
      return res.redirect("/auth/register");
    }
  }

  loginView(req, res) {
    res.render("login", { Title: "Log-in" });
  }

  async login(req, res) {
    try {
      const { email, password } = req.body;

      const existingUser = await User.findOne({ email });

      if (!existingUser) {
        req.flash("error", "User does not Exists.");
        return res.redirect("/auth/login");
      }

      const isMatched = await bcrypt.compare(password, existingUser.password);
      if (!isMatched) {
        req.flash("error", "Invalid email or Password");
        return res.redirect("/auth/login");
      }
      if (!existingUser.isEmailVerify) {
        req.flash(
          "error",
          "Your Account is not verified , please check your mail to verify ",
        );
        return res.redirect("/auth/login");
      }
      if (!existingUser.isActive) {
        req.flash("error", "Your Account has been  Blocked ");
        return res.redirect("/auth/login");
      }
      let payload = {
        id: existingUser._id,
        name: existingUser.name,
        email: existingUser.email,
        role: existingUser.role,
        kycStatus: existingUser.kycStatus,
        image: existingUser.profileImage,
      };
      //Access-token
      const accessToken = jwt.sign(payload, process.env.JWT_SECRET_KEY, {
        expiresIn: "15m",
      });
      res.cookie("accessToken", accessToken, {
        httpOnly: true,
        maxAge: 15 * 60 * 1000,
      });

      //Refresh-Token
      const refreshToken = jwt.sign(
        payload,
        process.env.JWT_REFRESH_SECRET_KEY,
        {
          expiresIn: "7d",
        },
      );
      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
      const redirectUrls = {
        Admin: "/admin/dashboard",
        "Super Admin": "/super-admin/dashboard",
        Shop: "/shop/dashboard",
        Owner: "/pet/dashboard",
        Doctor: "/doctor/dashboard",
      };

      const redirectPath = redirectUrls[existingUser.role];

      if (redirectPath) {
        return res.redirect(redirectPath);
      } else {
        return res.redirect("/auth/login");
      }
    } catch (error) {
      console.error("Not Logged In : ", error.message);

      req.flash("error", "Something Went wrong , Please try Again ");
      return res.redirect("/auth/login");
    }
  }

  renderDashboard(req, res) {
    res.render("dashboard");
  }

  async verifyEmail(req, res) {
    try {
      const { token } = req.params;

      const verification = await VerificationToken.findOne({ token });
      if (!verification) {
        req.flash("error", "Invalid or expired verification link.");
        return res.redirect("/auth/login");
      }

      const user = await User.findById(verification.userId);
      if (!user) {
        req.flash("error", "User not found. Please register again.");
        return res.redirect("/auth/register");
      }

      if (user.isEmailVerify) {
        await VerificationToken.deleteOne({ _id: verification._id });
        req.flash("success", "Your email is already verified. Please login.");
        return res.redirect("/auth/login");
      }

      user.isEmailVerify = true;
      await user.save();

      await VerificationToken.deleteOne({ _id: verification._id });

      req.flash("success", "Email verified successfully! You can now login.");
      return res.redirect("/auth/login");
    } catch (error) {
      console.error("Email Verification Error: ", error.message);
      req.flash("error", "Something went wrong. Please try again.");
      return res.redirect("/auth/login");
    }
  }

  async logout(req, res) {
    try {
      res.clearCookie("accessToken");
      res.clearCookie("refreshToken");
      req.flash("success", "Logout Successfully");
      res.redirect("/auth/login");
    } catch (error) {
      console.error(error.message);
      req.flash("error", "Something went wrong. Please try again.");
    }
  }
  
  forgotPasswordView(req, res) {
    res.render("forgot-password", { Title: "Forgot Password" });
  }

  async forgotPassword(req, res) {
    try {
      const { email } = req.body;
      const user = await User.findOne({ email });


      if (!user) {
        req.flash("success", "If that email exists, a reset link has been sent.");
        return res.redirect("/auth/forgot-password");
      }

      const token = crypto.randomBytes(32).toString("hex");
      user.resetPasswordToken = token;
      user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000);
      await user.save();

      await sendPasswordResetEmail(user, token);

      req.flash("success", "Password reset link sent to your email. Check your inbox.");
      return res.redirect("/auth/forgot-password");
    } catch (error) {
      console.error("Forgot Password Error:", error.message);
      req.flash("error", "Something went wrong. Please try again.");
      return res.redirect("/auth/forgot-password");
    }
  }

  async renderResetPassword(req, res) {
    try {
      const { token } = req.params;
      const user = await User.findOne({
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: new Date() },
      });

      if (!user) {
        req.flash("error", "Password reset link is invalid or has expired.");
        return res.redirect("/auth/forgot-password");
      }

      res.render("reset-password", { Title: "Reset Password", token });
    } catch (error) {
      console.error("Reset Password View Error:", error.message);
      req.flash("error", "Something went wrong.");
      return res.redirect("/auth/forgot-password");
    }
  }

  async resetPassword(req, res) {
    try {
      const { token } = req.params;
      const { password, confirmPassword } = req.body;

      if (password !== confirmPassword) {
        req.flash("error", "Passwords do not match.");
        return res.redirect(`/auth/reset-password/${token}`);
      }

      if (password.length < 6) {
        req.flash("error", "Password must be at least 6 characters.");
        return res.redirect(`/auth/reset-password/${token}`);
      }

      const user = await User.findOne({
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: new Date() },
      });

      if (!user) {
        req.flash("error", "Password reset link is invalid or has expired.");
        return res.redirect("/auth/forgot-password");
      }

      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
      user.resetPasswordToken = null;
      user.resetPasswordExpires = null;
      await user.save();

      req.flash("success", "Password reset successfully! You can now log in.");
      return res.redirect("/auth/login");
    } catch (error) {
      console.error("Reset Password Error:", error.message);
      req.flash("error", "Something went wrong. Please try again.");
      return res.redirect("/auth/forgot-password");
    }
  }
}

module.exports = new AuthController();
