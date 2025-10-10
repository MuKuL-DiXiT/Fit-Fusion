# FitFusion Backend API Routes

## Authentication Routes (`/api/auth`)
- `POST /signup` - Register new user (supports both regular users and suppliers)
- `POST /login` - User login with email/username
- `POST /logout` - User logout (requires auth)
- `GET /profile` - Get user profile (requires auth)
- `PUT /profile` - Update user profile (requires auth)
- `GET /check` - Check authentication status (requires auth)
- `GET /health` - Auth service health check

## Health Tracking Routes (`/api/health`)
- `GET /food-logs` - Get user's food logs (requires auth)
- `POST /food-logs` - Add food log entry (requires auth)
- `GET /exercise-logs` - Get user's exercise logs (requires auth)
- `POST /exercise-logs` - Add exercise log entry (requires auth)
- `GET /daily-summary` - Get daily health summary (requires auth)

## Diet Plans Routes (`/api/diet-plans`)
- `GET /` - Get all user's diet plans (requires auth)
- `GET /recent` - Get recent diet plans (last 3) (requires auth)
- `GET /:planId` - Get specific diet plan with items (requires auth)
- `POST /` - Create new diet plan (requires auth)
- `PUT /:planId` - Update diet plan (requires auth)
- `DELETE /:planId` - Delete diet plan (requires auth)
- `POST /:planId/items` - Add item to diet plan (requires auth)
- `DELETE /:planId/items/:itemId` - Remove item from diet plan (requires auth)
- `POST /generate-ai` - Generate AI diet plan with Gemini (requires auth)

## Products Routes (`/api/products`)
- `GET /` - Get all products with filtering/pagination
- `GET /:productId` - Get single product with reviews
- `GET /categories/list` - Get all categories
- `POST /:productId/reviews` - Add product review (requires auth)

## Orders & Cart Routes (`/api/orders`)
### Cart Management
- `GET /cart` - Get user's cart (requires auth)
- `POST /cart/items` - Add item to cart (requires auth)
- `PUT /cart/items/:itemId` - Update cart item quantity (requires auth)
- `DELETE /cart/items/:itemId` - Remove item from cart (requires auth)

### Order Management
- `POST /place-order` - Convert cart to order (requires auth)
- `GET /` - Get user's orders with optional status filter (requires auth)
- `GET /:orderId` - Get specific order details (requires auth)
- `PUT /:orderId/status` - Update order status (requires auth)

## Database Schema Features
- **User Management**: Users with roles (user/supplier), profile management
- **Product Catalog**: Products, categories, suppliers, reviews, discounts
- **Order System**: Cart functionality, order lifecycle, inventory management
- **Health Tracking**: Food logs, exercise logs, BMI records, goals
- **Diet Planning**: Custom plans, AI-generated plans, meal tracking
- **Authentication**: JWT tokens, HTTP-only cookies, secure sessions

## Order Status Flow
1. **Cart** - Items added to cart
2. **Pending** - Order placed, payment processing
3. **Shipped** - Order dispatched
4. **Delivered** - Order completed
5. **Cancelled** - Order cancelled

## AI Features
- **Gemini Integration**: AI-powered diet plan generation
- **Personalization**: Based on user goals, preferences, restrictions
- **Fallback System**: Sample plans when AI is unavailable
- **Database Storage**: AI-generated plans stored for future reference

## Security Features
- **JWT Authentication**: Secure token-based auth
- **HTTP-only Cookies**: Prevent XSS attacks
- **Input Validation**: Comprehensive validation middleware
- **CORS Configuration**: Proper cross-origin setup
- **SQL Injection Protection**: Parameterized queries
- **Role-based Access**: Different access levels for users/suppliers

## Frontend Integration
- **TypeScript Services**: Complete API client services
- **Error Handling**: Comprehensive error management
- **Loading States**: Proper UX feedback
- **Real-time Updates**: Cart and order status sync
- **Responsive Design**: Mobile-friendly interface