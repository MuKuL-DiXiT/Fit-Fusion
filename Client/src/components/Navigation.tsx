"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useUserStore } from "@/lib/store/userStore";
import {
  UserIcon,
  ShoppingCartIcon,
  HeartIcon,
  HomeIcon,
  MagnifyingGlassIcon,
  ChartBarIcon,
  DocumentTextIcon,
  Bars3Icon,
  XMarkIcon,
  ChartPieIcon,
} from "@heroicons/react/24/outline";
import { clsx } from "clsx";

export default function Navigation() {
  const pathname = usePathname();
  const { isAuthenticated, user, logout } = useUserStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // If you want a live cart count, wire it to a cart store or backend; default to 0 for now
  const cartItemsCount = 0;

  // Check if user is a supplier
  const isSupplier = user?.role === "supplier";

  // Navigation items for regular users
  const publicNavItems = [
    { name: "Home", href: "/", icon: HomeIcon },
    { name: "Products", href: "/products", icon: MagnifyingGlassIcon },
    { name: "Health Tracker", href: "/health-tracker", icon: ChartBarIcon },
  ];

  const authenticatedNavItems = [
    { name: "Home", href: "/", icon: HomeIcon },
    { name: "Products", href: "/products", icon: MagnifyingGlassIcon },
    { name: "Health Tracker", href: "/health-tracker", icon: ChartBarIcon },
    { name: "Diet Plans", href: "/diet-plans", icon: DocumentTextIcon },
  ];

  // Navigation items for suppliers
  const supplierNavItems = [
    {
      name: "Supplier Dashboard",
      href: "/supplier-dashboard",
      icon: ChartPieIcon,
    },
  ];

  // Determine which navigation items to show
  const navItems = isAuthenticated
    ? isSupplier
      ? [...authenticatedNavItems, ...supplierNavItems]
      : authenticatedNavItems
    : publicNavItems;

  const handleLogout = async () => {
    await logout();
    setIsMobileMenuOpen(false);
  };

  return (
    <nav className="bg-white shadow-lg border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link
            href={isSupplier ? "/supplier-dashboard" : "/"}
            className="flex items-center space-x-2"
          >
            <HeartIcon className="h-8 w-8 text-teal-700" />
            <span className="text-xl font-bold text-gray-900">FitFusion</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={clsx(
                  "flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  pathname === item.href
                    ? "text-teal-700 bg-teal-50"
                    : "text-gray-700 hover:text-teal-700 hover:bg-teal-50"
                )}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.name}</span>
              </Link>
            ))}
          </div>

          {/* Right side items */}
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                {/* Show cart for all authenticated users, including suppliers */}
                <Link
                  href="/cart"
                  className="relative flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-teal-700 hover:bg-teal-50 transition-colors"
                >
                  <ShoppingCartIcon className="h-5 w-5" />
                  <span>Cart</span>
                  {cartItemsCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-teal-700 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {cartItemsCount}
                    </span>
                  )}
                </Link>

                {/* Account Dropdown */}
                <div className="relative group">
                  <button className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-teal-700 hover:bg-teal-50 transition-colors">
                    <UserIcon className="h-5 w-5" />
                    <span>{user?.username || "Account"}</span>
                  </button>
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <div className="py-1">
                      <Link
                        href="/account"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-teal-50 hover:text-teal-700"
                      >
                        Account Details
                      </Link>
                      {!isSupplier && (
                        <Link
                          href="/account/orders"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-teal-50 hover:text-teal-700"
                        >
                          Orders
                        </Link>
                      )}
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600"
                      >
                        Sign Out
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  href="/auth/login"
                  className="text-gray-700 hover:text-teal-700 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/signup"
                  className="bg-teal-700 text-white hover:bg-teal-800 px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-gray-700 hover:text-teal-700 p-2"
            >
              {isMobileMenuOpen ? (
                <XMarkIcon className="h-6 w-6" />
              ) : (
                <Bars3Icon className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMobileMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t border-gray-200">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={clsx(
                  "flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium",
                  pathname === item.href
                    ? "text-teal-700 bg-teal-50"
                    : "text-gray-700 hover:text-teal-700 hover:bg-teal-50"
                )}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.name}</span>
              </Link>
            ))}

            {isAuthenticated ? (
              <>
                {/* Show cart for all authenticated users, including suppliers */}
                <Link
                  href="/cart"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-teal-700 hover:bg-teal-50"
                >
                  <ShoppingCartIcon className="h-5 w-5" />
                  <span>Cart ({cartItemsCount})</span>
                </Link>

                <Link
                  href="/account"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-teal-700 hover:bg-teal-50"
                >
                  <UserIcon className="h-5 w-5" />
                  <span>Account</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-red-600 hover:bg-red-50 w-full text-left"
                >
                  <span>Sign Out</span>
                </button>
              </>
            ) : (
              <div className="space-y-1">
                <Link
                  href="/auth/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-teal-700 hover:bg-teal-50"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/signup"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-md text-base font-medium bg-teal-700 text-white hover:bg-teal-800"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
