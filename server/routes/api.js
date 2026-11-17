/**
 * Conversion Suite - Merchant Configuration API
 */

const express = require('express');
const router = express.Router();
const db = require('../database/db');

// GET settings for store
router.get('/settings', (req, res) => {
  const shop = req.query.shop || process.env.SHOP_DOMAIN;
  let merchant = db.table('merchants').findOne((m) => m.shop_domain === shop);

  if (!merchant) {
    merchant = {
      shop_domain: shop,
      free_shipping_threshold: 7500,
      enable_cart_upsell: true,
      currency: 'USD'
    };
  }

  const tiers = db.table('bundle_tiers').find((t) => t.shop_domain === shop);

  res.json({
    success: true,
    shop: merchant,
    tiers: tiers
  });
});

// Update merchant settings
router.put('/settings', (req, res) => {
  const shop = req.query.shop || process.env.SHOP_DOMAIN;
  const { free_shipping_threshold, enable_cart_upsell } = req.body;

  db.table('merchants').update((m) => m.shop_domain === shop, {
    free_shipping_threshold: parseInt(free_shipping_threshold, 10),
    enable_cart_upsell: Boolean(enable_cart_upsell)
  });

  res.json({ success: true, message: 'Settings updated successfully' });
});

// Update bundle tiers
router.put('/tiers', (req, res) => {
  const shop = req.query.shop || process.env.SHOP_DOMAIN;
  const { tiers } = req.body;

  if (Array.isArray(tiers)) {
    tiers.forEach((tier) => {
      db.table('bundle_tiers').update(
        (t) => t.shop_domain === shop && t.tier_number === tier.tier_number,
        {
          min_quantity: parseInt(tier.min_quantity, 10),
          discount_percentage: parseInt(tier.discount_percentage, 10),
          title: tier.title,
          badge: tier.badge
        }
      );
    });
  }

  res.json({ success: true, message: 'Bundle tiers updated successfully' });
});

module.exports = router;
