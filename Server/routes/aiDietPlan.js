const express = require("express");
const router = express.Router();
const { pool } = require("../config/db");
const { authenticateToken } = require("../middleware/auth");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// Generate AI diet plan
router.post("/generate", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { goals, preferences, budget, duration } = req.body;

    // Build the prompt for Gemini
    const prompt = `You are a professional nutritionist. Create a detailed ${duration || 7}-day diet plan based on the following:

Goals: ${goals || "General health and fitness"}
Dietary Preferences: ${preferences || "No restrictions"}
Budget: ${budget || "Moderate"}

Please provide a comprehensive meal plan in the following STRICT JSON format. Return ONLY valid JSON, no additional text or markdown:

{
  "planName": "A descriptive name for the diet plan",
  "meals": [
    {
      "day": 1,
      "mealTime": "Breakfast",
      "foodName": "Food item name",
      "quantity": 100,
      "caloriesPer100g": 250.5,
      "proteinPer100g": 12.5,
      "carbsPer100g": 30.0,
      "fatsPer100g": 8.5,
      "instructions": "Brief preparation instructions"
    }
  ]
}

Requirements:
- Include 4 meals per day (Breakfast, Lunch, Snack, Dinner) for ${duration || 7} days
- Use meal_time values: "Breakfast", "Lunch", "Snack", "Dinner" (exact capitalization)
- All nutrition values should be per 100g
- Quantity should be in grams
- Keep food names simple and clear
- Ensure the diet meets the user's goals and budget
- Return ONLY the JSON object, no markdown code blocks or extra text`;

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    // Clean up the response - remove markdown code blocks if present
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    // Parse the JSON response
    let dietPlanData;
    try {
      dietPlanData = JSON.parse(text);
    } catch (parseError) {
      console.error("Failed to parse Gemini response:", text);
      return res.status(500).json({
        success: false,
        message: "Failed to parse AI response. Please try again.",
        error: parseError.message
      });
    }

    // Validate the structure
    if (!dietPlanData.planName || !dietPlanData.meals || !Array.isArray(dietPlanData.meals)) {
      return res.status(500).json({
        success: false,
        message: "Invalid diet plan structure from AI",
      });
    }

    // Start a database transaction to insert the diet plan
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Create the diet plan
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(startDate.getDate() + (parseInt(duration) || 7));

      const planResult = await client.query(
        "INSERT INTO diet_plans (user_id, plan_name, start_date, end_date) VALUES ($1, $2, $3, $4) RETURNING *",
        [userId, dietPlanData.planName, startDate, endDate]
      );

      const planId = planResult.rows[0].plan_id;

      // Insert foods and diet plan items
      const foodIdMap = {};

      for (const meal of dietPlanData.meals) {
        // Check if food already exists
        const existingFood = await client.query(
          "SELECT food_id FROM food WHERE food_name = $1",
          [meal.foodName]
        );

        let foodId;
        if (existingFood.rows.length > 0) {
          foodId = existingFood.rows[0].food_id;
        } else {
          // Insert new food item
          const newFood = await client.query(
            "INSERT INTO food (food_name, calories_per_100g, protein_per_100g, carbs_per_100g, fats_per_100g) VALUES ($1, $2, $3, $4, $5) RETURNING food_id",
            [
              meal.foodName,
              meal.caloriesPer100g || 0,
              meal.proteinPer100g || 0,
              meal.carbsPer100g || 0,
              meal.fatsPer100g || 0
            ]
          );
          foodId = newFood.rows[0].food_id;
        }

        foodIdMap[meal.foodName] = foodId;

        // Calculate total calories for this meal based on quantity
        const totalCalories = (meal.caloriesPer100g * meal.quantity) / 100;

        // Insert diet plan item
        await client.query(
          "INSERT INTO diet_plan_items (plan_id, food_id, meal_time, quantity, calories) VALUES ($1, $2, $3, $4, $5)",
          [
            planId,
            foodId,
            meal.mealTime,
            meal.quantity,
            totalCalories
          ]
        );
      }

      await client.query("COMMIT");

      // Fetch the complete plan with items
      const itemsResult = await client.query(
        `SELECT dpi.*, f.food_name, f.calories_per_100g, f.protein_per_100g, 
                f.carbs_per_100g, f.fats_per_100g
         FROM diet_plan_items dpi
         JOIN food f ON dpi.food_id = f.food_id
         WHERE dpi.plan_id = $1
         ORDER BY dpi.meal_time, dpi.item_id`,
        [planId]
      );

      res.status(201).json({
        success: true,
        message: "AI diet plan generated and saved successfully",
        plan: planResult.rows[0],
        items: itemsResult.rows,
        aiResponse: dietPlanData
      });

    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error("Error generating AI diet plan:", error);
    res.status(500).json({
      success: false,
      message: "Error generating AI diet plan",
      error: error.message
    });
  }
});

module.exports = router;
