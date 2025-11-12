'use client';
import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  StarIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

interface Product {
  product_id: number;
  product_name: string;
  description?: string;
  price: number;
  category_id?: number;
  category_name?: string;
  avg_rating?: number;
  review_count?: number;
  stock_quantity?: number;
}

export default function ProductsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Products');
  const [priceRange, setPriceRange] = useState([0, 50000]);
  const [sortBy, setSortBy] = useState('name');
  const [showFilters, setShowFilters] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch products from localhost:3001
  useEffect(() => {
    let cancelled = false;
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:3001/api/products');
        
        if (!response.ok) {
          throw new Error('Failed to fetch products');
        }
        
        const data = await response.json();
        
        if (!cancelled && data.success && data.products) {
          // Convert price strings to numbers
          const productsWithNumbers = data.products.map((p: any) => ({
            ...p,
            price: parseFloat(p.price) || 0,
            avg_rating: parseFloat(p.avg_rating) || 0,
            review_count: parseInt(p.review_count) || 0,
            stock_quantity: parseInt(p.stock_quantity) || 0,
          }));
          setProducts(productsWithNumbers);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Failed to fetch products', err);
          setError('Failed to load products. Please make sure the server is running.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };
    
    fetchProducts();
    
    return () => {
      cancelled = true;
    };
  }, []);

  // Get unique categories from products
  const productCategories = useMemo(() => {
    const cats = Array.from(new Set(products.map((p) => p.category_name).filter(Boolean)));
    return ['All Products', ...cats.sort()];
  }, [products]);

  // Get max price for price range filter
  const maxPrice = useMemo(() => {
    if (products.length === 0) return 50000;
    return Math.max(...products.map(p => p.price));
  }, [products]);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let filtered = products.filter((p) => {
      // Search filter
      const matchesSearch =
        p.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.description?.toLowerCase() || '').includes(searchQuery.toLowerCase());
      
      // Category filter
      const matchesCategory =
        selectedCategory === 'All Products' || p.category_name === selectedCategory;
      
      // Price range filter
      const matchesPrice = p.price >= priceRange[0] && p.price <= priceRange[1];
      
      return matchesSearch && matchesCategory && matchesPrice;
    });

    // Sort products
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return a.price - b.price;
        case 'price-high':
          return b.price - a.price;
        case 'rating':
          return (b.avg_rating || 0) - (a.avg_rating || 0);
        default:
          return a.product_name.localeCompare(b.product_name);
      }
    });

    return filtered;
  }, [products, searchQuery, selectedCategory, priceRange, sortBy]);

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        i <= rating ? (
          <StarIconSolid key={i} className="h-4 w-4 text-yellow-400" />
        ) : (
          <StarIcon key={i} className="h-4 w-4 text-gray-300" />
        )
      );
    }
    return stars;
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl text-teal-700 font-bold mb-6">All Products</h1>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-10">
            <p className="text-gray-600">Loading products...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Filters */}
        {!loading && !error && (
          <>
            <div className="bg-white text-black border p-4 rounded-md mb-6 space-y-4">
              {/* Search and Category Row */}
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[200px] relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border rounded-md focus:ring-teal-600 focus:border-teal-600"
                  />
                </div>

                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="border rounded-md px-3 py-2 focus:ring-teal-600 focus:border-teal-600"
                >
                  {productCategories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="border rounded-md text-gray-600 px-3 py-2 focus:ring-teal-600 focus:border-teal-600"
                >
                  <option value="name">Sort by Name</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="rating">Rating</option>
                </select>

                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center border px-3 py-2 rounded-md hover:bg-gray-50 transition"
                >
                  <FunnelIcon className="h-5 w-5 mr-1" /> 
                  {showFilters ? 'Hide' : 'Show'} Price Filter
                </button>
              </div>

              {/* Price Range Filter */}
              {showFilters && (
                <div className="border-t pt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price Range: ₹{priceRange[0]} - ₹{priceRange[1]}
                  </label>
                  <div className="flex gap-4 items-center">
                    <div className="flex-1">
                      <label className="text-xs text-gray-600">Min Price</label>
                      <input
                        type="number"
                        min="0"
                        max={maxPrice}
                        value={priceRange[0]}
                        onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
                        className="w-full border rounded px-2 py-1 mt-1"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-xs text-gray-600">Max Price</label>
                      <input
                        type="number"
                        min="0"
                        max={maxPrice}
                        value={priceRange[1]}
                        onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                        className="w-full border rounded px-2 py-1 mt-1"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Results Count */}
              <div className="text-sm text-gray-600 border-t pt-2">
                Showing {filteredProducts.length} of {products.length} products
              </div>
            </div>

            {/* Product Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map((p) => (
                <div
                  key={p.product_id}
                  className="bg-white rounded-lg shadow-sm border hover:shadow-md transition"
                >
                  <Image
                    src={`https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400&h=300&fit=crop&q=80`}
                    alt={p.product_name}
                    width={400}
                    height={300}
                    className="w-full h-48 object-cover"
                  />
                  <div className="p-4">
                    <h3 className="font-semibold text-lg text-gray-800 line-clamp-2 mb-1">
                      {p.product_name}
                    </h3>
                    {p.category_name && (
                      <p className="text-xs text-gray-500 mb-2">{p.category_name}</p>
                    )}
                    <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                      {p.description || 'No description available'}
                    </p>
                    <div className="flex items-center mb-2">
                      {renderStars(Math.round(p.avg_rating || 0))}
                      <span className="text-xs text-gray-500 ml-2">
                        ({p.review_count || 0} reviews)
                      </span>
                    </div>
                    <p className="font-bold text-lg text-gray-900 mb-3">₹{p.price.toFixed(2)}</p>
                    {p.stock_quantity !== undefined && (
                      <p className="text-xs text-gray-500 mb-2">
                        {p.stock_quantity > 0 ? `${p.stock_quantity} in stock` : 'Out of stock'}
                      </p>
                    )}
                    <Link
                      href={`/products/${p.product_id}`}
                      className="block text-center w-full py-2 bg-teal-700 text-white rounded-md hover:bg-teal-800 transition"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {/* No results */}
            {filteredProducts.length === 0 && !loading && (
              <div className="text-center py-10">
                <p className="text-gray-500 text-lg">No products found matching your criteria.</p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('All Products');
                    setPriceRange([0, maxPrice]);
                  }}
                  className="mt-4 px-4 py-2 bg-teal-700 text-white rounded-md hover:bg-teal-800 transition"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
