/**
 * Conversion Suite - Automatic Discount API Route
 */

const express = require('express');
const router = express.Router();
const discountService = require('../services/discountService');

// Sync all bundle discount tiers to Shopify Admin Backend
router.post('/sync', async (req, res) => {
  const shop = req.query.shop || req.body.shop || process.env.SHOP_DOMAIN;

  try {
    const syncResults = await discountService.syncTierDiscounts(shop);
    res.json({
      success: true,
      message: 'Shopify Automatic Discounts synchronized successfully',
      results: syncResults
    });
  } catch (err) {
    console.error('Error syncing discounts:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
