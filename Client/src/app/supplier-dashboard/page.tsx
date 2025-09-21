"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/lib/store/userStore";

export default function SupplierDashboard() {
  const { user } = useUserStore();
  const router = useRouter();

  useEffect(() => {
    if (!user || user.role !== "supplier") {
      router.replace("/"); // redirect non-suppliers
    }
  }, [user, router]);

  // Inventory management state
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch("/api/supplier-inventory");
        const data = await res.json();
        setProducts(data);
      } catch (e) {
        setError("Failed to load inventory");
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
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

        <div className="rounded-lg bg-white p-6 shadow-sm border-l-4 border-green-500">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-md bg-green-100 flex items-center justify-center">
                <i className="fas fa-check-circle text-green-600"></i>
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
        <div className="border-b border-gray-200 px-6 py-4">
          <h3 className="text-lg font-semibold text-gray-800">
            Inventory Management
          </h3>
          <p className="text-sm text-gray-600">
            Manage your product inventory and stock levels
          </p>
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
                  className="bg-green-600 h-2 rounded-full"
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
    </div>
  );
}
