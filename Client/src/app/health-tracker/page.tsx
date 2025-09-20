'use client';

import { useState, useEffect } from 'react';
import { useUserStore } from '@/lib/store/userStore';
import axios from 'axios';
import { healthService, type FoodLogEntry, type ExerciseLogEntry, type DailySummary } from '@/lib/api/health';
import {
  MagnifyingGlassIcon,
  FireIcon,
  HeartIcon,
  ScaleIcon,
  ClockIcon,
  TrashIcon,
  SparklesIcon,
  LightBulbIcon,
} from '@heroicons/react/24/outline';

interface NutritionData {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface ExerciseData {
  name: string;
  calories: number;
}

interface FoodEntry {
  id: string;
  food: NutritionData;
  quantity: number;
  meal: 'breakfast' | 'lunch' | 'dinner' | 'snack';
}

interface ExerciseEntry {
  id: string;
  exercise: string;
  duration: number;
  calories: number;
}

export default function HealthTrackerPage() {
  const { user } = useUserStore();
  const [activeTab, setActiveTab] = useState<'food' | 'exercise'>('food');
  
  // Food tracking state
  const [foodQuery, setFoodQuery] = useState('');
  const [foodResult, setFoodResult] = useState<NutritionData | null>(null);
  const [foodEntries, setFoodEntries] = useState<FoodEntry[]>([]);
  const [selectedMeal, setSelectedMeal] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('breakfast');
  
  // Exercise tracking state
  const [exerciseQuery, setExerciseQuery] = useState('');
  const [exerciseResult, setExerciseResult] = useState<ExerciseData | null>(null);
  const [exerciseEntries, setExerciseEntries] = useState<ExerciseEntry[]>([]);

  // AI Suggestions state
  const [foodSuggestions, setFoodSuggestions] = useState<any>(null);
  const [exerciseSuggestions, setExerciseSuggestions] = useState<any>(null);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const handleFoodSearch = async () => {
    if (!foodQuery.trim()) return;
    try {
      const response = await axios.get('/api/health-data', {
        params: { type: 'food', query: foodQuery },
      });
      setFoodResult({ name: foodQuery, ...response.data });
    } catch (error) {
      console.error('Error fetching food data:', error);
    }
  };

  const addFoodEntry = (food: NutritionData, quantity: number = 1) => {
    const newEntry: FoodEntry = {
      id: Date.now().toString(),
      food,
      quantity,
      meal: selectedMeal,
    };
    setFoodEntries([...foodEntries, newEntry]);
    setFoodResult(null);
    setFoodQuery('');
  };

  const removeFoodEntry = (id: string) => {
    setFoodEntries(foodEntries.filter(entry => entry.id !== id));
  };

  const handleExerciseSearch = async () => {
    if (!exerciseQuery.trim()) return;
    try {
      const response = await axios.get('/api/health-data', {
        params: { type: 'exercise', query: exerciseQuery },
      });
      setExerciseResult({ name: exerciseQuery, ...response.data });
    } catch (error) {
      console.error('Error fetching exercise data:', error);
    }
  };

  const addExerciseEntry = (exercise: ExerciseData) => {
    const newEntry: ExerciseEntry = {
      id: Date.now().toString(),
      exercise: exercise.name,
      duration: 30, // Assuming a default duration for mock data
      calories: exercise.calories,
    };
    setExerciseEntries([...exerciseEntries, newEntry]);
    setExerciseResult(null);
    setExerciseQuery('');
  };

  const removeExerciseEntry = (id: string) => {
    setExerciseEntries(exerciseEntries.filter(entry => entry.id !== id));
  };

  // AI Suggestions functions
  const getFoodSuggestions = async () => {
    if (!user) return;
    
    setLoadingSuggestions(true);
    try {
      const response = await axios.post('/api/gemini-suggestions', {
        type: 'food-suggestions',
        data: {
          foodItems: foodEntries.map(entry => ({
            name: entry.food.name,
            calories: entry.food.calories * entry.quantity,
            protein: entry.food.protein * entry.quantity,
            carbs: entry.food.carbs * entry.quantity,
            fat: entry.food.fat * entry.quantity
          })),
          currentMeal: selectedMeal
        },
        userProfile: {
          goals: 'Weight loss and muscle gain', // Can be made dynamic
          activityLevel: 'Moderate',
          dietaryRestrictions: 'None',
          weightGoal: 'Lose weight'
        }
      });
      setFoodSuggestions(response.data.suggestions);
    } catch (error) {
      console.error('Error getting food suggestions:', error);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const getExerciseSuggestions = async () => {
    if (!user) return;
    
    setLoadingSuggestions(true);
    try {
      const response = await axios.post('/api/gemini-suggestions', {
        type: 'exercise-suggestions',
        data: {
          recentExercises: exerciseEntries.map(entry => ({
            name: entry.exercise,
            duration: entry.duration,
            caloriesBurned: entry.calories
          }))
        },
        userProfile: {
          goals: 'Weight loss and fitness',
          fitnessLevel: 'Intermediate',
          equipment: 'Home gym basics',
          timeAvailable: '45 minutes',
          limitations: 'None'
        }
      });
      setExerciseSuggestions(response.data.suggestions);
    } catch (error) {
      console.error('Error getting exercise suggestions:', error);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  // Auto-fetch suggestions when entries change
  useEffect(() => {
    if (foodEntries.length > 0 && user) {
      getFoodSuggestions();
    }
  }, [foodEntries, user]);

  useEffect(() => {
    if (exerciseEntries.length > 0 && user) {
      getExerciseSuggestions();
    }
  }, [exerciseEntries, user]);

  // Calculate totals
  const totalCaloriesConsumed = foodEntries.reduce((total, entry) => 
    total + (entry.food.calories * entry.quantity), 0
  );

  const totalCaloriesBurned = exerciseEntries.reduce((total, entry) => 
    total + entry.calories, 0
  );

  const netCalories = totalCaloriesConsumed - totalCaloriesBurned;

  const totalMacros = foodEntries.reduce((totals, entry) => ({
    protein: totals.protein + (entry.food.protein * entry.quantity),
    carbs: totals.carbs + (entry.food.carbs * entry.quantity),
    fat: totals.fat + (entry.food.fat * entry.quantity),
  }), { protein: 0, carbs: 0, fat: 0 });

  const groupedFoodEntries = foodEntries.reduce((groups, entry) => {
    if (!groups[entry.meal]) groups[entry.meal] = [];
    groups[entry.meal].push(entry);
    return groups;
  }, {} as Record<string, FoodEntry[]>);

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Health Tracker</h1>
          <p className="text-gray-600">Track your food intake and exercise to maintain a healthy lifestyle</p>
        </div>

        {/* Daily Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <FireIcon className="h-8 w-8 text-orange-500 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Calories Consumed</p>
                <p className="text-2xl font-bold text-gray-900">{totalCaloriesConsumed}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <HeartIcon className="h-8 w-8 text-red-500 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Calories Burned</p>
                <p className="text-2xl font-bold text-gray-900">{totalCaloriesBurned}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <ScaleIcon className="h-8 w-8 text-blue-500 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Net Calories</p>
                <p className={`text-2xl font-bold ${netCalories >= 0 ? 'text-orange-600' : 'text-green-600'}`}>
                  {netCalories >= 0 ? '+' : ''}{netCalories}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <ClockIcon className="h-8 w-8 text-purple-500 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Exercise Time</p>
                <p className="text-2xl font-bold text-gray-900">
                  {exerciseEntries.reduce((total, entry) => total + entry.duration, 0)} min
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Macros Summary */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Daily Macros</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{Math.round(totalMacros.protein)}g</div>
              <div className="text-sm text-gray-600">Protein</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{Math.round(totalMacros.carbs)}g</div>
              <div className="text-sm text-gray-600">Carbs</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{Math.round(totalMacros.fat)}g</div>
              <div className="text-sm text-gray-600">Fat</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'food', label: 'Food Tracker', icon: FireIcon },
                { id: 'exercise', label: 'Exercise Tracker', icon: HeartIcon },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as 'food' | 'exercise')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="h-5 w-5" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'food' && (
              <div className="space-y-6">
                {/* Food Search */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Search Food</h3>
                  <div className="flex gap-4 mb-4">
                    <div className="flex-1">
                      <input
                        type="text"
                        placeholder="e.g., 1 cup of rice"
                        value={foodQuery}
                        onChange={(e) => setFoodQuery(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleFoodSearch()}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500 text-black"
                      />
                    </div>
                    <select
                      value={selectedMeal}
                      onChange={(e) => setSelectedMeal(e.target.value as any)}
                      className="px-4 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500 text-gray-900"
                    >
                      <option value="breakfast">Breakfast</option>
                      <option value="lunch">Lunch</option>
                      <option value="dinner">Dinner</option>
                      <option value="snack">Snack</option>
                    </select>
                    <button
                      onClick={handleFoodSearch}
                      className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center space-x-2"
                    >
                      <MagnifyingGlassIcon className="h-5 w-5" />
                      <span>Search</span>
                    </button>
                  </div>

                  {/* Search Result */}
                  {foodResult && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-md mb-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-green-900 capitalize">{foodResult.name}</h4>
                          <p className="text-sm text-green-700">
                            {foodResult.calories} cal, {foodResult.protein}g protein, {foodResult.carbs}g carbs, {foodResult.fat}g fat
                          </p>
                        </div>
                        <button
                          onClick={() => addFoodEntry(foodResult)}
                          className="px-4 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                        >
                          Add to Log
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Food Entries by Meal */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Today's Meals</h3>
                  {['breakfast', 'lunch', 'dinner', 'snack'].map((meal) => (
                    <div key={meal} className="mb-6">
                      <h4 className="font-medium text-gray-700 mb-2 capitalize">{meal}</h4>
                      <div className="space-y-2">
                        {(groupedFoodEntries[meal] || []).map((entry) => (
                          <div key={entry.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                            <div>
                              <span className="font-medium capitalize">{entry.food.name}</span>
                              <span className="text-gray-600"> x{entry.quantity}</span>
                              <div className="text-sm text-gray-600">
                                {Math.round(entry.food.calories * entry.quantity)} cal
                              </div>
                            </div>
                            <button
                              onClick={() => removeFoodEntry(entry.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <TrashIcon className="h-5 w-5" />
                            </button>
                          </div>
                        ))}
                        {(!groupedFoodEntries[meal] || groupedFoodEntries[meal].length === 0) && (
                          <p className="text-gray-500 text-sm italic">No food added for {meal}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* AI Food Suggestions */}
                {user && (
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        <SparklesIcon className="h-6 w-6 text-blue-600" />
                        <h3 className="text-lg font-semibold text-gray-900">AI Nutrition Insights</h3>
                      </div>
                      <button
                        onClick={() => setShowSuggestions(!showSuggestions)}
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        {showSuggestions ? 'Hide' : 'Show'} Suggestions
                      </button>
                    </div>
                    
                    {showSuggestions && (
                      <div>
                        {loadingSuggestions && (
                          <div className="flex items-center space-x-2 text-blue-600">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                            <span>Getting personalized suggestions...</span>
                          </div>
                        )}
                        
                        {foodSuggestions && !loadingSuggestions && (
                          <div className="space-y-4">
                            {foodSuggestions.suggestions?.map((suggestion: any, index: number) => (
                              <div key={index} className="bg-white rounded-lg p-4 border border-blue-100">
                                <div className="flex items-start space-x-3">
                                  <LightBulbIcon className="h-5 w-5 text-yellow-500 mt-0.5" />
                                  <div>
                                    <p className="font-medium text-gray-900 capitalize">{suggestion.type}</p>
                                    <p className="text-gray-700 text-sm mt-1">{suggestion.message}</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                            
                            {foodSuggestions.nextMealSuggestions?.length > 0 && (
                              <div className="bg-white rounded-lg p-4 border border-blue-100">
                                <h4 className="font-medium text-gray-900 mb-2">Next Meal Suggestions</h4>
                                <div className="flex flex-wrap gap-2">
                                  {foodSuggestions.nextMealSuggestions.map((food: string, index: number) => (
                                    <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                                      {food}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                        
                        {!foodSuggestions && !loadingSuggestions && foodEntries.length === 0 && (
                          <p className="text-gray-600 text-sm">Add some food entries to get personalized nutrition suggestions!</p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'exercise' && (
              <div className="space-y-6">
                {/* Exercise Calculator */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Search Exercise</h3>
                  <div className="flex gap-4 mb-4">
                    <input
                      type="text"
                      placeholder="e.g., 30 minutes of running"
                      value={exerciseQuery}
                      onChange={(e) => setExerciseQuery(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleExerciseSearch()}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500 text-gray-900"
                    />
                    <button
                      onClick={handleExerciseSearch}
                      className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center space-x-2"
                    >
                      <MagnifyingGlassIcon className="h-5 w-5" />
                      <span>Search</span>
                    </button>
                  </div>

                  {/* Exercise Result */}
                  {exerciseResult && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-md mb-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-green-900 capitalize">{exerciseResult.name}</h4>
                          <p className="text-green-700">
                            Burns approximately {exerciseResult.calories} calories
                          </p>
                        </div>
                        <button
                          onClick={() => addExerciseEntry(exerciseResult)}
                          className="px-4 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                        >
                          Add to Log
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Exercise Entries */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Today's Exercises</h3>
                  <div className="space-y-3">
                    {exerciseEntries.map((entry) => (
                      <div key={entry.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-md">
                        <div>
                          <div className="font-medium capitalize">{entry.exercise}</div>
                          <div className="text-sm text-gray-600">
                            {entry.calories} calories burned
                          </div>
                        </div>
                        <button
                          onClick={() => removeExerciseEntry(entry.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    ))}
                    {exerciseEntries.length === 0 && (
                      <p className="text-gray-500 text-center py-8">
                        No exercises logged today.
                      </p>
                    )}
                  </div>
                </div>

                {/* AI Exercise Suggestions */}
                {user && (
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6 border border-green-200">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        <SparklesIcon className="h-6 w-6 text-green-600" />
                        <h3 className="text-lg font-semibold text-gray-900">AI Fitness Recommendations</h3>
                      </div>
                      <button
                        onClick={getExerciseSuggestions}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm font-medium"
                      >
                        Get Suggestions
                      </button>
                    </div>
                    
                    {loadingSuggestions && (
                      <div className="flex items-center space-x-2 text-green-600">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                        <span>Generating workout recommendations...</span>
                      </div>
                    )}
                    
                    {exerciseSuggestions && !loadingSuggestions && (
                      <div className="space-y-4">
                        {exerciseSuggestions.suggestions?.map((suggestion: any, index: number) => (
                          <div key={index} className="bg-white rounded-lg p-4 border border-green-100">
                            <div className="flex items-start space-x-3">
                              <LightBulbIcon className="h-5 w-5 text-yellow-500 mt-0.5" />
                              <div>
                                <p className="font-medium text-gray-900 capitalize">{suggestion.type}</p>
                                <p className="text-gray-700 text-sm mt-1">{suggestion.message}</p>
                                {suggestion.exercise && (
                                  <div className="mt-2 p-2 bg-green-50 rounded text-sm">
                                    <strong>{suggestion.exercise.name}</strong> - {suggestion.exercise.duration} 
                                    ({suggestion.exercise.intensity} intensity)
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                        
                        {exerciseSuggestions.progressTips?.length > 0 && (
                          <div className="bg-white rounded-lg p-4 border border-green-100">
                            <h4 className="font-medium text-gray-900 mb-2">Progress Tips</h4>
                            <ul className="space-y-1">
                              {exerciseSuggestions.progressTips.map((tip: string, index: number) => (
                                <li key={index} className="text-gray-700 text-sm">• {tip}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {!exerciseSuggestions && !loadingSuggestions && (
                      <p className="text-gray-600 text-sm">Click "Get Suggestions" to receive personalized workout recommendations based on your activity!</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}