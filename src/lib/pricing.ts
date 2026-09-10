export const DEPOSIT_PERCENT = 20;

export function calcDeposit(priceAgorot: number) {
  // Round to the nearest whole shekel (not agora) — a round amount like ₪21
  // is far easier to transfer over Bit/PayBox than ₪21.40.
  const rawAgorot = (priceAgorot * DEPOSIT_PERCENT) / 100;
  return Math.round(rawAgorot / 100) * 100;
}

export function formatILS(amount: number) {
  return new Intl.NumberFormat("he-IL", {
    style: "currency",
    currency: "ILS",
    // Most prices are whole shekels, but a deposit (20% of the total) can
    // land on a fractional shekel (e.g. the ₪7 spare-aravot add-on gives a
    // ₪1.40 deposit) — show it precisely instead of silently rounding away
    // the agorot, which would tell the customer to transfer the wrong amount.
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}
