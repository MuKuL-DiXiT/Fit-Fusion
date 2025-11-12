"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/lib/store/userStore";

export default function SupplierDashboard() {
  const { user, isAuthenticated, isLoading, checkAuth } = useUserStore();
  setTimeout(() => {}, 2000);
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await checkAuth();
      } finally {
        if (!cancelled) setAuthChecked(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [checkAuth]);

  useEffect(() => {

    if ( !user || user.role != 'supplier') {
      router.replace("/");
    }
  }, [authChecked, isAuthenticated, user, router]);

  // Inventory management state
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [newProduct, setNewProduct] = useState({
    product_name: '',
    description: '',
    price: '',
    stock_quantity: '',
    category_id: ''
  });

  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch("http://localhost:3001/api/products/supplier/mine", {
          credentials: "include",
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.message || "Failed to load inventory");
        }
        const data = await res.json();
        if (data.success) {
          const mapped = (data.products || []).map((p: any) => ({
            id: String(p.product_id),
            name: p.product_name,
            stock_quantity: p.stock_quantity ?? 0,
            inStock: (p.stock_quantity ?? 0) > 0,
          }));
          setProducts(mapped);
        } else {
          throw new Error(data.message || "Failed to load inventory");
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load inventory");
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, [authChecked, isAuthenticated, user]);

  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await fetch("http://localhost:3001/api/products/categories/list");
        const data = await res.json();
        if (data.success) {
          setCategories(data.categories);
        }
      } catch (e) {
        console.error("Failed to load categories");
      }
    }
    fetchCategories();
  }, []);

  const handleStockChange = (id: string, value: number) => {
    setProducts((prev: any) =>
      prev.map((p: any) => (p.id === id ? { ...p, stock_quantity: value } : p))
    );
  };

  const handleInStockChange = (id: string, value: boolean) => {
    setProducts((prev: any) =>
      prev.map((p: any) => (p.id === id ? { ...p, inStock: value } : p))
    );
  };

  const handleUpdate = async (id: string) => {
    setUpdating(id);
    const product = products.find((p: any) => p.id === id);
    if (!product) {
      setUpdating(null);
      setError("Product not found");
      return;
    }
    try {
      await fetch("/api/supplier-inventory", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          stock_quantity: product.stock_quantity,
          inStock: product.inStock,
        }),
      });
    } catch (e) {
      setError("Failed to update product");
    } finally {
      setUpdating(null);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("http://localhost:3001/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          product_name: newProduct.product_name,
          description: newProduct.description,
          price: parseFloat(newProduct.price),
          stock_quantity: parseInt(newProduct.stock_quantity) || 0,
          category_id: parseInt(newProduct.category_id)
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert("Product added successfully!");
        setShowAddModal(false);
        setNewProduct({
          product_name: '',
          description: '',
          price: '',
          stock_quantity: '',
          category_id: ''
        });
        // Refresh products list
        window.location.reload();
      } else {
        alert(data.message || "Failed to add product");
      }
    } catch (e) {
      alert("Error adding product");
    }
  };

  if (!authChecked || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      {/* Stats Overview */}
      <div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg bg-white p-6 shadow-sm border-l-4 border-primary-500">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-md bg-primary-100 flex items-center justify-center">
                <i className="fas fa-box text-primary-600"></i>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">
                Total Products
              </p>
              <p className="text-2xl font-semibold text-gray-900">
                {products.length}
              </p>
            </div>
          </div>
        </div>

  <div className="rounded-lg bg-white p-6 shadow-sm border-l-4 border-teal-600">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-md bg-teal-100 flex items-center justify-center">
                <i className="fas fa-check-circle text-teal-700"></i>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">In Stock</p>
              <p className="text-2xl font-semibold text-gray-900">
                {products.filter((p) => p.inStock).length}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow-sm border-l-4 border-yellow-500">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-md bg-yellow-100 flex items-center justify-center">
                <i className="fas fa-exclamation-triangle text-yellow-600"></i>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Low Stock</p>
              <p className="text-2xl font-semibold text-gray-900">
                {products.filter((p) => p.stock_quantity < 10).length}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow-sm border-l-4 border-blue-500">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-md bg-blue-100 flex items-center justify-center">
                <i className="fas fa-sync-alt text-blue-600"></i>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Updating</p>
              <p className="text-2xl font-semibold text-gray-900">
                {updating ? 1 : 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Inventory Management Section */}
      <div className="rounded-xl bg-white shadow-sm overflow-hidden">
        <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">
              Inventory Management
            </h3>
            <p className="text-sm text-gray-600">
              Manage your product inventory and stock levels
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-teal-700 text-white px-4 py-2 rounded-md hover:bg-teal-800 transition flex items-center gap-2"
          >
            <span>+</span> Add Product
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
          ) : error ? (
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <i className="fas fa-exclamation-circle text-red-400"></i>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">{error}</h3>
                </div>
              </div>
            </div>
          ) : (
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6"
                    >
                      Product
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      Stock
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      In Stock
                    </th>
                    <th
                      scope="col"
                      className="relative py-3.5 pl-3 pr-4 sm:pr-6"
                    >
                      <span className="sr-only">Action</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {products.map((p: any) => (
                    <tr
                      key={p.id}
                      className={updating === p.id ? "opacity-75" : ""}
                    >
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                        {p.name}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        <input
                          type="number"
                          min={0}
                          value={p.stock_quantity}
                          onChange={(e) =>
                            handleStockChange(p.id, Number(e.target.value))
                          }
                          className="block w-24 rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        />
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={p.inStock}
                            onChange={(e) =>
                              handleInStockChange(p.id, e.target.checked)
                            }
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                        </label>
                      </td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                        <button
                          className="inline-flex items-center rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 disabled:opacity-75"
                          disabled={updating === p.id}
                          onClick={() => handleUpdate(p.id)}
                        >
                          {updating === p.id ? (
                            <>
                              <i className="fas fa-spinner fa-spin mr-2"></i>
                              Updating...
                            </>
                          ) : (
                            <>
                              <i className="fas fa-pen-to-square mr-2"></i>
                              Update
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Additional Dashboard Content */}
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Quick Stats Card */}
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Inventory Summary
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">
                  In Stock Products
                </span>
                <span className="text-sm font-medium text-gray-700">
                  {products.length > 0
                    ? `${Math.round(
                        (products.filter((p) => p.inStock).length /
                          products.length) *
                          100
                      )}%`
                    : "0%"}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-teal-700 h-2 rounded-full"
                  style={{
                    width:
                      products.length > 0
                        ? `${
                            (products.filter((p) => p.inStock).length /
                              products.length) *
                            100
                          }%`
                        : "0%",
                  }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">
                  Low Stock Products
                </span>
                <span className="text-sm font-medium text-gray-700">
                  {products.length > 0
                    ? `${Math.round(
                        (products.filter((p) => p.stock_quantity < 10).length /
                          products.length) *
                          100
                      )}%`
                    : "0%"}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-yellow-500 h-2 rounded-full"
                  style={{
                    width:
                      products.length > 0
                        ? `${
                            (products.filter((p) => p.stock_quantity < 10)
                              .length /
                              products.length) *
                            100
                          }%`
                        : "0%",
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity Card */}
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Recent Activity
          </h3>
          <ul className="divide-y divide-gray-200">
            <li className="py-3">
              <div className="flex space-x-3">
                <div className="flex-shrink-0">
                  <i className="fas fa-user-circle text-primary-600 text-xl"></i>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    You logged in
                  </p>
                  <p className="text-sm text-gray-500">Just now</p>
                </div>
              </div>
            </li>
            <li className="py-3">
              <div className="flex space-x-3">
                <div className="flex-shrink-0">
                  <i className="fas fa-box text-primary-600 text-xl"></i>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    Inventory loaded
                  </p>
                  <p className="text-sm text-gray-500">
                    {products.length} products
                  </p>
                </div>
              </div>
            </li>
          </ul>
        </div>
      </div>

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold mb-4">Add New Product</h2>
            <form onSubmit={handleAddProduct} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  value={newProduct.product_name}
                  onChange={(e) => setNewProduct({...newProduct, product_name: e.target.value})}
                  className="w-full border rounded-md px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                  className="w-full border rounded-md px-3 py-2"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price *
                </label>
                <input
                  type="number"
                  required
                  step="0.01"
                  value={newProduct.price}
                  onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
                  className="w-full border rounded-md px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Stock Quantity
                </label>
                <input
                  type="number"
                  value={newProduct.stock_quantity}
                  onChange={(e) => setNewProduct({...newProduct, stock_quantity: e.target.value})}
                  className="w-full border rounded-md px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category *
                </label>
                <select
                  required
                  value={newProduct.category_id}
                  onChange={(e) => setNewProduct({...newProduct, category_id: e.target.value})}
                  className="w-full border rounded-md px-3 py-2"
                >
                  <option value="">Select Category</option>
                  {categories.map((cat) => (
                    <option key={cat.category_id} value={cat.category_id}>
                      {cat.category_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="submit"
                  className="flex-1 bg-teal-700 text-white px-4 py-2 rounded-md hover:bg-teal-800"
                >
                  Add Product
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
