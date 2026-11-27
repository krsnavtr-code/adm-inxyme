import React, { useState, useEffect, useMemo, useId, useRef } from "react";
import { toast } from "react-hot-toast";
import {
  IndianRupee,
  X,
  Tag,
  Lock,
  AlertCircle,
  Loader2,
  Trash2,
  CheckCircle2,
} from "lucide-react";
import NativeModalDialog from "./payments/NativeModalDialog";
import userApi from "../../api/userApi";
import {
  computeDiscountFromOfferedPrice,
  formatCurrencyINR,
  formatDiscountPercent,
  resolveCoursePrice,
} from "../../utils/paymentFormatters";

export default function SetDiscountPriceModal({
  open,
  user,
  courses = [],
  onClose,
  onSaved,
}) {
  const titleId = useId();
  const fieldPrefix = useId();
  const offeredInputRef = useRef(null);
  const customFeeInputRef = useRef(null);

  const [selectedCourseKey, setSelectedCourseKey] = useState("");
  const [customCourseTitle, setCustomCourseTitle] = useState("");
  const [customCoursePrice, setCustomCoursePrice] = useState("");
  const [offeredPrice, setOfferedPrice] = useState("");
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const { enrolledCourses, catalogCourses } = useMemo(() => {
    const enrolledList = Array.isArray(user?.enrolledCourses) ? user.enrolledCourses : [];
    const enrolledIds = new Set(
      enrolledList.map((c) => (typeof c === "object" && c?._id ? String(c._id) : String(c)))
    );

    const courseMap = new Map();
    for (const c of courses) {
      if (c && c._id) {
        courseMap.set(String(c._id), c);
      }
    }
    for (const ec of enrolledList) {
      if (ec && typeof ec === "object" && ec._id) {
        const key = String(ec._id);
        const existing = courseMap.get(key);
        courseMap.set(key, existing ? { ...ec, ...existing } : ec);
      }
    }

    const allSorted = Array.from(courseMap.values()).sort((a, b) =>
      (a.title || "").localeCompare(b.title || "")
    );
    return {
      enrolledCourses: allSorted.filter((c) => enrolledIds.has(String(c._id))),
      catalogCourses: allSorted.filter((c) => !enrolledIds.has(String(c._id))),
    };
  }, [user, courses]);

  const allKnownCourses = useMemo(
    () => [...enrolledCourses, ...catalogCourses],
    [enrolledCourses, catalogCourses]
  );

  // Initialize form whenever modal opens for a user
  useEffect(() => {
    if (!open || !user) return;
    setTouched({});
    setSubmitted(false);

    const snapId = user.discountCourseId?._id
      ? String(user.discountCourseId._id)
      : user.discountCourseId
        ? String(user.discountCourseId)
        : "";

    let defaultKey = "";
    if (snapId && allKnownCourses.some((c) => String(c._id) === snapId)) {
      defaultKey = snapId;
    } else if (enrolledCourses.length > 0) {
      defaultKey = String(enrolledCourses[0]._id);
    } else if (
      Number(user.discountCoursePrice) > 0 &&
      user.discountedCoursePrice !== null &&
      user.discountedCoursePrice !== undefined
    ) {
      defaultKey = "__custom__";
    } else if (allKnownCourses.length > 0) {
      defaultKey = String(allKnownCourses[0]._id);
    } else {
      defaultKey = "__custom__";
    }

    setSelectedCourseKey(defaultKey);

    if (defaultKey === "__custom__") {
      setCustomCourseTitle(user.discountCourseTitle || "");
      setCustomCoursePrice(
        Number(user.discountCoursePrice) > 0 ? String(user.discountCoursePrice) : ""
      );
      setOfferedPrice(
        user.discountedCoursePrice !== null && user.discountedCoursePrice !== undefined
          ? String(user.discountedCoursePrice)
          : ""
      );
    } else {
      const matchedSnapshot = (user.courseDiscounts || []).find(
        (d) => d?.courseId && String(d.courseId) === defaultKey
      );
      if (
        matchedSnapshot &&
        matchedSnapshot.offeredPrice !== null &&
        matchedSnapshot.offeredPrice !== undefined
      ) {
        setOfferedPrice(String(matchedSnapshot.offeredPrice));
      } else if (
        snapId === defaultKey &&
        user.discountedCoursePrice !== null &&
        user.discountedCoursePrice !== undefined
      ) {
        setOfferedPrice(String(user.discountedCoursePrice));
      } else {
        setOfferedPrice("");
      }
      setCustomCourseTitle("");
      setCustomCoursePrice("");
    }
  }, [open, user?._id]);

  // Autofocus the primary offered-price field on open
  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => {
      offeredInputRef.current?.focus();
    }, 60);
    return () => clearTimeout(timer);
  }, [open]);

  const selectedCourseObj = useMemo(() => {
    if (!selectedCourseKey || selectedCourseKey === "__custom__") return null;
    return allKnownCourses.find((c) => String(c._id) === String(selectedCourseKey)) || null;
  }, [selectedCourseKey, allKnownCourses]);

  const liveCatalogCoursePrice = useMemo(
    () => (selectedCourseObj ? resolveCoursePrice(selectedCourseObj) : 0),
    [selectedCourseObj]
  );

  // If the selected catalog course has a non-zero DB price, snapshot that exact catalog fee;
  // allow manual course price input when choosing custom program or a 0-priced course.
  const isManualBasePrice =
    selectedCourseKey === "__custom__" || (selectedCourseObj && liveCatalogCoursePrice <= 0);

  const effectiveBaseCoursePrice = useMemo(() => {
    if (isManualBasePrice) {
      const num = Number(customCoursePrice);
      return Number.isFinite(num) && num > 0 ? num : 0;
    }
    return liveCatalogCoursePrice;
  }, [isManualBasePrice, customCoursePrice, liveCatalogCoursePrice]);

  const existingCourseSnapshot = useMemo(() => {
    if (!user) return null;
    if (selectedCourseKey && selectedCourseKey !== "__custom__") {
      const fromArray = (user.courseDiscounts || []).find(
        (d) => d?.courseId && String(d.courseId) === String(selectedCourseKey)
      );
      if (fromArray) return fromArray;
      const topId = user.discountCourseId?._id
        ? String(user.discountCourseId._id)
        : user.discountCourseId
          ? String(user.discountCourseId)
          : "";
      if (topId === String(selectedCourseKey) && Number(user.discountCoursePrice) > 0) {
        return {
          courseId: user.discountCourseId,
          courseTitle: user.discountCourseTitle,
          originalCoursePrice: Number(user.discountCoursePrice),
          offeredPrice: Number(user.discountedCoursePrice),
          discountAmount: Number(user.discountAmount || 0),
          discountPercent: Number(user.discount || 0),
        };
      }
    }
    return null;
  }, [user, selectedCourseKey]);

  const handleSelectCourse = (newKey) => {
    setSelectedCourseKey(newKey);
    if (newKey === "__custom__") {
      setCustomCourseTitle(user?.discountCourseId ? "" : user?.discountCourseTitle || "");
      setCustomCoursePrice(
        !user?.discountCourseId && Number(user?.discountCoursePrice) > 0
          ? String(user.discountCoursePrice)
          : ""
      );
      setOfferedPrice("");
      return;
    }

    const existing = (user?.courseDiscounts || []).find(
      (d) => d?.courseId && String(d.courseId) === String(newKey)
    );
    const snapId = user?.discountCourseId?._id
      ? String(user.discountCourseId._id)
      : user?.discountCourseId
        ? String(user.discountCourseId)
        : "";
    if (existing) {
      setOfferedPrice(String(existing.offeredPrice));
    } else if (
      snapId === String(newKey) &&
      user?.discountedCoursePrice !== null &&
      user?.discountedCoursePrice !== undefined
    ) {
      setOfferedPrice(String(user.discountedCoursePrice));
    } else {
      setOfferedPrice("");
    }
    setCustomCourseTitle("");
    setCustomCoursePrice("");
    setTouched({});
    setSubmitted(false);
  };

  const errors = useMemo(() => {
    const e = {};
    if (isManualBasePrice) {
      const baseNum = Number(customCoursePrice);
      if (customCoursePrice === "" || !Number.isFinite(baseNum) || baseNum <= 0) {
        e.coursePrice = "Error: Enter the original course price (greater than ₹0).";
      }
    } else if (effectiveBaseCoursePrice <= 0) {
      e.coursePrice = "Error: Selected course has ₹0 price. Choose a priced course or Custom Program.";
    }

    const offeredNum = Number(offeredPrice);
    if (offeredPrice === "" || !Number.isFinite(offeredNum) || offeredNum < 0) {
      e.offeredPrice = "Error: Enter the final offered price in ₹ (0 or above).";
    } else if (effectiveBaseCoursePrice > 0 && offeredNum > effectiveBaseCoursePrice) {
      e.offeredPrice = `Error: Offered price (${formatCurrencyINR(
        offeredNum
      )}) cannot exceed course price (${formatCurrencyINR(effectiveBaseCoursePrice)}).`;
    }
    return e;
  }, [isManualBasePrice, customCoursePrice, effectiveBaseCoursePrice, offeredPrice]);

  const showBasePriceError = (submitted || touched.coursePrice) && errors.coursePrice;
  const showOfferedError = (submitted || touched.offeredPrice) && errors.offeredPrice;

  const liveCalculation = useMemo(() => {
    const offeredNum = Number(offeredPrice);
    if (
      effectiveBaseCoursePrice <= 0 ||
      offeredPrice === "" ||
      !Number.isFinite(offeredNum) ||
      offeredNum < 0
    ) {
      return null;
    }
    return computeDiscountFromOfferedPrice(effectiveBaseCoursePrice, offeredNum);
  }, [effectiveBaseCoursePrice, offeredPrice]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitted(true);

    if (errors.coursePrice) {
      customFeeInputRef.current?.focus();
      return;
    }
    if (errors.offeredPrice) {
      offeredInputRef.current?.focus();
      return;
    }

    try {
      setIsSaving(true);
      const payload = {
        courseId: selectedCourseObj?._id || null,
        courseTitle:
          selectedCourseObj?.title || customCourseTitle.trim() || "Custom Program",
        coursePrice: effectiveBaseCoursePrice,
        offeredPrice: Number(offeredPrice),
      };
      const res = await userApi.updateDiscount(user._id, payload);
      const updated = res?.data || res?.user || null;
      toast.success(
        `Saved ${formatCurrencyINR(Number(offeredPrice))} (${formatDiscountPercent(
          liveCalculation?.discountPercent || 0
        )} OFF)`
      );
      if (onSaved) onSaved(updated);
      onClose();
    } catch (error) {
      console.error("Error saving offered course price:", error);
      toast.error(
        error.response?.data?.message || "Failed to update student offered price"
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearDiscount = async ({ courseId = null, clearAll = false } = {}) => {
    if (!user?._id) return;
    try {
      setIsSaving(true);
      const res = await userApi.updateDiscount(user._id, {
        action: "clear",
        courseId,
        clearAll,
      });
      const updated = res?.data || res?.user || null;
      toast.success(
        clearAll ? "All discounts cleared for student" : "Course offer removed"
      );
      if (onSaved) onSaved(updated);
      if (clearAll) onClose();
    } catch (error) {
      console.error("Error clearing discount:", error);
      toast.error(error.response?.data?.message || "Failed to remove discount");
    } finally {
      setIsSaving(false);
    }
  };

  const hasAnySavedDiscount =
    Number(user?.discount) > 0 ||
    (user?.discountedCoursePrice !== null && user?.discountedCoursePrice !== undefined) ||
    (Array.isArray(user?.courseDiscounts) && user.courseDiscounts.length > 0);

  return (
    <NativeModalDialog
      open={open}
      onClose={() => !isSaving && onClose()}
      titleId={titleId}
      closedBy={isSaving ? "none" : "any"}
      maxWidthClass="max-w-lg"
    >
      <div className="flex items-center justify-between bg-gradient-to-r from-indigo-950 to-indigo-800 px-6 py-4 text-white shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 border border-white/20">
            <Tag className="h-5 w-5 text-indigo-100" />
          </div>
          <div>
            <h2 id={titleId} className="text-base font-bold leading-tight">
              Set Student Offered Price
            </h2>
            <p className="text-xs text-indigo-200 mt-0.5 truncate max-w-[300px]">
              {user?.fullname || "Student"} &bull; {user?.email}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => !isSaving && onClose()}
          disabled={isSaving}
          aria-label="Close Offered Price dialog"
          className="rounded-lg p-1.5 text-white/80 hover:bg-white/10 hover:text-white transition-colors disabled:opacity-40"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <form
        method="post"
        onSubmit={handleSubmit}
        noValidate
        aria-labelledby={titleId}
        className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/40 [color-scheme:light]"
      >
        {/* Existing Saved Course Pricing Snapshots */}
        {Array.isArray(user?.courseDiscounts) && user.courseDiscounts.length > 0 && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-emerald-900">
              <span>Saved Student Course Offers ({user.courseDiscounts.length})</span>
            </div>
            <div className="space-y-1.5">
              {user.courseDiscounts.map((entry, idx) => (
                <div
                  key={entry.courseId || entry.courseTitle || idx}
                  className="flex items-center justify-between gap-2 rounded-lg bg-white border border-emerald-100 px-2.5 py-1.5 text-xs"
                >
                  <div className="min-w-0">
                    <div className="font-semibold text-gray-900 truncate">
                      {entry.courseTitle || "Course"}
                    </div>
                    <div className="text-[11px] text-gray-600">
                      Offered <strong>{formatCurrencyINR(entry.offeredPrice)}</strong>{" "}
                      <span className="line-through text-gray-400">
                        {formatCurrencyINR(entry.originalCoursePrice)}
                      </span>{" "}
                      <span className="text-emerald-700 font-semibold">
                        ({formatDiscountPercent(entry.discountPercent)} OFF)
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {entry.courseId && (
                      <button
                        type="button"
                        onClick={() => handleSelectCourse(String(entry.courseId))}
                        className="px-2 py-0.5 rounded border border-indigo-200 bg-indigo-50 text-[11px] font-medium text-indigo-700 hover:bg-indigo-100"
                      >
                        Edit
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={isSaving}
                      onClick={() =>
                        handleClearDiscount({
                          courseId: entry.courseId || null,
                          clearAll: !entry.courseId && user.courseDiscounts.length === 1,
                        })
                      }
                      aria-label={`Remove saved price for ${entry.courseTitle || "course"}`}
                      className="p-1 rounded text-red-500 hover:bg-red-50 hover:text-red-700"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Course Selector */}
        <div>
          <label
            htmlFor={`${fieldPrefix}-courseSelect`}
            className="block text-xs font-semibold text-gray-700 mb-1"
          >
            Select Course for Offer
          </label>
          <p id={`${fieldPrefix}-courseHint`} className="text-[11px] text-gray-500 mb-1.5">
            The current catalog course price will be saved as a snapshot when you save.
          </p>
          <select
            id={`${fieldPrefix}-courseSelect`}
            name="courseKey"
            aria-describedby={`${fieldPrefix}-courseHint`}
            value={selectedCourseKey}
            onChange={(e) => handleSelectCourse(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            {enrolledCourses.length > 0 && (
              <optgroup label="Student's Enrolled Courses">
                {enrolledCourses.map((c) => {
                  const p = resolveCoursePrice(c);
                  return (
                    <option key={c._id} value={c._id}>
                      {c.title} {p > 0 ? `(₹${p.toLocaleString("en-IN")})` : "(₹0)"}
                    </option>
                  );
                })}
              </optgroup>
            )}
            <optgroup label={enrolledCourses.length > 0 ? "Other Courses" : "All Courses"}>
              {catalogCourses.map((c) => {
                const p = resolveCoursePrice(c);
                return (
                  <option key={c._id} value={c._id}>
                    {c.title} {p > 0 ? `(₹${p.toLocaleString("en-IN")})` : "(₹0)"}
                  </option>
                );
              })}
            </optgroup>
            <option value="__custom__">Custom Program / Manual Course Price...</option>
          </select>
        </div>

        {/* Custom title if custom program selected */}
        {selectedCourseKey === "__custom__" && (
          <div>
            <label
              htmlFor={`${fieldPrefix}-customTitle`}
              className="block text-xs font-semibold text-gray-700 mb-1"
            >
              Program / Course Label <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              id={`${fieldPrefix}-customTitle`}
              name="customCourseTitle"
              type="text"
              value={customCourseTitle}
              onChange={(e) => setCustomCourseTitle(e.target.value)}
              placeholder="e.g. Custom SAP Bundle"
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
        )}

        {/* Course Base Price (Saved Snapshot) */}
        <div>
          <div className="flex items-center justify-between gap-2 mb-1">
            <label
              htmlFor={`${fieldPrefix}-basePrice`}
              className="block text-xs font-semibold text-gray-700"
            >
              Course Price at This Moment (₹){" "}
              {!isManualBasePrice && (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-700">
                  <Lock className="h-3 w-3" /> Saved Snapshot
                </span>
              )}
            </label>
          </div>
          <p id={`${fieldPrefix}-basePriceHint`} className="text-[11px] text-gray-500 mb-1.5">
            Stored in database so later course fee revisions will not alter this student&apos;s offer or % discount.
          </p>

          {isManualBasePrice ? (
            <div className="relative">
              <IndianRupee className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                ref={customFeeInputRef}
                id={`${fieldPrefix}-basePrice`}
                name="coursePrice"
                type="text"
                inputMode="decimal"
                required
                aria-invalid={Boolean(showBasePriceError)}
                aria-describedby={
                  showBasePriceError
                    ? `${fieldPrefix}-basePriceHint ${fieldPrefix}-basePriceError`
                    : `${fieldPrefix}-basePriceHint`
                }
                value={customCoursePrice}
                onBlur={() => setTouched((p) => ({ ...p, coursePrice: true }))}
                onChange={(e) => setCustomCoursePrice(e.target.value)}
                placeholder="e.g. 50000"
                className={`w-full rounded-lg border pl-9 pr-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 ${
                  showBasePriceError
                    ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                    : "border-gray-300 focus:border-indigo-500 focus:ring-indigo-500/20"
                }`}
              />
            </div>
          ) : (
            <div
              id={`${fieldPrefix}-basePrice`}
              aria-describedby={`${fieldPrefix}-basePriceHint`}
              className="flex items-center justify-between rounded-lg border border-indigo-200 bg-indigo-50/60 px-3.5 py-2.5 text-sm font-bold text-indigo-950"
            >
              <span>{formatCurrencyINR(effectiveBaseCoursePrice, false)}</span>
              <span className="text-[11px] font-medium text-indigo-700">
                Catalog Fee (Snapshot on Save)
              </span>
            </div>
          )}

          {showBasePriceError && (
            <p
              id={`${fieldPrefix}-basePriceError`}
              className="mt-1 flex items-center gap-1.5 text-xs font-medium text-red-600"
            >
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              <span>{errors.coursePrice}</span>
            </p>
          )}

          {existingCourseSnapshot &&
            liveCatalogCoursePrice > 0 &&
            Math.abs(
              Number(existingCourseSnapshot.originalCoursePrice) - liveCatalogCoursePrice
            ) >= 0.01 && (
              <p className="mt-1.5 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] text-amber-900">
                Previous snapshot price was{" "}
                <strong>{formatCurrencyINR(existingCourseSnapshot.originalCoursePrice)}</strong>.
                Live catalog fee is now{" "}
                <strong>{formatCurrencyINR(liveCatalogCoursePrice)}</strong> (saving updates the snapshot).
              </p>
            )}
        </div>

        {/* Final Offered Price (Primary User Input) */}
        <div>
          <label
            htmlFor={`${fieldPrefix}-offeredPrice`}
            className="block text-xs font-semibold text-gray-700 mb-1"
          >
            Student Offered Course Price (₹) <span className="text-red-500">*</span>
          </label>
          <p id={`${fieldPrefix}-offeredHint`} className="text-[11px] text-gray-500 mb-1.5">
            Enter the final total price at which this student is given the course.
          </p>
          <div className="relative">
            <IndianRupee className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <input
              ref={offeredInputRef}
              id={`${fieldPrefix}-offeredPrice`}
              name="offeredPrice"
              type="text"
              inputMode="decimal"
              required
              enterKeyHint="done"
              aria-invalid={Boolean(showOfferedError)}
              aria-describedby={
                showOfferedError
                  ? `${fieldPrefix}-offeredHint ${fieldPrefix}-offeredError`
                  : `${fieldPrefix}-offeredHint`
              }
              value={offeredPrice}
              onBlur={() => setTouched((p) => ({ ...p, offeredPrice: true }))}
              onChange={(e) => setOfferedPrice(e.target.value)}
              placeholder="e.g. 35000"
              className={`w-full rounded-lg border pl-9 pr-3 py-2.5 text-base font-bold text-gray-900 bg-white focus:outline-none focus:ring-2 ${
                showOfferedError
                  ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                  : "border-gray-300 focus:border-indigo-500 focus:ring-indigo-500/20"
              }`}
            />
          </div>
          {showOfferedError && (
            <p
              id={`${fieldPrefix}-offeredError`}
              className="mt-1 flex items-center gap-1.5 text-xs font-medium text-red-600"
            >
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              <span>{errors.offeredPrice}</span>
            </p>
          )}
        </div>

        {/* Live Calculation Summary Card */}
        <div className="rounded-xl border border-indigo-200 bg-white p-3.5 shadow-xs space-y-2 text-xs">
          <div className="flex items-center justify-between text-gray-600">
            <span>Course Price (Snapshot Saved in DB)</span>
            <span className="font-semibold text-gray-900">
              {effectiveBaseCoursePrice > 0
                ? formatCurrencyINR(effectiveBaseCoursePrice)
                : "₹0"}
            </span>
          </div>
          <div className="flex items-center justify-between text-gray-600">
            <span>Offered Price to Student</span>
            <span className="font-semibold text-gray-900">
              {liveCalculation
                ? formatCurrencyINR(liveCalculation.offeredPrice, true)
                : "—"}
            </span>
          </div>
          <div className="flex items-center justify-between text-emerald-700 font-semibold">
            <span>Discount Amount</span>
            <span>
              {liveCalculation
                ? `- ${formatCurrencyINR(liveCalculation.discountAmount, true)}`
                : "₹0"}
            </span>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-sm font-bold">
            <span className="text-gray-800">Calculated Discount (%)</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-emerald-800">
              <CheckCircle2 className="h-3.5 w-3.5" />
              {liveCalculation
                ? formatDiscountPercent(liveCalculation.discountPercent)
                : "0%"}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-gray-200">
          <div>
            {hasAnySavedDiscount && (
              <button
                type="button"
                disabled={isSaving}
                onClick={() => handleClearDiscount({ clearAll: true })}
                className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Remove Discount
              </button>
            )}
          </div>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              disabled={isSaving}
              onClick={onClose}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 disabled:opacity-60"
            >
              {isSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Save Offered Price
            </button>
          </div>
        </div>
      </form>
    </NativeModalDialog>
  );
}
