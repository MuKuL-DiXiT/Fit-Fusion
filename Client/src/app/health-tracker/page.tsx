"use client";

import { useState, useEffect } from "react";
import { useUserStore } from "@/lib/store/userStore";
import { useRouter } from "next/navigation";
import {
  PlusIcon,
  TrashIcon,
  FireIcon,
  BoltIcon,
  NoSymbolIcon,
} from "@heroicons/react/24/outline";


interface Food {
  food_id?: number;
  food_name: string;
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fats_per_100g: number;
  source?: "db" | "ai";
}

interface Exercise {
  exercise_id?: number;
  exercise_name: string;
  calories_burned_per_minute: number;
  source?: "db" | "ai";
}

interface FoodLog {
  log_id: number;
  food_name: string;
  quantity_grams: number;
  total_calories: number;
  meal_time: "Breakfast" | "Lunch" | "Snack" | "Dinner";
}

interface ExerciseLog {
  log_id: number;
  exercise_name: string;
  duration_minutes: number;
  total_calories_burned: number;
}

// --- Main Component ---
export default function HealthTrackerPage() {
  const { user, isAuthenticated } = useUserStore();
  const router = useRouter();

  const [foodLogs, setFoodLogs] = useState<FoodLog[]>([]);
  const [exerciseLogs, setExerciseLogs] = useState<ExerciseLog[]>([]);
  const [loading, setLoading] = useState(true);

  const [showFoodModal, setShowFoodModal] = useState(false);
  const [showExerciseModal, setShowExerciseModal] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth/login");
    } else {
      fetchTodaysLogs();
    }
  }, [isAuthenticated, router]);

  const fetchTodaysLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:3001/api/log/today", { credentials: "include" });
      const data = await res.json();
      if (data.success) {
        setFoodLogs(data.food);
        setExerciseLogs(data.exercise);
      }
    } catch (error) {
      console.error("Failed to fetch logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const totalCaloriesIn = foodLogs.reduce((sum, log) => sum + Number(log.total_calories), 0);
  const totalCaloriesOut = exerciseLogs.reduce((sum, log) => sum + Number(log.total_calories_burned), 0);
  const netCalories = totalCaloriesIn - totalCaloriesOut;

  const handleDelete = async (type: "food" | "exercise", logId: number) => {
    if (!confirm("Are you sure you want to delete this log?")) return;

    try {
      await fetch(`http://localhost:3001/api/log/${type}/${logId}`, {
        method: "DELETE",
        credentials: "include",
      });
      fetchTodaysLogs(); // Refresh logs
    } catch (error) {
      console.error(`Failed to delete ${type} log:`, error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Health Tracker</h1>
          <p className="text-lg text-gray-600 mt-2">
            Log your daily food intake and exercise to stay on top of your goals.
          </p>
        </header>

        {/* Calorie Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-md flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-full">
              <FireIcon className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Calories In</p>
              <p className="text-2xl font-bold text-gray-900">{totalCaloriesIn.toFixed(0)}</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-md flex items-center gap-4">
            <div className="p-3 bg-red-100 rounded-full">
              <BoltIcon className="h-8 w-8 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Calories Out</p>
              <p className="text-2xl font-bold text-gray-900">{totalCaloriesOut.toFixed(0)}</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-md flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-full">
              <FireIcon className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Net Calories</p>
              <p className="text-2xl font-bold text-gray-900">{netCalories.toFixed(0)}</p>
            </div>
          </div>
        </div>

        {/* Food and Exercise Logs */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Food Log */}
          <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold text-gray-800">Food Log</h2>
              <button
                onClick={() => setShowFoodModal(true)}
                className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 flex items-center gap-2"
              >
                <PlusIcon className="h-5 w-5" />
                Log Food
              </button>
            </div>
            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
              {loading ? (
                <p>Loading logs...</p>
              ) : foodLogs.length > 0 ? (
                (["Breakfast", "Lunch", "Dinner", "Snack"] as const).map(mealTime => {
                  const logsForMeal = foodLogs.filter(log => log.meal_time === mealTime);
                  if (logsForMeal.length === 0) return null;

                  return (
                    <div key={mealTime}>
                      <h3 className="text-md font-semibold text-gray-700 mt-4 mb-2">{mealTime}</h3>
                      {logsForMeal.map(log => (
                        <div key={log.log_id} className="bg-gray-50 p-3 rounded-lg flex justify-between items-center mb-2">
                          <div>
                            <p className="font-medium">{log.food_name}</p>
                            <p className="text-sm text-gray-600">
                              {log.quantity_grams}g - {Number(log.total_calories).toFixed(0)} kcal
                            </p>
                          </div>
                          <button onClick={() => handleDelete("food", log.log_id)} className="text-red-500 hover:text-red-700">
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )
                })
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <NoSymbolIcon className="h-12 w-12 mx-auto mb-2" />
                  <p>No food logged for today.</p>
                </div>
              )}
            </div>
          </div>

          {/* Exercise Log */}
          <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold text-gray-800">Exercise Log</h2>
              <button
                onClick={() => setShowExerciseModal(true)}
                className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 flex items-center gap-2"
              >
                <PlusIcon className="h-5 w-5" />
                Log Exercise
              </button>
            </div>
            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
              {loading ? (
                <p>Loading logs...</p>
              ) : exerciseLogs.length > 0 ? (
                exerciseLogs.map((log) => (
                  <div key={log.log_id} className="bg-gray-50 p-3 rounded-lg flex justify-between items-center">
                    <div>
                      <p className="font-medium">{log.exercise_name}</p>
                      <p className="text-sm text-gray-600">
                        {log.duration_minutes} min - {Number(log.total_calories_burned).toFixed(0)} kcal
                      </p>
                    </div>
                    <button onClick={() => handleDelete("exercise", log.log_id)} className="text-red-500 hover:text-red-700">
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <NoSymbolIcon className="h-12 w-12 mx-auto mb-2" />
                  <p>No exercise logged for today.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showFoodModal && (
        <LogFoodModal
          onClose={() => setShowFoodModal(false)}
          onLogSuccess={() => {
            setShowFoodModal(false);
            fetchTodaysLogs();
          }}
        />
      )}
      {showExerciseModal && (
        <LogExerciseModal
          onClose={() => setShowExerciseModal(false)}
          onLogSuccess={() => {
            setShowExerciseModal(false);
            fetchTodaysLogs();
          }}
        />
      )}
    </div>
  );
}

// --- Food Modal Component ---
function LogFoodModal({ onClose, onLogSuccess }: { onClose: () => void; onLogSuccess: () => void }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Food[]>([]);
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [quantity, setQuantity] = useState(100);
  const [mealTime, setMealTime] = useState<FoodLog["meal_time"]>("Breakfast");
  const [loading, setLoading] = useState(false);

  const handleSearch = async (term: string) => {
    setSearchTerm(term);
    if (term.length < 2) {
      setSearchResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:3001/api/log/search-food?q=${term}`, { credentials: "include" });
      const data = await res.json();
      if (data.success) {
        setSearchResults(data.results);
      }
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLog = async () => {
    if (!selectedFood) return;
    setLoading(true);
    try {
      await fetch("http://localhost:3001/api/log/food", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ food: selectedFood, quantity_grams: quantity, meal_time: mealTime }),
      });
      onLogSuccess();
    } catch (error) {
      console.error("Failed to log food:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6 border-b">
          <h3 className="text-xl text-gray-800 font-semibold">Log Food Item</h3>
        </div>
        <div className="p-6 space-y-4">
          {!selectedFood ? (
            <>
              <input
                type="text"
                placeholder="Search for a food..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full text-gray-800 px-4 py-2 border rounded-lg"
              />
              {loading && <p>Searching...</p>}
              <div className="max-h-60 overflow-y-auto">
                {searchResults.map((food, i) => (
                  <div
                    key={i}
                    onClick={() => setSelectedFood(food)}
                    className="p-3 hover:bg-gray-100 cursor-pointer rounded-lg"
                  >
                    <p className="font-medium text-gray-800">{food.food_name}</p>
                    <p className="text-sm text-gray-600">
                      {food.calories_per_100g} kcal per 100g
                      {food.source === 'ai' && <span className="text-teal-600 ml-2">(AI Data)</span>}
                    </p>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div>
              <h4 className="text-lg text-gray-800 font-medium mb-2">{selectedFood.food_name}</h4>
              <div className="space-y-4 text-gray-800">
                <div className="flex items-center gap-4">
                  <label className="w-28">Quantity (grams)</label>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="w-24 px-3 py-1 border rounded-lg"
                  />
                </div>
                <div className="flex items-center gap-4">
                  <label className="w-28">Meal Time</label>
                  <select
                    value={mealTime}
                    onChange={(e) => setMealTime(e.target.value as FoodLog["meal_time"])}
                    className="w-36 px-3 py-1 border rounded-lg"
                  >
                    <option>Breakfast</option>
                    <option>Lunch</option>
                    <option>Dinner</option>
                    <option>Snack</option>
                  </select>
                </div>
              </div>
              <p className="text-gray-600 mt-4">
                Est. Calories: {((selectedFood.calories_per_100g * quantity) / 100).toFixed(0)}
              </p>
              <div className="text-sm text-gray-600 mt-2">
                <p>Protein: {((selectedFood.protein_per_100g * quantity) / 100).toFixed(1)}g</p>
                <p>Carbs: {((selectedFood.carbs_per_100g * quantity) / 100).toFixed(1)}g</p>
                <p>Fats: {((selectedFood.fats_per_100g * quantity) / 100).toFixed(1)}g</p>
              </div>
            </div>
          )}
        </div>
        <div className="p-6 border-t flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-gray-800 rounded-lg border">Cancel</button>
          <button
            onClick={handleLog}
            disabled={!selectedFood || loading}
            className="px-4 py-2 rounded-lg bg-teal-600 text-white disabled:bg-gray-400"
          >
            {loading ? "Logging..." : "Log Item"}
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Exercise Modal Component ---
function LogExerciseModal({ onClose, onLogSuccess }: { onClose: () => void; onLogSuccess: () => void }) {
    const [searchTerm, setSearchTerm] = useState("");
    const [searchResults, setSearchResults] = useState<Exercise[]>([]);
    const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
    const [duration, setDuration] = useState(30);
    const [loading, setLoading] = useState(false);
  
    const handleSearch = async (term: string) => {
      setSearchTerm(term);
      if (term.length < 2) {
        setSearchResults([]);
        return;
      }
      setLoading(true);
      try {
        const res = await fetch(`http://localhost:3001/api/log/search-exercise?q=${term}`, { credentials: "include" });
        const data = await res.json();
        if (data.success) {
          setSearchResults(data.results);
        }
      } catch (error) {
        console.error("Search failed:", error);
      } finally {
        setLoading(false);
      }
    };
  
    const handleLog = async () => {
      if (!selectedExercise) return;
      setLoading(true);
      try {
        await fetch("http://localhost:3001/api/log/exercise", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ exercise: selectedExercise, duration_minutes: duration }),
        });
        onLogSuccess();
      } catch (error) {
        console.error("Failed to log exercise:", error);
      } finally {
        setLoading(false);
      }
    };
  
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
          <div className="p-6 border-b">
            <h3 className="text-xl text-black font-semibold">Log Exercise</h3>
          </div>
          <div className="p-6 space-y-4">
            {!selectedExercise ? (
              <>
                <input
                  type="text"
                  placeholder="Search for an exercise..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full px-4 py-2 text-black border rounded-lg"
                />
                {loading && <p>Searching...</p>}
                <div className="max-h-60 overflow-y-auto">
                  {searchResults.map((ex, i) => (
                    <div
                      key={i}
                      onClick={() => setSelectedExercise(ex)}
                      className="p-3 hover:bg-gray-100 text-black cursor-pointer rounded-lg"
                    >
                      <p className="font-medium text-black">{ex.exercise_name}</p>
                      <p className="text-sm text-black">
                        {ex.calories_burned_per_minute} kcal per minute
                        {ex.source === 'ai' && <span className="text-teal-600 ml-2">(AI Data)</span>}
                      </p>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div>
                <h4 className="text-lg font-medium mb-2">{selectedExercise.exercise_name}</h4>
                <div className="flex text-black items-center gap-4">
                  <label>Duration (minutes)</label>
                  <input
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className="w-24 px-3 py-1 border rounded-lg"
                  />
                </div>
                <p className="text-black mt-2">
                  Est. Calories Burned: {(selectedExercise.calories_burned_per_minute * duration).toFixed(0)}
                </p>
              </div>
            )}
          </div>
          <div className="p-6 border-t flex justify-end gap-3">
            <button onClick={onClose} className="px-4 py-2 rounded-lg border">Cancel</button>
            <button
              onClick={handleLog}
              disabled={!selectedExercise || loading}
              className="px-4 py-2 rounded-lg bg-teal-600 text-black disabled:bg-gray-400"
            >
              {loading ? "Logging..." : "Log Exercise"}
            </button>
          </div>
        </div>
      </div>
    );
}