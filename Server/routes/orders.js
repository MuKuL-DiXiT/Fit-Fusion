const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

router.get('/cart', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    let cartQuery = await pool.query(
      `SELECT * FROM orders WHERE user_id = $1 AND status = 'Cart'`,
      [userId]
    );

    let cart;
    if (cartQuery.rows.length === 0) {
      const newCart = await pool.query(
        `INSERT INTO orders (user_id, total_amount, status)
         VALUES ($1, 0, 'Cart')
         RETURNING *`,
        [userId]
      );
      cart = newCart.rows[0];
    } else {
      cart = cartQuery.rows[0];
    }

    const itemsQuery = await pool.query(
      `SELECT oi.*, p.product_name, p.description, p.price as current_price
       FROM order_items oi
       JOIN products p ON oi.product_id = p.product_id
       WHERE oi.order_id = $1`,
      [cart.order_id]
    );

    res.json({
      success: true,
      cart: {
        ...cart,
        items: itemsQuery.rows
      }
    });
  } catch (error) {
    console.error('Error fetching cart:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching cart'
    });
  }
});

router.post('/cart/items', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { productId, quantity } = req.body;

    if (!productId || !quantity || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Product ID and valid quantity are required'
      });
    }

    const productQuery = await pool.query(
      'SELECT * FROM products WHERE product_id = $1',
      [productId]
    );

    if (productQuery.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const product = productQuery.rows[0];

    if (product.stock_quantity < quantity) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient stock available'
      });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      let cartQuery = await client.query(
        `SELECT * FROM orders WHERE user_id = $1 AND status = 'Cart'`,
        [userId]
      );

      let cart;
      if (cartQuery.rows.length === 0) {
        const newCart = await client.query(
          `INSERT INTO orders (user_id, total_amount, status)
           VALUES ($1, 0, 'Cart')
           RETURNING *`,
          [userId]
        );
        cart = newCart.rows[0];
      } else {
        cart = cartQuery.rows[0];
      }

      const existingItem = await client.query(
        `SELECT * FROM order_items WHERE order_id = $1 AND product_id = $2`,
        [cart.order_id, productId]
      );

      let updatedQuantity;
      if (existingItem.rows.length > 0) {
        updatedQuantity = existingItem.rows[0].quantity + quantity;
        
        if (product.stock_quantity < updatedQuantity) {
          throw new Error('Insufficient stock for total quantity');
        }

        await client.query(
          `UPDATE order_items SET quantity = $1 WHERE order_item_id = $2`,
          [updatedQuantity, existingItem.rows[0].order_item_id]
        );
      } else {
        updatedQuantity = quantity;
        await client.query(
          `INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase)
           VALUES ($1, $2, $3, $4)`,
          [cart.order_id, productId, quantity, product.price]
        );
      }

      const totalQuery = await client.query(
        `SELECT SUM(oi.quantity * oi.price_at_purchase) as total
         FROM order_items oi
         WHERE oi.order_id = $1`,
        [cart.order_id]
      );

      const newTotal = totalQuery.rows[0].total || 0;
      await client.query(
        `UPDATE orders SET total_amount = $1 WHERE order_id = $2`,
        [newTotal, cart.order_id]
      );

      await client.query('COMMIT');

      res.status(201).json({
        success: true,
        message: 'Item added to cart successfully'
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error adding item to cart:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error adding item to cart'
    });
  }
});

router.put('/cart/items/:itemId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { itemId } = req.params;
    const { quantity } = req.body;

    if (!quantity || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid quantity is required'
      });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const itemQuery = await client.query(
        `SELECT oi.*, o.user_id, p.stock_quantity
         FROM order_items oi
         JOIN orders o ON oi.order_id = o.order_id
         JOIN products p ON oi.product_id = p.product_id
         WHERE oi.order_item_id = $1 AND o.user_id = $2 AND o.status = 'Cart'`,
        [itemId, userId]
      );

      if (itemQuery.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Cart item not found'
        });
      }

      const item = itemQuery.rows[0];

      if (item.stock_quantity < quantity) {
        return res.status(400).json({
          success: false,
          message: 'Insufficient stock available'
        });
      }

      await client.query(
        `UPDATE order_items SET quantity = $1 WHERE order_item_id = $2`,
        [quantity, itemId]
      );

      const totalQuery = await client.query(
        `SELECT SUM(oi.quantity * oi.price_at_purchase) as total
         FROM order_items oi
         WHERE oi.order_id = $1`,
        [item.order_id]
      );

      const newTotal = totalQuery.rows[0].total || 0;
      await client.query(
        `UPDATE orders SET total_amount = $1 WHERE order_id = $2`,
        [newTotal, item.order_id]
      );

      await client.query('COMMIT');

      res.json({
        success: true,
        message: 'Cart item updated successfully'
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error updating cart item:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating cart item'
    });
  }
});

router.delete('/cart/items/:itemId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { itemId } = req.params;

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const itemQuery = await client.query(
        `SELECT oi.*, o.user_id
         FROM order_items oi
         JOIN orders o ON oi.order_id = o.order_id
         WHERE oi.order_item_id = $1 AND o.user_id = $2 AND o.status = 'Cart'`,
        [itemId, userId]
      );

      if (itemQuery.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Cart item not found'
        });
      }

      const item = itemQuery.rows[0];

      await client.query(
        `DELETE FROM order_items WHERE order_item_id = $1`,
        [itemId]
      );

      const totalQuery = await client.query(
        `SELECT SUM(oi.quantity * oi.price_at_purchase) as total
         FROM order_items oi
         WHERE oi.order_id = $1`,
        [item.order_id]
      );

      const newTotal = totalQuery.rows[0].total || 0;
      await client.query(
        `UPDATE orders SET total_amount = $1 WHERE order_id = $2`,
        [newTotal, item.order_id]
      );

      await client.query('COMMIT');

      res.json({
        success: true,
        message: 'Item removed from cart successfully'
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error removing cart item:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing cart item'
    });
  }
});

router.post('/place-order', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { shippingAddress } = req.body;

    if (!shippingAddress || shippingAddress.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Shipping address is required'
      });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const cartQuery = await client.query(
        `SELECT * FROM orders WHERE user_id = $1 AND status = 'Cart'`,
        [userId]
      );

      if (cartQuery.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'No items in cart'
        });
      }

      const cart = cartQuery.rows[0];

      const itemsQuery = await client.query(
        `SELECT oi.*, p.stock_quantity
         FROM order_items oi
         JOIN products p ON oi.product_id = p.product_id
         WHERE oi.order_id = $1`,
        [cart.order_id]
      );

      if (itemsQuery.rows.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No items in cart'
        });
      }

      for (const item of itemsQuery.rows) {
        if (item.stock_quantity < item.quantity) {
          return res.status(400).json({
            success: false,
            message: `Insufficient stock for product ID: ${item.product_id}`
          });
        }
      }

      for (const item of itemsQuery.rows) {
        await client.query(
          `UPDATE products SET stock_quantity = stock_quantity - $1 WHERE product_id = $2`,
          [item.quantity, item.product_id]
        );
      }

      await client.query(
        `UPDATE orders SET status = 'Pending', shipping_address = $1, order_date = NOW()
         WHERE order_id = $2`,
        [shippingAddress, cart.order_id]
      );

      await client.query('COMMIT');

      res.json({
        success: true,
        message: 'Order placed successfully',
        orderId: cart.order_id
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error placing order:', error);
    res.status(500).json({
      success: false,
      message: 'Error placing order'
    });
  }
});

router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { status } = req.query;

    let query = `
      SELECT o.*, COUNT(oi.order_item_id) as item_count
      FROM orders o
      LEFT JOIN order_items oi ON o.order_id = oi.order_id
      WHERE o.user_id = $1 AND o.status != 'Cart'
    `;
    
    const queryParams = [userId];

    if (status) {
      query += ` AND o.status = $2`;
      queryParams.push(status);
    }

    query += ` GROUP BY o.order_id ORDER BY o.order_date DESC`;

    const result = await pool.query(query, queryParams);

    res.json({
      success: true,
      orders: result.rows
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching orders'
    });
  }
});

router.get('/:orderId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { orderId } = req.params;

    const orderQuery = await pool.query(
      `SELECT * FROM orders WHERE order_id = $1 AND user_id = $2`,
      [orderId, userId]
    );

    if (orderQuery.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    const itemsQuery = await pool.query(
      `SELECT oi.*, p.product_name, p.description
       FROM order_items oi
       JOIN products p ON oi.product_id = p.product_id
       WHERE oi.order_id = $1`,
      [orderId]
    );

    res.json({
      success: true,
      order: orderQuery.rows[0],
      items: itemsQuery.rows
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching order'
    });
  }
});

router.put('/:orderId/status', authenticateToken, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    const validStatuses = ['Pending', 'Shipped', 'Delivered', 'Cancelled'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order status'
      });
    }

    const result = await pool.query(
      `UPDATE orders SET status = $1 WHERE order_id = $2 RETURNING *`,
      [status, orderId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.json({
      success: true,
      message: 'Order status updated successfully',
      order: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating order status'
    });
  }
});

// Complete order (fake payment flow)
router.put('/:orderId/complete', authenticateToken, async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.userId;

    // Update order status from 'Cart' to 'Delivered' (payment complete)
    const result = await pool.query(
      `UPDATE orders 
       SET status = 'Delivered' 
       WHERE order_id = $1 AND user_id = $2 AND status = 'Cart' 
       RETURNING *`,
      [orderId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Order not found or already completed'
      });
    }

    res.json({
      success: true,
      message: 'Order placed successfully'
    });
  } catch (error) {
    console.error('Error completing order:', error);
    res.status(500).json({
      success: false,
      message: 'Error completing order'
    });
  }
});

module.exports = router;