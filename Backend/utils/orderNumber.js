// Order number generation — single source of truth (JS side).
//
// Format: ORD-<CHANNEL>-<HASH>   e.g. ORD-B2B-8F3A91, ORD-D2C-1C90E2, ORD-CUS-04B7FD
//   CHANNEL — B2B (business buyer) | D2C (consumer buyer) | CUS (custom order)
//   HASH    — a 6-char uppercase hex code derived from the row id.
//
// Why this hash: (id * odd-constant) mod 2^24 is a *bijection* on [0, 2^24),
// so every id maps to a UNIQUE 6-hex code (no collisions up to 16.7M orders)
// that looks random/non-sequential (order volume isn't guessable from it).
// The SQL derivation in models/order.js and models/customOrder.js uses the
// exact same formula, so a number computed here always matches the DB value.

const HASH_CONST = 2654435761n; // Knuth's 32-bit multiplicative constant (odd)
const MOD = 16777216n; // 2^24

function orderHash(id) {
  const n = (BigInt(id || 0) * HASH_CONST) % MOD;
  return n.toString(16).toUpperCase().padStart(6, '0');
}

// channel: 'B2B' | 'D2C' | 'CUS'
function formatOrderNumber(id, channel = 'B2B') {
  return `ORD-${channel}-${orderHash(id)}`;
}

// Map a buyer's account type to the channel code.
function channelForUserType(userType) {
  return String(userType || '').toLowerCase() === 'consumer' ? 'D2C' : 'B2B';
}

module.exports = { orderHash, formatOrderNumber, channelForUserType };
