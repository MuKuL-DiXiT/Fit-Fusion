'use client';

import { useState } from 'react';
import axios from 'axios';
import {
  MagnifyingGlassIcon,
  FireIcon,
  HeartIcon,
  ScaleIcon,
  ClockIcon,
  TrashIcon,
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
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500 text-gray-900"
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
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}