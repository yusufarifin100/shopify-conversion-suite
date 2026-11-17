/**
 * Conversion Suite - Express Backend Server
 * High-performance backend engine for Shopify OS 2.0 CRO Toolkit
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const apiRoutes = require('./routes/api');
const discountRoutes = require('./routes/discounts');
const webhookRoutes = require('./routes/webhooks');
const analyticsRoutes = require('./routes/analytics');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS
app.use(cors());

// Capture raw body for Shopify HMAC signature verification
app.use(
  express.json({
    verify: (req, res, buf, encoding) => {
      req.rawBody = buf.toString(encoding || 'utf8');
    }
  })
);
app.use(express.urlencoded({ extended: true }));

// Serve Static Merchant Admin Dashboard
app.use(express.static(path.join(__dirname, 'public')));

// Register Routes
app.use('/api', apiRoutes);
app.use('/api/discounts', discountRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/webhooks', webhookRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'shopify-conversion-suite-backend'
  });
});

// Admin dashboard shortcut
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 Conversion Suite Backend Server is running!`);
  console.log(`📡 URL: http://localhost:${PORT}`);
  console.log(`📊 Merchant Dashboard: http://localhost:${PORT}/admin`);
  console.log(`=======================================================`);
});

module.exports = app;
