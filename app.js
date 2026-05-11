const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const testRoutes = require("./src/routes/test.route");
const errorHandler = require("./src/middlewares/error.middleware");

const app = express();

// ================= SECURITY HEADERS (HELMET) =================
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"], // Allowed for MVP stability
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "res.cloudinary.com"], // Allow Cloudinary assets
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    // HSTS: 1 Year
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
    referrerPolicy: {
      policy: "strict-origin-when-cross-origin",
    },
  })
);

// 🛡️ Hide Express fingerprinting
app.disable("x-powered-by");

// 🛡️ Custom Permissions Policy
app.use((req, res, next) => {
  res.setHeader(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), interest-cohort=()"
  );
  next();
});

app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(express.json());

// test route
app.get("/", (req, res) => {
  res.send("API Running 🚀");
});

// routes
const routes = require("./src/routes");
app.use("/api", routes);

app.use("/api/test", testRoutes);

//Custom Error Middleware
app.use(errorHandler);

module.exports = app;
