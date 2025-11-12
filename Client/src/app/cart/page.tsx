'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { orderService } from '@/lib/api/orders';
import { ShoppingBagIcon, ArrowLeftIcon, TrashIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import Link from 'next/link';
import type { Cart } from '@/lib/api/orders';

export default function CartPage() {
  const router = useRouter();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showPayment, setShowPayment] = useState(false);
  const [paying, setPaying] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('');

  useEffect(() => {
    const fetchCart = async () => {
      setLoading(true);
      try {
        const res = await orderService.getCart();
        if (res.success && res.cart) {
          setCart(res.cart as Cart);
        } else {
          setError(res.message || 'Failed to load cart');
        }
      } catch (err) {
        setError('Failed to load cart');
      } finally {
        setLoading(false);
      }
    };
    fetchCart();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="text-gray-500 text-lg">Loading cart...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-500">
        {error}
      </div>
    );
  }

  const handleRemove = async (order_item_id: number) => {
    if (!cart) return;
    try {
      const res = await orderService.removeFromCart(order_item_id);
      if (res.success) {
        setCart({
          ...cart,
          items: cart.items.filter((item: any) => item.order_item_id !== order_item_id)
        });
      } else {
        alert(res.message || 'Failed to remove item');
      }
    } catch (err) {
      alert('Error removing item from cart');
    }
  };

  // Update cart item quantity or remove if zero
  const handleUpdateQuantity = async (order_item_id: number, newQuantity: number) => {
    if (!cart) return;
    if (newQuantity < 1) {
      // Remove item if quantity is zero
      await handleRemove(order_item_id);
      return;
    }
    try {
      const res = await orderService.updateCartItem(order_item_id, newQuantity);
      if (res.success) {
        setCart({
          ...cart,
          items: cart.items.map((item: any) =>
            item.order_item_id === order_item_id
              ? { ...item, quantity: newQuantity }
              : item
          )
        });
      } else {
        alert(res.message || 'Failed to update quantity');
      }
    } catch (err) {
      alert('Error updating item quantity');
    }
  };

  const handleOrderAndPay = async () => {
    setShowPayment(true);
  };

  const handleConfirmPayment = async () => {
    if (!cart) return;
    setPaying(true);
    try {
      // Call backend to update order status to 'Completed'
      const res = await orderService.completeOrder(cart.order_id);
      if (res.success) {
        setCart(null); // Remove cart from UI
        setShowPayment(false);
        alert('Payment successful! Order placed.');
      } else {
        alert(res.message || 'Failed to complete order');
      }
    } catch (err) {
      alert('Error completing order');
    } finally {
      setPaying(false);
    }
  };

  if (!cart || !cart.items || cart.items.length === 0) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <div className="max-w-2xl mx-auto px-4 py-12">
          <div className="flex items-center mb-8">
            <button
              onClick={() => router.back()}
              className="flex items-center text-teal-700 hover:text-teal-800 mr-4"
            >
              <ArrowLeftIcon className="h-5 w-5 mr-1" />
              Back
            </button>
            <h1 className="text-3xl font-bold text-gray-900">Your Cart</h1>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <ShoppingBagIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Your cart is empty</h2>
            <p className="text-gray-600 mb-6">Looks like you haven't added anything to your cart yet.</p>
            <Link href="/products" className="bg-teal-700 text-white px-6 py-3 rounded-md hover:bg-teal-800 transition-colors font-medium">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Calculate subtotal
  const subtotal = cart.items.reduce((sum: number, item: any) => sum + (parseFloat(item.price_at_purchase) * item.quantity), 0);

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="flex items-center mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center text-teal-700 hover:text-teal-800 mr-4"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-1" />
            Back
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Your Cart</h1>
          <span className="ml-2 text-gray-600">({cart.items.length} items)</span>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Cart Items</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {cart.items.map((item: any) => (
              <div key={item.order_item_id} className="p-6 flex items-center gap-6">
                <Image
                  src={`https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=80&h=80&fit=crop&q=80`}
                  alt={item.product_name}
                  width={80}
                  height={80}
                  className="rounded-md object-cover"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-medium text-gray-900 mb-1">{item.product_name}</h3>
                  <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                  <p className="text-lg font-semibold text-teal-700">₹{parseFloat(item.price_at_purchase).toFixed(2)}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      className="px-2 py-1 text-black/70 border rounded text-lg"
                      onClick={() => handleUpdateQuantity(item.order_item_id, item.quantity - 1)}
                    >
                      -
                    </button>
                    <span className="px-3 text-black text-base">{item.quantity}</span>
                    <button
                      className="px-2 py-1 text-black/70 border rounded text-lg"
                      onClick={() => handleUpdateQuantity(item.order_item_id, item.quantity + 1)}
                    >
                      +
                    </button>
                  </div>
                </div>
                <button className="text-red-500 hover:text-red-700"
                  onClick={() => handleRemove(item.order_item_id)}
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              </div>
            ))}
          </div>
          <div className="p-6 border-t border-gray-200 flex justify-between items-center">
            <span className="font-semibold text-teal-700 text-lg">Subtotal:</span>
            <span className="text-lg text-gray-900 font-bold">₹{subtotal.toFixed(2)}</span>
          </div>
          <div className="p-6 flex justify-end">
            <button
              className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 font-medium"
              onClick={handleOrderAndPay}
            >
              Order & Pay
            </button>
          </div>
          {/* Fake payment modal */}
          {showPayment && (
            <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
              <div className="bg-white text-black rounded-lg shadow-lg p-8 max-w-md w-full">
                <h2 className="text-2xl font-bold mb-4">Payment</h2>
                <p className="mb-4">Choose a payment method:</p>
                <div className="mb-6 flex gap-4">
                  <button 
                    className={`px-4 py-2 rounded ${paymentMethod === 'Credit Card' ? 'bg-teal-600 text-white' : 'bg-gray-100'}`}
                    onClick={() => setPaymentMethod('Credit Card')}
                  >
                    Credit Card
                  </button>
                  <button 
                    className={`px-4 py-2 rounded ${paymentMethod === 'UPI' ? 'bg-teal-600 text-white' : 'bg-gray-100'}`}
                    onClick={() => setPaymentMethod('UPI')}
                  >
                    UPI
                  </button>
                  <button 
                    className={`px-4 py-2 rounded ${paymentMethod === 'Net Banking' ? 'bg-teal-600 text-white' : 'bg-gray-100'}`}
                    onClick={() => setPaymentMethod('Net Banking')}
                  >
                    Net Banking
                  </button>
                </div>
                <button
                  className="bg-teal-700 text-white px-6 py-2 rounded-md hover:bg-teal-800 font-medium w-full disabled:bg-gray-400"
                  onClick={handleConfirmPayment}
                  disabled={paying || !paymentMethod}
                >
                  {paying ? 'Processing...' : 'Pay & Place Order'}
                </button>
                <button
                  className="mt-4 w-full text-gray-500 hover:text-gray-700"
                  onClick={() => {
                    setShowPayment(false);
                    setPaymentMethod('');
                  }}
                  disabled={paying}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
