/**
 * Conversion Suite - Shopify Admin API Helper
 * Executes GraphQL queries & mutations against Shopify Admin API (2025-01 / latest)
 */

class ShopifyClient {
  constructor(shop, accessToken) {
    this.shop = shop || process.env.SHOP_DOMAIN;
    this.accessToken = accessToken || process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;
    this.apiVersion = '2025-01';
  }

  /** True when running against the built-in demo token instead of a real store. */
  isMock() {
    return Boolean(this.accessToken?.startsWith('shpat_demo_') || !this.shop);
  }

  async graphql(query, variables = {}) {
    const endpoint = `https://${this.shop}/admin/api/${this.apiVersion}/graphql.json`;

    // In development/mock mode without active store credentials
    if (this.isMock()) {
      console.log(`[Shopify GraphQL Mock] Query called on ${this.shop}`);
      return this.mockResponse(query, variables);
    }

    if (!this.accessToken) {
      throw new Error('SHOPIFY_ADMIN_ACCESS_TOKEN is not set, cannot call the Shopify Admin API');
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': this.accessToken
      },
      body: JSON.stringify({ query, variables })
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Shopify API HTTP Error ${response.status}: ${text}`);
    }

    const json = await response.json();
    if (json.errors) {
      throw new Error(`Shopify GraphQL Errors: ${JSON.stringify(json.errors)}`);
    }

    return json.data;
  }

  // Mock response for offline development or sandbox testing
  mockResponse(query, variables) {
    if (query.includes('discountAutomaticBasicCreate') || query.includes('discountAutomaticAppCreate')) {
      return {
        discountAutomaticBasicCreate: {
          automaticDiscountNode: {
            id: `gid://shopify/DiscountAutomaticNode/${Date.now()}`,
            automaticDiscount: {
              title: variables.automaticBasicDiscount?.title || 'Conversion Suite Tier Discount',
              status: 'ACTIVE',
              startsAt: new Date().toISOString()
            }
          },
          userErrors: []
        }
      };
    }

    if (query.includes('shop {')) {
      return {
        shop: {
          name: 'QuickStart Demo Store',
          email: 'merchant@example.com',
          myshopifyDomain: this.shop,
          currencyCode: 'USD'
        }
      };
    }

    return { data: 'ok' };
  }
}

module.exports = ShopifyClient;
