# 🚀 shopify-conversion-suite
### Full-Stack High-Conversion Marketing Toolkit & Shopify App (OS 2.0)

[![Vercel Deployment](https://img.shields.io/badge/Live%20Demo-Vercel-black?style=for-the-badge&logo=vercel)](https://shopify-conversion-suite-peach.vercel.app)
[![GitHub Repository](https://img.shields.io/badge/GitHub-Repository-181717?style=for-the-badge&logo=github)](https://github.com/yusufarifin100/shopify-conversion-suite)

> Engineered specifically for high-growth direct-to-consumer (DTC) brands obsessed with **Conversion Rate Optimization (CRO)**, **Average Order Value (AOV)**, and frictionless shopping experiences.

👉 **Live Interactive Storefront Demo:** [https://shopify-conversion-suite-peach.vercel.app](https://shopify-conversion-suite-peach.vercel.app)  
👉 **Live Merchant Command Center:** [https://shopify-conversion-suite-peach.vercel.app/admin](https://shopify-conversion-suite-peach.vercel.app/admin)

---

## 🏗️ Full-Stack System Architecture

```
                                  SHOPIFY ECOSYSTEM
                                          │
       ┌──────────────────────────────────┴──────────────────────────────────┐
       ▼                                                                     ▼
[STOREFRONT / THEME LAYER]                                          [BACKEND & APP ENGINE]
(Liquid, CSS, Vanilla JS)                                           (Node.js, Express, SQLite)
• bundle-builder.liquid (Tiered Savings)                            • server.js (Express Server)
• cart-drawer.liquid (AJAX Slide-Out)                               • routes/discounts.js (GraphQL Automatic Discounts)
• countdown-timer.liquid (Flash Sale Urgency)                       • routes/webhooks.js (HMAC-verified Orders Consumer)
• assets/cart-drawer.js (/cart/add.js, /cart/change.js)             • services/analyticsService.js (AOV & CRO Metrics)
• Free Shipping Progress Bar ($75 Target)                           • public/admin.html (Merchant Command Center)
```

---

## 🎁 Feature 1: Dynamic "Buy More, Save More" Bundle Builder
**Files:** `sections/bundle-builder.liquid` | `assets/bundle-builder.js` | `assets/bundle-builder.css`

* **Tiered Discount Engine:**
  * **Tier 1:** Buy 2 items &rarr; Save 10%
  * **Tier 2 (Most Popular):** Buy 3 items &rarr; Save 20%
  * **Tier 3 (Best Value):** Buy 4+ items &rarr; Save 30%
* **Live Calculation:** Real-time client-side calculation before adding to cart. Customers see original price strikethroughs, exact dollar savings (`Save $18.40`), and applied discount percentages.
* **Backend Validation:** Connected to Shopify's **GraphQL Automatic Discount Engine** so discounts are officially enforced at checkout (anti-tamper).
* **1-Click Bundle Checkout:** Packages all selected bundle items with custom bundle line item properties (`_bundle_id`, `_bundle_tier`, `_bundle_discount`) and directly dispatches them to the Cart Drawer via `fetch('/cart/add.js')`.

---

## 🛒 Feature 2: Slide-Out AJAX Cart Drawer
**Files:** `snippets/cart-drawer.liquid` | `assets/cart-drawer.js` | `assets/cart-drawer.css`

* **Instant Sliding Experience:** Smooth cubic-bezier slide-in from the right with background blur overlay. Zero page reloads upon clicking "Add to Cart".
* **Free Shipping Progress Bar (US Brand Favorite):**
  * Fully configurable threshold (e.g., `$75.00` / 7500 cents).
  * Live dynamic feedback: *"Add $15.00 more to unlock FREE SHIPPING! 🚚"*
  * Unlocked celebration state: *"🎉 Congratulations! You unlocked FREE SHIPPING!"*
* **AJAX Cart API Lifecycle:** Native zero-dependency fetch requests to `/cart/add.js`, `/cart.js`, and `/cart/change.js`.
* **In-Cart Quantity Modifiers:** Smooth quantity increments (`+`), decrements (`-`), and line item removal with loading spinner overlay.
* **1-Click In-Cart Upsell Booster:** Showcase high-margin mystery gifts, mini boosters, or warranties inside the drawer.

---

## ⏱️ Feature 3: Flash Sale Countdown Urgency Banner
**Files:** `sections/countdown-timer.liquid` | `assets/countdown-timer.js` | `assets/countdown-timer.css`

* **Dynamic Dual-Mode Timer:**
  * **Evergreen Rolling Mode:** Resets every *X* hours (e.g., 12h or 24h) for each visitor stored via localStorage for persistent urgency.
  * **Fixed Target Date Mode:** Counts down to a scheduled marketing launch (e.g., `2026-12-31T23:59:59`).
* **One-Tap Coupon Pill:** Interactive discount code button (`SAVE30`) that copies the code to the user's clipboard and displays an animated *"✓ Copied!"* tooltip.

---

## ⚡ Backend Engine & Merchant Command Center
**Directory:** `server/`

* **Shopify GraphQL Automatic Discounts:** Creates native backend `DiscountAutomaticBasic` rules via Shopify Admin GraphQL API.
* **Webhook Consumer with HMAC Verification:** Listens to `orders/paid` webhooks, parses Conversion Suite bundle metadata, and logs revenue metrics.
* **Executive Merchant Dashboard (`/admin`):**
  * Total CRO Revenue Generated
  * Average Order Value (AOV) Lift tracking
  * Free Shipping Unlock Rate percentage
  * Real-Time Order Stream with interactive simulator

---

## 📁 Repository Structure

```
shopify-conversion-suite/
├── assets/
│   ├── bundle-builder.css          # Styling for tiered bundle builder
│   ├── bundle-builder.js           # Real-time bundle calculation & ATC logic
│   ├── cart-drawer.css             # Slide-out drawer animations & styling
│   ├── cart-drawer.js              # Shopify AJAX Cart controller & Free Shipping Bar
│   ├── countdown-timer.css         # Urgency banner, flip ticker & coupon pill styles
│   └── countdown-timer.js          # Dynamic countdown interval & clipboard logic
├── config/
│   └── settings_schema.json        # Shopify Theme Customizer configuration
├── demo/
│   └── index.html                  # Standalone interactive browser preview with Mock AJAX Cart
├── layout/
│   └── theme.liquid                # OS 2.0 layout reference with Cart Drawer integration
├── locales/
│   └── en.default.json             # Localization strings
├── sections/
│   ├── bundle-builder.liquid       # OS 2.0 Section with product blocks & customizable tiers
│   └── countdown-timer.liquid      # OS 2.0 Section with evergreen/fixed date timer settings
├── server/
│   ├── config/shopify.js           # Shopify GraphQL Admin API client
│   ├── database/db.js              # Relational JSON-backed persistence store
│   ├── middleware/verifyHmac.js    # HMAC signature security verification
│   ├── routes/                     # API, Discounts, Webhooks & Analytics routes
│   ├── services/                   # Business logic for discounts & webhook parsing
│   ├── public/admin.html           # Merchant Command Center UI
│   ├── server.js                   # Express application entrypoint
│   └── package.json
├── shopify.app.toml                 # Shopify CLI App Manifest configuration
├── snippets/
│   ├── cart-drawer.liquid          # Slide-out cart drawer markup
│   ├── icon-cart.liquid            # Inline SVG Cart Icon
│   ├── icon-close.liquid           # Inline SVG Close Icon
│   ├── icon-trash.liquid           # Inline SVG Trash Icon
│   └── icon-check.liquid           # Inline SVG Checkmark Icon
└── README.md
```

---

## 🚀 How to Run

### 1. Run the Backend Server & Merchant Dashboard
```bash
cd server
npm start
```
* **Server URL:** `http://localhost:3000`
* **Merchant Command Center:** `http://localhost:3000/admin`
* Test the live order stream using the **"⚡ Simulate Customer Order Webhook"** button!

### 2. Run the Storefront Interactive Demo
Open `demo/index.html` in any web browser to test the client-side customer experience (Urgency Banner &rarr; Bundle Builder &rarr; Slide-Out Cart Drawer).

---

## 📄 License
MIT License. Created for high-growth e-commerce merchants and Shopify theme engineers.
