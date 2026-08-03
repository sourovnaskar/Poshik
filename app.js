const express = require("express");
const cors = require("cors");
require("dotenv").config();
const session = require("express-session");
const cookieParser = require("cookie-parser");
const ejs = require("ejs");
const path = require("path");
const swaggerJsDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./swagger.js");
const flash = require("connect-flash");
const rateLimit = require("express-rate-limit");
require("dotenv").config();
const connectDB = require("./app/config/db.js");
connectDB();
const app = express();

app.use(cors());

app.set("view engine", "ejs");
app.set("views", "views");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: "draft-8",
  legacyHeaders: false,
});
app.use(globalRateLimiter);

app.use(
  session({
    secret: process.env.SESSION_SECRET || "keyboardcat",
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 24 },
  }),
);

app.use(flash());

app.use((req, res, next) => {
  res.locals.errorMsg = req.flash("error");
  res.locals.successMsg = req.flash("success");
  next();
});

app.use("/uploads", express.static(path.join(__dirname, "/uploads")));
app.use(express.static("public"));

const router = require("./app/routes");
app.use(router);

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

const port = 5000;
app.listen(port, () => {
  console.log(`server running on : http://localhost:${port}`);
});
