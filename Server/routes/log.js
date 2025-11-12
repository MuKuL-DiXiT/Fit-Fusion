const express = require("express");
const router = express.Router();
const { pool } = require("../config/db");
const { authenticateToken } = require("../middleware/auth");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// --- Food Logging ---

// Search for food (DB first, then AI)
router.get("/search-food", authenticateToken, async (req, res) => {
  const { q } = req.query;
  if (!q) {
    return res.status(400).json({ success: false, message: "Query is required" });
  }

  try {
    // 1. Search in our own database
    const dbResult = await pool.query(
      "SELECT *, 'db' as source FROM food WHERE food_name ILIKE $1 LIMIT 5",
      [`%${q}%`]
    );

    if (dbResult.rows.length > 0) {
      return res.json({ success: true, results: dbResult.rows });
    }

    // 2. If not found, ask Gemini AI
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `Provide nutritional information for "${q}" per 100g.
      Return ONLY a single valid JSON object in this exact format, no markdown or extra text:
      {
        "food_name": "${q}",
        "calories_per_100g": 123,
        "protein_per_100g": 12.3,
        "carbs_per_100g": 45.6,
        "fats_per_100g": 7.8
      }
      If you cannot find the food, return null for the values.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text().replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    
    const aiFood = JSON.parse(text);
    
    if (aiFood && aiFood.calories_per_100g) {
      res.json({ success: true, results: [{ ...aiFood, source: 'ai' }] });
    } else {
      res.json({ success: true, results: [] });
    }

  } catch (error) {
    console.error("Error searching food:", error);
    res.status(500).json({ success: false, message: "Failed to search for food" });
  }
});

// Log a food item
router.post("/food", authenticateToken, async (req, res) => {
  const { food, quantity_grams, meal_time } = req.body;
  const userId = req.user.userId;

  if (!food || !quantity_grams || !meal_time) {
    return res.status(400).json({ success: false, message: "Food, quantity, and meal time are required" });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    let foodId = food.food_id;

    // If the food is from AI (no food_id), insert it into our food table first
    if (!foodId) {
      const newFood = await client.query(
        `INSERT INTO food (food_name, calories_per_100g, protein_per_100g, carbs_per_100g, fats_per_100g)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (food_name) DO UPDATE SET calories_per_100g = EXCLUDED.calories_per_100g
         RETURNING food_id`,
        [
          food.food_name,
          food.calories_per_100g || 0,
          food.protein_per_100g || 0,
          food.carbs_per_100g || 0,
          food.fats_per_100g || 0,
        ]
      );
      foodId = newFood.rows[0].food_id;
    }

    const total_calories = (food.calories_per_100g * quantity_grams) / 100;

    // Insert into food_log
    const logResult = await client.query(
      `INSERT INTO food_log (user_id, food_id, quantity_grams, total_calories, meal_time, log_date)
       VALUES ($1, $2, $3, $4, $5, NOW())
       RETURNING *`,
      [userId, foodId, quantity_grams, total_calories, meal_time]
    );

    await client.query("COMMIT");
    res.status(201).json({ success: true, log: logResult.rows[0] });

  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error logging food:", error);
    res.status(500).json({ success: false, message: "Failed to log food" });
  } finally {
    client.release();
  }
});


// --- Exercise Logging ---

// Search for an exercise (DB first, then AI)
router.get("/search-exercise", authenticateToken, async (req, res) => {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ success: false, message: "Query is required" });
    }
  
    try {
      // 1. Search in our own database
      const dbResult = await pool.query(
        "SELECT *, 'db' as source FROM exercise WHERE exercise_name ILIKE $1 LIMIT 5",
        [`%${q}%`]
      );
  
      if (dbResult.rows.length > 0) {
        return res.json({ success: true, results: dbResult.rows });
      }
  
      // 2. If not found, ask Gemini AI
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const prompt = `Provide the average calories burned per minute for "${q}".
        Return ONLY a single valid JSON object in this exact format, no markdown or extra text:
        {
          "exercise_name": "${q}",
          "calories_burned_per_minute": 8.5
        }
        If you cannot find the exercise, return null for the value.`;
  
      const result = await model.generateContent(prompt);
      const response = await result.response;
      let text = response.text().replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      
      const aiExercise = JSON.parse(text);
      
      if (aiExercise && aiExercise.calories_burned_per_minute) {
        res.json({ success: true, results: [{ ...aiExercise, source: 'ai' }] });
      } else {
        res.json({ success: true, results: [] });
      }
  
    } catch (error) {
      console.error("Error searching exercise:", error);
      res.status(500).json({ success: false, message: "Failed to search for exercise" });
    }
});

// Log an exercise
router.post("/exercise", authenticateToken, async (req, res) => {
    const { exercise, duration_minutes } = req.body;
    const userId = req.user.userId;
  
    if (!exercise || !duration_minutes) {
      return res.status(400).json({ success: false, message: "Exercise and duration are required" });
    }
  
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
  
      let exerciseId = exercise.exercise_id;
  
      // If the exercise is from AI (no exercise_id), insert it into our exercise table first
      if (!exerciseId) {
        const newExercise = await client.query(
          `INSERT INTO exercise (exercise_name, calories_burned_per_minute)
           VALUES ($1, $2)
           ON CONFLICT (exercise_name) DO UPDATE SET calories_burned_per_minute = EXCLUDED.calories_burned_per_minute
           RETURNING exercise_id`,
          [
            exercise.exercise_name,
            exercise.calories_burned_per_minute || 0,
          ]
        );
        exerciseId = newExercise.rows[0].exercise_id;
      }
  
      const total_calories_burned = exercise.calories_burned_per_minute * duration_minutes;
  
      // Insert into exercise_log
      const logResult = await client.query(
        `INSERT INTO exercise_log (user_id, exercise_id, duration_minutes, total_calories_burned, log_date)
         VALUES ($1, $2, $3, $4, NOW())
         RETURNING *`,
        [userId, exerciseId, duration_minutes, total_calories_burned]
      );
  
      await client.query("COMMIT");
      res.status(201).json({ success: true, log: logResult.rows[0] });
  
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Error logging exercise:", error);
      res.status(500).json({ success: false, message: "Failed to log exercise" });
    } finally {
      client.release();
    }
});


// --- Fetching & Deleting Logs ---

// Get all logs for today
router.get("/today", authenticateToken, async (req, res) => {
    const userId = req.user.userId;
    try {
        const foodLogs = await pool.query(
            `SELECT fl.log_id, fl.quantity_grams, fl.total_calories, fl.log_date, fl.meal_time, f.food_name
             FROM food_log fl
             JOIN food f ON fl.food_id = f.food_id
             WHERE fl.user_id = $1 AND fl.log_date >= current_date
             ORDER BY fl.log_date DESC`,
            [userId]
        );

        const exerciseLogs = await pool.query(
            `SELECT el.log_id, el.duration_minutes, el.total_calories_burned, el.log_date, e.exercise_name
             FROM exercise_log el
             JOIN exercise e ON el.exercise_id = e.exercise_id
             WHERE el.user_id = $1 AND el.log_date >= current_date
             ORDER BY el.log_date DESC`,
            [userId]
        );

        res.json({
            success: true,
            food: foodLogs.rows,
            exercise: exerciseLogs.rows
        });

    } catch (error) {
        console.error("Error fetching today's logs:", error);
        res.status(500).json({ success: false, message: "Failed to fetch logs" });
    }
});

// Delete a food log
router.delete("/food/:logId", authenticateToken, async (req, res) => {
    const { logId } = req.params;
    const userId = req.user.userId;
    try {
        const result = await pool.query(
            "DELETE FROM food_log WHERE log_id = $1 AND user_id = $2 RETURNING *",
            [logId, userId]
        );
        if (result.rowCount === 0) {
            return res.status(404).json({ success: false, message: "Log not found" });
        }
        res.json({ success: true, message: "Food log deleted" });
    } catch (error) {
        console.error("Error deleting food log:", error);
        res.status(500).json({ success: false, message: "Failed to delete food log" });
    }
});

// Delete an exercise log
router.delete("/exercise/:logId", authenticateToken, async (req, res) => {
    const { logId } = req.params;
    const userId = req.user.userId;
    try {
        const result = await pool.query(
            "DELETE FROM exercise_log WHERE log_id = $1 AND user_id = $2 RETURNING *",
            [logId, userId]
        );
        if (result.rowCount === 0) {
            return res.status(404).json({ success: false, message: "Log not found" });
        }
        res.json({ success: true, message: "Exercise log deleted" });
    } catch (error) {
        console.error("Error deleting exercise log:", error);
        res.status(500).json({ success: false, message: "Failed to delete exercise log" });
    }
});


module.exports = router;
