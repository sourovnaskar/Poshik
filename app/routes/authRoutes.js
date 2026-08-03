const express = require("express");
const authController = require("../controller/authController");
const upload = require("../utils/multer_setup");
const validation = require("../middleware/validation");
const { registerSchema } = require("../utils/schemaValidation");
const authCheck = require("../middleware/authCheck");

const routes = express.Router();

routes.get("/register", authController.registerView);

routes.post(
  "/register-create",
  validation(registerSchema),
  upload.single("image"),
  authController.register,
);

routes.get("/login", authController.loginView);
routes.post("/login-create", authController.login);

routes.get("/verify-email/:token", authController.verifyEmail);
routes.get("/doctor/dashboard", authController.renderDashboard);

routes.get("/logout", authCheck, authController.logout);
module.exports = routes;
