-- Insert sample categories
INSERT INTO categories (category_name, description) VALUES 
('Supplements', 'Health and fitness supplements'),
('Equipment', 'Fitness equipment and accessories'),
('Nutrition', 'Healthy food and nutrition products'),
('Vitamins', 'Essential vitamins and minerals');

-- Insert sample suppliers
INSERT INTO suppliers (supplier_name, email, phone_number, address) VALUES 
('HealthCorp', 'contact@healthcorp.com', '+1234567890', '123 Health Street'),
('FitSupply', 'info@fitsupply.com', '+1234567891', '456 Fitness Ave'),
('NutriMax', 'sales@nutrimax.com', '+1234567892', '789 Nutrition Blvd');

-- Insert sample products
INSERT INTO products (supplier_id, category_id, product_name, description, price, stock_quantity) VALUES 
(1, 1, 'Whey Protein Powder', 'High-quality whey protein for muscle building', 49.99, 100),
(1, 4, 'Vitamin D3', 'Essential vitamin D3 supplement', 19.99, 200),
(2, 2, 'Resistance Bands Set', 'Complete set of resistance bands for home workouts', 29.99, 50),
(2, 2, 'Yoga Mat', 'Premium non-slip yoga mat', 39.99, 75),
(3, 3, 'Organic Protein Bar', 'Delicious organic protein bar with natural ingredients', 2.99, 300),
(3, 3, 'Green Superfood Powder', 'Nutrient-dense green superfood blend', 34.99, 80);

-- Insert sample food items
INSERT INTO food (food_name, calories_per_100g, protein_per_100g, carbs_per_100g, fats_per_100g) VALUES 
('Chicken Breast', 165, 31, 0, 3.6),
('Brown Rice', 123, 2.6, 23, 0.9),
('Broccoli', 34, 2.8, 7, 0.4),
('Salmon', 208, 20, 0, 13),
('Oatmeal', 389, 16.9, 66.3, 6.9),
('Greek Yogurt', 59, 10, 3.6, 0.4),
('Almonds', 579, 21.2, 21.6, 49.9),
('Spinach', 23, 2.9, 3.6, 0.4),
('Sweet Potato', 86, 1.6, 20.1, 0.1),
('Eggs', 155, 13, 1.1, 11);

-- Insert sample exercises
INSERT INTO exercise (exercise_name, calories_burned_per_minute) VALUES 
('Running', 10.0),
('Cycling', 8.0),
('Swimming', 11.0),
('Walking', 5.0),
('Weight Training', 6.0),
('Yoga', 3.0),
('Jump Rope', 12.0),
('Rowing', 9.0);