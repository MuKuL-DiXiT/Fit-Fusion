'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useUserStore } from '@/lib/store/userStore';
import { useRouter } from 'next/navigation';
import { dietPlanService, type DietPlan } from '@/lib/api/dietPlans';
import { generateSuggestions } from '@/lib/gemini';
import {
  PlusIcon,
  DocumentTextIcon,
  ClockIcon,
  FireIcon,
  TrashIcon,
  CalendarIcon,
  SparklesIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';

export default function DietPlansPage() {
  const { isAuthenticated } = useUserStore();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'my-plans' | 'create-ai'>('my-plans');
  const [dietPlans, setDietPlans] = useState<DietPlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [generatingPlan, setGeneratingPlan] = useState(false);
  
  // Form data for AI generation
  const [aiFormData, setAiFormData] = useState({
    goals: 'weight_loss',
    dietType: 'balanced',
    restrictions: '',
    targetCalories: '1800',
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }
    fetchDietPlans();
  }, [isAuthenticated, router]);

  const fetchDietPlans = async () => {
    setLoading(true);
    try {
      const response = await dietPlanService.getAllPlans();
      if (response.success) {
        setDietPlans(response.plans);
      }
    } catch (error) {
      console.error('Error fetching diet plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteDietPlan = async (planId: number) => {
    if (!confirm('Are you sure you want to delete this diet plan?')) return;
    
    try {
      const response = await dietPlanService.deletePlan(planId);
      if (response.success) {
        setDietPlans(dietPlans.filter(plan => plan.plan_id !== planId));
        alert('Diet plan deleted successfully!');
      } else {
        alert('Failed to delete diet plan: ' + response.message);
      }
    } catch (error) {
      console.error('Error deleting diet plan:', error);
      alert('Error deleting diet plan');
    }
  };

  const generateAIPlan = async () => {
    setGeneratingPlan(true);
    try {
      const prompt = `Create a comprehensive 7-day diet plan for ${aiFormData.goals} with ${aiFormData.dietType} nutrition. 
      ${aiFormData.restrictions ? `Dietary restrictions: ${aiFormData.restrictions}.` : ''}
      Target calories per day: ${aiFormData.targetCalories}.

      Provide SPECIFIC food recommendations with exact portions and nutritional benefits. Include:
      - Real food names (not generic descriptions)
      - Exact quantities (cups, grams, pieces)
      - Calorie content per item
      - Why each food helps with ${aiFormData.goals}

      Return ONLY valid JSON in this exact format:
      {
        "planName": "7-Day ${aiFormData.goals.charAt(0).toUpperCase() + aiFormData.goals.slice(1).replace('_', ' ')} Plan",
        "description": "Science-based nutrition plan for effective ${aiFormData.goals.replace('_', ' ')}",
        "targetCalories": ${parseInt(aiFormData.targetCalories)},
        "dailyMeals": [
          {
            "day": 1,
            "breakfast": {
              "foods": [
                {"name": "Steel-cut oats", "quantity": "1 cup cooked", "calories": 150, "benefits": "Fiber for satiety"},
                {"name": "Fresh blueberries", "quantity": "1/2 cup", "calories": 40, "benefits": "Antioxidants"}
              ],
              "totalCalories": 300
            },
            "lunch": {
              "foods": [
                {"name": "Grilled chicken breast", "quantity": "4 oz", "calories": 185, "benefits": "Lean protein"},
                {"name": "Quinoa", "quantity": "1/2 cup cooked", "calories": 110, "benefits": "Complete protein"}
              ],
              "totalCalories": 450
            },
            "snack": {
              "foods": [
                {"name": "Greek yogurt (plain)", "quantity": "1 cup", "calories": 130, "benefits": "Probiotics & protein"}
              ],
              "totalCalories": 130
            },
            "dinner": {
              "foods": [
                {"name": "Baked salmon", "quantity": "5 oz", "calories": 250, "benefits": "Omega-3 fatty acids"},
                {"name": "Steamed broccoli", "quantity": "1 cup", "calories": 30, "benefits": "Vitamins & minerals"}
              ],
              "totalCalories": 400
            }
          }
        ]
      }

      Include all 7 days with varied, nutritious meals. Focus on real foods that support ${aiFormData.goals.replace('_', ' ')}.`;

      const aiResponse = await generateSuggestions(prompt);
      
      if (aiResponse && aiResponse.planName && aiResponse.dailyMeals) {
        const saveToDatabase = confirm(`✅ AI Diet Plan "${aiResponse.planName}" generated successfully!\n\n📊 ${aiResponse.dailyMeals.length} days of personalized nutrition\n🎯 Target: ${aiResponse.targetCalories || aiFormData.targetCalories} calories/day\n\n💾 Would you like to save this plan to your account?`);
        
        if (saveToDatabase) {
          const planResponse = await dietPlanService.createPlan({
            planName: aiResponse.planName,
            startDate: new Date().toISOString().split('T')[0],
            endDate: new Date(Date.now() + (aiResponse.dailyMeals.length * 24 * 60 * 60 * 1000)).toISOString().split('T')[0],
            items: []
          });

          if (planResponse.success) {
            alert(`✅ Diet plan "${aiResponse.planName}" saved successfully!`);
            fetchDietPlans(); // Refresh the list
          } else {
            alert('❌ Failed to save plan: ' + planResponse.message);
          }
        }
        
        console.log('Generated AI Plan:', aiResponse);
      } else {
        alert('❌ AI plan generated but format is invalid. Please try again.');
        console.log('Invalid AI Response:', aiResponse);
      }
    } catch (error) {
      console.error('Error generating AI plan:', error);
      alert('❌ Error generating AI plan: ' + (error instanceof Error ? error.message : 'Please check your internet connection and try again.'));
    } finally {
      setGeneratingPlan(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Please log in to view your diet plans</h2>
          <Link href="/auth/login" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
            Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Diet Plans</h1>
          <p className="text-xl text-gray-600">
            Manage your personalized nutrition plans and generate AI-powered recommendations
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-8">
          <nav className="flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('my-plans')}
              className={`${
                activeTab === 'my-plans'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200`}
            >
              <DocumentTextIcon className="h-5 w-5 inline mr-2" />
              My Plans
            </button>
            <button
              onClick={() => setActiveTab('create-ai')}
              className={`${
                activeTab === 'create-ai'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200`}
            >
              <SparklesIcon className="h-5 w-5 inline mr-2" />
              AI Generator
            </button>
          </nav>
        </div>

        {/* My Plans Tab */}
        {activeTab === 'my-plans' && (
          <div>
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading your diet plans...</p>
              </div>
            ) : dietPlans.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl shadow-sm">
                <DocumentTextIcon className="h-24 w-24 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-gray-900 mb-2">No diet plans yet</h3>
                <p className="text-gray-600 mb-6">Create your first AI-powered diet plan to get started</p>
                <button
                  onClick={() => setActiveTab('create-ai')}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors duration-200"
                >
                  <SparklesIcon className="h-5 w-5 inline mr-2" />
                  Generate AI Plan
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {dietPlans.map((plan) => (
                  <div key={plan.plan_id} className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-200 overflow-hidden">
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900 truncate">{plan.plan_name}</h3>
                        <button
                          onClick={() => deleteDietPlan(plan.plan_id)}
                          className="text-red-500 hover:text-red-700 transition-colors duration-200"
                          title="Delete plan"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                      
                      <div className="space-y-3 mb-6">
                        <div className="flex items-center text-sm text-gray-600">
                          <CalendarIcon className="h-4 w-4 mr-2" />
                          Created: {new Date(plan.created_at).toLocaleDateString()}
                        </div>
                        
                        {plan.start_date && (
                          <div className="flex items-center text-sm text-gray-600">
                            <ClockIcon className="h-4 w-4 mr-2" />
                            {plan.start_date} to {plan.end_date || 'Ongoing'}
                          </div>
                        )}
                        
                        {plan.total_calories && (
                          <div className="flex items-center text-sm text-gray-600">
                            <FireIcon className="h-4 w-4 mr-2" />
                            {plan.total_calories} total calories
                          </div>
                        )}
                        
                        {plan.item_count && (
                          <div className="flex items-center text-sm text-gray-600">
                            <DocumentTextIcon className="h-4 w-4 mr-2" />
                            {plan.item_count} meal items
                          </div>
                        )}
                      </div>
                      
                      <div className="flex space-x-2">
                        <Link
                          href={`/diet-plans/${plan.plan_id}`}
                          className="flex-1 bg-blue-600 text-white text-center py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-200 text-sm font-medium"
                        >
                          <EyeIcon className="h-4 w-4 inline mr-1" />
                          View Plan
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* AI Generator Tab */}
        {activeTab === 'create-ai' && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-xl shadow-sm p-8">
              <div className="text-center mb-8">
                <SparklesIcon className="h-16 w-16 text-blue-600 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">AI Diet Plan Generator</h2>
                <p className="text-gray-600">Get personalized nutrition recommendations powered by AI</p>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); generateAIPlan(); }} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Health Goals</label>
                  <select
                    value={aiFormData.goals}
                    onChange={(e) => setAiFormData({ ...aiFormData, goals: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="weight_loss">Weight Loss</option>
                    <option value="muscle_gain">Muscle Gain</option>
                    <option value="maintenance">Weight Maintenance</option>
                    <option value="general_health">General Health</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Diet Type</label>
                  <select
                    value={aiFormData.dietType}
                    onChange={(e) => setAiFormData({ ...aiFormData, dietType: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="balanced">Balanced</option>
                    <option value="low_carb">Low Carb</option>
                    <option value="high_protein">High Protein</option>
                    <option value="mediterranean">Mediterranean</option>
                    <option value="vegetarian">Vegetarian</option>
                    <option value="vegan">Vegan</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Target Calories per Day</label>
                  <input
                    type="number"
                    value={aiFormData.targetCalories}
                    onChange={(e) => setAiFormData({ ...aiFormData, targetCalories: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., 1800"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Dietary Restrictions (Optional)</label>
                  <input
                    type="text"
                    value={aiFormData.restrictions}
                    onChange={(e) => setAiFormData({ ...aiFormData, restrictions: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., No nuts, dairy-free, gluten-free"
                  />
                </div>

                <button
                  type="submit"
                  disabled={generatingPlan}
                  className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 font-medium"
                >
                  {generatingPlan ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white inline mr-2"></div>
                      Generating AI Plan...
                    </>
                  ) : (
                    <>
                      <SparklesIcon className="h-5 w-5 inline mr-2" />
                      Generate AI Diet Plan
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}