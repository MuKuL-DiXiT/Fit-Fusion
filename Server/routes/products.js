const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

// Create a new product (for suppliers)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { product_name, description, price, stock_quantity, category_id } = req.body;
    const userId = req.user.userId;

    // Validate required fields
    if (!product_name || !price || !category_id) {
      return res.status(400).json({
        success: false,
        message: 'Product name, price, and category are required'
      });
    }

    // Get supplier_id from user
    const supplierQuery = await pool.query(
      'SELECT supplier_id FROM suppliers WHERE email = (SELECT email FROM users WHERE user_id = $1)',
      [userId]
    );

    if (supplierQuery.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Only suppliers can add products'
      });
    }

    const supplier_id = supplierQuery.rows[0].supplier_id;

    // Insert product
    const result = await pool.query(
      `INSERT INTO products (product_name, description, price, stock_quantity, category_id, supplier_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [product_name, description || null, price, stock_quantity || 0, category_id, supplier_id]
    );

    res.status(201).json({
      success: true,
      message: 'Product added successfully',
      product: result.rows[0]
    });
  } catch (error) {
    console.error('Error adding product:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding product'
    });
  }
});

router.get('/', async (req, res) => {
  try {
    const query = `
      SELECT p.product_id, p.product_name, p.description, p.price, 
             p.stock_quantity, p.category_id,
             c.category_name,
             COALESCE(AVG(r.rating), 0) as avg_rating,
             COUNT(r.review_id) as review_count
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.category_id
      LEFT JOIN reviews r ON p.product_id = r.product_id
      GROUP BY p.product_id, c.category_name
      ORDER BY p.product_name;
    `;
    const result = await pool.query(query);

    res.json({
      success: true,
      products: result.rows
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching products'
    });
  }
});

// Get products that belong to the authenticated supplier
router.get('/supplier/mine', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Determine supplier_id from the authenticated user
    const supplierQuery = await pool.query(
      'SELECT supplier_id FROM suppliers WHERE email = (SELECT email FROM users WHERE user_id = $1)',
      [userId]
    );

    if (supplierQuery.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Only suppliers can view their products'
      });
    }

    const supplierId = supplierQuery.rows[0].supplier_id;

    const productsQuery = `
      SELECT p.product_id, p.product_name, p.stock_quantity, p.price
      FROM products p
      WHERE p.supplier_id = $1
      ORDER BY p.product_name
    `;
    const result = await pool.query(productsQuery, [supplierId]);

    res.json({
      success: true,
      products: result.rows
    });
  } catch (error) {
    console.error('Error fetching supplier products:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching supplier products'
    });
  }
});

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

router.post('/:productId/reviews', authenticateToken, async (req, res) => {
  try {
    const { productId } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user.userId;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }

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