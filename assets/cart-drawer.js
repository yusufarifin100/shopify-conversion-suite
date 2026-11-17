/**
 * Conversion Suite - Slide-Out AJAX Cart Drawer Controller
 * High-performance, zero-dependency vanilla JS Cart Drawer
 * Compatible with Shopify OS 2.0 & AJAX Cart API
 */

(function () {
  'use strict';

  class CartDrawerController {
    constructor() {
      this.drawer = document.getElementById('CartDrawer');
      if (!this.drawer) return;

      this.overlay = this.drawer.querySelector('.cart-drawer-overlay');
      this.closeButtons = this.drawer.querySelectorAll('[data-cart-drawer-close]');
      this.itemsContainer = this.drawer.querySelector('[data-cart-items-container]');
      this.countBadges = document.querySelectorAll('[data-cart-drawer-count], .cart-count-bubble span:first-child');
      this.shippingBar = this.drawer.querySelector('[data-shipping-bar]');
      this.shippingText = this.drawer.querySelector('[data-shipping-bar-text]');
      this.shippingFill = this.drawer.querySelector('[data-shipping-bar-fill]');
      this.subtotalAmount = this.drawer.querySelector('[data-cart-subtotal]');
      this.checkoutSubtotal = this.drawer.querySelector('[data-checkout-subtotal]');
      this.cartFooter = this.drawer.querySelector('[data-cart-footer]');
      this.loader = this.drawer.querySelector('[data-cart-drawer-loader]');

      this.currencyFormat = window.Shopify?.money_format || '${{amount}}';
      this.threshold = parseInt(this.shippingBar?.dataset.threshold || '7500', 10);

      this.initEvents();
    }

    initEvents() {
      // Close button triggers
      this.closeButtons.forEach((btn) => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          this.close();
        });
      });

      // Escape key to close
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.isOpen()) {
          this.close();
        }
      });

      // Open triggers anywhere on page (e.g. cart icon in header)
      document.querySelectorAll('[data-cart-drawer-trigger], a[href="/cart"]').forEach((trigger) => {
        trigger.addEventListener('click', (e) => {
          e.preventDefault();
          this.open();
        });
      });

      // Intercept standard Add-to-Cart form submits
      document.addEventListener('submit', (e) => {
        const form = e.target;
        if (form && form.matches('form[action*="/cart/add"]')) {
          e.preventDefault();
          this.handleFormSubmit(form);
        }
      });

      // Item quantity and remove events delegation inside cart items
      if (this.itemsContainer) {
        this.itemsContainer.addEventListener('click', (e) => {
          const qtyBtn = e.target.closest('[data-qty-change]');
          if (qtyBtn) {
            e.preventDefault();
            const delta = parseInt(qtyBtn.dataset.qtyChange, 10);
            const key = qtyBtn.dataset.key;
            const currentVal = parseInt(qtyBtn.parentElement.querySelector('[data-qty-val]')?.textContent || '1', 10);
            const newQty = Math.max(0, currentVal + delta);
            this.changeItem(key, newQty);
            return;
          }

          const removeBtn = e.target.closest('[data-item-remove]');
          if (removeBtn) {
            e.preventDefault();
            const key = removeBtn.dataset.itemRemove;
            this.changeItem(key, 0);
          }
        });
      }

      // Upsell Add Button trigger
      const upsellBtn = this.drawer.querySelector('[data-upsell-add]');
      if (upsellBtn) {
        upsellBtn.addEventListener('click', (e) => {
          e.preventDefault();
          const variantId = upsellBtn.dataset.upsellAdd;
          this.addItem({ id: variantId, quantity: 1 });
        });
      }
    }

    isOpen() {
      return this.drawer.classList.contains('is-open');
    }

    open() {
      this.drawer.classList.add('is-open');
      this.drawer.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    }

    close() {
      this.drawer.classList.remove('is-open');
      this.drawer.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }

    showLoader() {
      if (this.loader) this.loader.classList.add('is-active');
    }

    hideLoader() {
      if (this.loader) this.loader.classList.remove('is-active');
    }

    // Money Formatter fallback
    formatMoney(cents) {
      if (typeof window.Shopify !== 'undefined' && typeof window.Shopify.formatMoney === 'function') {
        return window.Shopify.formatMoney(cents, this.currencyFormat);
      }
      const dollars = (cents / 100).toFixed(2);
      return '$' + dollars;
    }

    // Intercept standard Add-to-Cart form
    async handleFormSubmit(form) {
      const submitBtn = form.querySelector('[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.classList.add('is-loading');
      }

      const formData = new FormData(form);

      try {
        const response = await fetch('/cart/add.js', {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
          },
          body: formData
        });

        if (!response.ok) {
          throw new Error('Failed to add item to cart');
        }

        await this.refresh();
        this.open();
      } catch (err) {
        console.error('Conversion Suite Cart Error:', err);
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.classList.remove('is-loading');
        }
      }
    }

    // Add item directly via JS object: { id, quantity, properties }
    async addItem(itemData) {
      this.showLoader();
      try {
        const response = await fetch('/cart/add.js', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(itemData)
        });

        if (!response.ok) throw new Error('Add to cart failed');

        await this.refresh();
        this.open();
      } catch (error) {
        console.error('Error adding item to cart:', error);
      } finally {
        this.hideLoader();
      }
    }

    // Add multiple items simultaneously (ideal for bundle builders)
    async addMultipleItems(itemsArray) {
      this.showLoader();
      try {
        const response = await fetch('/cart/add.js', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({ items: itemsArray })
        });

        if (!response.ok) throw new Error('Add bundle items failed');

        await this.refresh();
        this.open();
      } catch (error) {
        console.error('Error adding bundle items:', error);
      } finally {
        this.hideLoader();
      }
    }

    // Update or remove line item
    async changeItem(key, quantity) {
      this.showLoader();
      try {
        const response = await fetch('/cart/change.js', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({ id: key, quantity: quantity })
        });

        if (!response.ok) throw new Error('Could not update cart quantity');

        const updatedCart = await response.json();
        this.renderCart(updatedCart);
      } catch (error) {
        console.error('Error changing cart item:', error);
      } finally {
        this.hideLoader();
      }
    }

    // Fetch latest cart object and re-render
    async refresh() {
      try {
        const response = await fetch('/cart.js', {
          headers: { 'Accept': 'application/json' }
        });
        const cart = await response.json();
        this.renderCart(cart);
      } catch (error) {
        console.error('Error fetching cart:', error);
      }
    }

    // Render entire drawer DOM according to cart state
    renderCart(cart) {
      // 1. Update count badges
      const count = cart.item_count || 0;
      this.countBadges.forEach((b) => (b.textContent = count));

      // 2. Update Free Shipping Progress Bar
      if (this.shippingBar) {
        const total = cart.total_price || 0;
        const diff = this.threshold - total;
        const pct = Math.min(100, Math.round((total / this.threshold) * 100));

        if (this.shippingFill) {
          this.shippingFill.style.width = pct + '%';
        }

        if (this.shippingText) {
          if (diff > 0) {
            this.shippingText.innerHTML = `Add <strong>${this.formatMoney(diff)}</strong> more to unlock <strong>FREE SHIPPING!</strong> 🚚`;
          } else {
            this.shippingText.innerHTML = `🎉 <strong>Congratulations!</strong> You unlocked <strong>FREE SHIPPING!</strong>`;
          }
        }
      }

      // 3. Update Subtotal
      const formattedTotal = this.formatMoney(cart.total_price || 0);
      if (this.subtotalAmount) this.subtotalAmount.textContent = formattedTotal;
      if (this.checkoutSubtotal) this.checkoutSubtotal.textContent = formattedTotal;

      // 4. Toggle empty vs populated state
      if (count === 0) {
        if (this.cartFooter) this.cartFooter.classList.add('is-hidden');
        if (this.itemsContainer) {
          this.itemsContainer.innerHTML = `
            <div class="cart-drawer__empty">
              <div class="cart-drawer__empty-icon">
                <svg class="icon icon-cart" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="9" cy="21" r="1"></circle>
                  <circle cx="20" cy="21" r="1"></circle>
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                </svg>
              </div>
              <h3 class="cart-drawer__empty-title">Your cart is empty</h3>
              <p class="cart-drawer__empty-desc">Discover our bestsellers and unlock special bundle savings today!</p>
              <a href="/collections/all" class="cart-drawer__continue-btn" data-cart-drawer-close>Explore Products</a>
            </div>
          `;
          // re-bind close button inside empty state
          const emptyClose = this.itemsContainer.querySelector('[data-cart-drawer-close]');
          if (emptyClose) {
            emptyClose.addEventListener('click', (e) => {
              e.preventDefault();
              this.close();
            });
          }
        }
        return;
      }

      // 5. Populate items
      if (this.cartFooter) this.cartFooter.classList.remove('is-hidden');
      if (this.itemsContainer) {
        let itemsHTML = '<div class="cart-drawer__items" data-cart-items>';

        cart.items.forEach((item, index) => {
          const originalPrice = item.original_line_price > item.final_line_price
            ? `<s class="cart-item__original-price">${this.formatMoney(item.original_line_price)}</s>`
            : '';

          const variantTitle = item.variant_title && item.variant_title !== 'Default Title'
            ? `<p class="cart-item__variant">${item.variant_title}</p>`
            : '';

          const bundleBadge = (item.properties && (item.properties._bundle_tier || item.properties.Bundle))
            ? `<div class="cart-item__bundle-badge">✨ Bundle Saver (${item.properties._bundle_discount || 'Special Offer'})</div>`
            : '';

          const itemImage = item.image
            ? `<img src="${item.image}" alt="${item.title}" class="cart-item__image" width="90" height="90" loading="lazy">`
            : `<div class="cart-item__image-placeholder"></div>`;

          itemsHTML += `
            <div class="cart-drawer__item" data-line-item-key="${item.key}" data-line="${index + 1}">
              <div class="cart-item__image-wrap">
                ${itemImage}
              </div>
              <div class="cart-item__details">
                <div class="cart-item__head">
                  <a href="${item.url}" class="cart-item__title">${item.product_title || item.title}</a>
                  <button type="button" class="cart-item__remove-btn" data-item-remove="${item.key}" aria-label="Remove ${item.title}">
                    <svg class="icon icon-trash" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                  </button>
                </div>
                ${variantTitle}
                ${bundleBadge}
                <div class="cart-item__footer">
                  <div class="cart-item__quantity-selector">
                    <button type="button" class="qty-btn qty-btn--minus" data-qty-change="-1" data-key="${item.key}" aria-label="Decrease quantity">&minus;</button>
                    <span class="qty-number" data-qty-val>${item.quantity}</span>
                    <button type="button" class="qty-btn qty-btn--plus" data-qty-change="1" data-key="${item.key}" aria-label="Increase quantity">&#43;</button>
                  </div>
                  <div class="cart-item__price-box">
                    ${originalPrice}
                    <span class="cart-item__final-price">${this.formatMoney(item.final_line_price)}</span>
                  </div>
                </div>
              </div>
            </div>
          `;
        });

        itemsHTML += '</div>';
        this.itemsContainer.innerHTML = itemsHTML;
      }
    }
  }

  // Initialize and attach to window
  document.addEventListener('DOMContentLoaded', () => {
    window.CartDrawer = new CartDrawerController();
  });
})();
