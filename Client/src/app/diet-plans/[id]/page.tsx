"use client";

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useUserStore } from '@/lib/store/userStore';
import { dietPlanService } from '@/lib/api/dietPlans';
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
  useEffect(()=>{})

  const planId = params.id as string;

  type Macros = { protein: number; carbs: number; fat: number };
  type Meal = { name: string; calories: number; foods: string[] };
  type MealMap = Record<string, Meal>;
  type DietPlanNormalized = {
    id?: string;
    name?: string;
    description?: string;
    duration?: number;
    totalCalories?: number;
    difficulty?: string;
    type?: string;
    macros?: Macros;
    meals?: MealMap;
    isCustom?: boolean;
  };

  const [plan, setPlan] = useState<DietPlanNormalized | null>(null);
  const [items, setItems] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const id = Number(planId);
        if (!id) return;
        const resp = await dietPlanService.getPlan(id);
        if (resp && resp.success) {
          if (!cancelled) {
            // normalize fields expected by UI
            const p = resp.plan as unknown as Record<string, unknown>;
            setPlan({
              id: String(p.plan_id ?? p.id ?? ''),
              name: String(p.plan_name ?? p.name ?? 'Diet Plan'),
              description: String(p.description ?? ''),
              duration: p.end_date && p.start_date ? Math.max(1, Math.ceil((new Date(String(p.end_date)).getTime() - new Date(String(p.start_date)).getTime()) / (1000*60*60*24))) : 7,
              totalCalories: resp.items ? (resp.items as unknown[]).reduce((s: number, it: unknown) => s + (Number((it as Record<string, unknown>).calories ?? 0)), 0) : Number(p.total_calories ?? 0),
              difficulty: String(p.difficulty ?? 'Moderate'),
              type: String(p.type ?? 'General'),
              macros: (p.macros as Macros) || { protein: 30, carbs: 50, fat: 20 },
              meals: buildMealsFromItems(resp.items || []),
              isCustom: Boolean(p.is_custom ?? p.isCustom ?? false)
            });
            setItems(resp.items || []);
          }
        } else {
          // fallback to store
          const fallback = dietPlans.find((d: unknown) => String(((d as Record<string, unknown>).plan_id ?? (d as Record<string, unknown>).id) ?? '') === planId) || currentDietPlan;
          if (!cancelled) setPlan(fallback as DietPlanNormalized | null);
        }
      } catch (err) {
  const fallback = dietPlans.find((d: unknown) => String(((d as Record<string, unknown>).plan_id ?? (d as Record<string, unknown>).id) ?? '') === planId) || currentDietPlan;
  if (!cancelled) setPlan(fallback as DietPlanNormalized | null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [planId]);

  function buildMealsFromItems(items: unknown[]) {
    const meals: Record<string, { name: string; calories: number; foods: string[] }> = {};
    for (const it of items) {
      const rec = it as Record<string, unknown>;
      const meal = String(rec.meal_time ?? 'Snack');
      if (!meals[meal]) meals[meal] = { name: meal, calories: 0, foods: [] };
      meals[meal].calories += Number(rec.calories ?? 0);
      if (rec.food_name) meals[meal].foods.push(String(rec.food_name));
      else if (rec.product_name) meals[meal].foods.push(String(rec.product_name));
    }
    return meals;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Loading plan...</div>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Diet plan not found</h1>
          <button
            onClick={() => router.back()}
            className="text-teal-700 hover:text-teal-800"
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
            className="flex items-center text-teal-700 hover:text-teal-800 mr-4"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-1" />
            Back
          </button>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold text-gray-900">{plan.name}</h1>
              {isActivePlan && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-teal-100 text-teal-800">
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
                {Object.entries(plan.meals ?? {})
                  .map(([mealType, meal]) => [mealType, meal as Meal] as [string, Meal])
                  .map(([mealType, meal]) => (
                  <div key={mealType} className="border-b border-gray-200 last:border-b-0 pb-6 last:pb-0">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-lg font-medium text-gray-900 capitalize">{mealType}</h3>
                      <span className="text-sm font-medium text-teal-700">{Number(meal.calories ?? 0)} cal</span>
                    </div>
                    <h4 className="text-md font-medium text-gray-800 mb-2">{String(meal.name ?? '')}</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {Array.isArray(meal.foods) ? (meal.foods as string[]).map((food, index) => (
                        <div key={index} className="flex items-center text-sm text-gray-600">
                          <span className="w-2 h-2 bg-teal-600 rounded-full mr-2"></span>
                          {String(food)}
                        </div>
                      )) : null}
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
                    <div className="bg-teal-100 border border-teal-200 rounded-lg p-2">
                      <div className="text-xs text-teal-800">
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
                    <span className="font-medium text-blue-600">{plan.macros?.protein ?? 30}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${plan.macros?.protein ?? 30}%` }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Carbohydrates</span>
                    <span className="font-medium text-teal-700">{plan.macros?.carbs ?? 50}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-teal-700 h-2 rounded-full" 
                      style={{ width: `${plan.macros?.carbs ?? 50}%` }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Fat</span>
                    <span className="font-medium text-yellow-600">{plan.macros?.fat ?? 20}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-yellow-600 h-2 rounded-full" 
                      style={{ width: `${plan.macros?.fat ?? 20}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              {!isActivePlan && (
                <button
                  onClick={() => setCurrentDietPlan(String(plan.id ?? ''))}
                  className="w-full bg-teal-700 text-white px-4 py-3 rounded-md hover:bg-teal-800 transition-colors font-medium"
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
