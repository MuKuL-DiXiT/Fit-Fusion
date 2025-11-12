const bcrypt = require("bcryptjs");
const { pool } = require("../config/db");
const { generateToken, getCookieOptions } = require("../middleware/auth");

// User signup controller
const signup = async (req, res) => {
  try {
    const {
      username,
      email,
      password,
      phone_number,
      address,
      role,
      supplier_name,
    } = req.body;

    // Validation
    if (!username || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: "Username, email, password, and role are required",
      });
    }

    // Check if user already exists
    const existingUser = await pool.query(
      "SELECT * FROM users WHERE email = $1 OR username = $2",
      [email, username]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: "User with this email or username already exists",
      });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insert new user with role
    const newUser = await pool.query(
      `INSERT INTO users (username, email, password, phone_number, address, role, created_at, updated_at) 
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW()) 
       RETURNING user_id, username, email, phone_number, address, role, created_at`,
      [
        username,
        email,
        hashedPassword,
        phone_number || null,
        address || null,
        role,
      ]
    );

    const user = newUser.rows[0];

    // If role is supplier, insert into Suppliers table as well
    if (role === "supplier") {
      // Use supplier_name if provided, else fallback to username
      const finalSupplierName = supplier_name || username;
      await pool.query(
        `INSERT INTO suppliers (supplier_name, email, phone_number, address, created_at)
         VALUES ($1, $2, $3, $4, NOW())`,
        [finalSupplierName, email, phone_number || null, address || null]
      );
    }

    // Generate JWT token
    const token = generateToken({
      userId: user.user_id,
      username: user.username,
      email: user.email,
      role: user.role,
    });

    // Set HTTP-only cookie
    res.cookie("authToken", token, getCookieOptions());

    res.status(201).json({
      success: true,
      message: "User created successfully",
      user: {
        userId: user.user_id,
        username: user.username,
        email: user.email,
        phone_number: user.phone_number,
        address: user.address,
        role: user.role,
        created_at: user.created_at,
      },
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error during signup",
    });
  }
};

// User login controller
const login = async (req, res) => {
  try {
    const { identifier, password } = req.body; // identifier can be email or username

    // Validation
    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: "Email/username and password are required",
      });
    }

    // Find user by email or username
    const userQuery = await pool.query(
      "SELECT * FROM users WHERE email = $1 OR username = $1",
      [identifier]
    );

    if (userQuery.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const user = userQuery.rows[0];
    console.log("User from DB:", user);

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Update last login time
    await pool.query("UPDATE users SET updated_at = NOW() WHERE user_id = $1", [
      user.user_id,
    ]);

    // Generate JWT token
    const token = generateToken({
      userId: user.user_id,
      username: user.username,
      email: user.email,
      role: user.role,
    });

    // Set HTTP-only cookie
    res.cookie("authToken", token, getCookieOptions());

    res.status(200).json({
      success: true,
      message: "Login successful",
      user: {
        userId: user.user_id,
        username: user.username,
        email: user.email,
        phone_number: user.phone_number,
        address: user.address,
        role: user.role,
        created_at: user.created_at,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error during login",
    });
  }
};

// User logout controller
const logout = async (req, res) => {
  try {
    // Clear the auth cookie
    res.clearCookie("authToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
    });

    res.status(200).json({
      success: true,
      message: "Logout successful",
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error during logout",
    });
  }
};

// Get current user profile controller
  const getProfile = async (req, res) => {
  try {
    const userId = req.user.userId;

    const userQuery = await pool.query(
      "SELECT user_id, username, email, phone_number, address, role, created_at, updated_at FROM users WHERE user_id = $1",
      [userId]
    );

    if (userQuery.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const user = userQuery.rows[0];

    res.status(200).json({
      success: true,
      user: {
        userId: user.user_id,
        username: user.username,
        email: user.email,
        phone_number: user.phone_number,
        address: user.address,
          role: user.role,
        created_at: user.created_at,
        updated_at: user.updated_at,
      },
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error while fetching profile",
    });
  }
};

// Update user profile controller
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { username, phone_number, address } = req.body;

    // Check if username is already taken by another user
    if (username) {
      const existingUser = await pool.query(
        "SELECT user_id FROM users WHERE username = $1 AND user_id != $2",
        [username, userId]
      );

      if (existingUser.rows.length > 0) {
        return res.status(409).json({
          success: false,
          message: "Username is already taken",
        });
      }
    }

    // Build dynamic update query
    const fieldsToUpdate = [];
    const values = [];
    let paramCount = 1;

    if (username) {
      fieldsToUpdate.push(`username = $${paramCount}`);
      values.push(username);
      paramCount++;
    }

    if (phone_number !== undefined) {
      fieldsToUpdate.push(`phone_number = $${paramCount}`);
      values.push(phone_number);
      paramCount++;
    }

    if (address !== undefined) {
      fieldsToUpdate.push(`address = $${paramCount}`);
      values.push(address);
      paramCount++;
    }

    if (fieldsToUpdate.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No fields to update",
      });
    }

    fieldsToUpdate.push(`updated_at = NOW()`);
    values.push(userId);

    const updateQuery = `
      UPDATE users 
      SET ${fieldsToUpdate.join(", ")} 
      WHERE user_id = $${paramCount} 
      RETURNING user_id, username, email, phone_number, address, updated_at
    `;

    const result = await pool.query(updateQuery, values);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const user = result.rows[0];

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: {
        userId: user.user_id,
        username: user.username,
        email: user.email,
        phone_number: user.phone_number,
        role: user.role,
        address: user.address,
        updated_at: user.updated_at,
      },
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error while updating profile",
    });
  }
};

module.exports = {
  signup,
  login,
  logout,
  getProfile,
  updateProfile,
};
