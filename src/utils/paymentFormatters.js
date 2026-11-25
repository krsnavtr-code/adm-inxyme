export const PAYMENT_METHODS = [
  { value: "upi", label: "UPI", hint: "GPay / PhonePe / Paytm" },
  { value: "bank_transfer", label: "Bank Transfer", hint: "NEFT / IMPS / RTGS" },
  { value: "razorpay", label: "Razorpay", hint: "Online Gateway" },
  { value: "cash", label: "Cash", hint: "Offline Receipt" },
  { value: "card", label: "Card", hint: "Credit / Debit" },
  { value: "cheque", label: "Cheque / DD", hint: "Bank Instrument" },
];

export const PAYMENT_METHOD_LABEL_MAP = {
  upi: "UPI Transfer",
  bank_transfer: "Bank Transfer (NEFT / IMPS / RTGS)",
  razorpay: "Razorpay (Online)",
  cash: "Cash",
  card: "Credit / Debit Card",
  cheque: "Cheque / DD",
  other: "Other",
};

export const INSTALLMENT_PRESETS = [
  "Full Course Fee",
  "Registration Fee",
  "1st Installment",
  "2nd Installment",
  "Final Installment",
  "Certification Fee",
];

export const getPaymentMethodLabel = (method) => {
  if (!method) return "Razorpay";
  return PAYMENT_METHOD_LABEL_MAP[method] || String(method).replace(/_/g, " ").toUpperCase();
};

export const formatCurrencyINR = (amount, showDecimals = false) => {
  const num = Number(amount) || 0;
  return `₹${num.toLocaleString("en-IN", {
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: 2,
  })}`;
};

/**
 * Resolve effective course fee (in INR) from a Course object.
 */
export const resolveCoursePrice = (courseObj) => {
  if (!courseObj || courseObj.isFree) return 0;
  const price = Number(courseObj.price);
  if (!Number.isNaN(price) && price > 0) return price;
  const originalPrice = Number(courseObj.originalPrice);
  if (!Number.isNaN(originalPrice) && originalPrice > 0) return originalPrice;
  return !Number.isNaN(price) && price >= 0 ? price : 0;
};

/**
 * Compute discount amount (in INR) and net payable fee from total course fee and user discount percentage (0-100).
 */
export const computeUserDiscountFromFee = (totalFee, discountPercent) => {
  const numericFee = Math.max(0, Number(totalFee) || 0);
  const pct = Math.min(100, Math.max(0, Number(discountPercent) || 0));
  const discountAmount =
    numericFee > 0 && pct > 0 ? Number(((numericFee * pct) / 100).toFixed(2)) : 0;
  const netPayable = Number(Math.max(0, numericFee - discountAmount).toFixed(2));
  return {
    totalFee: numericFee,
    discountPercent: pct,
    discountAmount,
    netPayable,
  };
};

export const computeGstBreakup = (amount, gstRate = 18, gstInclusive = true) => {
  const numericAmount = Math.max(0, Number(amount) || 0);
  const rate = Math.max(0, Number(gstRate ?? 18));

  if (rate === 0 || numericAmount === 0) {
    return {
      gstRate: rate,
      gstInclusive: Boolean(gstInclusive),
      taxableValue: Number(numericAmount.toFixed(2)),
      cgstRate: 0,
      sgstRate: 0,
      cgstAmount: 0,
      sgstAmount: 0,
      totalGst: 0,
      grandTotal: Number(numericAmount.toFixed(2)),
    };
  }

  if (gstInclusive) {
    const taxableValue = Number((numericAmount / (1 + rate / 100)).toFixed(2));
    const totalGst = Number((numericAmount - taxableValue).toFixed(2));
    const cgstAmount = Number((totalGst / 2).toFixed(2));
    const sgstAmount = Number((totalGst - cgstAmount).toFixed(2));
    return {
      gstRate: rate,
      gstInclusive: true,
      taxableValue,
      cgstRate: Number((rate / 2).toFixed(2)),
      sgstRate: Number((rate / 2).toFixed(2)),
      cgstAmount,
      sgstAmount,
      totalGst,
      grandTotal: Number(numericAmount.toFixed(2)),
    };
  }

  const taxableValue = Number(numericAmount.toFixed(2));
  const cgstAmount = Number(((taxableValue * (rate / 2)) / 100).toFixed(2));
  const sgstAmount = Number(((taxableValue * (rate / 2)) / 100).toFixed(2));
  const totalGst = Number((cgstAmount + sgstAmount).toFixed(2));
  return {
    gstRate: rate,
    gstInclusive: false,
    taxableValue,
    cgstRate: Number((rate / 2).toFixed(2)),
    sgstRate: Number((rate / 2).toFixed(2)),
    cgstAmount,
    sgstAmount,
    totalGst,
    grandTotal: Number((taxableValue + totalGst).toFixed(2)),
  };
};
