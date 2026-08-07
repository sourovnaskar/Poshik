const express = require("express");
const adminController = require("../controller/adminController");
const authCheck = require("../middleware/authCheck");
const adminCheck = require("../middleware/adminCheck");

const router = express.Router();

// All admin routes require auth and admin checks
router.use(authCheck, adminCheck);

// Dashboard
router.get("/dashboard", adminController.getDashboard);

// Users Management
router.get("/users", adminController.getUsers);
router.post("/users/:id/toggle-status", adminController.toggleUserStatus);

// Doctors Management
router.get("/doctors", adminController.getDoctors);
router.post("/doctors/:id/toggle-status", adminController.toggleDoctorStatus);

// Shops Management
router.get("/shops", adminController.getShops);
router.post("/shops/:id/toggle-status", adminController.toggleShopStatus);

// KYC Management
router.get("/kyc", adminController.getKyc);
router.post("/kyc/:id/approve", adminController.approveKyc);
router.post("/kyc/:id/reject", adminController.rejectKyc);

// Categories Management
router.get("/categories", adminController.getCategories);

// Products Monitoring
router.get("/products", adminController.getProducts);

// Appointments Monitoring
router.get("/appointments", adminController.getAppointments);

// Orders Monitoring
router.get("/orders", adminController.getOrders);

module.exports = router;
