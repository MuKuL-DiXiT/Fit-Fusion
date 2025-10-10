const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface Product {
  product_id: number;
  product_name: string;
  description?: string;
  price: number;
  stock_quantity: number;
  category_name?: string;
  supplier_name?: string;
  avg_rating: number;
  review_count: number;
  created_at: string;
  updated_at: string;
}

export interface Category {
  category_id: number;
  category_name: string;
  description?: string;
}

export interface Review {
  review_id: number;
  user_id: number;
  product_id: number;
  rating: number;
  comment?: string;
  username: string;
  reviewed_at: string;
}

export interface ProductFilters {
  category?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  page?: number;
  limit?: number;
  minPrice?: number;
  maxPrice?: number;
}

class ProductService {
  private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
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
        throw new Error(data.message || 'Request failed');
      }
      
      return data;
    } catch (error) {
      console.error('Product API request failed:', error);
      throw error;
    }
  }

  async getProducts(filters?: ProductFilters): Promise<{
    success: boolean;
    products: Product[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalProducts: number;
      limit: number;
    };
    message?: string;
  }> {
    const queryParams = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
    }

    const queryString = queryParams.toString();
    const endpoint = `/api/products${queryString ? `?${queryString}` : ''}`;
    
    return this.makeRequest(endpoint);
  }

  async getProduct(productId: number): Promise<{
    success: boolean;
    product: Product;
    reviews: Review[];
    message?: string;
  }> {
    return this.makeRequest(`/api/products/${productId}`);
  }

  async getCategories(): Promise<{
    success: boolean;
    categories: Category[];
    message?: string;
  }> {
    return this.makeRequest('/api/products/categories/list');
  }

  async addReview(productId: number, rating: number, comment?: string): Promise<{
    success: boolean;
    review: Review;
    message?: string;
  }> {
    return this.makeRequest(`/api/products/${productId}/reviews`, {
      method: 'POST',
      body: JSON.stringify({ rating, comment }),
    });
  }
}

export const productService = new ProductService();