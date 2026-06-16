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
      const bootstrapEmail = process.env.SUPERADMIN_EMAIL?.trim().toLowerCase();
      const bootstrapPassword = process.env.SUPERADMIN_PASSWORD;
      if (!bootstrapEmail || !bootstrapPassword) {
        console.warn('No superadmin exists. Set SUPERADMIN_EMAIL and SUPERADMIN_PASSWORD in the environment to bootstrap one.');
        return;
      }
      await User.create({
        name: process.env.SUPERADMIN_NAME?.trim() || 'Super Admin',
        email: bootstrapEmail,
        password: bootstrapPassword,
        role: 'superadmin',
        phone: process.env.SUPERADMIN_PHONE?.trim() || undefined,
      });
      console.log('Initial superadmin account created from environment configuration.');
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
