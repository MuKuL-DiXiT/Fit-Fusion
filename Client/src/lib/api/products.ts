const API_BASE_URL = 'http://localhost:3001/api';

export interface Product {
  product_id: number;
  product_name: string;
  description?: string;
  price: number;
  category_id?: number;
  category_name?: string;
  supplier_id?: number;
  supplier_name?: string;
  avg_rating?: number;
  review_count?: number;
  stock_quantity?: number;
}

export interface ProductsResponse {
  success: boolean;
  products: Product[];
}

export interface ProductDetailResponse {
  success: boolean;
  product: Product;
  reviews?: any[];
}

export const productService = {
  async getProducts(): Promise<ProductsResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/products`);
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
  },

  async getProductById(productId: string | number): Promise<ProductDetailResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/products/${productId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch product');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching product:', error);
      throw error;
    }
  },

  // Alias for getProductById
  async getProduct(productId: string | number): Promise<ProductDetailResponse> {
    return this.getProductById(productId);
  },
};
