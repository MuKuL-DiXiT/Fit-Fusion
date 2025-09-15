'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useUserStore } from '@/lib/store/userStore';
import { useRouter } from 'next/navigation';
import {
  PlusIcon,
  DocumentTextIcon,
  ClockIcon,
  FireIcon,
  TrashIcon,
  PencilIcon,
  StarIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

interface Meal {
  name: string;
  foods: string[];
  calories: number;
}

interface DietPlan {
  id: string;
  name: string;
  description: string;
  duration: number; // in days
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  type: 'Weight Loss' | 'Muscle Gain' | 'Maintenance' | 'General Health';
  meals: {
    breakfast: Meal;
    lunch: Meal;
    dinner: Meal;
    snacks: Meal;
  };
  totalCalories: number;
  macros: {
    protein: number;
    carbs: number;
    fat: number;
  };
  rating: number;
  isCustom: boolean;
  createdAt: Date;
}

const preMadePlans: DietPlan[] = [
  {
    id: 'pre-1',
    name: 'Mediterranean Weight Loss',
    description: 'A balanced Mediterranean diet plan focused on healthy fats, lean proteins, and fresh vegetables.',
    duration: 30,
    difficulty: 'Beginner',
    type: 'Weight Loss',
    meals: {
      breakfast: {
        name: 'Greek Yogurt Bowl',
        foods: ['Greek yogurt', 'Berries', 'Nuts', 'Honey'],
        calories: 350,
      },
      lunch: {
        name: 'Mediterranean Salad',
        foods: ['Mixed greens', 'Chicken breast', 'Olives', 'Feta cheese', 'Olive oil'],
        calories: 450,
      },
      dinner: {
        name: 'Grilled Salmon',
        foods: ['Salmon fillet', 'Quinoa', 'Steamed vegetables', 'Lemon'],
        calories: 500,
      },
      snacks: {
        name: 'Healthy Snacks',
        foods: ['Apple', 'Almonds'],
        calories: 200,
      },
    },
    totalCalories: 1500,
    macros: { protein: 35, carbs: 40, fat: 25 },
    rating: 4.7,
    isCustom: false,
    createdAt: new Date(),
  },
  {
    id: 'pre-2',
    name: 'High Protein Muscle Building',
    description: 'Designed for muscle gain with high protein intake and balanced carbohydrates for energy.',
    duration: 45,
    difficulty: 'Intermediate',
    type: 'Muscle Gain',
    meals: {
      breakfast: {
        name: 'Protein Pancakes',
        foods: ['Protein powder', 'Oats', 'Eggs', 'Banana', 'Berries'],
        calories: 550,
      },
      lunch: {
        name: 'Chicken Power Bowl',
        foods: ['Chicken breast', 'Brown rice', 'Sweet potato', 'Broccoli'],
        calories: 650,
      },
      dinner: {
        name: 'Lean Beef & Quinoa',
        foods: ['Lean beef', 'Quinoa', 'Green beans', 'Avocado'],
        calories: 700,
      },
      snacks: {
        name: 'Protein Snacks',
        foods: ['Protein shake', 'Greek yogurt', 'Mixed nuts'],
        calories: 400,
      },
    },
    totalCalories: 2300,
    macros: { protein: 45, carbs: 35, fat: 20 },
    rating: 4.8,
    isCustom: false,
    createdAt: new Date(),
  },
  {
    id: 'pre-3',
    name: 'Plant-Based Balanced',
    description: 'A nutritionally complete plant-based diet plan rich in variety and nutrients.',
    duration: 21,
    difficulty: 'Beginner',
    type: 'General Health',
    meals: {
      breakfast: {
        name: 'Smoothie Bowl',
        foods: ['Plant milk', 'Spinach', 'Banana', 'Chia seeds', 'Granola'],
        calories: 400,
      },
      lunch: {
        name: 'Buddha Bowl',
        foods: ['Quinoa', 'Chickpeas', 'Roasted vegetables', 'Tahini dressing'],
        calories: 500,
      },
      dinner: {
        name: 'Lentil Curry',
        foods: ['Red lentils', 'Coconut milk', 'Vegetables', 'Brown rice'],
        calories: 550,
      },
      snacks: {
        name: 'Plant Snacks',
        foods: ['Hummus', 'Vegetables', 'Fruit'],
        calories: 250,
      },
    },
    totalCalories: 1700,
    macros: { protein: 25, carbs: 55, fat: 20 },
    rating: 4.5,
    isCustom: false,
    createdAt: new Date(),
  },
];

export default function DietPlansPage() {
  const { isAuthenticated, user, dietPlans, currentDietPlan, addDietPlan, removeDietPlan, setCurrentDietPlan } = useUserStore();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'browse' | 'my-plans' | 'create'>('browse');
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Required</h2>
          <p className="text-gray-600 mb-4">Please sign in to access diet plans</p>
          <Link
            href="/auth/login"
            className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  const handleSelectPlan = (plan: DietPlan) => {
    if (!plan.isCustom) {
      // Create a custom copy of the pre-made plan for the user
      const customPlan: DietPlan = {
        ...plan,
        id: Date.now().toString(),
        isCustom: true,
        createdAt: new Date(),
      };
      addDietPlan(customPlan);
      setCurrentDietPlan(customPlan.id);
    } else {
      setCurrentDietPlan(plan.id);
    }
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<StarIconSolid key={i} className="h-4 w-4 text-yellow-400" />);
    }

    if (hasHalfStar) {
      stars.push(<StarIconSolid key="half" className="h-4 w-4 text-yellow-400" />);
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<StarIcon key={`empty-${i}`} className="h-4 w-4 text-gray-300" />);
    }

    return stars;
  };

  const DietPlanCard = ({ plan, showActions = false }: { plan: DietPlan; showActions?: boolean }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">{plan.name}</h3>
            <p className="text-gray-600 text-sm mb-3">{plan.description}</p>
          </div>
          {currentDietPlan?.id === plan.id && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Active
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-center text-sm text-gray-600">
            <CalendarIcon className="h-4 w-4 mr-2" />
            {plan.duration} days
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <FireIcon className="h-4 w-4 mr-2" />
            {plan.totalCalories} cal/day
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <ClockIcon className="h-4 w-4 mr-2" />
            {plan.difficulty}
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <span className="w-3 h-3 rounded-full bg-blue-500 mr-2"></span>
            {plan.type}
          </div>
        </div>

        {!plan.isCustom && (
          <div className="flex items-center mb-4">
            <div className="flex items-center">
              {renderStars(plan.rating)}
            </div>
            <span className="ml-2 text-sm text-gray-600">{plan.rating}</span>
          </div>
        )}

        {/* Macros */}
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Macros Distribution</h4>
          <div className="flex space-x-4">
            <div className="text-center">
              <div className="text-lg font-bold text-blue-600">{plan.macros.protein}%</div>
              <div className="text-xs text-gray-600">Protein</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-green-600">{plan.macros.carbs}%</div>
              <div className="text-xs text-gray-600">Carbs</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-yellow-600">{plan.macros.fat}%</div>
              <div className="text-xs text-gray-600">Fat</div>
            </div>
          </div>
        </div>

        {/* Meals Preview */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Daily Meals</h4>
          <div className="space-y-2">
            {Object.entries(plan.meals).map(([mealType, meal]) => (
              <div key={mealType} className="flex justify-between text-sm">
                <span className="text-gray-600 capitalize">{mealType}: {meal.name}</span>
                <span className="text-gray-900 font-medium">{meal.calories} cal</span>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex space-x-3">
          <button
            onClick={() => handleSelectPlan(plan)}
            className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors text-sm font-medium"
          >
            {currentDietPlan?.id === plan.id ? 'View Plan' : 'Select Plan'}
          </button>
          
          {showActions && plan.isCustom && (
            <>
              <button className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
                <PencilIcon className="h-4 w-4 text-gray-600" />
              </button>
              <button
                onClick={() => removeDietPlan(plan.id)}
                className="px-3 py-2 border border-red-300 rounded-md hover:bg-red-50 transition-colors"
              >
                <TrashIcon className="h-4 w-4 text-red-600" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Diet Plans</h1>
          <p className="text-gray-600">Create and manage personalized diet plans to achieve your health goals</p>
        </div>

        {/* Current Plan Banner */}
        {currentDietPlan && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-green-900">Current Active Plan</h2>
                <p className="text-green-700">{currentDietPlan.name}</p>
                <p className="text-sm text-green-600 mt-1">
                  {currentDietPlan.totalCalories} calories per day • {currentDietPlan.duration} days
                </p>
              </div>
              <Link
                href={`/diet-plans/${currentDietPlan.id}`}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
              >
                View Details
              </Link>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'browse', name: 'Browse Plans', icon: DocumentTextIcon },
                { id: 'my-plans', name: 'My Plans', icon: StarIcon },
                { id: 'create', name: 'Create Plan', icon: PlusIcon },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="h-5 w-5" />
                  <span>{tab.name}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Browse Plans Tab */}
            {activeTab === 'browse' && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-6">Popular Diet Plans</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {preMadePlans.map((plan) => (
                    <DietPlanCard key={plan.id} plan={plan} />
                  ))}
                </div>
              </div>
            )}

            {/* My Plans Tab */}
            {activeTab === 'my-plans' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-medium text-gray-900">Your Diet Plans</h3>
                  <button
                    onClick={() => setActiveTab('create')}
                    className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors flex items-center space-x-2"
                  >
                    <PlusIcon className="h-4 w-4" />
                    <span>Create New Plan</span>
                  </button>
                </div>
                
                {dietPlans.length === 0 ? (
                  <div className="text-center py-12">
                    <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No diet plans yet</h3>
                    <p className="text-gray-600 mb-4">Create your first diet plan or browse our popular plans</p>
                    <button
                      onClick={() => setActiveTab('browse')}
                      className="text-green-600 hover:text-green-700 font-medium"
                    >
                      Browse Popular Plans
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {dietPlans.map((plan) => (
                      <DietPlanCard key={plan.id} plan={plan} showActions={true} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Create Plan Tab */}
            {activeTab === 'create' && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-6">Create Custom Diet Plan</h3>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <div className="text-center">
                    <PlusIcon className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                    <h4 className="text-lg font-medium text-gray-900 mb-2">Custom Plan Creator</h4>
                    <p className="text-gray-600 mb-4">
                      Create a personalized diet plan tailored to your specific goals and preferences
                    </p>
                    <Link
                      href="/diet-plans/create"
                      className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                    >
                      Start Creating
                    </Link>
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
