import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import {
  ArrowLeft,
  Download,
  Send,
  CheckCircle2,
  FileText,
  Mail,
} from "lucide-react";
import paymentApi from "../../api/paymentApi";
import SendInvoiceMailModal from "../../components/admin/payments/SendInvoiceMailModal";
import {
  formatCurrencyINR,
  getPaymentMethodLabel,
  computeGstBreakup,
} from "../../utils/paymentFormatters";

export default function PaymentDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [payment, setPayment] = useState(null);
  const [gstBreakup, setGstBreakup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const fetchPayment = async () => {
      try {
        setLoading(true);
        const data = await paymentApi.getPaymentById(id);
        setPayment(data.payment);
        setGstBreakup(
          data.gstBreakup ||
            computeGstBreakup(
              data.payment?.paymentAmount,
              data.payment?.gstRate ?? 18,
              data.payment?.gstInclusive !== false
            )
        );
      } catch (err) {
        console.error("Error fetching payment:", err);
        setError("Failed to load payment details");
        toast.error("Failed to load payment details");
      } finally {
        setLoading(false);
      }
    };

    fetchPayment();
  }, [id]);

  const handleDownloadPdf = async () => {
    if (!payment?._id) return;
    try {
      setDownloading(true);
      const blob = await paymentApi.fetchInvoicePdfBlob(payment._id, true);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const inv = payment.invoiceNumber || String(payment._id).slice(-6).toUpperCase();
      a.download = `Invoice_${inv}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("Invoice PDF downloaded");
    } catch (err) {
      console.error("Error downloading invoice PDF:", err);
      toast.error("Failed to download invoice PDF");
    } finally {
      setDownloading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString("en-IN");
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500" />
      </div>
    );
  }

  if (error || !payment) {
    return (
      <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-r-lg">
        <p className="text-sm text-red-700">{error || "Payment not found"}</p>
      </div>
    );
  }

  const effectiveGst =
    gstBreakup ||
    computeGstBreakup(
      payment.paymentAmount,
      payment.gstRate ?? 18,
      payment.gstInclusive !== false
    );

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">
              Payment &amp; Invoice Details
            </h1>
            {payment.invoiceNumber && (
              <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100">
                {payment.invoiceNumber}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-1">
            View payment receipt details, 18% GST breakup, and send invoice email.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={downloading}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-xs hover:bg-gray-50 disabled:opacity-50"
          >
            <Download className="h-4 w-4 text-gray-500" />
            {downloading ? "Downloading..." : "Download Invoice PDF"}
          </button>

          <button
            type="button"
            onClick={() => setIsInvoiceModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
          >
            <Send className="h-4 w-4" />
            {payment.invoiceSent ? "Resend Payment Invoice Mail" : "Send Payment Invoice Mail"}
          </button>

          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-gray-300 bg-white px-3.5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
        </div>
      </div>

      {/* Invoice Mail Status Banner */}
      <div
        className={`rounded-2xl border p-4 flex items-center justify-between gap-4 ${
          payment.invoiceSent
            ? "border-emerald-200 bg-emerald-50/70 text-emerald-900"
            : "border-indigo-100 bg-indigo-50/60 text-indigo-900"
        }`}
      >
        <div className="flex items-center gap-3 text-sm">
          {payment.invoiceSent ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          ) : (
            <Mail className="h-5 w-5 text-indigo-600 shrink-0" />
          )}
          <div>
            {payment.invoiceSent ? (
              <>
                <span className="font-semibold">Payment Invoice Mail Sent</span>{" "}
                <span className="text-xs text-emerald-800">
                  ({payment.invoiceSentCount || 1} time{payment.invoiceSentCount > 1 ? "s" : ""}) on{" "}
                  {formatDate(payment.invoiceSentAt)} to {payment.invoiceLastSentTo || payment.email}
                </span>
              </>
            ) : (
              <span>
                <strong>Invoice mail not sent yet.</strong> Click &ldquo;Send Payment Invoice Mail&rdquo; to preview the written mail and attached GST invoice PDF.
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Payment Details */}
        <div className="lg:col-span-2 bg-white shadow-xs border border-gray-200 overflow-hidden rounded-2xl">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center gap-2">
            <FileText className="h-4 w-4 text-indigo-600" />
            <h2 className="text-base font-semibold text-gray-900">
              Payment Information
            </h2>
          </div>
          <dl className="divide-y divide-gray-100">
            <div className="px-6 py-4 sm:grid sm:grid-cols-3 sm:gap-4">
              <dt className="text-sm font-medium text-gray-500">Payment Status</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${
                    payment.status === "completed"
                      ? "bg-emerald-100 text-emerald-800"
                      : payment.status === "failed" || payment.status === "cancelled"
                      ? "bg-red-100 text-red-800"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {payment.status}
                </span>
              </dd>
            </div>
            <div className="px-6 py-4 sm:grid sm:grid-cols-3 sm:gap-4">
              <dt className="text-sm font-medium text-gray-500">Amount Paid</dt>
              <dd className="mt-1 text-base font-bold text-gray-900 sm:mt-0 sm:col-span-2">
                {formatCurrencyINR(payment.paymentAmount, true)}
              </dd>
            </div>
            <div className="px-6 py-4 sm:grid sm:grid-cols-3 sm:gap-4">
              <dt className="text-sm font-medium text-gray-500">Payment Date</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {formatDate(payment.paymentDate || payment.createdAt)}
              </dd>
            </div>
            <div className="px-6 py-4 sm:grid sm:grid-cols-3 sm:gap-4">
              <dt className="text-sm font-medium text-gray-500">Payment Method</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {getPaymentMethodLabel(payment.paymentMethod)}
              </dd>
            </div>
            <div className="px-6 py-4 sm:grid sm:grid-cols-3 sm:gap-4">
              <dt className="text-sm font-medium text-gray-500">Transaction / Payment ID</dt>
              <dd className="mt-1 text-sm text-gray-900 font-mono sm:mt-0 sm:col-span-2">
                {payment.transactionId || payment.paymentId || "N/A"}
              </dd>
            </div>
            <div className="px-6 py-4 sm:grid sm:grid-cols-3 sm:gap-4">
              <dt className="text-sm font-medium text-gray-500">Course &amp; Purpose</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                <span className="font-semibold">{payment.course || "N/A"}</span>
                {payment.installmentLabel && (
                  <span className="ml-2 rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                    {payment.installmentLabel}
                  </span>
                )}
              </dd>
            </div>
            <div className="px-6 py-4 sm:grid sm:grid-cols-3 sm:gap-4">
              <dt className="text-sm font-medium text-gray-500">Student Name</dt>
              <dd className="mt-1 text-sm font-medium text-gray-900 sm:mt-0 sm:col-span-2">
                {payment.name}
              </dd>
            </div>
            <div className="px-6 py-4 sm:grid sm:grid-cols-3 sm:gap-4">
              <dt className="text-sm font-medium text-gray-500">Email</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {payment.email}
              </dd>
            </div>
            <div className="px-6 py-4 sm:grid sm:grid-cols-3 sm:gap-4">
              <dt className="text-sm font-medium text-gray-500">Phone</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {payment.phone || "Not provided"}
              </dd>
            </div>
            <div className="px-6 py-4 sm:grid sm:grid-cols-3 sm:gap-4">
              <dt className="text-sm font-medium text-gray-500">Billing Address</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 whitespace-pre-line">
                {payment.address || "Not provided"}
              </dd>
            </div>
            {payment.notes && (
              <div className="px-6 py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                <dt className="text-sm font-medium text-gray-500">Notes</dt>
                <dd className="mt-1 text-sm text-gray-700 sm:mt-0 sm:col-span-2">
                  {payment.notes}
                </dd>
              </div>
            )}
          </dl>
        </div>

        {/* GST & Fee Breakdown Card */}
        <div className="bg-white shadow-xs border border-gray-200 rounded-2xl overflow-hidden self-start">
          <div className="px-6 py-4 bg-indigo-950 text-white">
            <h2 className="text-base font-semibold">GST &amp; Fee Breakdown</h2>
            <p className="text-xs text-indigo-200 mt-0.5">
              {effectiveGst.gstRate > 0
                ? effectiveGst.gstInclusive
                  ? `Inclusive of ${effectiveGst.gstRate}% GST`
                  : `Plus ${effectiveGst.gstRate}% GST`
                : "Zero GST"}
            </p>
          </div>
          <div className="p-6 space-y-3 text-sm">
            {Number(payment.totalCourseFee) > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-500">Total Program Fee</span>
                <span className="font-medium text-gray-900">
                  {formatCurrencyINR(payment.totalCourseFee, true)}
                </span>
              </div>
            )}
            {Number(payment.discountAmount) > 0 && (
              <div className="flex justify-between text-emerald-700">
                <span>Discount</span>
                <span>- {formatCurrencyINR(payment.discountAmount, true)}</span>
              </div>
            )}
            {Number(payment.previouslyPaidAmount) > 0 && (
              <div className="flex justify-between text-emerald-700">
                <span>Previously Paid (Earlier)</span>
                <span>- {formatCurrencyINR(payment.previouslyPaidAmount, true)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-500">Taxable Value</span>
              <span className="font-medium text-gray-900">
                {formatCurrencyINR(effectiveGst.taxableValue, true)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">CGST ({effectiveGst.cgstRate}%)</span>
              <span className="text-gray-800">
                {formatCurrencyINR(effectiveGst.cgstAmount, true)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">SGST ({effectiveGst.sgstRate}%)</span>
              <span className="text-gray-800">
                {formatCurrencyINR(effectiveGst.sgstAmount, true)}
              </span>
            </div>
            <div className="flex justify-between pt-3 border-t border-gray-200 text-base font-bold">
              <span className="text-gray-900">Total Paid</span>
              <span className="text-indigo-700">
                {formatCurrencyINR(effectiveGst.grandTotal, true)}
              </span>
            </div>
            {Number(payment.balanceDue) > 0 && (
              <div className="flex justify-between pt-2 text-amber-700 font-semibold">
                <span>Balance Remaining</span>
                <span>{formatCurrencyINR(payment.balanceDue, true)}</span>
              </div>
            )}
            {(payment.companyGstin || payment.studentGstin) && (
              <div className="pt-3 border-t border-gray-100 text-xs space-y-1 text-gray-500 font-mono">
                {payment.companyGstin && <div>Inxyme GSTIN: {payment.companyGstin}</div>}
                {payment.studentGstin && <div>Student GSTIN: {payment.studentGstin}</div>}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Send Payment Invoice Mail Popup */}
      <SendInvoiceMailModal
        open={isInvoiceModalOpen}
        payment={payment}
        onClose={() => setIsInvoiceModalOpen(false)}
        onEmailSent={(updated) => {
          if (updated) setPayment(updated);
        }}
      />
    </div>
  );
}
