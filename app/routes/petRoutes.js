const express = require("express");
const upload = require("../utils/multer_setup");
const petController = require("../controller/petController");
const { PetSchema } = require("../utils/schemaValidation");
const validation = require("../middleware/validation");
const authCheck = require("../middleware/authCheck");

const routes = express.Router();

routes.get("/dashboard", authCheck, petController.renderDashboard);

routes.get("/add", authCheck, petController.renderAddPet);
routes.post(
  "/create",
  authCheck,
  upload.single("image"),
  validation(PetSchema),
  petController.createPet,
);

routes.get("/profile/:id", authCheck, petController.detailsPet);
routes.get("/edit/:id", authCheck, petController.renderEditPet);
routes.post(
  "/update/:id",
  upload.single("image"),
  authCheck,
  petController.updatePetDetails,
);

routes.get("/owner/profile", authCheck, petController.renderOwnerProfile);
routes.get("/owner/pets", authCheck, petController.myPet);
routes.get("/appointements", authCheck, petController.getMyAppointments);
routes.get("/view/book-doctor", authCheck, petController.getDoctorsDirectory);
routes.post("/book-doctor", authCheck, petController.bookAppointment);

routes.get("/view/shop", authCheck, petController.petShop);
routes.get("/view/products/:id", authCheck, petController.products);

// POST route to check and add
routes.post("/cart/add", authCheck, petController.addToCart);

// POST route to override
routes.post("/cart/replace", authCheck, petController.replaceCart);
routes.get("/cart", authCheck, petController.viewCart);
module.exports = routes;
