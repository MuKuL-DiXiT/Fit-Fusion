"use client";

import { useState } from "react";
import { useUserStore } from "@/lib/store/userStore";
import { useRouter } from "next/navigation";

type DietPlan = {
  plan_name: string;
  days: {
    day: number;
    meals: {
      meal_time: "Breakfast" | "Lunch" | "Snack" | "Dinner";
      items: {
        food_name: string;
        quantity: string;
        calories_per_100g: number;
        protein_per_100g: number;
        carbs_per_100g: number;
        fats_per_100g: number;
      }[];
    }[];
  }[];
};

export default function CreateDietPlanPage() {
  const [currentWeight, setCurrentWeight] = useState("");
  const [targetWeight, setTargetWeight] = useState("");
  const [duration, setDuration] = useState("7");
  const [dietType, setDietType] = useState<"vegetarian" | "vegan" | "non-vegetarian">("vegetarian");
  const [isLoading, setIsLoading] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<DietPlan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [planName, setPlanName] = useState("");

  const user = useUserStore((state) => state.user);
  const router = useRouter();

  const handleGeneratePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setGeneratedPlan(null);

    if (!user) {
      setError("You must be logged in to create a diet plan.");
      setIsLoading(false);
      return;
    }

    const prompt = `
      Create a detailed diet plan for a user with the following characteristics.
      - Current Weight: ${currentWeight} kg
      - Target Weight: ${targetWeight} kg
      - Plan Duration: ${duration} days
      - Dietary Preference: ${dietType}

      The response must be a single, valid JSON object. Do not include any text, explanation, or markdown formatting outside of the JSON object.
      The JSON object should have a "plan_name" (e.g., "${duration} Day Weight Loss Plan") and a "days" array.
      Each object in the "days" array should represent a day and have a "day" number and a "meals" array.
      The "meals" array should contain objects for "Breakfast", "Lunch", "Snack", and "Dinner".
      Each meal object must have a "meal_time" and an "items" array.
      Each item in the "items" array must have the following exact keys: "food_name", "quantity" (as a string like "100g" or "1 cup"), "calories_per_100g", "protein_per_100g", "carbs_per_100g", and "fats_per_100g".
      All nutritional values must be numbers.

      Example for a single day:
      {
        "day": 1,
        "meals": [
          {
            "meal_time": "Breakfast",
            "items": [
              {
                "food_name": "Oatmeal",
                "quantity": "1 cup",
                "calories_per_100g": 70,
                "protein_per_100g": 3,
                "carbs_per_100g": 12,
                "fats_per_100g": 1.5
              }
            ]
          }
        ]
      }
    `;

    try {
      const response = await fetch("/api/gemini-suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response from AI.");
      }

      const data = await response.json();
      const parsedPlan = JSON.parse(data.text);
      setGeneratedPlan(parsedPlan);
      setPlanName(parsedPlan.plan_name || `My ${duration}-Day Diet Plan`);
    } catch (err) {
      console.error(err);
      setError("Failed to generate diet plan. The AI might be busy or the response was not in the correct format. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSavePlan = async () => {
    if (!generatedPlan || !user) return;
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/diet-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.userId,
          planName: planName,
          startDate: new Date().toISOString().split("T")[0],
          endDate: new Date(new Date().setDate(new Date().getDate() + parseInt(duration))).toISOString().split("T")[0],
          planData: generatedPlan,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to save the diet plan.");
      }

      router.push("/diet-plans");
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred while saving.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container  mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-6">Create Your AI-Powered Diet Plan</h1>

      <form onSubmit={handleGeneratePlan} className="bg-white text-black shadow-md rounded-lg p-8 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="currentWeight" className="block text-black font-bold mb-2">Current Weight (kg)</label>
            <input
              type="number"
              id="currentWeight"
              value={currentWeight}
              onChange={(e) => setCurrentWeight(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-black leading-tight focus:outline-none focus:shadow-outline"
              required
            />
          </div>
          <div>
            <label htmlFor="targetWeight" className="block text-black font-bold mb-2">Target Weight (kg)</label>
            <input
              type="number"
              id="targetWeight"
              value={targetWeight}
              onChange={(e) => setTargetWeight(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-black leading-tight focus:outline-none focus:shadow-outline"
              required
            />
          </div>
          <div>
            <label htmlFor="duration" className="block text-black font-bold mb-2">Duration (days)</label>
            <input
              type="number"
              id="duration"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              min="7"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-black leading-tight focus:outline-none focus:shadow-outline"
              required
            />
          </div>
          <div>
            <label htmlFor="dietType" className="block text-black font-bold mb-2">Dietary Preference</label>
            <select
              id="dietType"
              value={dietType}
              onChange={(e) => setDietType(e.target.value as any)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-black leading-tight focus:outline-none focus:shadow-outline"
            >
              <option value="vegetarian">Vegetarian</option>
              <option value="vegan">Vegan</option>
              <option value="non-vegetarian">Non-Vegetarian</option>
            </select>
          </div>
        </div>
        <div className="mt-6">
          <button
            type="submit"
            disabled={isLoading}
            className="bg-blue-500 hover:bg-blue-700 text-black font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full disabled:bg-blue-300"
          >
            {isLoading ? "Generating Plan..." : "Generate Diet Plan with AI"}
          </button>
        </div>
      </form>

      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6" role="alert">{error}</div>}

      {generatedPlan && (
        <div className="bg-white shadow-md rounded-lg p-8">
          <h2 className="text-3xl font-bold mb-4">Your Generated Diet Plan</h2>
          <div className="mb-4">
            <label htmlFor="planName" className="block text-black font-bold mb-2">Plan Name</label>
            <input
              type="text"
              id="planName"
              value={planName}
              onChange={(e) => setPlanName(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-black leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>
          <div className="space-y-6">
            {generatedPlan.days.map((day) => (
              <div key={day.day} className="border-b pb-4">
                <h3 className="text-2xl font-semibold mb-3">Day {day.day}</h3>
                {day.meals.map((meal) => (
                  <div key={meal.meal_time} className="ml-4 mb-4">
                    <h4 className="text-xl font-semibold">{meal.meal_time}</h4>
                    <ul className="list-disc list-inside">
                      {meal.items.map((item, index) => (
                        <li key={index} className="text-black">
                          {item.food_name} ({item.quantity}) - 
                          <span className="text-sm text-black">
                            {` Cals: ${item.calories_per_100g}, Prot: ${item.protein_per_100g}g, Carbs: ${item.carbs_per_100g}g, Fat: ${item.fats_per_100g}g`}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ))}
          </div>
          <div className="mt-6">
            <button
              onClick={handleSavePlan}
              disabled={isLoading}
              className="bg-teal-700 hover:bg-teal-800 text-black font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full disabled:bg-teal-300"
            >
              {isLoading ? "Saving..." : "Save This Plan"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}