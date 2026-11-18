# Conversion Suite

A Shopify Online Store 2.0 toolkit for conversion rate optimization (CRO): a tiered **Buy More, Save More bundle builder**, an **AJAX slide-out cart drawer** with a free-shipping progress bar, and a **flash-sale countdown banner**. It ships as a theme plus a small Node.js/Express companion backend and a Shopify app manifest.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Vercel-black?style=for-the-badge&logo=vercel)](https://shopify-conversion-suite-peach.vercel.app)
[![GitHub Repository](https://img.shields.io/badge/GitHub-Repository-181717?style=for-the-badge&logo=github)](https://github.com/yusufarifin100/shopify-conversion-suite)

- **Interactive storefront demo (mock cart, no Shopify needed):** https://shopify-conversion-suite-peach.vercel.app
- **Merchant dashboard (analytics UI):** https://shopify-conversion-suite-peach.vercel.app/admin

---

## Status

Built and tested end to end on a Shopify development store.

| Area | Status |
|---|---|
| Theme (bundle builder, cart drawer, countdown) | Working on a live dev-store theme |
| Tiered discounts at checkout (10% / 20% / 30%) | Working, verified in cart and checkout |
| Shopify app registered in the Dev Dashboard and installed | Working |
| Backend deployed on Vercel | Working (dashboard and analytics routes) |
| `orders/paid` webhook subscription | **Not enabled**, see [Known limitations](#known-limitations) |
| Backend GraphQL discount sync (`/api/discounts/sync`) | Implemented, **not wired up** (discounts were created in the Shopify Admin) |

---

## Features

### 1. Bundle builder
`sections/bundle-builder.liquid` · `assets/bundle-builder.js` · `assets/bundle-builder.css`

- Product cards are **section blocks**, so a merchant picks the products in the theme editor.
- Three configurable tiers (defaults): 2 items save 10%, 3 items save 20%, 4+ items save 30%.
- Live client-side pricing: original price strikethrough, exact savings, and a "add N more to unlock X%" hint.
- "Add Bundle to Cart" posts all selected variants in one `/cart/add.js` call, tagging each line with bundle properties (`_bundle_id`, `_bundle_tier`, `_bundle_discount`).

### 2. Slide-out cart drawer
`snippets/cart-drawer.liquid` · `assets/cart-drawer.js` · `assets/cart-drawer.css`

- Opens without a page reload; uses the Cart AJAX API (`/cart/add.js`, `/cart.js`, `/cart/change.js`).
- Free-shipping progress bar with a configurable threshold (default $75).
- Quantity controls and line removal; shows the active discount label per line.
- Optional in-cart upsell block, driven by theme settings (`enable_cart_upsell`, `cart_upsell_product`).

### 3. Countdown banner
`sections/countdown-timer.liquid` · `assets/countdown-timer.js` · `assets/countdown-timer.css`

- Two modes via section settings: **evergreen** (rolling window per visitor, stored in `localStorage`) or a **fixed target date**.
- Tap-to-copy coupon pill.

### 4. Companion backend
`server/` · `api/index.js` · `vercel.json`

- Express app deployed to Vercel as a serverless function.
- `public/admin.html`: merchant dashboard (revenue, AOV, free-shipping unlock rate, order stream with a simulator).
- `services/discountService.js`: creates `DiscountAutomaticBasic` rules through the Admin GraphQL API (one per tier).
- `routes/webhooks.js` + `middleware/verifyHmac.js`: `orders/paid` consumer with HMAC verification (code present; subscription currently disabled).
- Persistence is a JSON-file store (`server/database/db.js`), suitable for a demo, not for production.

---

## How the discount works

The bundle builder shows the savings in the browser, but the **price at checkout comes from Shopify**, not from the page. Three automatic discounts do that:

| Title | Value | Minimum quantity |
|---|---|---|
| Conversion Suite - Buy 2+ Save 10% | 10% | 2 |
| Conversion Suite - Buy 3+ Save 20% | 20% | 3 |
| Conversion Suite - Buy 4+ Save 30% | 30% | 4 |

They apply to the bundle products only and do not combine with each other, so Shopify applies the single best tier. Checked on a dev store for 2, 3 and 4 items: the cart and the checkout summary show the same totals as the bundle builder (for example 4 items: $135.00 down to $94.50, saving $40.50).

---

## Repository layout

```
├── assets/            # Theme JS/CSS (bundle builder, cart drawer, countdown)
├── config/            # settings_schema.json, settings_data.json (default bundle blocks)
├── layout/theme.liquid
├── locales/en.default.json
├── sections/          # bundle-builder, countdown-timer, countdown-banner
├── snippets/          # cart-drawer + inline SVG icons
├── templates/         # index, product, cart, 404
├── demo/index.html    # Standalone demo with a mock AJAX cart
├── server/            # Express backend and merchant dashboard
├── api/index.js       # Vercel serverless entry
├── shopify.app.toml   # Shopify app manifest (Shopify CLI)
└── vercel.json
```

---

## Run it

### Backend and dashboard (local)
```bash
cd server
npm install
cp .env.example .env   # fill in your own values
npm start
```
Dashboard: http://localhost:3000/admin

### Theme on a development store (Shopify CLI)
```bash
npm install -g @shopify/cli
shopify theme push --store YOUR-STORE.myshopify.com --unpublished --theme "conversion-suite" \
  --ignore "server/*" --ignore "api/*" --ignore "demo/*" --ignore "*.zip" \
  --ignore "package.json" --ignore "vercel.json" --ignore "shopify.app.toml" --ignore "README.md"
```
Then add your products to the bundle builder blocks in the theme editor, and create the three automatic discounts from the table above in **Discounts → Create discount → Amount off products → Automatic discount** (minimum quantity of items, specific products, no combinations).

### Standalone demo
Open `demo/index.html` in a browser.

### Environment variables
See `server/.env.example`. Never commit real secrets; `.env*` is git-ignored.

---

## Known limitations

- **`orders/paid` webhook is not subscribed.** Shopify only allows this topic for apps with Protected Customer Data access, which requires answering a data-protection questionnaire (retention policy, encryption at rest, merchant agreements). The handler and HMAC middleware are in the repo; the subscription is commented out in `shopify.app.toml`. Satisfying that questionnaire would need retention and encryption work first.
- **Persistence is a JSON file.** On Vercel's read-only serverless filesystem it will not persist writes. A real database is required before storing analytics permanently.
- **`/api/discounts/sync` has no authentication.** It is inert without an Admin API token in the environment, but should be protected before one is added.
- **Demo content.** The bundle builder ships with sample apparel products created on a dev store; the product images are placeholders.

---

## License
MIT
