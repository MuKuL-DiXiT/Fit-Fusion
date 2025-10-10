const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

// Get all products with filtering and pagination
router.get('/', async (req, res) => {
  try {
    const { 
      category, 
      search, 
      sortBy = 'created_at', 
      sortOrder = 'DESC',
      page = 1,
      limit = 20,
      minPrice,
      maxPrice
    } = req.query;

    let query = `
      SELECT p.*, c.category_name, s.supplier_name,
             COALESCE(AVG(r.rating), 0) as avg_rating,
             COUNT(r.review_id) as review_count
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.category_id
      LEFT JOIN suppliers s ON p.supplier_id = s.supplier_id
      LEFT JOIN reviews r ON p.product_id = r.product_id
      WHERE 1=1
    `;
    
    const queryParams = [];
    let paramCount = 1;

    // Add filters
    if (category) {
      query += ` AND c.category_name ILIKE $${paramCount}`;
      queryParams.push(`%${category}%`);
      paramCount++;
    }

    if (search) {
      query += ` AND (p.product_name ILIKE $${paramCount} OR p.description ILIKE $${paramCount})`;
      queryParams.push(`%${search}%`);
      paramCount++;
    }

    if (minPrice) {
      query += ` AND p.price >= $${paramCount}`;
      queryParams.push(minPrice);
      paramCount++;
    }

    if (maxPrice) {
      query += ` AND p.price <= $${paramCount}`;
      queryParams.push(maxPrice);
      paramCount++;
    }

    // Add GROUP BY
    query += ` GROUP BY p.product_id, c.category_name, s.supplier_name`;

    // Add sorting
    const validSortFields = ['product_name', 'price', 'created_at', 'avg_rating'];
    const validSortOrders = ['ASC', 'DESC'];
    
    if (validSortFields.includes(sortBy) && validSortOrders.includes(sortOrder.toUpperCase())) {
      if (sortBy === 'avg_rating') {
        query += ` ORDER BY avg_rating ${sortOrder.toUpperCase()}`;
      } else {
        query += ` ORDER BY p.${sortBy} ${sortOrder.toUpperCase()}`;
      }
    }

    // Add pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    query += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    queryParams.push(parseInt(limit), offset);

    const result = await pool.query(query, queryParams);

    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(DISTINCT p.product_id) as total
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.category_id
      WHERE 1=1
    `;
    
    const countParams = [];
    let countParamCount = 1;

    if (category) {
      countQuery += ` AND c.category_name ILIKE $${countParamCount}`;
      countParams.push(`%${category}%`);
      countParamCount++;
    }

    if (search) {
      countQuery += ` AND (p.product_name ILIKE $${countParamCount} OR p.description ILIKE $${countParamCount})`;
      countParams.push(`%${search}%`);
      countParamCount++;
    }

    if (minPrice) {
      countQuery += ` AND p.price >= $${countParamCount}`;
      countParams.push(minPrice);
      countParamCount++;
    }

    if (maxPrice) {
      countQuery += ` AND p.price <= $${countParamCount}`;
      countParams.push(maxPrice);
      countParamCount++;
    }

    const countResult = await pool.query(countQuery, countParams);
    const totalProducts = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(totalProducts / parseInt(limit));

    res.json({
      success: true,
      products: result.rows,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalProducts,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching products'
    });
  }
});

// Get single product by ID
router.get('/:productId', async (req, res) => {
  try {
    const { productId } = req.params;

    const productQuery = `
      SELECT p.*, c.category_name, s.supplier_name,
             COALESCE(AVG(r.rating), 0) as avg_rating,
             COUNT(r.review_id) as review_count
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.category_id
      LEFT JOIN suppliers s ON p.supplier_id = s.supplier_id
      LEFT JOIN reviews r ON p.product_id = r.product_id
      WHERE p.product_id = $1
      GROUP BY p.product_id, c.category_name, s.supplier_name
    `;

    const result = await pool.query(productQuery, [productId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Get recent reviews
    const reviewsQuery = `
      SELECT r.*, u.username
      FROM reviews r
      JOIN users u ON r.user_id = u.user_id
      WHERE r.product_id = $1
      ORDER BY r.reviewed_at DESC
      LIMIT 10
    `;

    const reviewsResult = await pool.query(reviewsQuery, [productId]);

    res.json({
      success: true,
      product: result.rows[0],
      reviews: reviewsResult.rows
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching product'
    });
  }
});

// Get all categories
router.get('/categories/list', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM categories ORDER BY category_name'
    );

    res.json({
      success: true,
      categories: result.rows
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching categories'
    });
  }
});

// Add product review (authenticated users only)
router.post('/:productId/reviews', authenticateToken, async (req, res) => {
  try {
    const { productId } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user.userId;

    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }

    // Check if product exists
    const productCheck = await pool.query(
      'SELECT product_id FROM products WHERE product_id = $1',
      [productId]
    );

    if (productCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check if user already reviewed this product
    const existingReview = await pool.query(
      'SELECT review_id FROM reviews WHERE user_id = $1 AND product_id = $2',
      [userId, productId]
    );

    if (existingReview.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'You have already reviewed this product'
      });
    }

    // Insert review
    const result = await pool.query(
      `INSERT INTO reviews (user_id, product_id, rating, comment)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [userId, productId, rating, comment || null]
    );

    res.status(201).json({
      success: true,
      message: 'Review added successfully',
      review: result.rows[0]
    });
  } catch (error) {
    console.error('Error adding review:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding review'
    });
  }
});

module.exports = router;