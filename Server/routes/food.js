const express = require("express");
const router = express.Router();
const { pool } = require("../config/db");
const { authenticateToken } = require("../middleware/auth");

// Search for food items
router.get("/search", authenticateToken, async (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.json({ success: true, foods: [] });
    }

    const result = await pool.query(
      "SELECT * FROM food WHERE food_name ILIKE $1 ORDER BY food_name LIMIT 10",
      [`%${q}%`]
    );

    res.json({
      success: true,
      foods: result.rows,
    });
  } catch (error) {
    console.error("Error searching for food:", error);
    res.status(500).json({
      success: false,
      message: "Error searching for food",
    });
  }
});

module.exports = router;
