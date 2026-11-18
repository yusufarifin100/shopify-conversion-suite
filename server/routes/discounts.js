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

    const failed = syncResults.filter((r) => r.error);
    if (failed.length > 0) {
      return res.status(502).json({
        success: false,
        error: `${failed.length} of ${syncResults.length} tiers failed: ${failed[0].error}`,
        results: syncResults
      });
    }

    const simulated = syncResults.every((r) => r.simulated);
    res.json({
      success: true,
      simulated,
      message: simulated
        ? 'Demo mode: no Shopify Admin token configured, so no real discounts were created'
        : 'Shopify Automatic Discounts synchronized successfully',
      results: syncResults
    });
  } catch (err) {
    console.error('Error syncing discounts:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
