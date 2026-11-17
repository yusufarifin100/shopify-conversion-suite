/**
 * Conversion Suite - Flash Sale Countdown Timer & Coupon Clipboard
 * High-precision timer supporting both evergreen rolling and fixed date modes.
 */

(function () {
  'use strict';

  class CountdownTimer {
    constructor(element) {
      this.banner = element;
      if (!this.banner) return;

      this.mode = this.banner.dataset.countdownMode || 'evergreen';
      this.targetDateStr = this.banner.dataset.targetDate;
      this.evergreenHours = parseFloat(this.banner.dataset.evergreenHours || '12');

      this.daysEl = this.banner.querySelector('[data-timer-days]');
      this.hoursEl = this.banner.querySelector('[data-timer-hours]');
      this.minsEl = this.banner.querySelector('[data-timer-mins]');
      this.secsEl = this.banner.querySelector('[data-timer-secs]');

      this.couponBtn = this.banner.querySelector('[data-copy-coupon]');
      this.couponFeedback = this.banner.querySelector('[data-coupon-feedback]');

      this.endTime = this.resolveEndTime();
      this.initTimer();
      this.initCouponCopy();
    }

    resolveEndTime() {
      if (this.mode === 'fixed' && this.targetDateStr) {
        const parsed = new Date(this.targetDateStr).getTime();
        if (!isNaN(parsed) && parsed > Date.now()) {
          return parsed;
        }
      }

      // Evergreen rolling timer: check localStorage or create a fresh deadline
      const storageKey = `cs_countdown_deadline_${this.banner.id}`;
      const saved = localStorage.getItem(storageKey);
      const now = Date.now();

      if (saved) {
        const savedTime = parseInt(saved, 10);
        if (savedTime > now) {
          return savedTime;
        }
      }

      // Generate new deadline (e.g. 12 hours from now)
      const durationMs = this.evergreenHours * 60 * 60 * 1000;
      const newDeadline = now + durationMs;
      try {
        localStorage.setItem(storageKey, newDeadline.toString());
      } catch (e) {
        // localStorage could be disabled or full in private mode
      }
      return newDeadline;
    }

    initTimer() {
      this.tick();
      this.interval = setInterval(() => this.tick(), 1000);
    }

    tick() {
      const now = Date.now();
      let diff = this.endTime - now;

      if (diff <= 0) {
        // In evergreen mode, cycle to next period
        if (this.mode === 'evergreen') {
          const durationMs = this.evergreenHours * 60 * 60 * 1000;
          this.endTime = now + durationMs;
          const storageKey = `cs_countdown_deadline_${this.banner.id}`;
          try {
            localStorage.setItem(storageKey, this.endTime.toString());
          } catch (e) {}
          diff = this.endTime - now;
        } else {
          // Fixed mode ended: zero out and stop
          this.updateDisplay(0, 0, 0, 0);
          clearInterval(this.interval);
          return;
        }
      }

      const totalSecs = Math.floor(diff / 1000);
      const days = Math.floor(totalSecs / (3600 * 24));
      const hours = Math.floor((totalSecs % (3600 * 24)) / 3600);
      const mins = Math.floor((totalSecs % 3600) / 60);
      const secs = totalSecs % 60;

      this.updateDisplay(days, hours, mins, secs);
    }

    updateDisplay(days, hours, mins, secs) {
      if (this.daysEl) this.daysEl.textContent = String(days).padStart(2, '0');
      if (this.hoursEl) this.hoursEl.textContent = String(hours).padStart(2, '0');
      if (this.minsEl) this.minsEl.textContent = String(mins).padStart(2, '0');
      if (this.secsEl) this.secsEl.textContent = String(secs).padStart(2, '0');
    }

    initCouponCopy() {
      if (!this.couponBtn) return;

      this.couponBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        const code = this.couponBtn.dataset.copyCoupon;
        if (!code) return;

        try {
          if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(code);
          } else {
            // Fallback for non-https or older browsers
            const textArea = document.createElement('textarea');
            textArea.value = code;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            document.execCommand('copy');
            textArea.remove();
          }

          if (this.couponFeedback) {
            const originalText = this.couponFeedback.textContent;
            this.couponFeedback.textContent = '✓ Copied!';
            this.couponFeedback.style.background = '#10b981';
            this.couponFeedback.style.color = '#ffffff';

            setTimeout(() => {
              this.couponFeedback.textContent = originalText;
              this.couponFeedback.style.background = '';
              this.couponFeedback.style.color = '';
            }, 2000);
          }
        } catch (err) {
          console.error('Failed to copy coupon code', err);
        }
      });
    }
  }

  // Initialize all countdown banners
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.countdown-banner').forEach((el) => new CountdownTimer(el));
  });
})();
