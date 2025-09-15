'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useUserStore } from '@/lib/store/userStore';
import {
  ScaleIcon,
  HeartIcon,
  ShoppingBagIcon,
  ChartBarIcon,
  DocumentTextIcon,
  UserGroupIcon,
  SparklesIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';

export default function Home() {
  const { isAuthenticated, user } = useUserStore();
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [bmi, setBmi] = useState<number | null>(null);
  const [bmiCategory, setBmiCategory] = useState('');

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
    if (bmi < 25) return 'text-green-600';
    if (bmi < 30) return 'text-yellow-600';
    return 'text-red-600';
  };

  const features = [
    {
      icon: ShoppingBagIcon,
      title: 'Health Products',
      description: 'Browse our curated selection of health and fitness products',
      href: '/products',
      color: 'text-green-600',
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
                  <span className="block text-green-600 xl:inline">FitFusion</span>
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
                        className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700 md:py-4 md:text-lg md:px-10"
                      >
                        View Diet Plans
                        <ArrowRightIcon className="ml-2 h-5 w-5" />
                      </Link>
                    ) : (
                      <Link
                        href="/auth/signup"
                        className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700 md:py-4 md:text-lg md:px-10"
                      >
                        Get Started
                        <ArrowRightIcon className="ml-2 h-5 w-5" />
                      </Link>
                    )}
                  </div>
                  <div className="mt-3 sm:mt-0 sm:ml-3">
                    <Link
                      href="/products"
                      className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-green-700 bg-green-100 hover:bg-green-200 md:py-4 md:text-lg md:px-10"
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
        <div className="bg-green-50 border-b border-green-200">
          <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-center">
              <UserGroupIcon className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <h2 className="text-xl font-semibold text-gray-900 text-center">
                  Welcome back, {user?.name}!
                </h2>
                <p className="text-gray-600 text-center">Ready to continue your fitness journey?</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* BMI Calculator Section */}
      <div id="bmi-calculator" className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-base text-green-600 font-semibold tracking-wide uppercase">
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
                    className="mt-1 block w-full px-4 py-3 bg-white text-gray-900 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
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
                    className="mt-1 block w-full px-4 py-3 bg-white text-gray-900 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="e.g., 70"
                  />
                </div>
              </div>
              <button
                onClick={calculateBMI}
                className="mt-6 w-full bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 font-semibold"
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
            <h2 className="text-base text-green-600 font-semibold tracking-wide uppercase">
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
                  <div className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow border border-transparent hover:border-green-300 h-full flex flex-col">
                    <div className="flex-shrink-0">
                      <div className={`inline-flex items-center justify-center h-12 w-12 rounded-md bg-green-100 ${feature.color}`}>
                        <feature.icon className="h-6 w-6" aria-hidden="true" />
                      </div>
                    </div>
                    <div className="mt-4">
                      <h3 className="text-lg font-semibold text-gray-900 group-hover:text-green-600">
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
        <div className="bg-green-700">
          <div className="max-w-2xl mx-auto text-center py-16 px-4 sm:py-20 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
              <span className="block">Ready to start your journey?</span>
              <span className="block">Join FitFusion today.</span>
            </h2>
            <p className="mt-4 text-lg leading-6 text-green-200">
              Sign up now and get access to personalized diet plans, progress tracking, and more.
            </p>
            <Link
              href="/auth/signup"
              className="mt-8 w-full inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-green-700 bg-white hover:bg-green-50 sm:w-auto"
            >
              Sign up for free
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}