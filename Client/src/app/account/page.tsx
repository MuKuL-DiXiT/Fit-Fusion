"use client";

import { useState, useEffect } from "react";
import { useUserStore } from "@/lib/store/userStore";
import { useRouter } from "next/navigation";
import {
  UserIcon,
  CogIcon,
  ShoppingBagIcon,
  HeartIcon,
  BellIcon,
  ShieldCheckIcon,
  PencilIcon,
} from "@heroicons/react/24/outline";

type Tab = "profile" | "orders" | "settings";

export default function AccountPage() {
  const { user, logout } = useUserStore();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const [isEditing, setIsEditing] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    if (!user && !isRedirecting) {
      setIsRedirecting(true);
      router.push("/auth/login");
    }
  }, [user, router, isRedirecting]);

  if (!user) {
    return null;
  }

  const mockOrders = [
    {
      id: "1",
      date: "2024-01-15",
      status: "delivered",
      total: 89.99,
      items: [
        { name: "Whey Protein Powder", quantity: 1, price: 49.99 },
        { name: "Resistance Bands Set", quantity: 1, price: 39.99 },
      ],
    },
    {
      id: "2",
      date: "2024-01-10",
      status: "shipped",
      total: 159.97,
      items: [
        { name: "Smart Fitness Watch", quantity: 1, price: 129.99 },
        { name: "Yoga Mat Premium", quantity: 1, price: 29.98 },
      ],
    },
    {
      id: "3",
      date: "2024-01-05",
      status: "processing",
      total: 24.99,
      items: [{ name: "Organic Green Tea", quantity: 1, price: 24.99 }],
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "bg-teal-100 text-teal-800";
      case "shipped":
        return "bg-blue-100 text-blue-800";
      case "processing":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const tabs = [
    { id: "profile" as Tab, name: "Profile", icon: UserIcon },
    { id: "orders" as Tab, name: "Orders", icon: ShoppingBagIcon },
    { id: "settings" as Tab, name: "Settings", icon: CogIcon },
  ];

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Account</h1>
          <p className="text-gray-600 mt-2">
            Manage your account and view your order history
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center mb-6">
                <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center">
                  <UserIcon className="h-8 w-8 text-teal-700" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    {user.username || user.email}
                  </h3>
                  <p className="text-sm text-gray-600">{user.email}</p>
                </div>
              </div>

              <nav className="space-y-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      activeTab === tab.id
                        ? "bg-teal-100 text-teal-800"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    <tab.icon className="h-5 w-5 mr-3" />
                    {tab.name}
                  </button>
                ))}
              </nav>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={() => {
                    logout();
                    router.push("/");
                  }}
                  className="w-full text-left text-sm text-red-600 hover:text-red-700 font-medium"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {activeTab === "profile" && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">
                      Personal Information
                    </h2>
                    <button
                      onClick={() => setIsEditing(!isEditing)}
                      className="flex items-center text-teal-700 hover:text-teal-800"
                    >
                      <PencilIcon className="h-4 w-4 mr-1" />
                      {isEditing ? "Cancel" : "Edit"}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          defaultValue={user.username || user.email}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-black focus:outline-none focus:ring-2 focus:ring-teal-600"
                        />
                      ) : (
                        <p className="text-gray-900">{user.username || user.email}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address
                      </label>
                      {isEditing ? (
                        <input
                          type="email"
                          defaultValue={user.email}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-black focus:outline-none focus:ring-2 focus:ring-teal-600"
                        />
                      ) : (
                        <p className="text-gray-900">{user.email}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number
                      </label>
                      {isEditing ? (
                        <input
                          type="tel"
                          defaultValue="+1 (555) 123-4567"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-600"
                        />
                      ) : (
                        <p className="text-gray-900">+1 (555) 123-4567</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Date of Birth
                      </label>
                      {isEditing ? (
                        <input
                          type="date"
                          defaultValue="1990-01-01"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-600"
                        />
                      ) : (
                        <p className="text-gray-900">January 1, 1990</p>
                      )}
                    </div>
                  </div>

                  {isEditing && (
                    <div className="mt-6 flex space-x-4">
                      <button className="bg-teal-700 text-white px-4 py-2 rounded-md hover:bg-teal-800 transition-colors">
                        Save Changes
                      </button>
                      <button
                        onClick={() => setIsEditing(false)}
                        className="border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">
                    Fitness Goals
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Primary Goal
                      </label>
                      <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-600">
                        <option>Weight Loss</option>
                        <option>Muscle Gain</option>
                        <option>Maintain Weight</option>
                        <option>General Fitness</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Activity Level
                      </label>
                      <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-600">
                        <option>Sedentary</option>
                        <option>Lightly Active</option>
                        <option>Moderately Active</option>
                        <option>Very Active</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Target Weight (lbs)
                      </label>
                      <input
                        type="number"
                        defaultValue="150"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-600"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Current Weight (lbs)
                      </label>
                      <input
                        type="number"
                        defaultValue="160"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-600"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "orders" && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">
                    Order History
                  </h2>

                  {mockOrders.length === 0 ? (
                    <div className="text-center py-12">
                      <ShoppingBagIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        No orders yet
                      </h3>
                      <p className="text-gray-600 mb-4">
                        Start shopping to see your orders here
                      </p>
                      <button
                        onClick={() => router.push("/products")}
                        className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                      >
                        Browse Products
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {mockOrders.map((order) => (
                        <div
                          key={order.id}
                          className="border border-gray-200 rounded-lg p-6"
                        >
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h3 className="text-lg font-medium text-gray-900">
                                Order #{order.id}
                              </h3>
                              <p className="text-sm text-gray-600">
                                Placed on{" "}
                                {new Date(order.date).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="text-right">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                                  order.status
                                )}`}
                              >
                                {order.status.charAt(0).toUpperCase() +
                                  order.status.slice(1)}
                              </span>
                              <p className="text-lg font-semibold text-gray-900 mt-1">
                                ${order.total}
                              </p>
                            </div>
                          </div>

                          <div className="space-y-3">
                            {order.items.map((item, index) => (
                              <div
                                key={index}
                                className="flex justify-between items-center"
                              >
                                <div>
                                  <span className="text-gray-900">
                                    {item.name}
                                  </span>
                                  <span className="text-gray-600 ml-2">
                                    x{item.quantity}
                                  </span>
                                </div>
                                <span className="text-gray-900">
                                  ${item.price}
                                </span>
                              </div>
                            ))}
                          </div>

                          <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center">
                            <button className="text-teal-700 hover:text-teal-800 text-sm font-medium">
                              View Details
                            </button>
                            {order.status === "delivered" && (
                              <button className="text-teal-700 hover:text-teal-800 text-sm font-medium">
                                Buy Again
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "settings" && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">
                    Account Settings
                  </h2>

                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <BellIcon className="h-5 w-5 text-gray-400 mr-3" />
                        <div>
                          <h3 className="text-sm font-medium text-gray-900">
                            Email Notifications
                          </h3>
                          <p className="text-sm text-gray-600">
                            Receive updates about your orders and diet plans
                          </p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          defaultChecked
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-700"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <HeartIcon className="h-5 w-5 text-gray-400 mr-3" />
                        <div>
                          <h3 className="text-sm font-medium text-gray-900">
                            Marketing Emails
                          </h3>
                          <p className="text-sm text-gray-600">
                            Receive tips and product recommendations
                          </p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-700"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <ShieldCheckIcon className="h-5 w-5 text-gray-400 mr-3" />
                        <div>
                          <h3 className="text-sm font-medium text-gray-900">
                            Two-Factor Authentication
                          </h3>
                          <p className="text-sm text-gray-600">
                            Add an extra layer of security to your account
                          </p>
                        </div>
                      </div>
                      <button className="text-teal-700 hover:text-teal-800 text-sm font-medium">
                        Enable
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">
                    Privacy & Security
                  </h2>

                  <div className="space-y-4">
                    <button className="w-full text-left p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <h3 className="text-sm font-medium text-gray-900">
                        Change Password
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Update your account password
                      </p>
                    </button>

                    <button className="w-full text-left p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <h3 className="text-sm font-medium text-gray-900">
                        Download Your Data
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Get a copy of your account data
                      </p>
                    </button>

                    <button className="w-full text-left p-4 border border-red-200 rounded-lg hover:bg-red-50 transition-colors">
                      <h3 className="text-sm font-medium text-red-600">
                        Delete Account
                      </h3>
                      <p className="text-sm text-red-500 mt-1">
                        Permanently delete your account and all data
                      </p>
                    </button>
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
