// D2C consumer pricing.
//
// Price is driven by the admin-set gold rate + making charge (from
// GET /settings), NOT the raw mark_amount:
//
//     price = (net_weight × gold_rate) × (1 + making_charge_percent / 100)
//
// If the gold rate isn't configured yet (0), we fall back to the product's
// mark_amount so nothing shows ₹0.

export type PricingSettings = {
  gold_rate: number;
  making_charge_percent: number;
};

const toNumber = (v: any): number => {
  const n = Number(v);
  return isFinite(n) ? n : 0;
};

// Compute a consumer price for one unit of a product.
export const computeConsumerPrice = (
  product: any,
  settings: PricingSettings | null | undefined,
): number => {
  const rate = toNumber(settings?.gold_rate);
  const makingPct = toNumber(settings?.making_charge_percent);
  const netWeight = toNumber(product?.net_weight);

  if (rate > 0 && netWeight > 0) {
    const metal = netWeight * rate;
    const withMaking = metal * (1 + makingPct / 100);
    return Math.round(withMaking);
  }

  // Fallback: whatever price the product already carries.
  return Math.round(toNumber(product?.mark_amount));
};

// Format a rupee amount for display, e.g. ₹1,23,450.
export const formatRupees = (amount: number): string => {
  const n = toNumber(amount);
  return '₹' + n.toLocaleString('en-IN');
};
