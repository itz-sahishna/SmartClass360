const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { getUserByIdentifier } = require('../db/helpers');
const auth = require('../middleware/auth');

router.post('/login', async (req, res, next) => {
  try {
    const { identifier, password, rememberMe } = req.body;
    if (!identifier || !password) {
      return res.status(400).json({ success: false, message: 'Missing identifier or password' });
    }

    const user = await getUserByIdentifier(identifier);
    
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    
    if (user.is_blocked) {
      return res.status(403).json({ success: false, message: 'Account is blocked' });
    }

    const payload = { id: user.id, role: user.role };
    const expiresIn = rememberMe ? process.env.JWT_REMEMBER_EXPIRES_IN : process.env.JWT_EXPIRES_IN;
    
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: expiresIn || '24h' });

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        roll_number: user.roll_number || null,
      }
    });
  } catch (err) {
    next(err);
  }
});

router.get('/me', auth, (req, res) => {
  res.json({ success: true, user: req.user });
});

module.exports = router;
