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
  FireIcon,
  TrashIcon,
  CalendarIcon,
  SparklesIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';

export default function DietPlansPage() {
  const { isAuthenticated } = useUserStore();
  const router = useRouter();
  const [dietPlans, setDietPlans] = useState<DietPlan[]>([]);
  const [loading, setLoading] = useState(true);

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
      await dietPlanService.deletePlan(planId);
      setDietPlans(dietPlans.filter(plan => plan.plan_id !== planId));
    } catch (error) {
      console.error('Error deleting diet plan:', error);
      alert('Error deleting diet plan');
    }
  };

  if (!isAuthenticated) {
    return null; // Or a loading/redirecting state
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
          <h1 className="text-4xl font-bold text-gray-900">Your Diet Plans</h1>
          <Link
            href="/diet-plans/create"
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-teal-600 text-white px-6 py-3 rounded-lg shadow-md hover:bg-teal-700 transition-colors duration-200"
          >
            <PlusIcon className="h-6 w-6" />
            <span className="font-semibold">Create New Diet Plan</span>
          </Link>
        </div>

        {loading ? (
          <div className="text-center">
            <p>Loading your plans...</p>
          </div>
        ) : dietPlans.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {dietPlans.map(plan => (
              <div key={plan.plan_id} className="bg-white rounded-xl shadow-lg overflow-hidden transform hover:-translate-y-1 transition-transform duration-300">
                <div className="p-6">
                  <div className="flex justify-between items-start">
                    <h3 className="text-2xl font-bold text-gray-800 mb-2">{plan.plan_name}</h3>
                    {plan.is_ai_generated && (
                      <div className="flex items-center gap-1 text-purple-600">
                        <SparklesIcon className="h-5 w-5" />
                        <span className="text-xs font-semibold">AI</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center text-gray-500 mb-4">
                    <CalendarIcon className="h-5 w-5 mr-2" />
                    <span>{new Date(plan.start_date).toLocaleDateString()} - {new Date(plan.end_date).toLocaleDateString()}</span>
                  </div>
                  <div className="space-y-3 text-gray-600">
                    <div className="flex items-center">
                      <DocumentTextIcon className="h-5 w-5 mr-2 text-teal-500" />
                      <span>{plan.item_count || 0} items</span>
                    </div>
                    <div className="flex items-center">
                      <FireIcon className="h-5 w-5 mr-2 text-red-500" />
                      <span>Approx. {plan.total_calories ? Math.round(plan.total_calories) : 0} calories</span>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-6 py-4 flex justify-end gap-2">
                  <Link href={`/diet-plans/${plan.plan_id}`} className="text-teal-600 hover:text-teal-800 p-2 rounded-full hover:bg-gray-200 transition-colors">
                    <EyeIcon className="h-6 w-6" />
                  </Link>
                  <button onClick={() => deleteDietPlan(plan.plan_id)} className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-gray-200 transition-colors">
                    <TrashIcon className="h-6 w-6" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center bg-white py-16 px-8 rounded-lg shadow-md">
            <DocumentTextIcon className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h2 className="text-2xl font-bold text-gray-800">No Diet Plans Yet</h2>
            <p className="text-gray-500 mt-2 mb-6">
              Click the button above to create your first personalized diet plan.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}