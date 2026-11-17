/**
 * Conversion Suite - Shopify HMAC Security Middleware
 * Verifies that requests authentically originate from Shopify servers
 */

const crypto = require('crypto');

/**
 * Validates Shopify Webhook HMAC signatures
 */
function verifyWebhookHmac(req, res, next) {
  const hmacHeader = req.get('X-Shopify-Hmac-Sha256');
  const secret = process.env.SHOPIFY_API_SECRET;

  if (!secret) {
    console.warn('⚠️ SHOPIFY_API_SECRET is missing. Skipping HMAC check in development mode.');
    return next();
  }

  if (!hmacHeader) {
    return res.status(401).json({ error: 'Missing X-Shopify-Hmac-Sha256 header' });
  }

  try {
    const rawBody = req.rawBody || JSON.stringify(req.body);
    const hash = crypto
      .createHmac('sha256', secret)
      .update(rawBody, 'utf8')
      .digest('base64');

    if (crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(hmacHeader))) {
      return next();
    } else {
      return res.status(403).json({ error: 'Invalid HMAC signature' });
    }
  } catch (err) {
    console.error('HMAC verification error:', err);
    return res.status(403).json({ error: 'Failed to verify HMAC' });
  }
}

/**
 * Validates Shopify App Proxy HMAC signatures
 */
function verifyAppProxyHmac(req, res, next) {
  const query = { ...req.query };
  const signature = query.signature;
  const secret = process.env.SHOPIFY_API_SECRET;

  if (!secret || process.env.NODE_ENV === 'development') {
    return next();
  }

  if (!signature) {
    return res.status(401).json({ error: 'Missing proxy signature' });
  }

  delete query.signature;

  const sortedParams = Object.keys(query)
    .sort()
    .map((key) => `${key}=${Array.isArray(query[key]) ? query[key].join(',') : query[key]}`)
    .join('');

  const calculatedSignature = crypto
    .createHmac('sha256', secret)
    .update(sortedParams)
    .digest('hex');

  if (calculatedSignature === signature) {
    return next();
  }

  return res.status(403).json({ error: 'Invalid proxy signature' });
}

module.exports = {
  verifyWebhookHmac,
  verifyAppProxyHmac
};
