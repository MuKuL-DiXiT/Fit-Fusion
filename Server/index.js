const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:3000", 
  credentials: true 
}));
app.use(express.json());
app.use(cookieParser());

const authRoutes = require("./routes/auth");
const healthRoutes = require("./routes/health");
const dietPlanRoutes = require("./routes/dietPlans");

app.use("/api/auth", authRoutes);
app.use("/api/health", healthRoutes);
app.use("/api/diet-plans", dietPlanRoutes);

app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "OK" });
});

app.use("*", (req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.use((error, req, res, next) => {
  console.error("Server error:", error);
  res.status(500).json({ message: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`Fit Fusion Server running on port ${PORT}`);
});