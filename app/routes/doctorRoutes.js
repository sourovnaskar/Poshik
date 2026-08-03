const express = require("express");
const upload = require("../utils/multer_setup");
// const { PetSchema } = require("../utils/schemaValidation");
// const validation = require("../middleware/validation");
const authCheck = require("../middleware/authCheck");
const doctrorController = require("../controller/doctrorController");

const routes = express.Router();

const kycUploadConfig = upload.fields([
  { name: "idProof", maxCount: 1 },
  { name: "addressProof", maxCount: 1 },
  { name: "license", maxCount: 1 },
  { name: "certificate", maxCount: 1 },
]);

routes.get("/dashboard", authCheck, doctrorController.renderDashboard);

//kyc related
routes.get("/kyc/form", authCheck, doctrorController.renderKycForm);
routes.post(
  "/kyc/submit",
  authCheck,
  kycUploadConfig,
  doctrorController.submitKyc,
);

//doctor's profile related
routes.get("/profile/form", authCheck, doctrorController.createProfileForm);
routes.post(
  "/profile/create",
  authCheck,
  doctrorController.submitProfile,
);

//doctor's schedule related
routes.get("/appointment/schedule", authCheck, doctrorController.renderSchedule);
routes.post(
  "/appointment/create/schedule",
  authCheck,
  doctrorController.createSchedule,
);

routes.get("/appointment/edit/schedule/:id", authCheck, doctrorController.renderUpdateSchedule);
routes.post(
  "/appointment/update/schedule/:id",
  authCheck,
  doctrorController.updateSchedule,
);

routes.post(
  "/appointment/cancel/schedule/:id",
  authCheck,
  doctrorController.cancelSchedule,
);

module.exports = routes;
