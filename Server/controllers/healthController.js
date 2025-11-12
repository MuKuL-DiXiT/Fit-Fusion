const { pool } = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

// Get user's food logs
const getFoodLogs = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { startDate, endDate, limit = 50 } = req.query;

    let query = `
      SELECT fl.log_id, fl.quantity_grams, fl.total_calories, fl.log_date,
             f.food_name, f.calories_per_100g, f.protein_per_100g, 
             f.carbs_per_100g, f.fats_per_100g
      FROM Food_Log fl
      JOIN Food f ON fl.food_id = f.food_id
      WHERE fl.user_id = $1
    `;
    
    const params = [userId];
    let paramCount = 2;

    if (startDate) {
      query += ` AND fl.log_date >= $${paramCount}`;
      params.push(startDate);
      paramCount++;
    }

    if (endDate) {
      query += ` AND fl.log_date <= $${paramCount}`;
      params.push(endDate);
      paramCount++;
    }

    query += ` ORDER BY fl.log_date DESC LIMIT $${paramCount}`;
    params.push(parseInt(limit));

    const result = await pool.query(query, params);

    res.status(200).json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Get food logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch food logs'
    });
  }
};

// Add food log entry
const addFoodLog = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { food_name, quantity_grams } = req.body;

    if (!food_name || !quantity_grams) {
      return res.status(400).json({
        success: false,
        message: 'Food name and quantity are required'
      });
    }

    // Check if food exists, if not create it with default values
    let foodResult = await pool.query(
      'SELECT * FROM Food WHERE LOWER(food_name) = LOWER($1)',
      [food_name]
    );

    let food;
    if (foodResult.rows.length === 0) {
      // Create new food entry with estimated values (could be improved with a nutrition API)
      const newFood = await pool.query(
        `INSERT INTO Food (food_name, calories_per_100g, protein_per_100g, carbs_per_100g, fats_per_100g) 
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [food_name, 100, 5, 15, 2] // Default nutritional values
      );
      food = newFood.rows[0];
    } else {
      food = foodResult.rows[0];
    }

    // Calculate total calories based on quantity
    const totalCalories = (food.calories_per_100g * quantity_grams) / 100;

    // Insert food log
    const logResult = await pool.query(
      `INSERT INTO Food_Log (user_id, food_id, quantity_grams, total_calories) 
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [userId, food.food_id, quantity_grams, totalCalories]
    );

    res.status(201).json({
      success: true,
      message: 'Food log added successfully',
      data: {
        ...logResult.rows[0],
        food_name: food.food_name
      }
    });
  } catch (error) {
    console.error('Add food log error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add food log'
    });
  }
};

// Add or upsert food suggestions (from AI) into food table
const addFoodSuggestions = async (req, res) => {
  try {
    const { foods } = req.body;

    if (!foods || !Array.isArray(foods)) {
      return res.status(400).json({
        success: false,
        message: 'Foods array is required'
      });
    }

    const inserted = [];
    for (const f of foods) {
      const name = (f.food_name || f.name || '').trim();
      if (!name) continue;

      let foodResult = await pool.query(
        'SELECT * FROM Food WHERE LOWER(food_name) = LOWER($1)',
        [name]
      );

      if (foodResult.rows.length === 0) {
        const newFood = await pool.query(
          `INSERT INTO Food (food_name, calories_per_100g, protein_per_100g, carbs_per_100g, fats_per_100g) 
           VALUES ($1, $2, $3, $4, $5) RETURNING *`,
          [
            name,
            f.calories_per_100g || f.calories || 100,
            f.protein_per_100g || f.protein || 0,
            f.carbs_per_100g || f.carbs || 0,
            f.fats_per_100g || f.fat || 0
          ]
        );
        inserted.push(newFood.rows[0]);
      } else {
        inserted.push(foodResult.rows[0]);
      }
    }

    res.status(201).json({
      success: true,
      data: inserted
    });
  } catch (error) {
    console.error('Add food suggestions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add food suggestions'
    });
  }
};

// Get user's exercise logs
const getExerciseLogs = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { startDate, endDate, limit = 50 } = req.query;

    let query = `
      SELECT el.log_id, el.duration_minutes, el.total_calories_burned, el.log_date,
             e.exercise_name, e.calories_burned_per_minute
      FROM Exercise_Log el
      JOIN Exercise e ON el.exercise_id = e.exercise_id
      WHERE el.user_id = $1
    `;
    
    const params = [userId];
    let paramCount = 2;

    if (startDate) {
      query += ` AND el.log_date >= $${paramCount}`;
      params.push(startDate);
      paramCount++;
    }

    if (endDate) {
      query += ` AND el.log_date <= $${paramCount}`;
      params.push(endDate);
      paramCount++;
    }

    query += ` ORDER BY el.log_date DESC LIMIT $${paramCount}`;
    params.push(parseInt(limit));

    const result = await pool.query(query, params);

    res.status(200).json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Get exercise logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch exercise logs'
    });
  }
};

// Add exercise log entry
const addExerciseLog = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { exercise_name, duration_minutes } = req.body;

    if (!exercise_name || !duration_minutes) {
      return res.status(400).json({
        success: false,
        message: 'Exercise name and duration are required'
      });
    }

    // Check if exercise exists, if not create it
    let exerciseResult = await pool.query(
      'SELECT * FROM Exercise WHERE LOWER(exercise_name) = LOWER($1)',
      [exercise_name]
    );

    let exercise;
    if (exerciseResult.rows.length === 0) {
      // Create new exercise with estimated calories per minute
      const newExercise = await pool.query(
        `INSERT INTO Exercise (exercise_name, calories_burned_per_minute) 
         VALUES ($1, $2) RETURNING *`,
        [exercise_name, 5] // Default 5 calories per minute
      );
      exercise = newExercise.rows[0];
    } else {
      exercise = exerciseResult.rows[0];
    }

    // Calculate total calories burned
    const totalCaloriesBurned = exercise.calories_burned_per_minute * duration_minutes;

    // Insert exercise log
    const logResult = await pool.query(
      `INSERT INTO Exercise_Log (user_id, exercise_id, duration_minutes, total_calories_burned) 
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [userId, exercise.exercise_id, duration_minutes, totalCaloriesBurned]
    );

    res.status(201).json({
      success: true,
      message: 'Exercise log added successfully',
      data: {
        ...logResult.rows[0],
        exercise_name: exercise.exercise_name
      }
    });
  } catch (error) {
    console.error('Add exercise log error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add exercise log'
    });
  }
};

// Get daily summary
const getDailySummary = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { date } = req.query;
    
    const targetDate = date || new Date().toISOString().split('T')[0];

    // Get food calories for the day
    const foodQuery = `
      SELECT COALESCE(SUM(total_calories), 0) as total_food_calories
      FROM Food_Log 
      WHERE user_id = $1 AND DATE(log_date) = $2
    `;

    // Get exercise calories for the day
    const exerciseQuery = `
      SELECT COALESCE(SUM(total_calories_burned), 0) as total_calories_burned
      FROM Exercise_Log 
      WHERE user_id = $1 AND DATE(log_date) = $2
    `;

    const [foodResult, exerciseResult] = await Promise.all([
      pool.query(foodQuery, [userId, targetDate]),
      pool.query(exerciseQuery, [userId, targetDate])
    ]);

    const totalFoodCalories = parseFloat(foodResult.rows[0].total_food_calories);
    const totalExerciseCalories = parseFloat(exerciseResult.rows[0].total_calories_burned);
    const netCalories = totalFoodCalories - totalExerciseCalories;

    res.status(200).json({
      success: true,
      data: {
        date: targetDate,
        total_food_calories: totalFoodCalories,
        total_exercise_calories: totalExerciseCalories,
        net_calories: netCalories
      }
    });
  } catch (error) {
    console.error('Get daily summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch daily summary'
    });
  }
};

// Delete food log entry
const deleteFoodLog = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { logId } = req.params;

    const result = await pool.query(
      'DELETE FROM Food_Log WHERE log_id = $1 AND user_id = $2 RETURNING *',
      [logId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Food log entry not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Food log entry deleted successfully'
    });
  } catch (error) {
    console.error('Delete food log error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete food log entry'
    });
  }
};

// Delete exercise log entry
const deleteExerciseLog = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { logId } = req.params;

    const result = await pool.query(
      'DELETE FROM Exercise_Log WHERE log_id = $1 AND user_id = $2 RETURNING *',
      [logId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Exercise log entry not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Exercise log entry deleted successfully'
    });
  } catch (error) {
    console.error('Delete exercise log error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete exercise log entry'
    });
  }
};

module.exports = {
  getFoodLogs,
  addFoodLog,
  getExerciseLogs,
  addExerciseLog,
  getDailySummary,
  deleteFoodLog,
  deleteExerciseLog,
  addFoodSuggestions
};