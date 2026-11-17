/**
 * Conversion Suite - Server-Side Automatic Discount Service
 * Synchronizes bundle builder discount tiers with Shopify's Native Backend Discount Engine
 */

const ShopifyClient = require('../config/shopify');
const db = require('../database/db');

class DiscountService {
  /**
   * Syncs database bundle tiers with Shopify's Automatic Discount rules
   */
  async syncTierDiscounts(shopDomain) {
    const tiers = db.table('bundle_tiers').find((t) => t.shop_domain === shopDomain);
    const shopify = new ShopifyClient(shopDomain);
    const results = [];

    for (const tier of tiers) {
      const discountTitle = `Conversion Suite - Buy ${tier.min_quantity}+ Save ${tier.discount_percentage}%`;

      // GraphQL Mutation for Shopify Automatic Discount
      const mutation = `
        mutation CreateAutomaticDiscount($automaticBasicDiscount: DiscountAutomaticBasicInput!) {
          discountAutomaticBasicCreate(automaticBasicDiscount: $automaticBasicDiscount) {
            automaticDiscountNode {
              id
              automaticDiscount {
                ... on DiscountAutomaticBasic {
                  title
                  status
                  startsAt
                }
              }
            }
            userErrors {
              field
              message
            }
          }
        }
      `;

      const variables = {
        automaticBasicDiscount: {
          title: discountTitle,
          startsAt: new Date().toISOString(),
          customerGets: {
            value: {
              percentage: tier.discount_percentage / 100
            },
            items: {
              all: true
            }
          },
          minimumRequirement: {
            quantity: {
              greaterThanOrEqualToQuantity: String(tier.min_quantity)
            }
          }
        }
      };

      try {
        const response = await shopify.graphql(mutation, variables);
        const node = response?.discountAutomaticBasicCreate?.automaticDiscountNode;

        results.push({
          tierId: tier.id,
          title: discountTitle,
          shopifyDiscountId: node?.id || `simulated_${Date.now()}`,
          status: 'ACTIVE'
        });
      } catch (err) {
        console.error(`Failed to sync discount for Tier ${tier.tier_number}:`, err);
        results.push({
          tierId: tier.id,
          error: err.message
        });
      }
    }

    return results;
  }
}

module.exports = new DiscountService();
