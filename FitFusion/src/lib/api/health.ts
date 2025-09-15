// API service for nutrition and exercise data
import axios from 'axios';

export interface NutritionData {
  name: string;
  calories: number;
  protein_g: number;
  carbohydrates_total_g: number;
  fat_total_g: number;
  fiber_g: number;
  sugar_g: number;
  sodium_mg: number;
  serving_size_g: number;
}

export interface ExerciseData {
  name: string;
  type: string;
  muscle: string;
  equipment: string;
  difficulty: string;
  instructions: string;
}

export interface CalorieBurnData {
  name: string;
  calories_per_hour: number;
  duration_minutes: number;
  total_calories: number;
}

// Mock data for demonstration (replace with real API calls)
const mockNutritionData: Record<string, NutritionData> = {
  apple: {
    name: 'Apple',
    calories: 95,
    protein_g: 0.5,
    carbohydrates_total_g: 25,
    fat_total_g: 0.3,
    fiber_g: 4,
    sugar_g: 19,
    sodium_mg: 2,
    serving_size_g: 182,
  },
  banana: {
    name: 'Banana',
    calories: 105,
    protein_g: 1.3,
    carbohydrates_total_g: 27,
    fat_total_g: 0.4,
    fiber_g: 3,
    sugar_g: 14,
    sodium_mg: 1,
    serving_size_g: 118,
  },
  chicken_breast: {
    name: 'Chicken Breast',
    calories: 231,
    protein_g: 43.5,
    carbohydrates_total_g: 0,
    fat_total_g: 5,
    fiber_g: 0,
    sugar_g: 0,
    sodium_mg: 104,
    serving_size_g: 185,
  },
  salmon: {
    name: 'Salmon',
    calories: 206,
    protein_g: 22,
    carbohydrates_total_g: 0,
    fat_total_g: 12,
    fiber_g: 0,
    sugar_g: 0,
    sodium_mg: 93,
    serving_size_g: 85,
  },
  rice: {
    name: 'White Rice',
    calories: 205,
    protein_g: 4.3,
    carbohydrates_total_g: 45,
    fat_total_g: 0.4,
    fiber_g: 0.6,
    sugar_g: 0.1,
    sodium_mg: 2,
    serving_size_g: 158,
  },
  broccoli: {
    name: 'Broccoli',
    calories: 55,
    protein_g: 3.7,
    carbohydrates_total_g: 11,
    fat_total_g: 0.6,
    fiber_g: 5,
    sugar_g: 2.6,
    sodium_mg: 64,
    serving_size_g: 184,
  },
};

const mockExerciseCalories: Record<string, number> = {
  running: 600,
  cycling: 500,
  swimming: 550,
  walking: 300,
  weightlifting: 400,
  yoga: 200,
  pilates: 250,
  dancing: 350,
  hiking: 450,
  tennis: 500,
  basketball: 550,
  soccer: 600,
};

// API functions
export const searchFood = async (query: string): Promise<NutritionData[]> => {
  try {
    // In a real app, you would call an external API like:
    // const response = await axios.get(`https://api.calorieninjas.com/v1/nutrition?query=${query}`, {
    //   headers: { 'X-Api-Key': process.env.NEXT_PUBLIC_CALORIE_NINJA_API_KEY }
    // });
    
    // For demo purposes, we'll search our mock data
    const results = Object.values(mockNutritionData).filter(food =>
      food.name.toLowerCase().includes(query.toLowerCase())
    );
    
    return results;
  } catch (error) {
    console.error('Error fetching nutrition data:', error);
    return [];
  }
};

export const calculateExerciseCalories = async (
  exercise: string,
  duration: number,
  weight: number = 70
): Promise<CalorieBurnData | null> => {
  try {
    // In a real app, you would call an external API
    // For demo purposes, we'll use our mock data
    const exerciseLower = exercise.toLowerCase();
    const baseCaloriesPerHour = mockExerciseCalories[exerciseLower] || 300;
    
    // Adjust for body weight (base calculation is for 70kg person)
    const adjustedCaloriesPerHour = baseCaloriesPerHour * (weight / 70);
    const totalCalories = (adjustedCaloriesPerHour * duration) / 60;
    
    return {
      name: exercise,
      calories_per_hour: Math.round(adjustedCaloriesPerHour),
      duration_minutes: duration,
      total_calories: Math.round(totalCalories),
    };
  } catch (error) {
    console.error('Error calculating exercise calories:', error);
    return null;
  }
};

export const getPopularFoods = (): NutritionData[] => {
  return Object.values(mockNutritionData);
};

export const getPopularExercises = (): string[] => {
  return Object.keys(mockExerciseCalories);
};
