/**
 * Conversion Suite - Analytics Route
 */

const express = require('express');
const router = express.Router();
const analyticsService = require('../services/analyticsService');
const db = require('../database/db');

// Get high-level CRO metrics
router.get('/', (req, res) => {
  const shop = req.query.shop || process.env.SHOP_DOMAIN;
  const stats = analyticsService.getDashboardStats(shop);
  res.json({ success: true, stats });
});

// Record micro-conversion events from Storefront
router.post('/track', (req, res) => {
  const { event_type, shop_domain, metadata } = req.body;

  const event = {
    id: `track_${Date.now()}`,
    shop_domain: shop_domain || process.env.SHOP_DOMAIN,
    event_type: event_type || 'storefront_interaction',
    metadata: metadata || {},
    timestamp: new Date().toISOString()
  };

  db.table('analytics_events').insert(event);
  res.json({ success: true, eventId: event.id });
});

module.exports = router;
