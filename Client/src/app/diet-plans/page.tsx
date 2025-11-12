'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useUserStore } from '@/lib/store/userStore';
import { useRouter } from 'next/navigation';
import { dietPlanService, type DietPlan } from '@/lib/api/dietPlans';
import GenerateAIDietPlan from '@/components/GenerateAIDietPlan';

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
                <SparklesIcon className="h-16 w-16 text-teal-600 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">AI Diet Plan Generator</h2>
                <p className="text-gray-600">Get personalized nutrition recommendations powered by Gemini AI</p>
              </div>

              <div className="flex justify-center">
                <GenerateAIDietPlan onPlanGenerated={fetchDietPlans} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}