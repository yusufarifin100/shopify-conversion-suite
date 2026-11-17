/**
 * Conversion Suite - Shopify Webhooks Route
 */

const express = require('express');
const router = express.Router();
const { verifyWebhookHmac } = require('../middleware/verifyHmac');
const webhookService = require('../services/webhookService');

// Orders Paid Webhook
router.post('/orders-paid', verifyWebhookHmac, async (req, res) => {
  const shop = req.get('X-Shopify-Shop-Domain') || process.env.SHOP_DOMAIN;
  const order = req.body;

  try {
    const event = await webhookService.processOrderPaid(order, shop);
    res.status(200).json({ success: true, processedEventId: event.id });
  } catch (err) {
    console.error('Webhook processing failed:', err);
    res.status(500).json({ error: 'Failed to process webhook' });
  }
});

// Mock order simulator endpoint for local testing
router.post('/simulate-order', async (req, res) => {
  const shop = req.body.shop || process.env.SHOP_DOMAIN;
  const mockOrder = {
    id: Math.floor(1000 + Math.random() * 9000),
    total_price: (req.body.total_price || 95.00).toFixed(2),
    line_items: [
      {
        id: 1,
        title: 'Hydra-Barrier Serum',
        quantity: 2,
        properties: [
          { name: '_bundle_id', value: 'bundle_123' },
          { name: '_bundle_tier', value: 'Buy More Save More' },
          { name: '_bundle_discount', value: '20%' }
        ]
      }
    ]
  };

  const event = await webhookService.processOrderPaid(mockOrder, shop);
  res.json({ success: true, message: 'Simulated order created', event });
});

module.exports = router;
