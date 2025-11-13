-- ENUMS
CREATE TYPE order_status AS ENUM ('Cart','Pending','Shipped','Delivered','Cancelled');
CREATE TYPE payment_status AS ENUM ('Created','Paid','Failed','Refunded');
CREATE TYPE notification_type AS ENUM ('Order','Promotion','HealthTip','System');
CREATE TYPE meal_time AS ENUM ('Breakfast','Lunch','Snack','Dinner');

-- USERS
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone_number VARCHAR(15),
    address TEXT,
    role VARCHAR(20) NOT NULL DEFAULT 'user',
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

-- SUPPLIERS
CREATE TABLE suppliers (
    supplier_id SERIAL PRIMARY KEY,
    supplier_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone_number VARCHAR(15),
    address TEXT,
    created_at TIMESTAMP DEFAULT now()
);

-- CATEGORIES
CREATE TABLE categories (
    category_id SERIAL PRIMARY KEY,
    category_name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT
);

-- PRODUCTS
CREATE TABLE products (
    product_id SERIAL PRIMARY KEY,
    supplier_id INT REFERENCES suppliers(supplier_id) ON DELETE CASCADE,
    category_id INT REFERENCES categories(category_id) ON DELETE SET NULL,
    product_name VARCHAR(100) NOT NULL,
    description TEXT,
    price NUMERIC(10,2) NOT NULL,
    stock_quantity INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

-- ORDERS
CREATE TABLE orders (
    order_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
    total_amount NUMERIC(10,2) NOT NULL,
    order_date TIMESTAMP DEFAULT now(),
    status order_status DEFAULT 'Cart',
    shipping_address TEXT
);

-- ORDER ITEMS
CREATE TABLE order_items (
    order_item_id SERIAL PRIMARY KEY,
    order_id INT REFERENCES orders(order_id) ON DELETE CASCADE,
    product_id INT REFERENCES products(product_id) ON DELETE CASCADE,
    quantity INT NOT NULL,
    price_at_purchase NUMERIC(10,2) NOT NULL
);

-- PAYMENTS
CREATE TABLE payments (
    payment_id SERIAL PRIMARY KEY,
    order_id INT REFERENCES orders(order_id) ON DELETE CASCADE,
    razorpay_payment_id VARCHAR(100) UNIQUE NOT NULL,
    amount NUMERIC(10,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'INR',
    status payment_status DEFAULT 'Created',
    payment_method VARCHAR(50),
    payment_date TIMESTAMP DEFAULT now()
);

-- REVIEWS
CREATE TABLE reviews (
    review_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
    product_id INT REFERENCES products(product_id) ON DELETE CASCADE,
    rating INT CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    reviewed_at TIMESTAMP DEFAULT now()
);

-- DISCOUNTS
CREATE TABLE discounts (
    discount_id SERIAL PRIMARY KEY,
    product_id INT REFERENCES products(product_id) ON DELETE CASCADE,
    discount_percentage NUMERIC(5,2) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL
);

-- NOTIFICATIONS
CREATE TABLE notifications (
    notification_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
    type notification_type DEFAULT 'System',
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT now()
);

-- BMI RECORDS
CREATE TABLE bmi_records (
    bmi_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
    height NUMERIC(5,2) NOT NULL,
    weight NUMERIC(5,2) NOT NULL,
    bmi_value NUMERIC(5,2) NOT NULL,
    recorded_at TIMESTAMP DEFAULT now()
);

-- GOALS
CREATE TABLE goals (
    goal_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
    target_weight NUMERIC(5,2),
    calories_to_consume NUMERIC(6,2),
    calories_to_burn NUMERIC(6,2),
    deadline DATE NOT NULL,
    created_at TIMESTAMP DEFAULT now()
);

-- DIET PLANS
CREATE TABLE diet_plans (
    plan_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
    plan_name VARCHAR(100) NOT NULL,
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMP DEFAULT now()
);

-- FOOD
CREATE TABLE food (
    food_id SERIAL PRIMARY KEY,
    food_name VARCHAR(100) NOT NULL,
    calories_per_100g NUMERIC(5,2) NOT NULL,
    protein_per_100g NUMERIC(5,2),
    carbs_per_100g NUMERIC(5,2),
    fats_per_100g NUMERIC(5,2)
);

-- DIET PLAN ITEMS
CREATE TABLE diet_plan_items (
    item_id SERIAL PRIMARY KEY,
    plan_id INT REFERENCES diet_plans(plan_id) ON DELETE CASCADE,
    food_id INT NULL REFERENCES food(food_id) ON DELETE SET NULL,
    product_id INT NULL REFERENCES products(product_id) ON DELETE SET NULL,
    meal_time meal_time NOT NULL,
    quantity NUMERIC(6,2),
    calories NUMERIC(6,2)
);

-- FOOD LOG
CREATE TABLE food_log (
    log_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
    food_id INT REFERENCES food(food_id) ON DELETE CASCADE,
    meal_time TIMESTAMP NOT NULL,
    quantity_grams NUMERIC(6,2) NOT NULL,
    total_calories NUMERIC(6,2) NOT NULL,
    log_date TIMESTAMP DEFAULT now()
);

-- EXERCISES
CREATE TABLE exercise (
    exercise_id SERIAL PRIMARY KEY,
    exercise_name VARCHAR(100) NOT NULL,
    calories_burned_per_minute NUMERIC(5,2) NOT NULL
);

-- EXERCISE LOG
CREATE TABLE exercise_log (
    log_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
    exercise_id INT REFERENCES exercise(exercise_id) ON DELETE CASCADE,
    duration_minutes INT NOT NULL,
    total_calories_burned NUMERIC(6,2) NOT NULL,
    log_date TIMESTAMP DEFAULT now()
);