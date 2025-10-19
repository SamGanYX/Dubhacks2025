import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const router = express.Router();

// Mock user for demo purposes
// In a real implementation, you'd have a User model and proper authentication
const mockAdmin = {
  id: 'admin-1',
  email: 'admin@voicemail-ai.com',
  password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
  role: 'admin'
};

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

    // For demo purposes, check against mock admin
    // In production, you'd query your User database
    if (email === mockAdmin.email) {
      const isValidPassword = await bcrypt.compare(password, mockAdmin.password);
      
      if (isValidPassword) {
        const token = jwt.sign(
          { 
            userId: mockAdmin.id, 
            email: mockAdmin.email, 
            role: mockAdmin.role 
          },
          process.env.JWT_SECRET || 'fallback-secret',
          { expiresIn: '24h' }
        );

        return res.json({
          success: true,
          message: 'Login successful',
          token,
          user: {
            id: mockAdmin.id,
            email: mockAdmin.email,
            role: mockAdmin.role
          }
        });
      }
    }

    res.status(401).json({
      success: false,
      error: 'Invalid email or password'
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Register endpoint (for future use)
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        error: 'Name, email, and password are required'
      });
    }

    // In a real implementation, you'd:
    // 1. Validate email format
    // 2. Check if user already exists
    // 3. Hash the password
    // 4. Save to database
    // 5. Send verification email

    res.status(501).json({
      success: false,
      error: 'Registration not implemented yet'
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Verify token middleware
export const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Access token required'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      error: 'Invalid or expired token'
    });
  }
};

// Get current user info
router.get('/me', verifyToken, (req, res) => {
  res.json({
    success: true,
    user: {
      id: req.user.userId,
      email: req.user.email,
      role: req.user.role
    }
  });
});

// Logout endpoint (client-side token removal)
router.post('/logout', (req, res) => {
  res.json({
    success: true,
    message: 'Logout successful'
  });
});

export default router;
