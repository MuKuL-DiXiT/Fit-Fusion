'use client';

import { useParams, useRouter } from 'next/navigation';
import { useUserStore } from '@/lib/store/userStore';
import {
  CalendarIcon,
  FireIcon,
  ClockIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

export default function DietPlanDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { dietPlans, currentDietPlan, setCurrentDietPlan } = useUserStore();

  const planId = params.id as string;
  const plan = dietPlans.find(p => p.id === planId) || currentDietPlan;

  if (!plan) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Diet plan not found</h1>
          <button
            onClick={() => router.back()}
            className="text-green-600 hover:text-green-700"
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  const isActivePlan = currentDietPlan?.id === plan.id;

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center text-green-600 hover:text-green-700 mr-4"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-1" />
            Back
          </button>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold text-gray-900">{plan.name}</h1>
              {isActivePlan && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                  <CheckCircleIcon className="h-4 w-4 mr-1" />
                  Active Plan
                </span>
              )}
            </div>
            <p className="text-gray-600 mt-2">{plan.description}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Daily Meals */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Daily Meal Plan</h2>
              <div className="space-y-6">
                {Object.entries(plan.meals).map(([mealType, meal]) => (
                  <div key={mealType} className="border-b border-gray-200 last:border-b-0 pb-6 last:pb-0">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-lg font-medium text-gray-900 capitalize">{mealType}</h3>
                      <span className="text-sm font-medium text-green-600">{meal.calories} cal</span>
                    </div>
                    <h4 className="text-md font-medium text-gray-800 mb-2">{meal.name}</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {meal.foods.map((food, index) => (
                        <div key={index} className="flex items-center text-sm text-gray-600">
                          <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                          {food}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Weekly Schedule */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Weekly Schedule</h2>
              <div className="grid grid-cols-7 gap-2">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => (
                  <div key={day} className="text-center">
                    <div className="text-xs font-medium text-gray-600 mb-2">{day}</div>
                    <div className="bg-green-100 border border-green-200 rounded-lg p-2">
                      <div className="text-xs text-green-800">
                        Same meal plan repeats
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-sm text-gray-600 mt-4">
                This meal plan repeats for {plan.duration} days. You can customize individual days as needed.
              </p>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Plan Overview */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Plan Overview</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-sm text-gray-600">
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    Duration
                  </div>
                  <span className="text-sm font-medium text-gray-900">{plan.duration} days</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-sm text-gray-600">
                    <FireIcon className="h-4 w-4 mr-2" />
                    Daily Calories
                  </div>
                  <span className="text-sm font-medium text-gray-900">{plan.totalCalories}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-sm text-gray-600">
                    <ClockIcon className="h-4 w-4 mr-2" />
                    Difficulty
                  </div>
                  <span className="text-sm font-medium text-gray-900">{plan.difficulty}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-sm text-gray-600">
                    <span className="w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
                    Type
                  </div>
                  <span className="text-sm font-medium text-gray-900">{plan.type}</span>
                </div>
              </div>
            </div>

            {/* Macros Distribution */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Macros Distribution</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Protein</span>
                    <span className="font-medium text-blue-600">{plan.macros.protein}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${plan.macros.protein}%` }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Carbohydrates</span>
                    <span className="font-medium text-green-600">{plan.macros.carbs}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full" 
                      style={{ width: `${plan.macros.carbs}%` }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Fat</span>
                    <span className="font-medium text-yellow-600">{plan.macros.fat}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-yellow-600 h-2 rounded-full" 
                      style={{ width: `${plan.macros.fat}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              {!isActivePlan && (
                <button
                  onClick={() => setCurrentDietPlan(plan.id)}
                  className="w-full bg-green-600 text-white px-4 py-3 rounded-md hover:bg-green-700 transition-colors font-medium"
                >
                  Activate This Plan
                </button>
              )}
              {plan.isCustom && (
                <button className="w-full border border-gray-300 text-gray-700 px-4 py-3 rounded-md hover:bg-gray-50 transition-colors font-medium">
                  Edit Plan
                </button>
              )}
              <button className="w-full border border-gray-300 text-gray-700 px-4 py-3 rounded-md hover:bg-gray-50 transition-colors font-medium">
                Download PDF
              </button>
            </div>

            {/* Tips */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-900 mb-2">Tips for Success</h4>
              <ul className="text-xs text-blue-800 space-y-1">
                <li>• Drink plenty of water throughout the day</li>
                <li>• Prepare meals in advance when possible</li>
                <li>• Listen to your body and adjust portions as needed</li>
                <li>• Track your progress regularly</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
