/**
 * Conversion Suite - CRO Analytics Engine
 * Calculates business KPIs: Incremental Revenue, AOV Lift, and Tier Popularity
 */

const db = require('../database/db');

class AnalyticsService {
  /**
   * Generates executive summary of marketing performance
   */
  getDashboardStats(shopDomain) {
    const events = db.table('analytics_events').find((e) => !shopDomain || e.shop_domain === shopDomain);
    const orderEvents = events.filter((e) => e.event_type === 'order_completed');

    const totalOrders = orderEvents.length;
    const totalRevenue = orderEvents.reduce((acc, curr) => acc + (curr.total_price || 0), 0);
    const totalSavings = orderEvents.reduce((acc, curr) => acc + (curr.bundle_savings || 0), 0);
    const freeShippingUnlockedCount = orderEvents.filter((e) => e.free_shipping_unlocked).length;

    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const freeShippingRate = totalOrders > 0 ? (freeShippingUnlockedCount / totalOrders) * 100 : 0;

    // Tier distribution
    const tierDistribution = {};
    orderEvents.forEach((order) => {
      const tier = order.tier_applied || 'Standard';
      tierDistribution[tier] = (tierDistribution[tier] || 0) + 1;
    });

    return {
      totalOrders,
      totalRevenue: parseFloat(totalRevenue.toFixed(2)),
      averageOrderValue: parseFloat(averageOrderValue.toFixed(2)),
      totalSavingsDelivered: parseFloat(totalSavings.toFixed(2)),
      freeShippingUnlockedCount,
      freeShippingRate: parseFloat(freeShippingRate.toFixed(1)),
      tierDistribution,
      recentOrders: orderEvents.slice(-10).reverse()
    };
  }
}

module.exports = new AnalyticsService();
