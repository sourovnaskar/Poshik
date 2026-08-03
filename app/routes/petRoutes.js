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

module.exports = routes;
