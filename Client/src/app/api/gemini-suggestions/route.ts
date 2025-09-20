import { NextRequest, NextResponse } from 'next/server';
import { geminiModel } from '@/lib/gemini';

export async function POST(request: NextRequest) {
  try {
    const { type, data, userProfile } = await request.json();

    let prompt = '';

    switch (type) {
      case 'food-suggestions':
        prompt = createFoodSuggestionsPrompt(data, userProfile);
        break;
      case 'exercise-suggestions':
        prompt = createExerciseSuggestionsPrompt(data, userProfile);
        break;
      case 'diet-plan':
        prompt = createDietPlanPrompt(data, userProfile);
        break;
      case 'product-recommendations':
        prompt = createProductRecommendationsPrompt(data, userProfile);
        break;
      default:
        return NextResponse.json({ error: 'Invalid suggestion type' }, { status: 400 });
    }

    const result = await geminiModel.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Try to parse as JSON, fallback to plain text
    let suggestions;
    try {
      suggestions = JSON.parse(text);
    } catch {
      suggestions = { text };
    }

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error('Error generating suggestions:', error);
    return NextResponse.json(
      { error: 'Failed to generate suggestions' },
      { status: 500 }
    );
  }
}

function createFoodSuggestionsPrompt(data: any, userProfile: any) {
  return `
You are a nutritionist AI. Based on the following information, provide helpful suggestions about the user's food choices.

User Profile:
- Goals: ${userProfile?.goals || 'General health'}
- Activity Level: ${userProfile?.activityLevel || 'Moderate'}
- Dietary Restrictions: ${userProfile?.dietaryRestrictions || 'None'}
- Age: ${userProfile?.age || 'Unknown'}
- Weight Goal: ${userProfile?.weightGoal || 'Maintain'}

Recently Logged Food:
${data?.foodItems?.map((item: any) => `- ${item.name}: ${item.calories} calories, ${item.protein}g protein, ${item.carbs}g carbs, ${item.fat}g fat`).join('\n') || 'No recent food logs'}

Current meal context: ${data?.currentMeal || 'Unknown'}

Please provide a JSON response with the following structure:
{
  "suggestions": [
    {
      "type": "improvement",
      "message": "Specific suggestion for better nutrition"
    },
    {
      "type": "alternative",
      "message": "Healthier alternative food suggestions"
    },
    {
      "type": "timing",
      "message": "Optimal timing or portion recommendations"
    }
  ],
  "nutritionalAnalysis": {
    "strengths": ["List of good nutritional choices"],
    "improvements": ["Areas that could be improved"]
  },
  "nextMealSuggestions": ["Specific food items for next meal"]
}

Focus on being encouraging while providing actionable advice tailored to their goals.`;
}

function createExerciseSuggestionsPrompt(data: any, userProfile: any) {
  return `
You are a fitness trainer AI. Based on the following information, provide personalized exercise suggestions.

User Profile:
- Goals: ${userProfile?.goals || 'General fitness'}
- Fitness Level: ${userProfile?.fitnessLevel || 'Beginner'}
- Available Equipment: ${userProfile?.equipment || 'None'}
- Time Available: ${userProfile?.timeAvailable || '30 minutes'}
- Injuries/Limitations: ${userProfile?.limitations || 'None'}

Recent Exercise Activity:
${data?.recentExercises?.map((ex: any) => `- ${ex.name}: ${ex.duration} minutes, ${ex.caloriesBurned} calories`).join('\n') || 'No recent exercise logs'}

Current session context: ${data?.currentSession || 'General workout'}

Please provide a JSON response with the following structure:
{
  "suggestions": [
    {
      "type": "next-exercise",
      "message": "Specific exercise to do next",
      "exercise": {
        "name": "Exercise name",
        "duration": "Recommended duration",
        "intensity": "Low/Medium/High",
        "equipment": "Required equipment"
      }
    }
  ],
  "workoutPlan": {
    "warmup": ["List of warmup exercises"],
    "main": ["List of main exercises"],
    "cooldown": ["List of cooldown exercises"]
  },
  "progressTips": ["Tips for improvement"],
  "recoveryAdvice": ["Recovery recommendations"]
}

Make suggestions appropriate for their fitness level and available time.`;
}

function createDietPlanPrompt(data: any, userProfile: any) {
  return `
You are a nutrition expert AI. Create a personalized diet plan based on the user's profile and preferences.

User Profile:
- Goals: ${userProfile?.goals || 'General health'}
- Weight Goal: ${userProfile?.weightGoal || 'Maintain'}
- Activity Level: ${userProfile?.activityLevel || 'Moderate'}
- Dietary Restrictions: ${userProfile?.dietaryRestrictions || 'None'}
- Food Preferences: ${userProfile?.foodPreferences || 'No specific preferences'}
- Cooking Time: ${userProfile?.cookingTime || '30 minutes'}
- Budget: ${userProfile?.budget || 'Moderate'}

Plan Requirements:
- Duration: ${data?.duration || '7 days'}
- Meal Types: ${data?.mealTypes || 'Breakfast, Lunch, Dinner, Snacks'}
- Calorie Target: ${data?.calorieTarget || 'Calculate based on goals'}

Please provide a JSON response with the following structure:
{
  "planOverview": {
    "name": "Diet plan name",
    "description": "Brief description",
    "duration": "Plan duration",
    "totalCaloriesPerDay": "Average daily calories",
    "macroBreakdown": {
      "protein": "Percentage",
      "carbs": "Percentage", 
      "fat": "Percentage"
    }
  },
  "dailyMeals": [
    {
      "day": 1,
      "breakfast": {
        "name": "Meal name",
        "ingredients": ["List of ingredients"],
        "calories": "Calorie count",
        "prepTime": "Preparation time",
        "macros": {"protein": "g", "carbs": "g", "fat": "g"}
      },
      "lunch": "Similar structure",
      "dinner": "Similar structure",
      "snacks": ["List of snack options"]
    }
  ],
  "shoppingList": ["Categorized ingredients needed"],
  "tips": ["Helpful tips for following the plan"],
  "substitutions": ["Ingredient substitution options"]
}

Make the plan realistic, culturally appropriate for Indian cuisine preferences, and budget-friendly.`;
}

function createProductRecommendationsPrompt(data: any, userProfile: any) {
  return `
You are a fitness and health product expert AI. Recommend products based on the user's profile and activities.

User Profile:
- Goals: ${userProfile?.goals || 'General health'}
- Activity Level: ${userProfile?.activityLevel || 'Moderate'}
- Experience Level: ${userProfile?.experienceLevel || 'Beginner'}
- Budget Range: ${userProfile?.budgetRange || 'Moderate'}
- Current Equipment: ${userProfile?.equipment || 'None'}

Recent Activity:
- Foods logged: ${data?.recentFoods?.length || 0} items
- Exercises done: ${data?.recentExercises?.length || 0} activities
- Current diet plan: ${data?.currentDietPlan || 'None'}

Available Product Categories:
- Supplements (Protein Powder, Vitamins, Pre-Workout, etc.)
- Equipment (Dumbbells, Resistance Bands, Yoga Mats, etc.)
- Nutrition (Protein Bars, Healthy Snacks, Superfoods, etc.)
- Apparel (Workout Clothes, Athletic Shoes, etc.)
- Recovery (Foam Rollers, Massage Tools, etc.)

Please provide a JSON response with the following structure:
{
  "recommendedProducts": [
    {
      "category": "Product category",
      "name": "Specific product name",
      "reason": "Why this product is recommended",
      "benefits": ["List of benefits for the user"],
      "priority": "High/Medium/Low",
      "priceRange": "Expected price range in INR"
    }
  ],
  "productsByGoal": {
    "immediate": ["Products needed now"],
    "shortTerm": ["Products for next month"],
    "longTerm": ["Products for future goals"]
  },
  "budgetOptimization": {
    "essential": ["Must-have products"],
    "optional": ["Nice-to-have products"],
    "alternatives": ["Budget-friendly alternatives"]
  }
}

Focus on products that align with their current activities and goals. Consider Indian market availability and pricing.`;
}