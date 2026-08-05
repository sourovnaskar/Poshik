const express = require("express");

const routes = express.Router();

const authRoutes = require("./authRoutes");
routes.use("/api/auth", authRoutes);

const petRoutes = require("./petRoutes");
routes.use("/api/pet", petRoutes);

const doctorRoutes = require("./doctorRoutes");
routes.use("/api/doctor", doctorRoutes);

const shopRoutes = require("./shopRoutes");
routes.use("/api/shop", shopRoutes);

module.exports = routes;
