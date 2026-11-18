/**
 * Conversion Suite - Database Manager
 * Portable, persistent JSON-backed relational store for Merchant Settings, Tiers, & Analytics
 */

const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, 'data.json');

const INITIAL_STATE = {
  merchants: [
    {
      shop_domain: 'aya-store-b729lzvt.myshopify.com',
      access_token: 'shpat_demo_conversion_suite_token',
      free_shipping_threshold: 7500, // $75.00
      enable_cart_upsell: true,
      upsell_product_id: 'prod_upsell_glow',
      currency: 'USD',
      created_at: new Date().toISOString()
    }
  ],
  bundle_tiers: [
    {
      id: 1,
      shop_domain: 'aya-store-b729lzvt.myshopify.com',
      tier_number: 1,
      min_quantity: 2,
      discount_percentage: 10,
      title: 'Starter Bundle',
      badge: 'Starter Tier',
      shopify_discount_code: 'BUNDLE10'
    },
    {
      id: 2,
      shop_domain: 'aya-store-b729lzvt.myshopify.com',
      tier_number: 2,
      min_quantity: 3,
      discount_percentage: 20,
      title: 'Popular Routine',
      badge: '🔥 Most Popular',
      shopify_discount_code: 'BUNDLE20'
    },
    {
      id: 3,
      shop_domain: 'aya-store-b729lzvt.myshopify.com',
      tier_number: 3,
      min_quantity: 4,
      discount_percentage: 30,
      title: 'Maximum Value',
      badge: '👑 Best Value',
      shopify_discount_code: 'BUNDLE30'
    }
  ],
  analytics_events: [
    {
      id: 'evt_1',
      shop_domain: 'aya-store-b729lzvt.myshopify.com',
      event_type: 'order_completed',
      order_id: '1001',
      total_price: 114.00,
      bundle_savings: 28.50,
      free_shipping_unlocked: true,
      tier_applied: 'Most Popular (20%)',
      timestamp: new Date(Date.now() - 3600000 * 24).toISOString()
    },
    {
      id: 'evt_2',
      shop_domain: 'aya-store-b729lzvt.myshopify.com',
      event_type: 'order_completed',
      order_id: '1002',
      total_price: 88.00,
      bundle_savings: 9.77,
      free_shipping_unlocked: true,
      tier_applied: 'Starter Tier (10%)',
      timestamp: new Date(Date.now() - 3600000 * 12).toISOString()
    },
    {
      id: 'evt_3',
      shop_domain: 'aya-store-b729lzvt.myshopify.com',
      event_type: 'order_completed',
      order_id: '1003',
      total_price: 145.00,
      bundle_savings: 62.14,
      free_shipping_unlocked: true,
      tier_applied: 'Best Value (30%)',
      timestamp: new Date(Date.now() - 3600000 * 3).toISOString()
    }
  ]
};

class Database {
  constructor() {
    this.data = this.load();
  }

  load() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (err) {
      console.error('Error reading database file, resetting to initial state:', err);
    }
    this.save(INITIAL_STATE);
    return JSON.parse(JSON.stringify(INITIAL_STATE));
  }

  save(data = this.data) {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error saving database:', err);
    }
  }

  // Table queries
  table(name) {
    if (!this.data[name]) {
      this.data[name] = [];
    }
    const tableData = this.data[name];

    return {
      find: (filterFn) => {
        if (!filterFn) return [...tableData];
        return tableData.filter(filterFn);
      },
      findOne: (filterFn) => {
        return tableData.find(filterFn) || null;
      },
      insert: (record) => {
        tableData.push(record);
        this.save();
        return record;
      },
      update: (filterFn, updateFields) => {
        let count = 0;
        tableData.forEach((row, index) => {
          if (filterFn(row)) {
            tableData[index] = { ...row, ...updateFields, updated_at: new Date().toISOString() };
            count++;
          }
        });
        if (count > 0) this.save();
        return count;
      },
      delete: (filterFn) => {
        const initialLength = tableData.length;
        this.data[name] = tableData.filter((row) => !filterFn(row));
        const deletedCount = initialLength - this.data[name].length;
        if (deletedCount > 0) this.save();
        return deletedCount;
      }
    };
  }
}

module.exports = new Database();
