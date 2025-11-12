const API_BASE_URL = 'http://localhost:3001';

export interface Order {
  order_id: number;
  user_id: number;
  total_amount: number;
  order_date: string;
  status: 'Cart' | 'Pending' | 'Shipped' | 'Delivered' | 'Cancelled';
  shipping_address?: string;
  item_count?: number;
}

export interface OrderItem {
  order_item_id: number;
  order_id: number;
  product_id: number;
  quantity: number;
  price_at_purchase: number;
  product_name?: string;
  description?: string;
  current_price?: number;
}

export interface Cart {
  order_id: number;
  user_id: number;
  total_amount: number;
  status: 'Cart';
  items: OrderItem[];
}

export interface PlaceOrderData {
  shippingAddress: string;
}

class OrderService {
  private async makeRequest<T = unknown>(endpoint: string, options: RequestInit = {}): Promise<T> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      const data = await response.json();
      
      if (!response.ok) {
        const msg = data && typeof data === 'object' && 'message' in (data as Record<string, unknown>) ? String((data as Record<string, unknown>).message) : 'Request failed';
        throw new Error(msg);
      }
      
      return data as T;
    } catch (error) {
      console.error('Order API request failed:', error);
      throw error;
    }
  }

  // Cart management
  async getCart(): Promise<{
    success: boolean;
    cart: Cart;
    message?: string;
  }> {
    return this.makeRequest('/api/orders/cart');
  }

  async addToCart(productId: number, quantity: number): Promise<{
    success: boolean;
    message?: string;
  }> {
    return this.makeRequest('/api/orders/cart/items', {
      method: 'POST',
      body: JSON.stringify({ productId, quantity }),
    });
  }

  async updateCartItem(itemId: number, quantity: number): Promise<{
    success: boolean;
    message?: string;
  }> {
    return this.makeRequest(`/api/orders/cart/items/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify({ quantity }),
    });
  }

  async removeFromCart(itemId: number): Promise<{
    success: boolean;
    message?: string;
  }> {
    return this.makeRequest(`/api/orders/cart/items/${itemId}`, {
      method: 'DELETE',
    });
  }

  // Order management
  async placeOrder(orderData: PlaceOrderData): Promise<{
    success: boolean;
    orderId: number;
    message?: string;
  }> {
    return this.makeRequest('/api/orders/place-order', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  }

  async getOrders(status?: string): Promise<{
    success: boolean;
    orders: Order[];
    message?: string;
  }> {
    const queryParams = status ? `?status=${status}` : '';
    return this.makeRequest(`/api/orders${queryParams}`);
  }

  async getOrder(orderId: number): Promise<{
    success: boolean;
    order: Order;
    items: OrderItem[];
    message?: string;
  }> {
    return this.makeRequest(`/api/orders/${orderId}`);
  }

  async updateOrderStatus(orderId: number, status: string): Promise<{
    success: boolean;
    order: Order;
    message?: string;
  }> {
    return this.makeRequest(`/api/orders/${orderId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  async completeOrder(orderId: number): Promise<{
    success: boolean;
    message?: string;
  }> {
    return this.makeRequest(`/api/orders/${orderId}/complete`, {
      method: 'PUT',
    });
  }
}

export const orderService = new OrderService();