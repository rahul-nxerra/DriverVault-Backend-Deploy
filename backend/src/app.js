const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

// test route
app.get("/", (req, res) => {
  res.send("API Running 🚀");
});

// routes
const routes = require("./routes");
app.use("/api", routes);

module.exports = app;