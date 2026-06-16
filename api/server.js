require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const app = express();

app.use(cors({ origin: '*', credentials: true }));
app.use(express.json({ limit: '10mb' }));

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 500 });
app.use('/api/', limiter);

app.use('/api/auth', require('./routes/auth'));
app.use('/api/verify', require('./routes/verify'));
app.use('/api/admin', require('./routes/admin'));

app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date() }));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected');
    // Seed admin user if none exists
    const User = require('./models/User');
    const admin = await User.findOne({ role: 'superadmin' });
    if (!admin) {
      await User.create({
        name: 'Super Admin',
        email: 'admin@excise.live',
        password: 'Admin@123',
        role: 'superadmin',
        phone: '03001234567',
      });
      console.log('Default superadmin created: admin@excise.live / Admin@123');
    }
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
};

connectDB().then(() => {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`DMT API running on port ${PORT}`));
});
