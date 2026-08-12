const express = require("express");

const routes = express.Router();

// Landing page
routes.get("/", (req, res) => {
  res.render("landing", { title: "Poshik — Care for Your Pet, Made Simple" });
});

const authRoutes = require("./authRoutes");
routes.use("/auth", authRoutes);

const petRoutes = require("./petRoutes");
routes.use("/pet", petRoutes);
routes.use("/user", petRoutes); 

const doctorRoutes = require("./doctorRoutes");
routes.use("/doctor", doctorRoutes);

const shopRoutes = require("./shopRoutes");
routes.use("/shop", shopRoutes);

const adminRoutes = require("./adminRoutes");
routes.use("/admin", adminRoutes);

module.exports = routes;
