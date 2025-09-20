'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { dietPlanService } from '@/lib/api/dietPlans';
import { useUserStore } from '@/lib/store/userStore';
import {
  ArrowLeftIcon,
  PlusIcon,
  CalendarIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

export default function CreateDietPlanPage() {
  const router = useRouter();
  const { isAuthenticated } = useUserStore();
  const [isLoading, setIsLoading] = useState(false);
  const [planData, setPlanData] = useState({
    planName: '',
    startDate: '',
    endDate: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    if (!planData.planName.trim()) {
      alert('Please enter a plan name');
      return;
    }

    setIsLoading(true);
    try {
      const response = await dietPlanService.createPlan({
        planName: planData.planName,
        startDate: planData.startDate || undefined,
        endDate: planData.endDate || undefined,
      });

      if (response.success) {
        router.push(`/diet-plans/${response.plan.plan_id}`);
      } else {
        alert('Failed to create diet plan: ' + response.message);
      }
    } catch (error) {
      console.error('Error creating diet plan:', error);
      alert('Error creating diet plan. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Please log in to create a diet plan
          </h2>
          <Link
            href="/auth/login"
            className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
          >
            Log In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <Link
              href="/diet-plans"
              className="mr-4 p-2 text-gray-400 hover:text-gray-600"
            >
              <ArrowLeftIcon className="h-6 w-6" />
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Create Diet Plan</h1>
          </div>
          <p className="text-gray-600">
            Create a personalized diet plan to help you achieve your health goals.
          </p>
        </div>

        {/* Form */}
        <div className="bg-white shadow rounded-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Plan Name */}
            <div>
              <label htmlFor="planName" className="block text-sm font-medium text-gray-700 mb-2">
                Plan Name *
              </label>
              <input
                type="text"
                id="planName"
                value={planData.planName}
                onChange={(e) => setPlanData({ ...planData, planName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                placeholder="e.g., My Weight Loss Plan"
                required
              />
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
                  <CalendarIcon className="h-4 w-4 inline mr-1" />
                  Start Date (Optional)
                </label>
                <input
                  type="date"
                  id="startDate"
                  value={planData.startDate}
                  onChange={(e) => setPlanData({ ...planData, startDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                />
              </div>

              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-2">
                  <ClockIcon className="h-4 w-4 inline mr-1" />
                  End Date (Optional)
                </label>
                <input
                  type="date"
                  id="endDate"
                  value={planData.endDate}
                  onChange={(e) => setPlanData({ ...planData, endDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                  min={planData.startDate}
                />
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <PlusIcon className="h-5 w-5 text-blue-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">
                    Next Steps
                  </h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <p>
                      After creating your plan, you'll be able to add meals and track your daily nutrition.
                      You can customize meal times, add foods from our database, and monitor your progress.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-4">
              <Link
                href="/diet-plans"
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Creating...' : 'Create Plan'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}