'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import axios from 'axios';
import { useUserStore } from '@/lib/store/userStore';
import { mockProducts, productCategories, subcategories, Product } from '@/lib/data/products';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  StarIcon,
  ShoppingCartIcon,
  HeartIcon,
  XMarkIcon,
  SparklesIcon,
  LightBulbIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

export default function ProductsPage() {
  const { addToCart, isAuthenticated, user } = useUserStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Products');
  const [selectedSubcategory, setSelectedSubcategory] = useState('');
  const [priceRange, setPriceRange] = useState([0, 50000]);
  const [sortBy, setSortBy] = useState('name');
  const [showFilters, setShowFilters] = useState(false);
  
  // AI Recommendations state
  const [aiRecommendations, setAiRecommendations] = useState<any>(null);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [showRecommendations, setShowRecommendations] = useState(true);

  const filteredProducts = useMemo(() => {
    let filtered = mockProducts.filter((product) => {
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           product.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesCategory = selectedCategory === 'All Products' || product.category === selectedCategory;
      
      const matchesSubcategory = !selectedSubcategory || product.subcategory === selectedSubcategory;
      
      const matchesPrice = product.price >= priceRange[0] && product.price <= priceRange[1];
      
      return matchesSearch && matchesCategory && matchesSubcategory && matchesPrice;
    });

    // Sort products
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return a.price - b.price;
        case 'price-high':
          return b.price - a.price;
        case 'rating':
          return b.rating - a.rating;
        case 'popularity':
          return b.reviewCount - a.reviewCount;
        default:
          return a.name.localeCompare(b.name);
      }
    });

    return filtered;
  }, [searchQuery, selectedCategory, selectedSubcategory, priceRange, sortBy]);

  const handleAddToCart = (product: Product) => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
      image: product.image,
      category: product.category,
    });
  };

  // AI Recommendations function
  const getAIRecommendations = async () => {
    if (!user) return;
    
    setLoadingRecommendations(true);
    try {
      const response = await axios.post('/api/gemini-suggestions', {
        type: 'product-recommendations',
        data: {
          recentFoods: [], // Could be fetched from health tracker
          recentExercises: [], // Could be fetched from health tracker
          currentDietPlan: null // Could be fetched from user store
        },
        userProfile: {
          goals: 'Weight loss and muscle gain',
          activityLevel: 'Moderate',
          experienceLevel: 'Intermediate',
          budgetRange: 'Moderate',
          equipment: 'Basic home gym'
        }
      });
      setAiRecommendations(response.data.suggestions);
    } catch (error) {
      console.error('Error getting AI recommendations:', error);
    } finally {
      setLoadingRecommendations(false);
    }
  };

  // Fetch AI recommendations when user is authenticated
  useEffect(() => {
    if (user && isAuthenticated) {
      getAIRecommendations();
    }
  }, [user, isAuthenticated]);

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

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Health & Fitness Products</h1>
          <p className="text-gray-600">Discover high-quality products to support your health and fitness journey</p>
        </div>

        {/* AI Recommendations Section */}
        {user && isAuthenticated && (
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-6 border border-indigo-200 mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <SparklesIcon className="h-6 w-6 text-indigo-600" />
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Recommended for You</h2>
                  <p className="text-gray-600 text-sm">AI-powered product suggestions based on your goals and activity</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={getAIRecommendations}
                  className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                >
                  Refresh
                </button>
                <button
                  onClick={() => setShowRecommendations(!showRecommendations)}
                  className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                >
                  {showRecommendations ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            {showRecommendations && (
              <div>
                {loadingRecommendations && (
                  <div className="flex items-center justify-center py-8">
                    <div className="flex items-center space-x-2 text-indigo-600">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
                      <span>Getting personalized recommendations...</span>
                    </div>
                  </div>
                )}

                {aiRecommendations && !loadingRecommendations && (
                  <div className="space-y-4">
                    {/* High Priority Recommendations */}
                    {aiRecommendations.recommendedProducts?.filter((product: any) => product.priority === 'High').length > 0 && (
                      <div>
                        <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                          <LightBulbIcon className="h-4 w-4 text-yellow-500 mr-2" />
                          High Priority for Your Goals
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {aiRecommendations.recommendedProducts
                            .filter((product: any) => product.priority === 'High')
                            .slice(0, 3)
                            .map((recommendation: any, index: number) => (
                              <div key={index} className="bg-white rounded-lg p-4 border border-indigo-100 shadow-sm">
                                <h4 className="font-semibold text-gray-900 mb-1">{recommendation.name}</h4>
                                <p className="text-sm text-gray-600 mb-2">{recommendation.reason}</p>
                                <div className="flex flex-wrap gap-1 mb-2">
                                  {recommendation.benefits?.slice(0, 2).map((benefit: string, idx: number) => (
                                    <span key={idx} className="text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded">
                                      {benefit}
                                    </span>
                                  ))}
                                </div>
                                <p className="text-xs text-gray-500">Expected: {recommendation.priceRange}</p>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* Budget Optimization */}
                    {aiRecommendations.budgetOptimization && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                        <div className="bg-white rounded-lg p-4 border border-green-200">
                          <h4 className="font-medium text-green-900 mb-2">Essential Items</h4>
                          <ul className="space-y-1">
                            {aiRecommendations.budgetOptimization.essential?.slice(0, 3).map((item: string, index: number) => (
                              <li key={index} className="text-sm text-gray-700">• {item}</li>
                            ))}
                          </ul>
                        </div>
                        <div className="bg-white rounded-lg p-4 border border-yellow-200">
                          <h4 className="font-medium text-yellow-900 mb-2">Optional Items</h4>
                          <ul className="space-y-1">
                            {aiRecommendations.budgetOptimization.optional?.slice(0, 3).map((item: string, index: number) => (
                              <li key={index} className="text-sm text-gray-700">• {item}</li>
                            ))}
                          </ul>
                        </div>
                        <div className="bg-white rounded-lg p-4 border border-blue-200">
                          <h4 className="font-medium text-blue-900 mb-2">Budget Alternatives</h4>
                          <ul className="space-y-1">
                            {aiRecommendations.budgetOptimization.alternatives?.slice(0, 3).map((item: string, index: number) => (
                              <li key={index} className="text-sm text-gray-700">• {item}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {!aiRecommendations && !loadingRecommendations && (
                  <div className="text-center py-4">
                    <p className="text-gray-600 text-sm">Click "Refresh" to get personalized product recommendations!</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-black focus:ring-green-500 focus:border-green-500"
              />
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setSelectedSubcategory('');
              }}
              className="px-4 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
            >
              {productCategories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>

            {/* Subcategory Filter */}
            {selectedCategory !== 'All Products' && subcategories[selectedCategory as keyof typeof subcategories] && (
              <select
                value={selectedSubcategory}
                onChange={(e) => setSelectedSubcategory(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
              >
                <option value="">All {selectedCategory}</option>
                {subcategories[selectedCategory as keyof typeof subcategories].map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
              </select>
            )}

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
            >
              <option value="name">Sort by Name</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="rating">Rating</option>
              <option value="popularity">Popularity</option>
            </select>

            {/* Mobile Filters Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="lg:hidden flex items-center px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              <FunnelIcon className="h-5 w-5 mr-2" />
              Filters
            </button>
          </div>

          {/* Price Range Filter */}
          <div className={`mt-4 ${showFilters ? 'block' : 'hidden lg:block'}`}>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-700">Price Range:</span>
              <input
                type="range"
                min="0"
                max="50000"
                value={priceRange[0]}
                onChange={(e) => setPriceRange([parseInt(e.target.value), priceRange[1]])}
                className="flex-1"
              />
              <span className="text-sm text-gray-700">₹{priceRange[0]} - ₹{priceRange[1]}</span>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-gray-600">
            Showing {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <div key={product.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow group">
              <div className="relative">
                <Image
                  src={product.image}
                  alt={product.name}
                  width={400}
                  height={300}
                  className="w-full h-48 object-cover"
                />
                {product.originalPrice && (
                  <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-semibold">
                    Sale
                  </div>
                )}
                <button className="absolute top-2 right-2 p-2 rounded-full bg-white/80 hover:bg-white transition-colors opacity-0 group-hover:opacity-100">
                  <HeartIcon className="h-5 w-5 text-gray-600 hover:text-red-500" />
                </button>
              </div>

              <div className="p-4">
                <div className="mb-2">
                  <span className="text-xs text-green-600 font-medium">{product.category}</span>
                  <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">{product.name}</h3>
                </div>

                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{product.description}</p>

                <div className="flex items-center mb-3">
                  <div className="flex items-center">
                    {renderStars(product.rating)}
                  </div>
                  <span className="ml-2 text-sm text-gray-600">
                    {product.rating} ({product.reviewCount})
                  </span>
                </div>

                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-bold text-gray-900">₹{product.price}</span>
                    {product.originalPrice && (
                      <span className="text-sm text-gray-500 line-through">₹{product.originalPrice}</span>
                    )}
                  </div>
                  <span className="text-xs text-gray-500">{product.brand}</span>
                </div>

                <div className="flex gap-2">
                  <Link
                    href={`/products/${product.id}`}
                    className="flex-1 text-center px-3 py-2 border border-green-600 text-green-600 rounded-md hover:bg-green-50 transition-colors text-sm font-medium"
                  >
                    View Details
                  </Link>
                  {isAuthenticated && (
                    <button
                      onClick={() => handleAddToCart(product)}
                      className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                    >
                      <ShoppingCartIcon className="h-5 w-5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* No Results */}
        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <MagnifyingGlassIcon className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-600">Try adjusting your search criteria or filters</p>
          </div>
        )}
      </div>
    </div>
  );
}
