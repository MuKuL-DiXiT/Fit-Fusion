"use client";
import { useState, useEffect } from "react";
import { useUserStore } from "@/lib/store/userStore";
import { useRouter } from "next/navigation";
import { PlusIcon, TrashIcon, DocumentDuplicateIcon } from "@heroicons/react/24/outline";

// --- Types ---
type FoodItem = {
  food_id: number;
  food_name: string;
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fats_per_100g: number;
};

type MealItem = {
  food: FoodItem;
  quantity: number; // in grams
};

type Meal = {
  meal_time: "Breakfast" | "Lunch" | "Dinner" | "Snack";
  items: MealItem[];
};

type DayPlan = {
  day: number;
  meals: Meal[];
};

// --- Helper Functions ---
const calculateBMR = (weight: number, height: number, age: number, gender: "male" | "female") => {
  if (gender === "male") {
    return 88.362 + 13.397 * weight + 4.799 * height - 5.677 * age;
  } else {
    return 447.593 + 9.247 * weight + 3.098 * height - 4.33 * age;
  }
};

const calculateTDEE = (bmr: number, activityLevel: string) => {
  const levels = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    veryActive: 1.9,
  };
  return bmr * (levels[activityLevel as keyof typeof levels] || 1.2);
};


// --- Main Component ---
export default function CreateManualDietPlanPage() {
  const { user } = useUserStore();
  const router = useRouter();

  // States for the builder
  const [planName, setPlanName] = useState("My New Diet Plan");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState(new Date(new Date().setDate(new Date().getDate() + 6)).toISOString().split("T")[0]);
  const [days, setDays] = useState<DayPlan[]>([]);
  const [activeDay, setActiveDay] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // States for Calorie Calculator
  const [calculator, setCalculator] = useState({
    weight: 70,
    targetWeight: 65,
    height: 170,
    age: 30,
    gender: "male" as "male" | "female",
    activityLevel: "light",
    goal: "lose",
  });
  const [calorieTarget, setCalorieTarget] = useState<number | null>(null);
  const [proteinTarget, setProteinTarget] = useState<number | null>(null);

  useEffect(() => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    if (diffDays > 0 && diffDays <= 30) {
      const newDays: DayPlan[] = Array.from({ length: diffDays }, (_, i) => {
        const existingDay = days.find(d => d.day === i + 1);
        return existingDay || {
          day: i + 1,
          meals: [
            { meal_time: "Breakfast", items: [] },
            { meal_time: "Lunch", items: [] },
            { meal_time: "Dinner", items: [] },
            { meal_time: "Snack", items: [] },
          ],
        };
      });
      setDays(newDays);
      if (activeDay > diffDays) setActiveDay(diffDays);
    }
  }, [startDate, endDate]);

  const handleCalculatorChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCalculator(prev => ({ ...prev, [name]: name === 'gender' || name === 'activityLevel' || name === 'goal' ? value : Number(value) }));
  };

  const handleCalculateCalories = () => {
    setError(null);
    const bmr = calculateBMR(calculator.weight, calculator.height, calculator.age, calculator.gender);
    const tdee = calculateTDEE(bmr, calculator.activityLevel);
    let target = tdee;

    if (calculator.goal === "lose" || calculator.goal === "gain") {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (end <= start) {
        setError("End date must be after the start date to calculate a goal-oriented plan.");
        setCalorieTarget(null);
        setProteinTarget(null);
        return;
      }
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const durationInDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      const weightToChange = calculator.weight - calculator.targetWeight;
      const totalCalorieChange = weightToChange * 7700; // Approx. 7700 kcal per kg of body weight
      const dailyCalorieAdjustment = totalCalorieChange / durationInDays;

      if (calculator.goal === "lose" && dailyCalorieAdjustment < 0) {
        setError("Target weight is higher than current weight, but goal is to lose. Please check your inputs.");
        return;
      }
      if (calculator.goal === "gain" && dailyCalorieAdjustment > 0) {
        setError("Target weight is lower than current weight, but goal is to gain. Please check your inputs.");
        return;
      }

      target = tdee - dailyCalorieAdjustment;
    }

    setCalorieTarget(target);
    const protein = calculator.weight * 1.8;
    setProteinTarget(protein);
  };

  const handleAddItem = (dayIndex: number, mealIndex: number, item: MealItem) => {
    const newDays = [...days];
    newDays[dayIndex].meals[mealIndex].items.push(item);
    setDays(newDays);
  };

  const handleRemoveItem = (dayIndex: number, mealIndex: number, itemIndex: number) => {
    const newDays = [...days];
    newDays[dayIndex].meals[mealIndex].items.splice(itemIndex, 1);
    setDays(newDays);
  };

  const handleRepeatDay = (dayIndex: number) => {
    if (!confirm("This will overwrite all subsequent days with the content of this day. Are you sure?")) return;
    const dayToRepeat = days[dayIndex];
    const newDays = [...days];
    for (let i = dayIndex + 1; i < newDays.length; i++) {
      newDays[i] = { ...dayToRepeat, day: i + 1 };
    }
    setDays(newDays);
  };

  const handleSavePlan = async () => {
    if (!user) {
      setError("You must be logged in to save a plan.");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("http://localhost:3001/api/diet-plans/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          planName,
          startDate,
          endDate,
          days,
        }),
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || "Failed to save plan.");
      }
      router.push("/diet-plans");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const getDayTotalCalories = (day: DayPlan) => {
    return day.meals.reduce((total, meal) => {
      return total + meal.items.reduce((mealTotal, item) => {
        return mealTotal + (item.food.calories_per_100g * item.quantity) / 100;
      }, 0);
    }, 0);
  };

  return (
    <div className="bg-white text-black mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-2">Create a Manual Diet Plan</h1>
      <p className="text-black mb-8">Design your own diet plan, day by day.</p>

      {/* Plan Details First */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-2xl font-bold mb-4">1. Set Your Plan's Foundation</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block font-medium mb-1">Plan Name</label>
            <input type="text" value={planName} onChange={e => setPlanName(e.target.value)} className="w-full p-2 border rounded-lg" />
          </div>
          <div>
            <label className="block font-medium mb-1">Start Date</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full p-2 border rounded-lg" />
          </div>
          <div>
            <label className="block font-medium mb-1">End Date</label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full p-2 border rounded-lg" />
          </div>
        </div>
      </div>

      {/* Calorie Calculator */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-2xl font-bold mb-4">2. Calculate Your Daily Needs</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <label className="block font-medium mb-1 text-sm">Current Weight (kg)</label>
            <input type="number" name="weight" value={calculator.weight} onChange={handleCalculatorChange} className="w-full p-2 border rounded-lg" />
          </div>
          <div>
            <label className="block font-medium mb-1 text-sm">Target Weight (kg)</label>
            <input type="number" name="targetWeight" value={calculator.targetWeight} onChange={handleCalculatorChange} className="w-full p-2 border rounded-lg" />
          </div>
          <div>
            <label className="block font-medium mb-1 text-sm">Height (cm)</label>
            <input type="number" name="height" value={calculator.height} onChange={handleCalculatorChange} className="w-full p-2 border rounded-lg" />
          </div>
          <div>
            <label className="block font-medium mb-1 text-sm">Age</label>
            <input type="number" name="age" value={calculator.age} onChange={handleCalculatorChange} className="w-full p-2 border rounded-lg" />
          </div>
          <div>
            <label className="block font-medium mb-1 text-sm">Gender</label>
            <select name="gender" value={calculator.gender} onChange={handleCalculatorChange} className="w-full p-2 border rounded-lg bg-white">
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>
          <div>
            <label className="block font-medium mb-1 text-sm">Activity Level</label>
            <select name="activityLevel" value={calculator.activityLevel} onChange={handleCalculatorChange} className="w-full p-2 border rounded-lg bg-white">
              <option value="sedentary">Sedentary</option>
              <option value="light">Light</option>
              <option value="moderate">Moderate</option>
              <option value="active">Active</option>
              <option value="veryActive">Very Active</option>
            </select>
          </div>
          <div className="col-span-2 md:col-span-1">
            <label className="block font-medium mb-1 text-sm">Goal</label>
            <select name="goal" value={calculator.goal} onChange={handleCalculatorChange} className="w-full p-2 border rounded-lg bg-white">
              <option value="lose">Lose Weight</option>
              <option value="maintain">Maintain Weight</option>
              <option value="gain">Gain Weight</option>
            </select>
          </div>
        </div>
        <button onClick={handleCalculateCalories} className="mt-6 bg-teal-600 text-black px-6 py-2 rounded-lg hover:bg-teal-700 transition-colors">
          Calculate
        </button>
        {error && <p className="text-red-500 mt-2">{error}</p>}
        {(calorieTarget || proteinTarget) && !error && (
          <div className="mt-4 p-4 bg-teal-50 rounded-lg grid grid-cols-1 md:grid-cols-2 gap-4">
            {calorieTarget && (
              <div>
                <p className="font-semibold text-lg">Recommended Daily Calorie Target:</p>
                <p className="text-2xl font-bold text-teal-700">{calorieTarget.toFixed(0)} kcal</p>
              </div>
            )}
            {proteinTarget && (
               <div>
                <p className="font-semibold text-lg">Recommended Daily Protein Target:</p>
                <p className="text-2xl font-bold text-teal-700">{proteinTarget.toFixed(0)} g</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Plan Builder */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4">3. Build Your Plan</h2>
        
        {/* Day Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-4 overflow-x-auto">
            {days.map(day => (
              <button
                key={day.day}
                onClick={() => setActiveDay(day.day)}
                className={`${
                  activeDay === day.day
                    ? "border-teal-500 text-teal-600"
                    : "border-transparent text-black hover:text-black hover:border-gray-300"
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Day {day.day}
              </button>
            ))}
          </nav>
        </div>

        {/* Active Day Content */}
        <div className="mt-6">
          {days.map((day, dayIndex) => (
            <div key={day.day} className={activeDay === day.day ? "block" : "hidden"}>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">
                  Day {day.day} - Total Calories: {getDayTotalCalories(day).toFixed(0)} kcal
                </h3>
                <button onClick={() => handleRepeatDay(dayIndex)} className="text-sm bg-gray-200 text-black px-3 py-1 rounded-lg hover:bg-gray-300 flex items-center gap-1">
                  <DocumentDuplicateIcon className="h-4 w-4" />
                  Repeat This Day
                </button>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {day.meals.map((meal, mealIndex) => (
                  <MealCard
                    key={meal.meal_time}
                    meal={meal}
                    onAddItem={(item) => handleAddItem(dayIndex, mealIndex, item)}
                    onRemoveItem={(itemIndex) => handleRemoveItem(dayIndex, mealIndex, itemIndex)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-8">
            <button onClick={handleSavePlan} disabled={isLoading} className="w-full bg-teal-600 text-black py-3 rounded-lg text-lg font-semibold hover:bg-teal-700 disabled:bg-gray-400">
                {isLoading ? "Saving..." : "Save Full Plan"}
            </button>
            {error && <p className="text-red-500 mt-2">{error}</p>}
        </div>
      </div>
    </div>
  );
}

// --- Meal Card Component ---
function MealCard({ meal, onAddItem, onRemoveItem }: { meal: Meal; onAddItem: (item: MealItem) => void; onRemoveItem: (index: number) => void; }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<FoodItem[]>([]);
  const [quantity, setQuantity] = useState(100);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async () => {
    if (searchTerm.length < 2) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      // Use the same search endpoint as the health tracker
      const res = await fetch(`http://localhost:3001/api/log/search-food?q=${encodeURIComponent(searchTerm)}`, { credentials: "include" });
      if (!res.ok) {
        // Throw an error if the response is not OK, to be caught by the catch block
        throw new Error(`API request failed with status ${res.status}`);
      }
      const data = await res.json();
      if (data.success) {
        setSearchResults(data.results);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error("Search failed:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectItem = (food: FoodItem) => {
    // Add with a default internal quantity (100g) but do not expose weight in the UI
    onAddItem({ food, quantity: 100 });
    setSearchTerm("");
    setSearchResults([]);
    setQuantity(100);
  };

  const totalMealCalories = meal.items.reduce((total, item) => total + (item.food.calories_per_100g * item.quantity) / 100, 0);

  return (
    <div className="bg-gray-50 p-4 rounded-lg">
      <h4 className="font-bold text-lg mb-2 flex justify-between">
        <span>{meal.meal_time}</span>
        <span className="text-black">{totalMealCalories.toFixed(0)} kcal</span>
      </h4>
      <div className="space-y-2 mb-4 min-h-[40px]">
        {meal.items.map((item, index) => (
          <div key={index} className="flex justify-between items-center bg-white p-2 rounded-md shadow-sm">
            <div>
              <p className="font-medium">{item.food.food_name}</p>
              <p className="text-sm text-black">{((item.food.calories_per_100g * item.quantity) / 100).toFixed(0)} kcal</p>
            </div>
            <button onClick={() => onRemoveItem(index)} className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50">
              <TrashIcon className="h-5 w-5" />
            </button>
          </div>
        ))}
      </div>
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Add Food:</label>
        </div>
        <div className="relative">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Search food..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full p-2 border rounded-lg"
            />
            <button onClick={handleSearch} disabled={isSearching} className="bg-teal-500 text-black px-4 rounded-lg hover:bg-teal-600 disabled:bg-gray-400">
              {isSearching ? '...' : 'Search'}
            </button>
          </div>
          {Array.isArray(searchResults) && searchResults.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg max-h-48 overflow-y-auto shadow-lg">
              {searchResults.map(food => (
                <div key={food.food_id} onClick={() => handleSelectItem(food)} className="p-2 hover:bg-gray-100 cursor-pointer border-b last:border-b-0">
                  <p className="font-medium">{food.food_name}</p>
                  <p className="text-sm text-black">{food.calories_per_100g} kcal per 100g</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}