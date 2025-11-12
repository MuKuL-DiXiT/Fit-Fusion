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
const aiDietPlanRoutes = require("./routes/aiDietPlan");
const productRoutes = require("./routes/products");
const orderRoutes = require("./routes/orders");
const foodRoutes = require("./routes/food");
const logRoutes = require("./routes/log");

app.use("/api/auth", authRoutes);
app.use("/api/health", healthRoutes);
app.use("/api/diet-plans", dietPlanRoutes);
app.use("/api/ai-diet-plan", aiDietPlanRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/food", foodRoutes);
app.use("/api/log", logRoutes);

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

// Seed sample products/food if DB is empty (best-effort)
const { pool } = require('./config/db');
const fs = require('fs');
(async function trySeed() {
  try {
    const cnt = await pool.query('SELECT COUNT(*) FROM products');
    if (cnt && cnt.rows && parseInt(cnt.rows[0].count) === 0) {
      const sql = fs.readFileSync(__dirname + '/sample_data.sql', 'utf8');
      await pool.query(sql);
      console.log('Seeded sample data into database');
    }
  } catch (err) {
    console.warn('Skipping DB seeding (error or table exists):', err.message || err);
  }
})();

app.listen(PORT, () => {
  console.log(`Fit Fusion Server running on port ${PORT}`);
});