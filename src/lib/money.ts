/** Format integer paise as a localized currency string, e.g. 149900 -> "₹1,499". */
export function formatPaise(paise: number, currency = "INR") {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(paise / 100);
}

/** Free shipping above ₹1,500, else a flat ₹99. Single source of truth. */
export const FREE_SHIPPING_THRESHOLD = 150000; // ₹1,500 in paise
export const FLAT_SHIPPING_FEE = 9900; // ₹99 in paise

export function computeShipping(subtotal: number) {
  return subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : FLAT_SHIPPING_FEE;
}
