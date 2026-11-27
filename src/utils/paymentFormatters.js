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

export const formatDiscountPercent = (discountPercent) => {
  const pct = Math.min(100, Math.max(0, Number(discountPercent) || 0));
  return `${Number(pct.toFixed(2))}%`;
};

/**
 * Compute discount amount (in INR) and percentage (0-100) from the course price captured at save time
 * and the final price at which the course is offered to the student.
 */
export const computeDiscountFromOfferedPrice = (originalCoursePrice, offeredPrice) => {
  const basePrice = Math.max(0, Number(originalCoursePrice) || 0);
  const agreedPrice = Math.max(0, Number(offeredPrice) || 0);
  if (basePrice <= 0) {
    return {
      originalCoursePrice: 0,
      offeredPrice: Number(agreedPrice.toFixed(2)),
      discountAmount: 0,
      discountPercent: 0,
    };
  }
  const clampedOffered = Math.min(basePrice, agreedPrice);
  const discountAmount = Number((basePrice - clampedOffered).toFixed(2));
  const rawPercent = ((basePrice - clampedOffered) / basePrice) * 100;
  const discountPercent = Math.min(100, Math.max(0, Number(rawPercent.toFixed(6))));
  return {
    originalCoursePrice: Number(basePrice.toFixed(2)),
    offeredPrice: Number(clampedOffered.toFixed(2)),
    discountAmount,
    discountPercent,
  };
};

/**
 * Find matching saved pricing snapshot on a user object for a courseId or courseTitle.
 */
export const findMatchingCoursePricingSnapshot = (userObj, courseId = "", courseTitle = "") => {
  if (!userObj) return null;

  const targetId = courseId?._id ? String(courseId._id) : courseId ? String(courseId) : "";
  const targetTitle = String(courseTitle || "").trim().toLowerCase();

  const entries = Array.isArray(userObj.courseDiscounts) ? userObj.courseDiscounts : [];
  if (entries.length > 0) {
    if (targetId) {
      const byId = entries.find((item) => item?.courseId && String(item.courseId) === targetId);
      if (byId && Number(byId.originalCoursePrice) > 0) return byId;
    }
    if (targetTitle) {
      const byTitle = entries.find(
        (item) =>
          item?.courseTitle &&
          String(item.courseTitle).trim().toLowerCase() === targetTitle
      );
      if (byTitle && Number(byTitle.originalCoursePrice) > 0) return byTitle;
    }
  }

  const hasTopLevelSnapshot =
    Number(userObj.discountCoursePrice) > 0 &&
    userObj.discountedCoursePrice !== undefined &&
    userObj.discountedCoursePrice !== null;

  if (!hasTopLevelSnapshot) return null;

  const snapId = userObj.discountCourseId?._id
    ? String(userObj.discountCourseId._id)
    : userObj.discountCourseId
      ? String(userObj.discountCourseId)
      : "";
  const snapTitle = String(userObj.discountCourseTitle || "").trim().toLowerCase();

  const matchesById = Boolean(targetId && snapId && targetId === snapId);
  const matchesByTitle = Boolean(targetTitle && snapTitle && targetTitle === snapTitle);
  const matchesGenericCustom = !targetId && !snapId && (!snapTitle || snapTitle === targetTitle);

  if (matchesById || matchesByTitle || matchesGenericCustom) {
    const originalCoursePrice = Number(userObj.discountCoursePrice);
    const offeredPrice = Number(userObj.discountedCoursePrice);
    return {
      courseId: userObj.discountCourseId || null,
      courseTitle: userObj.discountCourseTitle || "",
      originalCoursePrice,
      offeredPrice,
      discountAmount: Number(
        userObj.discountAmount ?? Math.max(0, originalCoursePrice - offeredPrice)
      ),
      discountPercent: Number(userObj.discount || 0),
    };
  }

  return null;
};

/**
 * Resolve totalCourseFee, discountAmount, offeredPrice, and metadata for a student + course.
 */
export const resolveCoursePricingForStudent = ({
  user = null,
  courseObj = null,
  courseId = "",
  courseTitle = "",
  preferLivePrice = false,
}) => {
  const effectiveCourseId = courseId || courseObj?._id || "";
  const effectiveTitle = courseTitle || courseObj?.title || "";
  const liveCatalogPrice = courseObj ? resolveCoursePrice(courseObj) : 0;

  const snapshot = findMatchingCoursePricingSnapshot(user, effectiveCourseId, effectiveTitle);

  if (snapshot && !preferLivePrice) {
    const snapBase = Math.max(0, Number(snapshot.originalCoursePrice) || 0);
    const snapOffered = Math.min(snapBase, Math.max(0, Number(snapshot.offeredPrice) || 0));
    const snapDiscountAmt = Number((snapBase - snapOffered).toFixed(2));
    return {
      totalCourseFee: snapBase,
      discountAmount: snapDiscountAmt,
      offeredPrice: snapOffered,
      discountPercent: Number(snapshot.discountPercent ?? user?.discount ?? 0),
      pricingSource: "snapshot",
      snapshot,
      liveCatalogPrice,
      priceChangedSinceDiscount:
        liveCatalogPrice > 0 && Math.abs(liveCatalogPrice - snapBase) >= 0.01,
    };
  }

  const baseFee = liveCatalogPrice > 0 ? liveCatalogPrice : snapshot?.originalCoursePrice || 0;
  const pct = Math.min(100, Math.max(0, Number(user?.discount || 0)));
  const discountAmount =
    baseFee > 0 && pct > 0 ? Number(((baseFee * pct) / 100).toFixed(2)) : 0;
  return {
    totalCourseFee: baseFee,
    discountAmount,
    offeredPrice: Number(Math.max(0, baseFee - discountAmount).toFixed(2)),
    discountPercent: pct,
    pricingSource: pct > 0 ? "percent" : "none",
    snapshot,
    liveCatalogPrice,
    priceChangedSinceDiscount:
      Boolean(snapshot && liveCatalogPrice > 0 && Math.abs(liveCatalogPrice - Number(snapshot.originalCoursePrice)) >= 0.01),
  };
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

/**
 * Compute remaining balance after subtracting discount, previously received installments, and current payment.
 */
export const computeRemainingBalance = (
  totalFee,
  discountAmount = 0,
  previouslyPaid = 0,
  currentPaid = 0
) => {
  const total = Math.max(0, Number(totalFee) || 0);
  if (!total) return 0;
  const discount = Math.max(0, Number(discountAmount) || 0);
  const prevPaid = Math.max(0, Number(previouslyPaid) || 0);
  const paidNow = Math.max(0, Number(currentPaid) || 0);
  return Number(Math.max(0, total - discount - prevPaid - paidNow).toFixed(2));
};

/**
 * Filter completed payment records matching a given courseId or course title.
 */
export const filterCompletedPaymentsForCourse = (
  paymentsList = [],
  courseId = "",
  courseTitle = ""
) => {
  const targetId = courseId ? String(courseId) : "";
  const targetTitle = String(courseTitle || "").trim().toLowerCase();
  if ((!targetId && !targetTitle) || !Array.isArray(paymentsList)) return [];

  return paymentsList.filter((p) => {
    if (!p || (p.status || "").toLowerCase() !== "completed") return false;
    const pCourseId = p.courseId?._id || p.courseId;
    if (targetId && pCourseId && String(pCourseId) === targetId) return true;
    const pTitle = String(p.course || "").trim().toLowerCase();
    return Boolean(targetTitle && pTitle && pTitle === targetTitle);
  });
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
