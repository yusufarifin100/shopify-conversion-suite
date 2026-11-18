/**
 * Conversion Suite - Dynamic Bundle Builder Controller
 * High-Conversion Tiered Discount Calculation & Seamless Cart Drawer Integration
 */

(function () {
  'use strict';

  class BundleBuilder {
    constructor(element) {
      this.container = element;
      if (!this.container) return;

      // Configuration from dataset
      this.tier1Qty = parseInt(this.container.dataset.tier1Qty || '2', 10);
      this.tier1Discount = parseInt(this.container.dataset.tier1Discount || '10', 10);
      this.tier2Qty = parseInt(this.container.dataset.tier2Qty || '3', 10);
      this.tier2Discount = parseInt(this.container.dataset.tier2Discount || '20', 10);
      this.tier3Qty = parseInt(this.container.dataset.tier3Qty || '4', 10);
      this.tier3Discount = parseInt(this.container.dataset.tier3Discount || '30', 10);
      this.currencySymbol = this.container.dataset.currencySymbol || '$';

      // Elements
      this.tierCards = this.container.querySelectorAll('.bundle-tier-card');
      this.progressBanner = this.container.querySelector('[data-bundle-progress-banner]');
      this.statusText = this.container.querySelector('[data-bundle-status-text]');
      this.productCards = this.container.querySelectorAll('.bundle-product-card');

      // Summary Bar Elements
      this.summaryBar = this.container.querySelector('[data-bundle-summary-bar]');
      this.summaryCount = this.container.querySelector('[data-summary-count]');
      this.summaryTierStatus = this.container.querySelector('[data-summary-tier-status]');
      this.savingsBadge = this.container.querySelector('[data-summary-savings-badge]');
      this.savingsAmount = this.container.querySelector('[data-summary-savings-amount]');
      this.savingsPercent = this.container.querySelector('[data-summary-savings-percent]');
      this.originalPriceEl = this.container.querySelector('[data-summary-original-price]');
      this.finalPriceEl = this.container.querySelector('[data-summary-final-price]');
      this.addToCartBtn = this.container.querySelector('[data-bundle-add-to-cart]');
      this.btnBundlePrice = this.container.querySelector('[data-btn-bundle-price]');

      // State Map: cardElement -> { id, variantId, price, quantity }
      this.selectedItems = new Map();

      this.init();
    }

    init() {
      // Setup Product Cards
      this.productCards.forEach((card) => {
        const addBtn = card.querySelector('[data-bundle-quick-add]');
        const qtyControl = card.querySelector('[data-bundle-qty-control]');
        const minusBtn = card.querySelector('[data-qty-minus]');
        const plusBtn = card.querySelector('[data-qty-plus]');
        const qtyCount = card.querySelector('[data-qty-count]');
        const variantSelect = card.querySelector('[data-variant-select]');

        // Quick Add Click
        addBtn.addEventListener('click', () => {
          addBtn.classList.add('is-hidden');
          qtyControl.classList.remove('is-hidden');
          card.classList.add('is-selected');
          qtyCount.textContent = '1';
          this.updateCardState(card, 1);
        });

        // Plus
        plusBtn.addEventListener('click', () => {
          let current = parseInt(qtyCount.textContent || '1', 10);
          current += 1;
          qtyCount.textContent = current;
          this.updateCardState(card, current);
        });

        // Minus
        minusBtn.addEventListener('click', () => {
          let current = parseInt(qtyCount.textContent || '1', 10);
          current -= 1;
          if (current <= 0) {
            qtyControl.classList.add('is-hidden');
            addBtn.classList.remove('is-hidden');
            card.classList.remove('is-selected');
            qtyCount.textContent = '0';
            this.updateCardState(card, 0);
          } else {
            qtyCount.textContent = current;
            this.updateCardState(card, current);
          }
        });

        // Variant change listener
        if (variantSelect && variantSelect.tagName === 'SELECT') {
          variantSelect.addEventListener('change', () => {
            const currentQty = parseInt(qtyCount.textContent || '0', 10);
            if (currentQty > 0) {
              this.updateCardState(card, currentQty);
            }
          });
        }
      });

      // Tier Card direct click to highlight or guide
      this.tierCards.forEach((tierCard) => {
        tierCard.addEventListener('click', () => {
          const targetQty = parseInt(tierCard.dataset.qty, 10);
          this.highlightTierSuggestion(targetQty);
        });
      });

      // Add to Cart Button Click
      if (this.addToCartBtn) {
        this.addToCartBtn.addEventListener('click', (e) => {
          e.preventDefault();
          this.handleBundleAddToCart();
        });
      }

      this.recalculate();
    }

    updateCardState(card, quantity) {
      const variantSelect = card.querySelector('[data-variant-select]');
      let variantId = '';
      let price = 0;

      if (variantSelect) {
        if (variantSelect.tagName === 'SELECT') {
          const selectedOption = variantSelect.options[variantSelect.selectedIndex];
          variantId = selectedOption.value;
          price = parseFloat(selectedOption.dataset.price || '0');
        } else {
          variantId = variantSelect.value;
          price = parseFloat(variantSelect.dataset.price || '0');
        }
      }

      // If price wasn't on variant, read from base-price attribute
      if (!price) {
        const basePriceEl = card.querySelector('[data-base-price]');
        price = parseFloat(basePriceEl?.dataset.basePrice || '0');
      }

      if (quantity > 0) {
        this.selectedItems.set(card, {
          variantId: variantId,
          price: price, // in cents if Shopify format or raw
          quantity: quantity
        });
      } else {
        this.selectedItems.delete(card);
      }

      this.recalculate();
    }

    formatMoney(amount) {
      // If amount is in cents (> 100), convert to standard decimal
      const num = amount > 500 ? (amount / 100).toFixed(2) : amount.toFixed(2);
      return `${this.currencySymbol}${num}`;
    }

    recalculate() {
      let totalCount = 0;
      let grossTotal = 0;

      this.selectedItems.forEach((item) => {
        totalCount += item.quantity;
        grossTotal += item.price * item.quantity;
      });

      // Calculate Tier & Discount
      let appliedDiscount = 0;
      let activeTierNum = 0;
      let tierMessage = '';

      if (totalCount >= this.tier3Qty) {
        appliedDiscount = this.tier3Discount;
        activeTierNum = 3;
        tierMessage = `🎉 <strong>Maximum discount unlocked!</strong> You're saving <strong>${this.tier3Discount}% OFF</strong>!`;
      } else if (totalCount >= this.tier2Qty) {
        appliedDiscount = this.tier2Discount;
        activeTierNum = 2;
        const remaining = this.tier3Qty - totalCount;
        tierMessage = `🔥 <strong>${this.tier2Discount}% discount active!</strong> Add <strong>${remaining} more</strong> to unlock <strong>${this.tier3Discount}% OFF</strong>!`;
      } else if (totalCount >= this.tier1Qty) {
        appliedDiscount = this.tier1Discount;
        activeTierNum = 1;
        const remaining = this.tier2Qty - totalCount;
        tierMessage = `✨ <strong>${this.tier1Discount}% discount unlocked!</strong> Add <strong>${remaining} more</strong> to unlock <strong>${this.tier2Discount}% OFF</strong>!`;
      } else {
        const remaining = this.tier1Qty - totalCount;
        tierMessage = `Add <strong>${remaining} more ${remaining === 1 ? 'item' : 'items'}</strong> to unlock <strong>${this.tier1Discount}% OFF</strong>!`;
      }

      // Update active tier cards visually
      this.tierCards.forEach((tc) => {
        const tier = parseInt(tc.dataset.tier, 10);
        tc.classList.toggle('is-active', tier === activeTierNum);
      });

      // Update Progress Banner
      if (this.statusText) {
        this.statusText.innerHTML = tierMessage;
      }
      if (this.progressBanner) {
        this.progressBanner.classList.toggle('is-unlocked', appliedDiscount > 0);
      }

      // Calculate Savings & Net Price
      const savingsVal = (grossTotal * appliedDiscount) / 100;
      const netTotal = grossTotal - savingsVal;

      // Update Summary Bar
      if (this.summaryCount) this.summaryCount.textContent = totalCount;

      if (this.summaryTierStatus) {
        if (appliedDiscount > 0) {
          this.summaryTierStatus.textContent = `Unlocked ${appliedDiscount}% Tier Discount`;
        } else {
          this.summaryTierStatus.textContent = `Select ${this.tier1Qty} items to get ${this.tier1Discount}% OFF`;
        }
      }

      if (appliedDiscount > 0) {
        if (this.savingsBadge) this.savingsBadge.classList.remove('is-hidden');
        if (this.savingsAmount) this.savingsAmount.textContent = this.formatMoney(savingsVal);
        if (this.savingsPercent) this.savingsPercent.textContent = `${appliedDiscount}%`;
        if (this.originalPriceEl) {
          this.originalPriceEl.classList.remove('is-hidden');
          this.originalPriceEl.textContent = this.formatMoney(grossTotal);
        }
      } else {
        if (this.savingsBadge) this.savingsBadge.classList.add('is-hidden');
        if (this.originalPriceEl) this.originalPriceEl.classList.add('is-hidden');
      }

      const formattedNet = this.formatMoney(netTotal);
      if (this.finalPriceEl) this.finalPriceEl.textContent = formattedNet;
      if (this.btnBundlePrice) this.btnBundlePrice.textContent = formattedNet;

      // Enable/Disable ATC Button
      if (this.addToCartBtn) {
        if (totalCount >= 1) {
          this.addToCartBtn.removeAttribute('disabled');
        } else {
          this.addToCartBtn.setAttribute('disabled', 'disabled');
        }
      }
    }

    highlightTierSuggestion(qty) {
      const banner = this.container.querySelector('[data-bundle-progress-banner]');
      if (banner) {
        banner.style.transform = 'scale(1.05)';
        setTimeout(() => (banner.style.transform = ''), 200);
      }
    }

    async handleBundleAddToCart() {
      if (this.selectedItems.size === 0) return;

      const btn = this.addToCartBtn;
      btn.disabled = true;
      const originalText = btn.innerHTML;
      btn.innerHTML = `<span class="spinner" style="width:20px;height:20px;margin-right:8px;display:inline-block;border:2px solid #fff;border-top-color:transparent;border-radius:50%;animation:cart-spin 0.6s linear infinite;"></span> Adding Bundle...`;

      // Build payload items
      const itemsPayload = [];
      const timestamp = Date.now();
      let totalCount = 0;
      this.selectedItems.forEach((item) => (totalCount += item.quantity));

      let discountText = '0%';
      if (totalCount >= this.tier3Qty) discountText = `${this.tier3Discount}%`;
      else if (totalCount >= this.tier2Qty) discountText = `${this.tier2Discount}%`;
      else if (totalCount >= this.tier1Qty) discountText = `${this.tier1Discount}%`;

      this.selectedItems.forEach((item) => {
        itemsPayload.push({
          id: item.variantId,
          quantity: item.quantity,
          properties: {
            '_bundle_id': `bundle_${timestamp}`,
            '_bundle_tier': `Buy More Save More`,
            '_bundle_discount': discountText
          }
        });
      });

      try {
        if (window.CartDrawer && typeof window.CartDrawer.addMultipleItems === 'function') {
          await window.CartDrawer.addMultipleItems(itemsPayload);
        } else {
          // Fallback direct fetch
          await fetch('/cart/add.js', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ items: itemsPayload })
          });
          window.location.href = '/cart';
        }
      } catch (err) {
        console.error('Bundle Add to Cart Error:', err);
      } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
        // innerHTML replaced the price node, so re-bind it and refresh;
        // otherwise later recalculations update a detached element and the
        // button keeps showing the price from the moment it was clicked.
        this.btnBundlePrice = btn.querySelector('[data-btn-bundle-price]');
        this.recalculate();
      }
    }
  }

  // Initialize all bundle builder sections
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.bundle-builder').forEach((el) => new BundleBuilder(el));
  });
})();
