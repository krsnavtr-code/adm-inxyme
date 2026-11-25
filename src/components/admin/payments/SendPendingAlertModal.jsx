import React, { useState, useEffect, useId, useCallback, useRef } from "react";
import { toast } from "react-hot-toast";
import {
  BellRing,
  Send,
  X,
  Paperclip,
  CheckCircle2,
  Loader2,
  AlertTriangle,
  RotateCcw,
  ExternalLink,
} from "lucide-react";
import NativeModalDialog from "./NativeModalDialog";
import paymentApi from "../../../api/paymentApi";
import { formatCurrencyINR } from "../../../utils/paymentFormatters";

const isValidHttpUrl = (value = "") => /^https?:\/\/\S+$/i.test(String(value || "").trim());

export default function SendPendingAlertModal({
  open,
  payment,
  onClose,
  onAlertSent,
}) {
  const titleId = useId();
  const fieldPrefix = useId();

  const [loadingPreview, setLoadingPreview] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const [toEmail, setToEmail] = useState("");
  const [ccEmail, setCcEmail] = useState("");
  const [pendingAmount, setPendingAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [paymentLink, setPaymentLink] = useState("");
  const [attachInvoicePdf, setAttachInvoicePdf] = useState(false);

  const [subject, setSubject] = useState("");
  const [writtenMessage, setWrittenMessage] = useState("");
  const [pdfFilename, setPdfFilename] = useState("Invoice.pdf");
  const [paidTillNow, setPaidTillNow] = useState(0);

  const subjectEditedRef = useRef(false);
  const messageEditedRef = useRef(false);
  const initializedRef = useRef(false);

  const loadAlertPreview = useCallback(
    async (paymentId, overrides = {}, { preserveEdits = false, silent = false } = {}) => {
      try {
        if (!silent) setLoadingPreview(true);
        const res = await paymentApi.getPendingAlertPreview(paymentId, overrides);
        if (res?.success && res.preview) {
          const p = res.preview;
          if (!preserveEdits) {
            setToEmail(p.to || "");
            setPendingAmount(
              p.pendingAmount !== undefined ? String(p.pendingAmount) : ""
            );
            setDueDate(
              p.dueDate ? new Date(p.dueDate).toISOString().slice(0, 10) : ""
            );
          }
          if (!preserveEdits || !subjectEditedRef.current) {
            setSubject(p.subject || "");
          }
          if (!preserveEdits || !messageEditedRef.current) {
            setWrittenMessage(p.writtenMessage || "");
          }
          setPdfFilename(p.pdfFilename || "Invoice.pdf");
          setPaidTillNow(Number(p.paidTillNow || 0));
          initializedRef.current = true;
        }
      } catch (err) {
        console.error("Failed to load pending payment alert preview:", err);
        if (!silent) toast.error("Failed to prepare pending payment alert preview");
      } finally {
        if (!silent) setLoadingPreview(false);
      }
    },
    []
  );

  useEffect(() => {
    if (open && payment?._id) {
      initializedRef.current = false;
      subjectEditedRef.current = false;
      messageEditedRef.current = false;
      setCcEmail("");
      setPaymentLink("");
      setAttachInvoicePdf(false);
      loadAlertPreview(payment._id);
    }
  }, [open, payment?._id, loadAlertPreview]);

  // Keep default subject & written message synced when pending amount, due date, or payment link changes
  useEffect(() => {
    if (!open || !payment?._id || !initializedRef.current) return;
    if (subjectEditedRef.current && messageEditedRef.current) return;

    const timer = setTimeout(() => {
      loadAlertPreview(
        payment._id,
        {
          pendingAmount,
          dueDate,
          paymentLink,
          attachInvoicePdf: String(attachInvoicePdf),
        },
        { preserveEdits: true, silent: true }
      );
    }, 300);

    return () => clearTimeout(timer);
  }, [
    open,
    payment?._id,
    pendingAmount,
    dueDate,
    paymentLink,
    attachInvoicePdf,
    loadAlertPreview,
  ]);

  const handleRegenerateText = () => {
    if (!payment?._id) return;
    subjectEditedRef.current = false;
    messageEditedRef.current = false;
    loadAlertPreview(
      payment._id,
      {
        pendingAmount,
        dueDate,
        paymentLink,
        attachInvoicePdf: String(attachInvoicePdf),
      },
      { preserveEdits: true }
    );
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!payment?._id) return;

    const trimmedTo = toEmail.trim();
    if (!trimmedTo || !/\S+@\S+\.\S+/.test(trimmedTo)) {
      toast.error("Please enter a valid student email address");
      return;
    }

    const numericDue = Number(pendingAmount);
    if (!numericDue || Number.isNaN(numericDue) || numericDue <= 0) {
      toast.error("Please enter a pending amount greater than ₹0");
      return;
    }

    const trimmedLink = paymentLink.trim();
    if (trimmedLink && !isValidHttpUrl(trimmedLink)) {
      toast.error("Payment link must start with http:// or https://");
      return;
    }

    if (!subject.trim() || !writtenMessage.trim()) {
      toast.error("Email subject and message are required");
      return;
    }

    try {
      setIsSending(true);
      const res = await paymentApi.sendPendingAlertEmail(payment._id, {
        to: trimmedTo,
        cc: ccEmail.trim(),
        subject: subject.trim(),
        writtenMessage: writtenMessage.trim(),
        pendingAmount: numericDue,
        dueDate: dueDate || "",
        paymentLink: trimmedLink,
        attachInvoicePdf,
      });

      if (res?.success) {
        toast.success(res.message || "Pending payment alert sent successfully!");
        if (onAlertSent) onAlertSent(res.payment);
        onClose();
      } else {
        throw new Error(res?.message || "Failed to send pending payment alert");
      }
    } catch (err) {
      console.error("Failed to send pending payment alert:", err);
      toast.error(
        err.response?.data?.message ||
          err.message ||
          "Failed to send pending payment alert"
      );
    } finally {
      setIsSending(false);
    }
  };

  const invoiceNumber =
    payment?.invoiceNumber ||
    `INV-${String(payment?._id || "").slice(-6).toUpperCase()}`;

  const numericPending = Math.max(0, Number(pendingAmount) || 0);
  const dueDateDisplay = dueDate
    ? new Date(dueDate).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "";
  const safePaymentLink = isValidHttpUrl(paymentLink) ? paymentLink.trim() : "";

  return (
    <NativeModalDialog
      open={open}
      onClose={() => {
        if (!isSending) onClose();
      }}
      titleId={titleId}
      closedBy={isSending ? "none" : "any"}
      maxWidthClass="max-w-6xl"
    >
      {/* Modal Header */}
      <div className="flex items-center justify-between bg-gradient-to-r from-amber-700 via-orange-600 to-slate-900 px-6 py-4 text-white shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15 border border-white/25">
            <BellRing className="h-5 w-5 text-amber-100" />
          </div>
          <div className="min-w-0">
            <h1 id={titleId} className="text-lg font-bold leading-tight truncate">
              Send Pending Payment Alert
            </h1>
            <p className="text-xs text-amber-100 truncate mt-0.5">
              Preview &amp; customize fee reminder mail before sending to{" "}
              <span className="font-semibold text-white">{payment?.name}</span>
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          disabled={isSending}
          aria-label="Close Send Pending Payment Alert dialog"
          className="rounded-lg p-1.5 text-white/80 hover:bg-white/10 hover:text-white transition-colors disabled:opacity-40"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Main Form Body */}
      <form
        method="post"
        onSubmit={handleSend}
        className="flex-1 overflow-y-auto bg-gray-50 flex flex-col"
      >
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-0 divide-y lg:divide-y-0 lg:divide-x divide-gray-200">
          {/* LEFT PANE: Compose Reminder Controls */}
          <div className="lg:col-span-6 p-5 flex flex-col gap-3.5 bg-white">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <BellRing className="h-4 w-4 text-amber-600" />
                <h2 className="text-sm font-bold text-gray-900">
                  Reminder Details &amp; Written Mail
                </h2>
              </div>
              <button
                type="button"
                onClick={handleRegenerateText}
                disabled={loadingPreview}
                className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-100 disabled:opacity-50"
              >
                <RotateCcw className={`h-3 w-3 ${loadingPreview ? "animate-spin" : ""}`} />
                Refresh Default Text
              </button>
            </div>

            {numericPending <= 0 && !loadingPreview && (
              <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  Current recorded balance remaining is ₹0.00. Enter a custom{" "}
                  <strong>Pending Amount Due</strong> below if you still want to send a
                  payment reminder.
                </span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor={`${fieldPrefix}-to`}
                  className="block text-xs font-semibold text-gray-700 mb-1"
                >
                  To (Student Email) <span className="text-red-500">*</span>
                </label>
                <input
                  id={`${fieldPrefix}-to`}
                  name="to"
                  type="email"
                  required
                  value={toEmail}
                  onChange={(e) => setToEmail(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor={`${fieldPrefix}-cc`}
                  className="block text-xs font-semibold text-gray-700 mb-1"
                >
                  CC <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  id={`${fieldPrefix}-cc`}
                  name="cc"
                  type="text"
                  value={ccEmail}
                  onChange={(e) => setCcEmail(e.target.value)}
                  placeholder="accounts@inxyme.com"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor={`${fieldPrefix}-pendingAmount`}
                  className="block text-xs font-semibold text-gray-700 mb-1"
                >
                  Pending Balance Due (₹) <span className="text-red-500">*</span>
                </label>
                <input
                  id={`${fieldPrefix}-pendingAmount`}
                  name="pendingAmount"
                  type="number"
                  inputMode="decimal"
                  min="1"
                  step="0.01"
                  required
                  value={pendingAmount}
                  onChange={(e) => setPendingAmount(e.target.value)}
                  className="w-full rounded-lg border border-amber-300 bg-amber-50/40 px-3 py-2 text-sm font-bold text-gray-900 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor={`${fieldPrefix}-dueDate`}
                  className="block text-xs font-semibold text-gray-700 mb-1"
                >
                  Payment Due Date <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  id={`${fieldPrefix}-dueDate`}
                  name="dueDate"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor={`${fieldPrefix}-paymentLink`}
                className="block text-xs font-semibold text-gray-700 mb-1"
              >
                Payment Link URL <span className="text-gray-400 font-normal">(optional CTA button in email)</span>
              </label>
              <input
                id={`${fieldPrefix}-paymentLink`}
                name="paymentLink"
                type="url"
                value={paymentLink}
                onChange={(e) => setPaymentLink(e.target.value)}
                placeholder="https://www.inxyme.com/pay/..."
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor={`${fieldPrefix}-subject`}
                className="block text-xs font-semibold text-gray-700 mb-1"
              >
                Email Subject <span className="text-red-500">*</span>
              </label>
              <input
                id={`${fieldPrefix}-subject`}
                name="subject"
                type="text"
                required
                value={subject}
                onChange={(e) => {
                  subjectEditedRef.current = true;
                  setSubject(e.target.value);
                }}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor={`${fieldPrefix}-message`}
                className="block text-xs font-semibold text-gray-700 mb-1"
              >
                Written Alert Message <span className="text-red-500">*</span>
              </label>
              <textarea
                id={`${fieldPrefix}-message`}
                name="writtenMessage"
                rows={7}
                required
                value={writtenMessage}
                onChange={(e) => {
                  messageEditedRef.current = true;
                  setWrittenMessage(e.target.value);
                }}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 leading-relaxed focus:border-amber-500 focus:outline-none"
              />
            </div>

            <label
              htmlFor={`${fieldPrefix}-attachPdf`}
              className="flex items-center gap-2.5 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-medium text-gray-700 cursor-pointer"
            >
              <input
                id={`${fieldPrefix}-attachPdf`}
                type="checkbox"
                checked={attachInvoicePdf}
                onChange={(e) => setAttachInvoicePdf(e.target.checked)}
                className="rounded border-gray-300 accent-amber-600"
              />
              <span>
                Also attach receipt / statement PDF (
                <strong className="font-mono">{pdfFilename}</strong>)
              </span>
            </label>
          </div>

          {/* RIGHT PANE: Live Branded Email Preview */}
          <div className="lg:col-span-6 p-5 flex flex-col gap-3 bg-gray-50/70">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-bold text-gray-900">
                Live Student Alert Email Preview
              </h2>
              <span className="rounded-md bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                Pending Balance: {formatCurrencyINR(numericPending, true)}
              </span>
            </div>

            {loadingPreview ? (
              <div className="flex-1 flex flex-col items-center justify-center py-16 text-gray-500 gap-2">
                <Loader2 className="h-6 w-6 animate-spin text-amber-600" />
                <span className="text-xs">Loading alert preview...</span>
              </div>
            ) : (
              <>
                <div className="rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs space-y-1">
                  <div>
                    <span className="font-semibold text-gray-500">To: </span>
                    <span className="font-semibold text-gray-900">{toEmail}</span>
                    {ccEmail && <span className="text-gray-500 ml-2">• CC: {ccEmail}</span>}
                  </div>
                  <div className="truncate">
                    <span className="font-semibold text-gray-500">Subject: </span>
                    <span className="font-semibold text-gray-900">{subject}</span>
                  </div>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-xs max-h-[500px] overflow-y-auto">
                  <div className="bg-gradient-to-r from-slate-900 to-blue-900 px-5 py-4 text-white flex items-center justify-between border-b-2 border-[#f47c26]">
                    <div className="flex items-center gap-3">
                      <div className="bg-white rounded-lg px-2 py-1 shadow-xs shrink-0">
                        <img
                          src="/inxyme-logo.png"
                          alt="Inxyme"
                          className="h-8 w-auto object-contain"
                        />
                      </div>
                      <div>
                        <div className="text-base font-extrabold tracking-wide">Inxyme</div>
                        <div className="text-[11px] text-blue-200">
                          Pending Payment Reminder
                        </div>
                      </div>
                    </div>
                    <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold uppercase text-amber-800 border border-amber-300">
                      PAYMENT DUE
                    </span>
                  </div>

                  <div className="p-5 space-y-4">
                    <div className="text-xs sm:text-[13px] leading-relaxed text-gray-800 whitespace-pre-line">
                      {writtenMessage}
                    </div>

                    <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3.5 text-xs space-y-1.5">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-amber-800 mb-1.5">
                        Pending Fee Summary
                      </div>
                      <div className="flex justify-between">
                        <span className="text-amber-900/75">Reference / Invoice No</span>
                        <span className="font-bold text-slate-900 font-mono">
                          {invoiceNumber}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-amber-900/75">Course / Program</span>
                        <span className="font-semibold text-slate-900 text-right max-w-[60%] truncate">
                          {payment?.course}
                        </span>
                      </div>
                      {Number(payment?.totalCourseFee) > 0 && (
                        <div className="flex justify-between">
                          <span className="text-amber-900/75">Total Program Fee</span>
                          <span className="text-slate-800">
                            {formatCurrencyINR(payment.totalCourseFee, true)}
                          </span>
                        </div>
                      )}
                      {Number(payment?.discountAmount) > 0 && (
                        <div className="flex justify-between text-emerald-700">
                          <span>Discount Applied</span>
                          <span>- {formatCurrencyINR(payment.discountAmount, true)}</span>
                        </div>
                      )}
                      {paidTillNow > 0 && (
                        <div className="flex justify-between text-emerald-700 font-semibold">
                          <span>Total Paid So Far</span>
                          <span>{formatCurrencyINR(paidTillNow, true)}</span>
                        </div>
                      )}
                      {dueDateDisplay && (
                        <div className="flex justify-between text-amber-900 font-semibold">
                          <span>Due Date</span>
                          <span>{dueDateDisplay}</span>
                        </div>
                      )}
                      <div className="flex justify-between pt-1.5 border-t border-amber-200 font-bold text-sm">
                        <span className="text-amber-950">Pending Balance Due</span>
                        <span className="text-amber-700">
                          {formatCurrencyINR(numericPending, true)}
                        </span>
                      </div>
                    </div>

                    {safePaymentLink && (
                      <div className="text-center pt-1">
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#f47c26] px-5 py-2.5 text-xs font-bold text-white shadow-xs">
                          Pay Pending Balance ({formatCurrencyINR(numericPending, true)})
                          <ExternalLink className="h-3.5 w-3.5" />
                        </span>
                      </div>
                    )}

                    {attachInvoicePdf && (
                      <div className="flex items-center gap-2 rounded-lg border border-indigo-100 bg-indigo-50/70 px-3 py-2 text-xs text-indigo-900">
                        <Paperclip className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                        <span>
                          Attached PDF: <strong className="font-mono">{pdfFilename}</strong>
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-gray-200 bg-white px-6 py-4 shrink-0">
          <div className="text-xs text-gray-600">
            {payment?.pendingAlertSent ? (
              <span className="inline-flex items-center gap-1.5 text-amber-800 font-medium">
                <CheckCircle2 className="h-4 w-4 text-amber-600" />
                Previously alerted ({payment.pendingAlertSentCount || 1}x) on{" "}
                {payment.pendingAlertSentAt
                  ? new Date(payment.pendingAlertSentAt).toLocaleString("en-IN")
                  : "earlier"}{" "}
                to {payment.pendingAlertLastSentTo || payment.email}
              </span>
            ) : (
              <span>
                Ready to send pending fee reminder to{" "}
                <strong>{toEmail || payment?.email}</strong>.
              </span>
            )}
          </div>

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSending}
              className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSending || loadingPreview}
              className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-5 py-2 text-sm font-semibold text-white shadow-md shadow-amber-600/20 hover:bg-amber-700 disabled:opacity-50 transition-all"
            >
              {isSending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending Alert...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  {payment?.pendingAlertSent
                    ? "Resend Pending Payment Alert"
                    : "Send Pending Payment Alert"}
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </NativeModalDialog>
  );
}
