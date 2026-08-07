const User = require("../models/userModel");
const Doctor = require("../models/doctorModel");
const Shop = require("../models/shopModel");
const KycDocument = require("../models/kycModel");
const Category = require("../models/categoryModel");
const Product = require("../models/productModel");
const Appointment = require("../models/appointmentModel");

class AdminController {
  // GET /admin/dashboard
  async getDashboard(req, res) {
    try {
      const usersCount = await User.countDocuments({ role: "Owner" });
      const doctorsCount = await Doctor.countDocuments();
      const shopsCount = await Shop.countDocuments();
      const kycPendingCount = await KycDocument.countDocuments({
        status: "Pending",
      });
      const totalAppointments = await Appointment.countDocuments();

      res.render("admin/dashboard", {
        title: "Admin Dashboard",
        user: req.user,
        stats: {
          usersCount,
          doctorsCount,
          shopsCount,
          kycPendingCount,
          totalAppointments,
          totalRevenue: 0, // Mock revenue
        },
      });
    } catch (error) {
      console.error("Error in admin dashboard:", error);
      req.flash("error", "Error loading dashboard");
      res.redirect("/");
    }
  }

  // GET /admin/users
  async getUsers(req, res) {
    try {
      const users = await User.find({ role: "Owner" }).sort({ createdAt: -1 });
      res.render("admin/users", {
        title: "Manage Users",
        user: req.user,
        users,
      });
    } catch (error) {
      console.error(error);
      req.flash("error", "Error loading users");
      res.redirect("/admin/dashboard");
    }
  }

  // POST /admin/users/:id/toggle-status
  async toggleUserStatus(req, res) {
    try {
      const user = await User.findById(req.params.id);
      if (user) {
        user.isActive = !user.isActive;
        await user.save();
        req.flash(
          "success",
          `User account ${user.isActive ? "activated" : "deactivated"}`,
        );
      }
      res.redirect("/admin/users");
    } catch (error) {
      req.flash("error", "Failed to update user status");
      res.redirect("/admin/users");
    }
  }

  // GET /admin/doctors
  async getDoctors(req, res) {
    try {
      const doctors = await Doctor.find()
        .populate("user")
        .sort({ createdAt: -1 });
      res.render("admin/doctors", {
        title: "Manage Doctors",
        user: req.user,
        doctors,
      });
    } catch (error) {
      console.error(error);
      req.flash("error", "Error loading doctors");
      res.redirect("/admin/dashboard");
    }
  }

  // POST /admin/doctors/:id/toggle-status
  async toggleDoctorStatus(req, res) {
    try {
      const doctor = await Doctor.findById(req.params.id).populate("user");
      if (doctor) {
        doctor.isActive = !doctor.isActive;
        await doctor.save();
        doctor.user.isActive = !doctor.user.isActive;
        await doctor.user.save();
        req.flash(
          "success",
          `Doctor account ${doctor.isActive ? "activated" : "deactivated"}`,
        );
      }

      res.redirect("/admin/doctors");
    } catch (error) {
      req.flash("error", "Failed to update doctor status");
      res.redirect("/admin/doctors");
    }
  }

  // GET /admin/shops
  async getShops(req, res) {
    try {
      const shops = await Shop.find().populate("owner").sort({ createdAt: -1 });
      res.render("admin/shops", {
        title: "Manage Shops",
        user: req.user,
        shops,
      });
    } catch (error) {
      console.error(error);
      req.flash("error", "Error loading shops");
      res.redirect("/admin/dashboard");
    }
  }

  // POST /admin/shops/:id/toggle-status
  async toggleShopStatus(req, res) {
    try {
      const shop = await Shop.findById(req.params.id);
      if (shop) {
        shop.isActive = !shop.isActive;
        await shop.save();
        req.flash(
          "success",
          `Shop account ${shop.isActive ? "activated" : "deactivated"}`,
        );
      }
      res.redirect("/admin/shops");
    } catch (error) {
      req.flash("error", "Failed to update shop status");
      res.redirect("/admin/shops");
    }
  }

  // GET /admin/kyc
  async getKyc(req, res) {
    try {
      const kycs = await KycDocument.find()
        .populate("user")
        .sort({ createdAt: -1 });
      res.render("admin/kyc", {
        title: "KYC Applications",
        user: req.user,
        kycs,
      });
    } catch (error) {
      console.error(error);
      req.flash("error", "Error loading KYC applications");
      res.redirect("/admin/dashboard");
    }
  }

  // POST /admin/kyc/:id/approve
  async approveKyc(req, res) {
    try {
      const kyc = await KycDocument.findById(req.params.id).populate("user");
      if (kyc) {
        kyc.status = "Approved";
        kyc.verifiedBy = req.user._id;
        kyc.verifiedAt = new Date();
        await kyc.save();

        // Update user status
        kyc.user.kycStatus = "Approved";
        await kyc.user.save();

        req.flash("success", "KYC Approved successfully");
      }
      res.redirect("/admin/kyc");
    } catch (error) {
      req.flash("error", "Failed to approve KYC");
      res.redirect("/admin/kyc");
    }
  }

  // POST /admin/kyc/:id/reject
  async rejectKyc(req, res) {
    try {
      const { rejectionReason } = req.body;
      const kyc = await KycDocument.findById(req.params.id).populate("user");
      if (kyc) {
        kyc.status = "Rejected";
        kyc.rejectionReason = rejectionReason || "Invalid Documents";
        kyc.verifiedBy = req.user._id;
        kyc.verifiedAt = new Date();
        await kyc.save();

        // Update user status
        kyc.user.kycStatus = "Rejected";
        await kyc.user.save();

        req.flash("success", "KYC Rejected successfully");
      }
      res.redirect("/admin/kyc");
    } catch (error) {
      req.flash("error", "Failed to reject KYC");
      res.redirect("/admin/kyc");
    }
  }

  // GET /admin/categories
  async getCategories(req, res) {
    try {
      const categories = await Category.find()
        .populate("shop")
        .sort({ createdAt: -1 });
      res.render("admin/categories", {
        title: "Product Categories",
        user: req.user,
        categories,
      });
    } catch (error) {
      console.error(error);
      req.flash("error", "Error loading categories");
      res.redirect("/admin/dashboard");
    }
  }

  // GET /admin/products
  async getProducts(req, res) {
    try {
      const products = await Product.find()
        .populate("shop")
        .populate("category")
        .sort({ createdAt: -1 });
      res.render("admin/products", {
        title: "Monitor Products",
        user: req.user,
        products,
      });
    } catch (error) {
      console.error(error);
      req.flash("error", "Error loading products");
      res.redirect("/admin/dashboard");
    }
  }

  // GET /admin/appointments
  async getAppointments(req, res) {
    try {
      const appointments = await Appointment.find()
        .populate("owner")
        .populate("doctor")
        .populate("pet")
        .sort({ createdAt: -1 });
      res.render("admin/appointments", {
        title: "Monitor Appointments",
        user: req.user,
        appointments,
      });
    } catch (error) {
      console.error(error);
      req.flash("error", "Error loading appointments");
      res.redirect("/admin/dashboard");
    }
  }

  // GET /admin/orders
  async getOrders(req, res) {
    try {
      // Since Order model is not created, passing empty array for now
      const orders = [];
      res.render("admin/orders", {
        title: "Monitor Orders & Payments",
        user: req.user,
        orders,
      });
    } catch (error) {
      console.error(error);
      req.flash("error", "Error loading orders");
      res.redirect("/admin/dashboard");
    }
  }
}

module.exports = new AdminController();
