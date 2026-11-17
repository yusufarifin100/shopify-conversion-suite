/**
 * Conversion Suite - Webhook Consumer Service
 * Processes order notifications directly from Shopify to calculate CRO revenue and AOV
 */

const db = require('../database/db');

class WebhookService {
  /**
   * Handles incoming orders/paid webhook
   */
  async processOrderPaid(orderPayload, shopDomain) {
    const orderId = orderPayload.id || orderPayload.name || `order_${Date.now()}`;
    const totalPrice = parseFloat(orderPayload.total_price || '0');
    const lineItems = orderPayload.line_items || [];

    // Check if any items belong to a bundle created by Conversion Suite
    let bundleItemCount = 0;
    let bundleDiscountName = null;
    let bundleSavingsEstimate = 0;

    lineItems.forEach((item) => {
      const properties = item.properties || [];
      const isBundleItem = properties.some((p) => p.name === '_bundle_id' || p.name === '_bundle_tier');
      const discountProp = properties.find((p) => p.name === '_bundle_discount');

      if (isBundleItem) {
        bundleItemCount += item.quantity;
        if (discountProp) bundleDiscountName = discountProp.value;
      }
    });

    // Check merchant's free shipping threshold
    const merchant = db.table('merchants').findOne((m) => m.shop_domain === shopDomain);
    const thresholdDollars = (merchant?.free_shipping_threshold || 7500) / 100;
    const unlockedFreeShipping = totalPrice >= thresholdDollars;

    // Estimate savings if bundle was present
    if (bundleDiscountName) {
      const pct = parseFloat(bundleDiscountName.replace('%', '')) || 0;
      if (pct > 0) {
        bundleSavingsEstimate = (totalPrice / (1 - pct / 100)) - totalPrice;
      }
    }

    // Save analytics event
    const event = {
      id: `evt_${Date.now()}`,
      shop_domain: shopDomain,
      event_type: 'order_completed',
      order_id: String(orderId),
      total_price: totalPrice,
      bundle_savings: parseFloat(bundleSavingsEstimate.toFixed(2)),
      free_shipping_unlocked: unlockedFreeShipping,
      tier_applied: bundleDiscountName ? `Tier (${bundleDiscountName})` : 'Standard Cart',
      bundle_items_count: bundleItemCount,
      timestamp: new Date().toISOString()
    };

    db.table('analytics_events').insert(event);

    console.log(`[Shopify Webhook] Processed Order #${orderId}: $${totalPrice} (Free Shipping: ${unlockedFreeShipping})`);
    return event;
  }
}

module.exports = new WebhookService();
