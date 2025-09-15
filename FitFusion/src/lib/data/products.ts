export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  subcategory: string;
  rating: number;
  reviewCount: number;
  inStock: boolean;
  tags: string[];
  nutritionalInfo?: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    fiber?: number;
  };
  brand: string;
  size?: string;
  ingredients?: string[];
}

export const productCategories = [
  'All Products',
  'Supplements',
  'Equipment',
  'Nutrition',
  'Apparel',
  'Recovery',
];

export const subcategories = {
  Supplements: ['Protein Powder', 'Vitamins', 'Pre-Workout', 'Post-Workout', 'Creatine'],
  Equipment: ['Dumbbells', 'Resistance Bands', 'Yoga Mats', 'Cardio Equipment', 'Home Gym'],
  Nutrition: ['Protein Bars', 'Healthy Snacks', 'Organic Foods', 'Superfoods', 'Meal Plans'],
  Apparel: ['Workout Clothes', 'Athletic Shoes', 'Accessories', 'Athleisure'],
  Recovery: ['Foam Rollers', 'Massage Tools', 'Sleep Aids', 'Pain Relief', 'Stretching Aids'],
};

export const mockProducts: Product[] = [
  {
    id: '1',
    name: 'Premium Whey Protein Powder',
    description: 'High-quality whey protein isolate with 25g protein per serving. Perfect for muscle building and recovery.',
    price: 49.99,
    originalPrice: 69.99,
    image: 'https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=400&h=400&fit=crop',
    category: 'Supplements',
    subcategory: 'Protein Powder',
    rating: 4.8,
    reviewCount: 324,
    inStock: true,
    tags: ['protein', 'whey', 'muscle building', 'recovery'],
    nutritionalInfo: {
      calories: 110,
      protein: 25,
      carbs: 2,
      fat: 1,
    },
    brand: 'FitFusion Pro',
    size: '2 lbs',
    ingredients: ['Whey Protein Isolate', 'Natural Flavors', 'Stevia', 'Lecithin'],
  },
  {
    id: '2',
    name: 'Adjustable Dumbbell Set',
    description: 'Space-saving adjustable dumbbells with quick-change weight system. 5-50 lbs per dumbbell.',
    price: 299.99,
    originalPrice: 399.99,
    image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=400&fit=crop',
    category: 'Equipment',
    subcategory: 'Dumbbells',
    rating: 4.6,
    reviewCount: 156,
    inStock: true,
    tags: ['dumbbells', 'adjustable', 'home gym', 'strength training'],
    brand: 'FitFusion Equipment',
    size: '5-50 lbs',
  },
  {
    id: '3',
    name: 'Organic Protein Bars (12 Pack)',
    description: 'Delicious organic protein bars with 20g plant-based protein. Perfect for on-the-go nutrition.',
    price: 24.99,
    image: 'https://images.unsplash.com/photo-1564954725576-b0e89751b7b5?w=400&h=400&fit=crop',
    category: 'Nutrition',
    subcategory: 'Protein Bars',
    rating: 4.7,
    reviewCount: 89,
    inStock: true,
    tags: ['protein bars', 'organic', 'plant-based', 'snacks'],
    nutritionalInfo: {
      calories: 210,
      protein: 20,
      carbs: 15,
      fat: 8,
      fiber: 5,
    },
    brand: 'Nature\'s Best',
    size: '12 bars',
    ingredients: ['Organic Dates', 'Pea Protein', 'Almonds', 'Dark Chocolate', 'Coconut Oil'],
  },
  {
    id: '4',
    name: 'Premium Yoga Mat',
    description: 'Non-slip, eco-friendly yoga mat with superior grip and cushioning. Perfect for all types of yoga.',
    price: 79.99,
    image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=400&fit=crop',
    category: 'Equipment',
    subcategory: 'Yoga Mats',
    rating: 4.9,
    reviewCount: 203,
    inStock: true,
    tags: ['yoga mat', 'non-slip', 'eco-friendly', 'exercise'],
    brand: 'ZenFlex',
    size: '6mm thick',
  },
  {
    id: '5',
    name: 'Pre-Workout Energy Boost',
    description: 'Natural pre-workout supplement with caffeine, beta-alanine, and creatine for enhanced performance.',
    price: 34.99,
    originalPrice: 44.99,
    image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=400&fit=crop',
    category: 'Supplements',
    subcategory: 'Pre-Workout',
    rating: 4.5,
    reviewCount: 267,
    inStock: true,
    tags: ['pre-workout', 'energy', 'caffeine', 'performance'],
    brand: 'Energy Plus',
    size: '30 servings',
  },
  {
    id: '6',
    name: 'Resistance Band Set',
    description: 'Complete resistance band set with 5 bands of varying resistance levels. Includes door anchor and handles.',
    price: 39.99,
    image: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400&h=400&fit=crop',
    category: 'Equipment',
    subcategory: 'Resistance Bands',
    rating: 4.4,
    reviewCount: 178,
    inStock: true,
    tags: ['resistance bands', 'strength training', 'portable', 'home workout'],
    brand: 'FlexFit',
    size: '5 bands',
  },
  {
    id: '7',
    name: 'Athletic Performance T-Shirt',
    description: 'Moisture-wicking athletic t-shirt with antimicrobial fabric. Perfect for intense workouts.',
    price: 29.99,
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop',
    category: 'Apparel',
    subcategory: 'Workout Clothes',
    rating: 4.3,
    reviewCount: 92,
    inStock: true,
    tags: ['athletic wear', 'moisture-wicking', 'workout clothes', 'performance'],
    brand: 'ActiveWear Pro',
    size: 'S-XL',
  },
  {
    id: '8',
    name: 'Foam Roller for Recovery',
    description: 'High-density foam roller for muscle recovery and myofascial release. Reduces soreness and improves flexibility.',
    price: 24.99,
    image: 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=400&h=400&fit=crop',
    category: 'Recovery',
    subcategory: 'Foam Rollers',
    rating: 4.6,
    reviewCount: 145,
    inStock: true,
    tags: ['foam roller', 'recovery', 'muscle relief', 'flexibility'],
    brand: 'RecoverRight',
    size: '18 inch',
  },
  {
    id: '9',
    name: 'Multivitamin for Athletes',
    description: 'Comprehensive multivitamin designed specifically for active individuals. 30-day supply.',
    price: 19.99,
    image: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=400&fit=crop',
    category: 'Supplements',
    subcategory: 'Vitamins',
    rating: 4.4,
    reviewCount: 234,
    inStock: true,
    tags: ['multivitamin', 'athletes', 'supplements', 'health'],
    brand: 'VitalFit',
    size: '30 capsules',
  },
  {
    id: '10',
    name: 'Superfood Green Powder',
    description: 'Organic superfood blend with spirulina, chlorella, and wheat grass. Boost your daily nutrition.',
    price: 44.99,
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop',
    category: 'Nutrition',
    subcategory: 'Superfoods',
    rating: 4.2,
    reviewCount: 76,
    inStock: true,
    tags: ['superfoods', 'organic', 'green powder', 'nutrition'],
    nutritionalInfo: {
      calories: 30,
      protein: 5,
      carbs: 4,
      fat: 0,
      fiber: 2,
    },
    brand: 'Green Life',
    size: '30 servings',
  },
];
