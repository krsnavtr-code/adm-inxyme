import React, { useState, useEffect, useId, useCallback } from "react";
import { toast } from "react-hot-toast";
import {
  Mail,
  FileText,
  Send,
  Download,
  RefreshCw,
  X,
  Paperclip,
  CheckCircle2,
  Edit3,
  Eye,
  Loader2,
  AlertCircle,
} from "lucide-react";
import NativeModalDialog from "./NativeModalDialog";
import paymentApi from "../../../api/paymentApi";
import {
  formatCurrencyINR,
  getPaymentMethodLabel,
  computeGstBreakup,
} from "../../../utils/paymentFormatters";

export default function SendInvoiceMailModal({
  open,
  payment,
  onClose,
  onEmailSent,
}) {
  const titleId = useId();
  const fieldPrefix = useId();

  const [loadingPreview, setLoadingPreview] = useState(false);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [pdfError, setPdfError] = useState("");
  const [pdfBlobUrl, setPdfBlobUrl] = useState("");
  const [pdfFilename, setPdfFilename] = useState("Invoice.pdf");

  const [toEmail, setToEmail] = useState("");
  const [ccEmail, setCcEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [writtenMessage, setWrittenMessage] = useState("");
  const [gstBreakup, setGstBreakup] = useState(null);
  const [mailTab, setMailTab] = useState("preview"); // "preview" | "edit"
  const [isSending, setIsSending] = useState(false);

  const loadPreviewAndPdf = useCallback(async (paymentId) => {
    setLoadingPreview(true);
    setLoadingPdf(true);
    setPdfError("");

    try {
      const [previewRes, pdfBlob] = await Promise.all([
        paymentApi.getInvoicePreview(paymentId),
        paymentApi.fetchInvoicePdfBlob(paymentId, false),
      ]);

      if (previewRes?.success && previewRes.preview) {
        setToEmail(previewRes.preview.to || "");
        setSubject(previewRes.preview.subject || "");
        setWrittenMessage(previewRes.preview.writtenMessage || "");
        setPdfFilename(previewRes.preview.pdfFilename || "Invoice.pdf");
        setGstBreakup(previewRes.preview.gstBreakup || null);
      }

      if (pdfBlob) {
        const objectUrl = URL.createObjectURL(pdfBlob);
        setPdfBlobUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return objectUrl;
        });
      }
    } catch (err) {
      console.error("Failed to load invoice preview or PDF:", err);
      setPdfError(
        err.response?.data?.message ||
          "Could not load invoice PDF preview. You can still retry or download."
      );
      toast.error("Failed to prepare invoice preview");
    } finally {
      setLoadingPreview(false);
      setLoadingPdf(false);
    }
  }, []);

  useEffect(() => {
    if (open && payment?._id) {
      setMailTab("preview");
      setCcEmail("");
      loadPreviewAndPdf(payment._id);
    }
    return () => {
      setPdfBlobUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return "";
      });
    };
  }, [open, payment?._id, loadPreviewAndPdf]);

  const handleDownloadPdf = async () => {
    if (!payment?._id) return;
    try {
      const blob = await paymentApi.fetchInvoicePdfBlob(payment._id, true);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = pdfFilename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("Invoice PDF downloaded");
    } catch (err) {
      console.error("Error downloading PDF:", err);
      toast.error("Failed to download invoice PDF");
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!payment?._id) return;

    const trimmedTo = toEmail.trim();
    if (!trimmedTo || !/\S+@\S+\.\S+/.test(trimmedTo)) {
      toast.error("Please enter a valid recipient email address");
      setMailTab("edit");
      return;
    }
    if (!subject.trim() || !writtenMessage.trim()) {
      toast.error("Email subject and written message are required");
      setMailTab("edit");
      return;
    }

    try {
      setIsSending(true);
      const res = await paymentApi.sendInvoiceEmail(payment._id, {
        to: trimmedTo,
        cc: ccEmail.trim(),
        subject: subject.trim(),
        writtenMessage: writtenMessage.trim(),
      });

      if (res?.success) {
        toast.success(res.message || "Payment invoice mail sent successfully!");
        if (onEmailSent) onEmailSent(res.payment);
        onClose();
      } else {
        throw new Error(res?.message || "Failed to send invoice mail");
      }
    } catch (err) {
      console.error("Failed to send invoice mail:", err);
      toast.error(err.response?.data?.message || err.message || "Failed to send invoice email");
    } finally {
      setIsSending(false);
    }
  };

  const effectiveGst =
    gstBreakup ||
    computeGstBreakup(
      payment?.paymentAmount,
      payment?.gstRate ?? 18,
      payment?.gstInclusive !== false
    );

  const invoiceNumber =
    payment?.invoiceNumber ||
    `INV-${String(payment?._id || "").slice(-6).toUpperCase()}`;

  const refId =
    payment?.transactionId || payment?.paymentId || payment?.orderId || "N/A";

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
      <div className="flex items-center justify-between bg-gradient-to-r from-indigo-950 via-indigo-900 to-slate-900 px-6 py-4 text-white shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 border border-white/20">
            <Mail className="h-5 w-5 text-indigo-100" />
          </div>
          <div className="min-w-0">
            <h1 id={titleId} className="text-lg font-bold leading-tight truncate">
              Send Payment Invoice Mail
            </h1>
            <p className="text-xs text-indigo-200 truncate mt-0.5">
              Review the written email &amp; attached Payment Invoice PDF before sending to{" "}
              <span className="font-semibold text-white">{payment?.name}</span>
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          disabled={isSending}
          aria-label="Close Send Invoice Mail dialog"
          className="rounded-lg p-1.5 text-white/80 hover:bg-white/10 hover:text-white transition-colors disabled:opacity-40"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Main Two-Column Body */}
      <form
        method="post"
        onSubmit={handleSend}
        className="flex-1 overflow-y-auto bg-gray-50 flex flex-col"
      >
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-0 divide-y lg:divide-y-0 lg:divide-x divide-gray-200">
          {/* LEFT PANE: Written Mail Preview & Edit */}
          <div className="lg:col-span-6 p-5 flex flex-col gap-4 bg-white">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-indigo-600" />
                <h2 className="text-sm font-bold text-gray-900">
                  Written Mail Preview
                </h2>
              </div>

              <div className="inline-flex rounded-lg border border-gray-200 bg-gray-100 p-0.5">
                <button
                  type="button"
                  onClick={() => setMailTab("preview")}
                  className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
                    mailTab === "preview"
                      ? "bg-white text-indigo-700 shadow-xs"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <Eye className="h-3.5 w-3.5" />
                  Preview Mail
                </button>
                <button
                  type="button"
                  onClick={() => setMailTab("edit")}
                  className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
                    mailTab === "edit"
                      ? "bg-white text-indigo-700 shadow-xs"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  Edit Mail
                </button>
              </div>
            </div>

            {loadingPreview ? (
              <div className="flex-1 flex flex-col items-center justify-center py-16 text-gray-500 gap-2">
                <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
                <span className="text-xs">Preparing email preview...</span>
              </div>
            ) : mailTab === "edit" ? (
              <div className="space-y-3.5">
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
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none"
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
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
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
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label
                    htmlFor={`${fieldPrefix}-message`}
                    className="block text-xs font-semibold text-gray-700 mb-1"
                  >
                    Written Mail Message <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id={`${fieldPrefix}-message`}
                    name="writtenMessage"
                    rows={10}
                    required
                    value={writtenMessage}
                    onChange={(e) => setWrittenMessage(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 leading-relaxed focus:border-indigo-500 focus:outline-none"
                  />
                  <p className="mt-1 text-[11px] text-gray-500">
                    The payment summary box and attached PDF invoice are automatically included below your message.
                  </p>
                </div>
              </div>
            ) : (
              /* LIVE RENDERED WRITTEN MAIL PREVIEW (Safe Declarative JSX) */
              <div className="flex-1 flex flex-col gap-3">
                {/* Envelope Meta Strip */}
                <div className="rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-xs space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <span className="font-semibold text-gray-500">To: </span>
                      <span className="font-semibold text-gray-900">{toEmail}</span>
                      {ccEmail && (
                        <span className="text-gray-500 ml-2">• CC: {ccEmail}</span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setMailTab("edit")}
                      className="text-indigo-600 hover:text-indigo-800 font-semibold"
                    >
                      Edit
                    </button>
                  </div>
                  <div className="truncate">
                    <span className="font-semibold text-gray-500">Subject: </span>
                    <span className="font-semibold text-gray-900">{subject}</span>
                  </div>
                </div>

                {/* Email Body Preview Card */}
                <div className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-xs max-h-[460px] overflow-y-auto">
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
                          Official Payment Receipt &amp; Tax Invoice
                        </div>
                      </div>
                    </div>
                    <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold uppercase text-emerald-800">
                      {payment?.status || "completed"}
                    </span>
                  </div>

                  <div className="p-5 space-y-4">
                    {/* Written Message */}
                    <div className="text-xs sm:text-[13px] leading-relaxed text-gray-800 whitespace-pre-line">
                      {writtenMessage}
                    </div>

                    {/* Payment Summary Box */}
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs space-y-1.5">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 mb-1.5">
                        Payment &amp; Invoice Summary
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Invoice Number</span>
                        <span className="font-bold text-slate-900 font-mono">
                          {invoiceNumber}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Course / Program</span>
                        <span className="font-semibold text-slate-900 text-right max-w-[60%] truncate">
                          {payment?.course}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Payment Mode</span>
                        <span className="text-slate-900">
                          {getPaymentMethodLabel(payment?.paymentMethod)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Reference / Txn ID</span>
                        <span className="font-mono text-slate-900">{refId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">
                          Taxable Value + {effectiveGst.gstRate}% GST (Incl.)
                        </span>
                        <span className="text-slate-700">
                          {formatCurrencyINR(effectiveGst.taxableValue, true)} +{" "}
                          {formatCurrencyINR(effectiveGst.totalGst, true)}
                        </span>
                      </div>
                      <div className="flex justify-between pt-1.5 border-t border-slate-200 font-bold text-sm">
                        <span className="text-slate-900">Total Amount Paid</span>
                        <span className="text-indigo-700">
                          {formatCurrencyINR(effectiveGst.grandTotal, true)}
                        </span>
                      </div>
                      {Number(payment?.previouslyPaidAmount) > 0 && (
                        <div className="flex justify-between text-emerald-700 font-semibold">
                          <span>Previously Paid (Earlier)</span>
                          <span>
                            - {formatCurrencyINR(payment.previouslyPaidAmount, true)}
                          </span>
                        </div>
                      )}
                      {Number(payment?.balanceDue) > 0 && (
                        <div className="flex justify-between text-amber-700 font-semibold">
                          <span>Balance Remaining</span>
                          <span>
                            {formatCurrencyINR(payment.balanceDue, true)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Attachment Badge */}
                    <div className="flex items-center gap-2 rounded-lg border border-indigo-100 bg-indigo-50/70 px-3 py-2 text-xs text-indigo-900">
                      <Paperclip className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                      <span>
                        Attached PDF: <strong className="font-mono">{pdfFilename}</strong>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT PANE: Payment Invoice PDF Preview */}
          <div className="lg:col-span-6 p-5 flex flex-col gap-3 bg-gray-50/70">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-indigo-600" />
                <h2 className="text-sm font-bold text-gray-900">
                  Payment Invoice PDF Preview
                </h2>
                <span className="rounded-md bg-indigo-100 px-2 py-0.5 font-mono text-[11px] font-semibold text-indigo-700">
                  {pdfFilename}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => payment?._id && loadPreviewAndPdf(payment._id)}
                  disabled={loadingPdf}
                  title="Reload PDF Preview"
                  className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${loadingPdf ? "animate-spin" : ""}`} />
                  Refresh
                </button>
                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  className="inline-flex items-center gap-1 rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-100"
                >
                  <Download className="h-3.5 w-3.5" />
                  Download PDF
                </button>
              </div>
            </div>

            <div className="flex-1 min-h-[440px] rounded-xl border border-gray-300 bg-white overflow-hidden shadow-inner flex flex-col">
              {loadingPdf ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-2 text-gray-500">
                  <Loader2 className="h-7 w-7 animate-spin text-indigo-600" />
                  <span className="text-xs font-medium">Generating Payment Invoice PDF...</span>
                </div>
              ) : pdfError ? (
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center gap-3">
                  <AlertCircle className="h-8 w-8 text-red-500" />
                  <p className="text-xs text-red-700 max-w-sm">{pdfError}</p>
                  <button
                    type="button"
                    onClick={() => payment?._id && loadPreviewAndPdf(payment._id)}
                    className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700"
                  >
                    Retry Preview
                  </button>
                </div>
              ) : pdfBlobUrl ? (
                <iframe
                  src={`${pdfBlobUrl}#toolbar=0&navpanes=0`}
                  title={`Invoice PDF Preview for ${invoiceNumber}`}
                  className="w-full h-[500px] border-0"
                />
              ) : null}
            </div>
          </div>
        </div>

        {/* Sticky Footer */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-gray-200 bg-white px-6 py-4 shrink-0">
          <div className="text-xs text-gray-600">
            {payment?.invoiceSent ? (
              <span className="inline-flex items-center gap-1.5 text-emerald-700 font-medium">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                Previously sent ({payment.invoiceSentCount || 1}x) on{" "}
                {payment.invoiceSentAt
                  ? new Date(payment.invoiceSentAt).toLocaleString("en-IN")
                  : "earlier"}{" "}
                to {payment.invoiceLastSentTo || payment.email}
              </span>
            ) : (
              <span>
                Ready to send written mail with <strong>{pdfFilename}</strong> attached.
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
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700 disabled:opacity-50 transition-all"
            >
              {isSending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending Invoice Mail...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  {payment?.invoiceSent ? "Resend Payment Invoice Mail" : "Send Payment Invoice Mail"}
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </NativeModalDialog>
  );
}
