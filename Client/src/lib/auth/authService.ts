const API_BASE_URL = "http://localhost:3001";

interface User {
  userId: number;
  username: string;
  email: string;
  phone_number?: string;
  address?: string;
  role: string;
  created_at: string;
}

interface AuthResponse {
  success: boolean;
  message: string;
  user?: User;
}

interface SignupData {
  username: string;
  email: string;
  password: string;
  role?: string;
  phone_number?: string;
  address?: string;
}

interface LoginData {
  identifier: string;
  password: string;
}

class AuthService {
  private async makeRequest<T = unknown>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
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
      console.error("API request failed:", error);
      throw error;
    }
  }

  async signup(signupData: SignupData): Promise<AuthResponse> {
    return this.makeRequest("/api/auth/signup", {
      method: "POST",
      body: JSON.stringify(signupData),
    });
  }

  async login(loginData: LoginData): Promise<AuthResponse> {
    return this.makeRequest("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(loginData),
    });
  }

  async logout(): Promise<{ success: boolean; message: string }> {
    return this.makeRequest("/api/auth/logout", {
      method: "POST",
    });
  }

  async getProfile(): Promise<AuthResponse> {
    return this.makeRequest("/api/auth/profile");
  }

  async updateProfile(profileData: Partial<User>): Promise<AuthResponse> {
    return this.makeRequest("/api/auth/profile", {
      method: "PUT",
      body: JSON.stringify(profileData),
    });
  }

  async checkAuth(): Promise<AuthResponse> {
    return this.makeRequest("/api/auth/check");
  }

  async isAuthenticated(): Promise<boolean> {
    try {
      const response = await this.checkAuth();
      return response.success;
    } catch {
      return false;
    }
  }
}

export const authService = new AuthService();
export type { User, AuthResponse, SignupData, LoginData };
