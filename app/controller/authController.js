const User = require("../models/userModel");
const VerificationToken = require("../models/verificationModel");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const path = require("path");
const cloudinary = require("../config/cloudinary");
const fs = require("fs/promises");
const crypto = require("crypto");

const sendVerificationEmail = require("../utils/email/sendEmail");

class AuthController {
  registerView(req, res) {
    res.render("register", { Title: "Register" });
  }

  async register(req, res) {
    try {
      const { name, email, password, confirmPassword, role } = req.body;

      if (confirmPassword !== password) {
        req.flash("error", "Password is not same");
        return res.redirect("/api/auth/register");
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
        return res.redirect("/api/auth/register");
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
      return res.redirect("/api/auth/login");
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
      return res.redirect("/api/auth/register");
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
        return res.redirect("/api/auth/login");
      }

      const isMatched = await bcrypt.compare(password, existingUser.password);
      if (!isMatched) {
        req.flash("error", "Invalid email or Password");
        return res.redirect("/api/auth/login");
      }
      if (!existingUser.isEmailVerify) {
        req.flash(
          "error",
          "Your Account is not verified , please check your mail to verify ",
        );
        return res.redirect("/api/auth/login");
      }
      if (!existingUser.isActive) {
        req.flash("error", "Your Account has been  Blocked ");
        return res.redirect("/api/auth/login");
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
        Owner: "/api/pet/dashboard",
        Doctor: "/api/doctor/dashboard",
      };

      const redirectPath = redirectUrls[existingUser.role];

      if (redirectPath) {
        return res.redirect(redirectPath);
      } else {
        return res.redirect("/api/auth/login");
      }
    } catch (error) {
      console.error("Not Logged In : ", error.message);

      req.flash("error", "Something Went wrong , Please try Again ");
      return res.redirect("/api/auth/login");
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
        return res.redirect("/api/auth/login");
      }

      const user = await User.findById(verification.userId);
      if (!user) {
        req.flash("error", "User not found. Please register again.");
        return res.redirect("/api/auth/register");
      }

      if (user.isEmailVerify) {
        await VerificationToken.deleteOne({ _id: verification._id });
        req.flash("success", "Your email is already verified. Please login.");
        return res.redirect("/api/auth/login");
      }

      user.isEmailVerify = true;
      await user.save();

      await VerificationToken.deleteOne({ _id: verification._id });

      req.flash("success", "Email verified successfully! You can now login.");
      return res.redirect("/api/auth/login");
    } catch (error) {
      console.error("Email Verification Error: ", error.message);
      req.flash("error", "Something went wrong. Please try again.");
      return res.redirect("/api/auth/login");
    }
  }

  async logout(req, res) {
    try {
      res.clearCookie("accessToken");
      res.clearCookie("refreshToken");
      req.flash("success", "Logout Successfully");
      res.redirect("/api/auth/login");
    } catch (error) {
      console.error(error.message);
      req.flash("error", "Something went wrong. Please try again.");
    }
  }
}

module.exports = new AuthController();
