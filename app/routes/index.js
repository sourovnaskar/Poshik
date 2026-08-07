const express = require("express");

const routes = express.Router();

// Landing page
routes.get("/", (req, res) => {
  res.render("landing", { title: "Poshik — Care for Your Pet, Made Simple" });
});

const authRoutes = require("./authRoutes");
routes.use("/api/auth", authRoutes);

const petRoutes = require("./petRoutes");
routes.use("/api/pet", petRoutes);

const doctorRoutes = require("./doctorRoutes");
routes.use("/api/doctor", doctorRoutes);

const shopRoutes = require("./shopRoutes");
routes.use("/api/shop", shopRoutes);

const adminRoutes = require("./adminRoutes");
routes.use("/admin", adminRoutes);

module.exports = routes;
