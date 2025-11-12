"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SparklesIcon } from "@heroicons/react/24/outline";

interface GenerateDietPlanProps {
  onPlanGenerated?: () => void;
}

export default function GenerateAIDietPlan({ onPlanGenerated }: GenerateDietPlanProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [formData, setFormData] = useState({
    goals: "",
    preferences: "",
    budget: "Moderate",
    duration: "7"
  });

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);

    try {
      const response = await fetch("http://localhost:3001/api/ai-diet-plan/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        alert("AI Diet Plan generated successfully! Check your diet plans.");
        setIsOpen(false);
        setFormData({
          goals: "",
          preferences: "",
          budget: "Moderate",
          duration: "7"
        });
        
        if (onPlanGenerated) {
          onPlanGenerated();
        } else {
          router.push("/diet-plans");
        }
      } else {
        alert(data.message || "Failed to generate diet plan");
      }
    } catch (error) {
      console.error("Error generating diet plan:", error);
      alert("Error generating diet plan. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="bg-gradient-to-r from-teal-600 to-teal-700 text-white px-6 py-3 rounded-lg hover:from-teal-700 hover:to-teal-800 transition-all flex items-center gap-2 shadow-lg"
      >
        <SparklesIcon className="h-5 w-5" />
        Generate AI Diet Plan
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-teal-50 to-teal-100">
              <div className="flex items-center gap-3">
                <SparklesIcon className="h-8 w-8 text-teal-700" />
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Generate AI Diet Plan</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Let AI create a personalized meal plan based on your goals
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleGenerate} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Goals <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.goals}
                  onChange={(e) => setFormData({ ...formData, goals: e.target.value })}
                  placeholder="E.g., Lose 5kg in 2 months, Build muscle, Maintain current weight, etc."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  rows={3}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dietary Preferences
                </label>
                <textarea
                  value={formData.preferences}
                  onChange={(e) => setFormData({ ...formData, preferences: e.target.value })}
                  placeholder="E.g., Vegetarian, Vegan, No dairy, Low carb, Keto, etc."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  rows={2}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Budget Level
                </label>
                <select
                  value={formData.budget}
                  onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                >
                  <option value="Low">Low Budget (₹500-1000/week)</option>
                  <option value="Moderate">Moderate Budget (₹1000-2000/week)</option>
                  <option value="High">High Budget (₹2000+/week)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Plan Duration (Days)
                </label>
                <select
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                >
                  <option value="3">3 Days</option>
                  <option value="5">5 Days</option>
                  <option value="7">7 Days (1 Week)</option>
                  <option value="14">14 Days (2 Weeks)</option>
                  <option value="21">21 Days (3 Weeks)</option>
                  <option value="30">30 Days (1 Month)</option>
                </select>
              </div>

              <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
                <p className="text-sm text-teal-800">
                  <strong>Note:</strong> The AI will generate a complete meal plan with breakfast, lunch, snack, 
                  and dinner for each day, including detailed nutrition information. This may take 15-30 seconds.
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={generating}
                  className="flex-1 bg-teal-700 text-white px-6 py-3 rounded-lg hover:bg-teal-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {generating ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Generating Plan...
                    </span>
                  ) : (
                    "Generate Diet Plan"
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  disabled={generating}
                  className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
