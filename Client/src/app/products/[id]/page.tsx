'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ShoppingCartIcon, ArrowLeftIcon, StarIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarSolid } from '@heroicons/react/24/solid';
import { useUserStore } from '@/lib/store/userStore';
import  { productService }  from '@/lib/api/products';

import { orderService } from '@/lib/api/orders';

export default function ProductPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useUserStore();

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState('');
  const [addingToCart, setAddingToCart] = useState(false);

  // Fetch product
  useEffect(() => {
    if (!id) return;
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const res = await productService.getProduct(Number(id));
        if (res.success && res.product) {
          setProduct(res.product);
        } else {
          setError('Product not found');
        }
      } catch (err) {
        console.error('Failed to load product:', err);
        setError('Failed to load product');
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  const renderStars = (rating: number) => {
    const stars = [];
    const full = Math.floor(rating);
    for (let i = 0; i < 5; i++) {
      stars.push(
        i < full ? (
          <StarSolid key={i} className="h-5 w-5 text-yellow-400" />
        ) : (
          <StarIcon key={i} className="h-5 w-5 text-gray-300" />
        )
      );
    }
    return <div className="flex">{stars}</div>;
  };

  const handleAddToCart = async () => {
    if (!user) {
      alert('Please login to add items to cart.');
      router.push('/auth/login');
      return;
    }
    
    if (addingToCart) return; // Prevent double clicks
    
    try {
      setAddingToCart(true);
      console.log('User:', user);
      console.log('Adding to cart:', { product_id: product.product_id, quantity });
      
      const res = await orderService.addToCart(product.product_id, quantity);
      console.log('Add to cart response:', res);
      
      if (res.success) {
        alert('Product added to cart! Check your cart page to view items.');
      } else {
        alert(res.message || 'Failed to add to cart');
      }
    } catch (err) {
      console.error('Error adding to cart:', err);
      alert(`Error while adding to cart: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setAddingToCart(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (error) return <div className="min-h-screen flex items-center justify-center text-red-500">{error}</div>;
  if (!product) return <div className="min-h-screen flex items-center justify-center">No product found</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
  <button onClick={() => router.back()} className="flex items-center text-teal-700 mb-6">
        <ArrowLeftIcon className="h-5 w-5 mr-1" /> Back
      </button>

      <div className="max-w-5xl mx-auto bg-white p-6 rounded-lg shadow-md grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <Image
            src={`https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=500&h=500&fit=crop&q=80`}
            alt={product.product_name}
            width={500}
            height={500}
            className="rounded-lg object-cover w-full"
          />
        </div>

        <div>
          <h1 className="text-3xl font-bold text-gray-900">{product.product_name}</h1>
          <p className="text-gray-600 mt-2">{product.category_name}</p>

          <div className="flex items-center mt-3 space-x-2">
            {renderStars(product.avg_rating || 0)}
            <span className="text-gray-600">({product.review_count || 0} reviews)</span>
          </div>

          <p className="text-gray-700 mt-4">{product.description}</p>

          <div className="mt-4 flex items-center space-x-4">
            <span className="text-3xl font-bold text-gray-900">₹{product.price}</span>
            <span className={`text-sm ${product.stock_quantity > 0 ? 'text-teal-700' : 'text-red-600'}`}>
              {product.stock_quantity > 0 ? 'In Stock' : 'Out of Stock'}
            </span>
          </div>

          {product.stock_quantity > 0 && (
            <div className="mt-6 space-y-3">
              <div className="flex items-center space-x-3">
                <span className='text-teal-700'>Quantity:</span>
                <div className="flex border rounded-md">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-3 py-1 text-black/70 hover:bg-gray-100"
                  >
                    -
                  </button>
                  <span className="px-4 py-1 text-black border-x">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="px-3 py-1 text-black/70 hover:bg-gray-100"
                  >
                    +
                  </button>
                </div>
              </div>

              <button
                onClick={handleAddToCart}
                disabled={addingToCart}
                className={`w-full py-3 rounded-md flex items-center justify-center transition ${
                  addingToCart 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-teal-700 hover:bg-teal-800'
                } text-white`}
              >
                <ShoppingCartIcon className="h-5 w-5 mr-2" />
                {addingToCart ? 'Adding...' : 'Add to Cart'}
              </button>
            </div>
          )}

          {!user && (
            <p className="mt-4 text-blue-600">
              <Link href="/auth/login" className="underline">Sign in</Link> to add items to your cart
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
