'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useUserStore } from '@/lib/store/userStore';
import { dietPlanService, type DietPlan, type DietPlanItem } from '@/lib/api/dietPlans';

import {
  ScaleIcon,
  HeartIcon,
  ShoppingBagIcon,
  ChartBarIcon,
  DocumentTextIcon,
  UserGroupIcon,
  SparklesIcon,
  ArrowRightIcon,
  CpuChipIcon,
  ClockIcon,
  FireIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';

export default function Home() {
  const { isAuthenticated, user } = useUserStore();
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [bmi, setBmi] = useState<number | null>(null);
  const [bmiCategory, setBmiCategory] = useState('');
  const [aiPlanLoading, setAiPlanLoading] = useState(false);
  const [recentPlans, setRecentPlans] = useState<DietPlan[]>([]);

  // AI plan types
  type AIFood = { food_name: string; calories_per_100g: number; protein_per_100g?: number; carbs_per_100g?: number; fats_per_100g?: number };
  type AIFoodEntry = { food_name: string; quantity_grams: number };
  type AIDay = { day: number; breakfast?: AIFoodEntry[]; lunch?: AIFoodEntry[]; snack?: AIFoodEntry[]; dinner?: AIFoodEntry[] };
  type AIPlan = { planName: string; description?: string; targetCalories?: number; foods: AIFood[]; dailyMeals: AIDay[] };

  useEffect(() => {
    if (isAuthenticated) {
      fetchRecentPlans();
    }
  }, [isAuthenticated]);

  const fetchRecentPlans = async () => {
    try {
      const response = await dietPlanService.getRecentPlans();
      if (response.success) {
        setRecentPlans(response.plans);
      }
    } catch (error) {
      console.error('Error fetching recent plans:', error);
    }
  };

  const generateAIPlan = async () => {
    setAiPlanLoading(true);
    try {
      const userGoals = 'weight loss'; // You can make this dynamic based on user input
      const dietPreference = 'balanced'; // You can make this dynamic based on user input
      
      const prompt = `You are a nutrition expert. Create a 7-day diet plan for ${userGoals} with ${dietPreference} nutrition.

CRITICAL: Return ONLY valid JSON without markdown blocks. Use this EXACT structure:

{
  "planName": "7-Day Weight Loss Plan",
  "description": "Personalized nutrition plan for weight loss",
  "targetCalories": 1800,
  "foods": [
    {"food_name": "Steel-cut oats", "calories_per_100g": 379, "protein_per_100g": 13.2, "carbs_per_100g": 67.7, "fats_per_100g": 6.5},
    {"food_name": "Fresh blueberries", "calories_per_100g": 57, "protein_per_100g": 0.7, "carbs_per_100g": 14.5, "fats_per_100g": 0.3},
    {"food_name": "Grilled chicken breast", "calories_per_100g": 165, "protein_per_100g": 31.0, "carbs_per_100g": 0.0, "fats_per_100g": 3.6},
    {"food_name": "Brown rice", "calories_per_100g": 123, "protein_per_100g": 2.6, "carbs_per_100g": 23.0, "fats_per_100g": 0.9},
    {"food_name": "Greek yogurt plain", "calories_per_100g": 59, "protein_per_100g": 10.0, "carbs_per_100g": 3.6, "fats_per_100g": 0.4}
  ],
  "dailyMeals": [
    {
      "day": 1,
      "breakfast": [
        {"food_name": "Steel-cut oats", "quantity_grams": 80},
        {"food_name": "Fresh blueberries", "quantity_grams": 75}
      ],
      "lunch": [
        {"food_name": "Grilled chicken breast", "quantity_grams": 120},
        {"food_name": "Brown rice", "quantity_grams": 80}
      ],
      "snack": [
        {"food_name": "Greek yogurt plain", "quantity_grams": 150}
      ],
      "dinner": [
        {"food_name": "Grilled chicken breast", "quantity_grams": 100},
        {"food_name": "Steamed broccoli", "quantity_grams": 150}
      ]
    }
  ]
}

Generate 7 days (day 1-7), include 15-20 different real foods in the "foods" array with accurate nutrition data per 100g. Each meal should have 1-3 food items with specific gram quantities. Return only the JSON.`;

  const raw = await generateSuggestions(prompt);
  const aiResponse = raw as unknown as AIPlan;

  if (aiResponse && aiResponse.planName && aiResponse.dailyMeals && aiResponse.foods) {
        // Show the generated plan and ask if user wants to save it
        const saveToDatabase = confirm(`✅ AI Diet Plan "${aiResponse.planName}" generated successfully!\n\n📊 ${aiResponse.dailyMeals.length} days of personalized nutrition\n🍎 ${aiResponse.foods.length} unique foods with complete nutritional data\n🎯 Target: ${aiResponse.targetCalories || 1800} calories/day\n\n💾 Would you like to save this plan to your account?`);
        
        if (saveToDatabase) {
          await saveDietPlanToDatabase(aiResponse);
        } else {
          console.log('Generated AI Plan (not saved):', aiResponse);
          alert('Plan generated! You can view it in the console or generate a new one anytime.');
        }
      } else {
        alert('❌ AI plan generated but format is invalid. Please try again.');
        console.log('Invalid AI Response:', aiResponse);
      }
    } catch (error) {
      console.error('Error generating AI plan:', error);
      alert('❌ Error generating AI plan: ' + (error instanceof Error ? error.message : 'Please check your internet connection and try again.'));
    } finally {
      setAiPlanLoading(false);
    }
  };

  const saveDietPlanToDatabase = async (aiPlan: AIPlan) => {
    try {
      console.log('AI Plan received for saving:', aiPlan);

      type AIFood = { food_name: string; calories_per_100g: number; protein_per_100g?: number; carbs_per_100g?: number; fats_per_100g?: number };
      type AIFoodEntry = { food_name: string; quantity_grams: number };
      type AIDay = { day: number; breakfast?: AIFoodEntry[]; lunch?: AIFoodEntry[]; snack?: AIFoodEntry[]; dinner?: AIFoodEntry[] };

  const plan = aiPlan as AIPlan;

      // Create diet plan items from the AI response
      const dietPlanItems: Array<Omit<DietPlanItem, 'item_id' | 'plan_id'>> = [];

      const mealMap: Record<string, DietPlanItem['meal_time']> = {
        breakfast: 'Breakfast',
        lunch: 'Lunch',
        snack: 'Snack',
        dinner: 'Dinner',
      };

      // Process each day's meals - handle the new format properly
      plan.dailyMeals.forEach((day: AIDay) => {
        const mealTypes: Array<keyof AIDay> = ['breakfast', 'lunch', 'snack', 'dinner'];

        mealTypes.forEach((mealType) => {
          const meals = day[mealType];
          if (meals && Array.isArray(meals)) {
            meals.forEach((foodItem) => {
              // Find the corresponding food data
              const foodData = plan.foods.find((f: AIFood) => f.food_name === foodItem.food_name);
              if (foodData) {
                // Calculate calories based on quantity and nutritional data
                const calories = (foodData.calories_per_100g * foodItem.quantity_grams) / 100;

                dietPlanItems.push({
                  food_name: foodItem.food_name,
                  meal_time: mealMap[mealType as string],
                  quantity: foodItem.quantity_grams,
                  calories: Math.round(calories * 100) / 100, // Round to 2 decimal places
                });
              } else {
                console.warn(`Food data not found for: ${foodItem.food_name}`);
              }
            });
          } else {
            console.warn(`No ${String(mealType)} data found for day ${day.day}`);
          }
        });
      });

      console.log('Processed diet plan items:', dietPlanItems);
      console.log('Foods data:', plan.foods);

      if (dietPlanItems.length === 0) {
        alert('❌ No valid meal items found in the AI response. Please try generating again.');
        return;
      }

      // Create the diet plan with all the processed items
      const planResponse = await dietPlanService.createPlan({
        planName: plan.planName,
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + (plan.dailyMeals.length * 24 * 60 * 60 * 1000)).toISOString().split('T')[0],
        items: dietPlanItems,
        foods: plan.foods.map(f => ({
          food_name: f.food_name,
          calories_per_100g: f.calories_per_100g,
          protein_per_100g: f.protein_per_100g ?? 0,
          carbs_per_100g: f.carbs_per_100g ?? 0,
          fats_per_100g: f.fats_per_100g ?? 0,
        }))
      });

      if (planResponse.success) {
        alert(`✅ Diet plan "${plan.planName}" saved successfully!\n\n📋 ${dietPlanItems.length} meal items saved\n🍎 ${plan.foods.length} foods with nutritional data\n\n📋 Go to Diet Plans section to view your complete plan.`);
        fetchRecentPlans(); // Refresh the recent plans display
      } else {
        alert('❌ Failed to save plan: ' + planResponse.message);
        console.error('Plan save failed:', planResponse);
      }
    } catch (error) {
      console.error('Error saving plan to database:', error);
      alert('❌ Error saving plan. Please try again.');
    }
  };

  const calculateBMI = () => {
    if (height && weight) {
      const heightInMeters = parseFloat(height) / 100;
      const weightInKg = parseFloat(weight);
      const calculatedBMI = weightInKg / (heightInMeters * heightInMeters);
      setBmi(calculatedBMI);

      if (calculatedBMI < 18.5) {
        setBmiCategory('Underweight');
      } else if (calculatedBMI < 25) {
        setBmiCategory('Normal weight');
      } else if (calculatedBMI < 30) {
        setBmiCategory('Overweight');
      } else {
        setBmiCategory('Obese');
      }
    }
  };

  const getBMIColor = () => {
    if (bmi === null) return 'text-gray-600';
    if (bmi < 18.5) return 'text-blue-600';
  if (bmi < 25) return 'text-teal-700';
    if (bmi < 30) return 'text-yellow-600';
    return 'text-red-600';
  };

  const features = [
    {
      icon: ShoppingBagIcon,
      title: 'Health Products',
      description: 'Browse our curated selection of health and fitness products',
      href: '/products',
  color: 'text-teal-700',
    },
    {
      icon: ChartBarIcon,
      title: 'Health Tracker',
      description: 'Track calories, nutrition, and exercise data',
      href: '/health-tracker',
      color: 'text-blue-600',
    },
    {
      icon: ScaleIcon,
      title: 'BMI Calculator',
      description: 'Calculate your Body Mass Index instantly',
      href: '#bmi-calculator',
      color: 'text-purple-600',
    },
  ];

  const authenticatedFeatures = [
    {
      icon: DocumentTextIcon,
      title: 'Diet Plans',
      description: 'Create and manage personalized diet plans',
      href: '/diet-plans',
      color: 'text-orange-600',
    },
    {
      icon: CpuChipIcon,
      title: 'AI Diet Assistant',
      description: 'Get AI-powered personalized meal recommendations',
      href: '#ai-plans',
      color: 'text-indigo-600',
    },
    {
      icon: HeartIcon,
      title: 'Progress Tracking',
      description: 'Monitor your fitness journey and achievements',
      href: '/progress',
      color: 'text-red-600',
    },
  ];

  return (
    <div className="bg-gray-50">
      {/* Hero Section */}
      <div className="relative bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="relative z-10 pb-8 bg-white sm:pb-16 md:pb-20 lg:max-w-2xl lg:w-full lg:pb-28 xl:pb-32">
            <main className="mt-10 mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
              <div className="text-center lg:text-left">
                <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
                  <span className="block xl:inline">Welcome to</span>{' '}
                  <span className="block text-teal-700 xl:inline">FitFusion</span>
                </h1>
                <p className="mt-3 text-base text-gray-600 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
                  Your complete health and fitness companion. Track your diet, calculate BMI, 
                  explore health products, and achieve your wellness goals.
                </p>
                <div className="mt-5 sm:mt-8 sm:flex sm:justify-center lg:justify-start">
                  <div className="rounded-md shadow">
                    {isAuthenticated ? (
                      <Link
                        href="/diet-plans"
                        className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-teal-700 hover:bg-teal-800 md:py-4 md:text-lg md:px-10"
                      >
                        View Diet Plans
                        <ArrowRightIcon className="ml-2 h-5 w-5" />
                      </Link>
                    ) : (
                      <Link
                        href="/auth/signup"
                        className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-teal-700 hover:bg-teal-800 md:py-4 md:text-lg md:px-10"
                      >
                        Get Started
                        <ArrowRightIcon className="ml-2 h-5 w-5" />
                      </Link>
                    )}
                  </div>
                  <div className="mt-3 sm:mt-0 sm:ml-3">
                    <Link
                      href="/products"
                      className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium text-teal-800 bg-teal-100 hover:bg-teal-200 md:py-4 md:text-lg md:px-10"
                    >
                      Explore Products
                    </Link>
                  </div>
                </div>
              </div>
            </main>
          </div>
        </div>
        <div className="lg:absolute lg:inset-y-0 lg:right-0 lg:w-1/2">
          <img
            className="h-56 w-full object-cover sm:h-72 md:h-96 lg:w-full lg:h-full"
            src="https://images.unsplash.com/photo-1550345332-09e3ac987658?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80"
            alt="Fitness"
          />
        </div>
      </div>

      {/* User Welcome Section (if authenticated) */}
      {isAuthenticated && (
  <div className="bg-teal-50 border-b border-teal-200">
          <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-center">
              <UserGroupIcon className="h-8 w-8 text-teal-700 mr-3" />
              <div>
                <h2 className="text-xl font-semibold text-gray-900 text-center">
                  Welcome back, {user?.username}!
                </h2>
                <p className="text-gray-600 text-center">Ready to continue your fitness journey?</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Diet Plans Section (if authenticated) */}
      {isAuthenticated && (
  <div id="ai-plans" className="py-12 bg-linear-to-br from-indigo-50 to-blue-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-base text-indigo-700 font-semibold tracking-wide uppercase">
                AI-Powered Nutrition
              </h2>
              <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
                Smart Diet Plans
              </p>
              <p className="mt-4 max-w-2xl text-xl text-gray-700 mx-auto">
                Let our AI create personalized meal plans based on your goals, preferences, and dietary restrictions
              </p>
            </div>

            <div className="mt-12 grid gap-8 lg:grid-cols-2">
              {/* AI Plan Generator */}
              <div className="bg-white rounded-xl shadow-lg p-8 border border-indigo-200">
                <div className="flex items-center mb-6">
                  <div className="shrink-0">
                    <CpuChipIcon className="h-8 w-8 text-indigo-600" />
                  </div>
                  <h3 className="ml-3 text-xl font-semibold text-gray-900">
                    Generate AI Diet Plan
                  </h3>
                </div>
                <p className="text-gray-800 mb-6">
                  Our advanced AI analyzes your profile, goals, and preferences to create a customized meal plan that fits your lifestyle.
                </p>
                <div className="space-y-4 mb-6">
                  <div className="flex items-center text-sm text-gray-800">
                    <SparklesIcon className="h-4 w-4 text-yellow-500 mr-2" />
                    Personalized to your goals
                  </div>
                  <div className="flex items-center text-sm text-gray-800">
                    <ClockIcon className="h-4 w-4 text-blue-500 mr-2" />
                    Generated in seconds
                  </div>
                  <div className="flex items-center text-sm text-gray-800">
                    <FireIcon className="h-4 w-4 text-red-500 mr-2" />
                    Optimized calorie distribution
                  </div>
                </div>
                <button
                  onClick={generateAIPlan}
                  disabled={aiPlanLoading}
                  className="w-full bg-indigo-600 text-white py-3 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {aiPlanLoading ? 'Generating...' : 'Generate AI Plan'}
                </button>
              </div>

              {/* Custom Diet Plan Creation */}
              <div className="bg-white rounded-xl shadow-lg p-8 border border-teal-200">
                <div className="flex items-center mb-6">
                  <div className="shrink-0">
                    <PlusIcon className="h-8 w-8 text-teal-700" />
                  </div>
                  <h3 className="ml-3 text-xl font-semibold text-gray-900">
                    Create Custom Plan
                  </h3>
                </div>
                <p className="text-gray-800 mb-6">
                  Build your own diet plan from scratch with our comprehensive food database and meal planning tools.
                </p>
                <div className="space-y-4 mb-6">
                  <div className="flex items-center text-sm text-gray-800">
                    <DocumentTextIcon className="h-4 w-4 text-orange-500 mr-2" />
                    Choose from 1000+ foods
                  </div>
                  <div className="flex items-center text-sm text-gray-800">
                    <ChartBarIcon className="h-4 w-4 text-purple-500 mr-2" />
                    Track macros automatically
                  </div>
                  <div className="flex items-center text-sm text-gray-800">
                    <HeartIcon className="h-4 w-4 text-red-500 mr-2" />
                    Save and reuse plans
                  </div>
                </div>
                <Link
                  href="/diet-plans/create"
                  className="w-full inline-flex items-center justify-center bg-teal-700 text-white py-3 px-4 rounded-md hover:bg-teal-800 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:ring-offset-2 font-semibold"
                >
                  Create Custom Plan
                </Link>
              </div>
            </div>

            {/* Recent Plans Preview */}
            {recentPlans.length > 0 && (
              <div className="mt-12">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Your Recent Diet Plans</h3>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {recentPlans.slice(0, 3).map((plan) => (
                    <div key={plan.plan_id} className="bg-white rounded-lg shadow p-6 border border-gray-200">
                      <h4 className="font-medium text-gray-900">{plan.plan_name}</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        {plan.item_count || 0} items • {plan.total_calories || 0} calories
                      </p>
                      <div className="mt-4 flex items-center justify-between text-sm">
                        <span className="text-gray-500">
                          {plan.start_date ? new Date(plan.start_date).toLocaleDateString() : 'No start date'}
                        </span>
                        <Link
                          href={`/diet-plans/${plan.plan_id}`}
                          className="text-indigo-600 hover:text-indigo-800 font-medium"
                        >
                          View Plan
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* BMI Calculator Section */}
      <div id="bmi-calculator" className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-base text-teal-700 font-semibold tracking-wide uppercase">
              Health Tools
            </h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              BMI Calculator
            </p>
            <p className="mt-4 max-w-2xl text-xl text-gray-600 mx-auto">
              Calculate your Body Mass Index to understand your health status
            </p>
          </div>

          <div className="mt-10 max-w-lg mx-auto">
            <div className="bg-gray-50 p-8 rounded-xl shadow-lg">
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label htmlFor="height" className="block text-sm font-medium text-gray-800">
                    Height (cm)
                  </label>
                  <input
                    type="number"
                    id="height"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    className="mt-1 block w-full px-4 py-3 bg-white text-gray-900 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600"
                    placeholder="e.g., 170"
                  />
                </div>
                <div>
                  <label htmlFor="weight" className="block text-sm font-medium text-gray-800">
                    Weight (kg)
                  </label>
                  <input
                    type="number"
                    id="weight"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    className="mt-1 block w-full px-4 py-3 bg-white text-gray-900 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600"
                    placeholder="e.g., 70"
                  />
                </div>
              </div>
              <button
                onClick={calculateBMI}
                className="mt-6 w-full bg-teal-700 text-white py-3 px-4 rounded-md hover:bg-teal-800 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:ring-offset-2 font-semibold"
              >
                Calculate BMI
              </button>
              
              {bmi && (
                <div className="mt-6 p-4 bg-white rounded-lg border-2">
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Your BMI is</p>
                    <p className={`text-4xl font-bold ${getBMIColor()}`}>
                      {bmi.toFixed(1)}
                    </p>
                    <p className={`text-lg font-medium ${getBMIColor()}`}>
                      {bmiCategory}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-base text-teal-700 font-semibold tracking-wide uppercase">
              Features
            </h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              Explore FitFusion
            </p>
            <p className="mt-4 max-w-2xl text-xl text-gray-600 mx-auto">
              Discover all the tools and features to help you on your health journey
            </p>
          </div>

          <div className="mt-12">
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {[...features, ...(isAuthenticated ? authenticatedFeatures : [])].map((feature) => (
                <Link key={feature.title} href={feature.href} className="group">
                  <div className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow border border-transparent hover:border-teal-300 h-full flex flex-col">
                    <div className="shrink-0">
                      <div className={`inline-flex items-center justify-center h-12 w-12 rounded-md bg-teal-100 ${feature.color}`}>
                        <feature.icon className="h-6 w-6" aria-hidden="true" />
                      </div>
                    </div>
                    <div className="mt-4">
                      <h3 className="text-lg font-semibold text-gray-900 group-hover:text-teal-700">
                        {feature.title}
                      </h3>
                      <p className="mt-2 text-base text-gray-600">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      {!isAuthenticated && (
  <div className="bg-teal-800">
          <div className="max-w-2xl mx-auto text-center py-16 px-4 sm:py-20 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
              <span className="block">Ready to start your journey?</span>
              <span className="block">Join FitFusion today.</span>
            </h2>
            <p className="mt-4 text-lg leading-6 text-teal-200">
              Sign up now and get access to personalized diet plans, progress tracking, and more.
            </p>
            <Link
              href="/auth/signup"
              className="mt-8 w-full inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-teal-800 bg-white hover:bg-teal-50 sm:w-auto"
            >
              Sign up for free
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}