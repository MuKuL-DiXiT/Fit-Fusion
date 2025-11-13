const express = require("express");
const router = express.Router();
const { pool } = require("../config/db");
const { authenticateToken } = require("../middleware/auth");

router.get("/", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const result = await pool.query(
      `SELECT dp.*, 
              COUNT(dpi.item_id) as item_count,
              SUM(dpi.calories) as total_calories
       FROM diet_plans dp
       LEFT JOIN diet_plan_items dpi ON dp.plan_id = dpi.plan_id
       WHERE dp.user_id = $1
       GROUP BY dp.plan_id
       ORDER BY dp.created_at DESC`,
      [userId]
    );

    res.json({
      success: true,
      plans: result.rows,
    });
  } catch (error) {
    console.error("Error fetching diet plans:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching diet plans",
    });
  }
});

router.get("/recent", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const result = await pool.query(
      `SELECT dp.*, 
              COUNT(dpi.item_id) as item_count,
              SUM(dpi.calories) as total_calories
       FROM diet_plans dp
       LEFT JOIN diet_plan_items dpi ON dp.plan_id = dpi.plan_id
       WHERE dp.user_id = $1
       GROUP BY dp.plan_id
       ORDER BY dp.created_at DESC
       LIMIT 3`,
      [userId]
    );

    res.json({
      success: true,
      plans: result.rows,
    });
  } catch (error) {
    console.error("Error fetching recent diet plans:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching recent diet plans",
    });
  }
});

router.get("/:planId", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const planId = req.params.planId;

    const planResult = await pool.query(
      "SELECT * FROM diet_plans WHERE plan_id = $1 AND user_id = $2",
      [planId, userId]
    );

    if (planResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Diet plan not found",
      });
    }

    const itemsResult = await pool.query(
      `SELECT dpi.*, f.food_name, f.calories_per_100g, f.protein_per_100g, 
              f.carbs_per_100g, f.fats_per_100g, p.product_name
       FROM diet_plan_items dpi
       LEFT JOIN food f ON dpi.food_id = f.food_id
       LEFT JOIN products p ON dpi.product_id = p.product_id
       WHERE dpi.plan_id = $1
       ORDER BY dpi.meal_time, dpi.item_id`,
      [planId]
    );

    res.json({
      success: true,
      plan: planResult.rows[0],
      items: itemsResult.rows,
    });
  } catch (error) {
    console.error("Error fetching diet plan:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching diet plan",
    });
  }
});

router.post("/manual", authenticateToken, async (req, res) => {
  const { planName, startDate, endDate, days } = req.body;
  const userId = req.user.userId;

  if (!planName || !startDate || !endDate || !days || !Array.isArray(days)) {
    return res.status(400).json({ success: false, message: "Missing required fields." });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1. Insert the main diet plan
    const planQuery = `
      INSERT INTO diet_plans (user_id, plan_name, start_date, end_date)
      VALUES ($1, $2, $3, $4)
      RETURNING plan_id;
    `;
    const planValues = [userId, planName, startDate, endDate];
    const planResult = await client.query(planQuery, planValues);
    const planId = planResult.rows[0].plan_id;

    // 2. Insert all the diet plan items (associate with plan)
    // Note: schema expects (plan_id, food_id, product_id, meal_time, quantity, calories)
    for (const day of days) {
      for (const meal of day.meals) {
        for (const item of meal.items) {
          const itemQuery = `
            INSERT INTO diet_plan_items (plan_id, food_id, product_id, meal_time, quantity, calories)
            VALUES ($1, $2, $3, $4, $5, $6);
          `;
          const calories = (item.food.calories_per_100g * item.quantity) / 100;
          const itemValues = [
            planId,
            item.food ? item.food.food_id : null,
            null,
            meal.meal_time,
            item.quantity,
            calories,
          ];
          await client.query(itemQuery, itemValues);
        }
      }
    }

    await client.query("COMMIT");
    res.status(201).json({ success: true, message: "Diet plan saved successfully!", planId });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error saving manual diet plan:", error);
    res.status(500).json({ success: false, message: "An error occurred while saving the plan." });
  } finally {
    client.release();
  }
});


router.post("/", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { planName, startDate, endDate, items, foods } = req.body;

    if (!planName) {
      return res.status(400).json({
        success: false,
        message: "Plan name is required",
      });
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const foodIdMap = {};
      if (foods && foods.length > 0) {
        for (const food of foods) {
          const existingFood = await client.query(
            "SELECT food_id FROM food WHERE food_name = $1",
            [food.food_name]
          );

          let foodId;
          if (existingFood.rows.length > 0) {
            foodId = existingFood.rows[0].food_id;
          } else {
            const newFood = await client.query(
              "INSERT INTO food (food_name, calories_per_100g, protein_per_100g, carbs_per_100g, fats_per_100g) VALUES ($1, $2, $3, $4, $5) RETURNING food_id",
              [
                food.food_name,
                food.calories_per_100g,
                food.protein_per_100g || 0,
                food.carbs_per_100g || 0,
                food.fats_per_100g || 0
              ]
            );
            foodId = newFood.rows[0].food_id;
          }
          foodIdMap[food.food_name] = foodId;
        }
      }

      const planResult = await client.query(
        "INSERT INTO diet_plans (user_id, plan_name, start_date, end_date) VALUES ($1, $2, $3, $4) RETURNING *",
        [userId, planName, startDate || null, endDate || null]
      );

      const planId = planResult.rows[0].plan_id;

      if (items && items.length > 0) {
        for (const item of items) {
          let foodId = item.food_id;
          if (item.food_name && foodIdMap[item.food_name]) {
            foodId = foodIdMap[item.food_name];
          }

          await client.query(
            "INSERT INTO diet_plan_items (plan_id, food_id, product_id, meal_time, quantity, calories) VALUES ($1, $2, $3, $4, $5, $6)",
            [
              planId,
              foodId || null,
              item.product_id || null,
              item.meal_time,
              item.quantity,
              item.calories,
            ]
          );
        }
      }

      await client.query("COMMIT");

      res.status(201).json({
        success: true,
        message: "Diet plan created successfully",
        plan: planResult.rows[0],
      });
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error creating diet plan:", error);
    res.status(500).json({
      success: false,
      message: "Error creating diet plan",
    });
  }
});

router.put("/:planId", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const planId = req.params.planId;
    const { planName, startDate, endDate } = req.body;

    const result = await pool.query(
      "UPDATE diet_plans SET plan_name = $1, start_date = $2, end_date = $3 WHERE plan_id = $4 AND user_id = $5 RETURNING *",
      [planName, startDate || null, endDate || null, planId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Diet plan not found",
      });
    }

    res.json({
      success: true,
      message: "Diet plan updated successfully",
      plan: result.rows[0],
    });
  } catch (error) {
    console.error("Error updating diet plan:", error);
    res.status(500).json({
      success: false,
      message: "Error updating diet plan",
    });
  }
});

router.delete("/:planId", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const planId = req.params.planId;

    const result = await pool.query(
      "DELETE FROM diet_plans WHERE plan_id = $1 AND user_id = $2 RETURNING *",
      [planId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Diet plan not found",
      });
    }

    res.json({
      success: true,
      message: "Diet plan deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting diet plan:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting diet plan",
    });
  }
});

router.post("/:planId/items", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const planId = req.params.planId;
    const { food_id, product_id, meal_time, quantity, calories } = req.body;

    const planCheck = await pool.query(
      "SELECT plan_id FROM diet_plans WHERE plan_id = $1 AND user_id = $2",
      [planId, userId]
    );

    if (planCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Diet plan not found",
      });
    }

    const result = await pool.query(
      "INSERT INTO diet_plan_items (plan_id, food_id, product_id, meal_time, quantity, calories) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
      [
        planId,
        food_id || null,
        product_id || null,
        meal_time,
        quantity,
        calories,
      ]
    );

    res.status(201).json({
      success: true,
      message: "Item added to diet plan successfully",
      item: result.rows[0],
    });
  } catch (error) {
    console.error("Error adding item to diet plan:", error);
    res.status(500).json({
      success: false,
      message: "Error adding item to diet plan",
    });
  }
});

router.delete("/:planId/items/:itemId", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const planId = req.params.planId;
    const itemId = req.params.itemId;

    const planCheck = await pool.query(
      "SELECT plan_id FROM diet_plans WHERE plan_id = $1 AND user_id = $2",
      [planId, userId]
    );

    if (planCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Diet plan not found",
      });
    }

    const result = await pool.query(
      "DELETE FROM diet_plan_items WHERE item_id = $1 AND plan_id = $2 RETURNING *",
      [itemId, planId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Diet plan item not found",
      });
    }

    res.json({
      success: true,
      message: "Item removed from diet plan successfully",
    });
  } catch (error) {
    console.error("Error removing item from diet plan:", error);
    res.status(500).json({
      success: false,
      message: "Error removing item from diet plan",
    });
  }
});

module.exports = router;