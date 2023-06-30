const crypto = require('crypto');

function generateSessionSecret() {
  const sessionSecretBytes = crypto.randomBytes(32);
  const sessionSecret = sessionSecretBytes.toString('hex');
  return sessionSecret;
}

module.exports = generateSessionSecret;