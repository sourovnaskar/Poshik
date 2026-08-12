const express = require("express");
const upload = require("../utils/multer_setup");
const authCheck = require("../middleware/authCheck");
const shopControler = require("../controller/shopControler");
const validations = require("../middleware/validation");
const { shopDetailsSchema } = require("../utils/schemaValidation");

const routes = express.Router();

const kycUploadConfig = upload.fields([
  { name: "idProof", maxCount: 1 },
  { name: "addressProof", maxCount: 1 },
  { name: "license", maxCount: 1 },
  { name: "certificate", maxCount: 1 },
]);

routes.get("/dashboard", authCheck, shopControler.renderDashboard);

routes.get("/kyc/form", authCheck, shopControler.renderKycForm);

routes.post("/kyc/submit", authCheck, kycUploadConfig, shopControler.submitKyc);

routes.get("/details/form", authCheck, shopControler.createShopDetails);
routes.post(
  "/submit/form",
  authCheck,
  validations(shopDetailsSchema),
  upload.single("logo"),
  shopControler.submitDetails,
);

//category related

routes.get("/get/categories", authCheck, shopControler.getCategories);
routes.get("/categories", authCheck, shopControler.renderAddCategory);
routes.post(
  "/categories/add",
  authCheck,
  upload.single("image"),
  shopControler.createCategory,
);

//products related
routes.get("/products", authCheck, shopControler.renderAddProducts);
routes.post(
  "/products/add",
  authCheck,
  upload.array("images", 4),
  shopControler.createProduct,
);
routes.get("/all/products", authCheck, shopControler.getProducts);

// Product Edit & Delete
routes.get("/products/edit/:productId", authCheck, shopControler.editProductForm);
routes.post("/products/update/:productId", authCheck, upload.array("images", 4), shopControler.updateProduct);
routes.post("/products/delete/:productId", authCheck, shopControler.deleteProduct);

// Orders
routes.get("/orders", authCheck, shopControler.getOrders);
routes.get("/orders/:orderId", authCheck, shopControler.getOrderDetail);
routes.post("/orders/:orderId/status", authCheck, shopControler.updateOrderStatus);

// Earnings
routes.get("/earnings", authCheck, shopControler.getEarnings);

module.exports = routes;
