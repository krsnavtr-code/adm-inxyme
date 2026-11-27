import React, { useState, useEffect, useId, useCallback, useMemo } from "react";
import { toast } from "react-hot-toast";
import { Link, useSearchParams } from "react-router-dom";
import {
  Plus,
  Search,
  Filter,
  RefreshCw,
  Mail,
  Download,
  Eye,
  CheckCircle2,
  Clock,
  IndianRupee,
  FileText,
  Link2,
  Send,
  X,
  Receipt,
  CreditCard,
  BellRing,
  User,
  Pencil,
} from "lucide-react";
import paymentApi from "../../api/paymentApi";
import userApi from "../../api/userApi";
import AddPaymentModal from "../../components/admin/payments/AddPaymentModal";
import SendInvoiceMailModal from "../../components/admin/payments/SendInvoiceMailModal";
import SendPendingAlertModal from "../../components/admin/payments/SendPendingAlertModal";
import {
  formatCurrencyINR,
  formatDiscountPercent,
  getPaymentMethodLabel,
} from "../../utils/paymentFormatters";

export default function PaymentsList() {
  const tableHeadingId = useId();
  const searchInputId = useId();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialUserId = searchParams.get("userId") || "";

  const [payments, setPayments] = useState([]);
  const [stats, setStats] = useState({
    totalRecords: 0,
    completedCount: 0,
    pendingCount: 0,
    invoicesSentCount: 0,
    totalCollected: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [userFilter, setUserFilter] = useState("all");
  const [users, setUsers] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [methodFilter, setMethodFilter] = useState("all");
  const [invoiceSentFilter, setInvoiceSentFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(Boolean(initialUserId));
  const [editingPayment, setEditingPayment] = useState(null);
  const [recentAddedPayment, setRecentAddedPayment] = useState(null);
  const [invoiceModalPayment, setInvoiceModalPayment] = useState(null);
  const [alertModalPayment, setAlertModalPayment] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);

  // Load user directory for the Student / User filter dropdown
  useEffect(() => {
    let cancelled = false;
    const loadUsersForFilter = async () => {
      try {
        const res = await userApi.getUsers();
        if (cancelled) return;
        const list = Array.isArray(res) ? res : res?.data || res?.users || [];
        if (Array.isArray(list)) {
          setUsers(list);
        }
      } catch (err) {
        console.warn("Could not load users list for payment filter:", err);
      }
    };
    loadUsersForFilter();
    return () => {
      cancelled = true;
    };
  }, []);

  const { studentUsers, otherUsers } = useMemo(() => {
    const sorted = [...users].sort((a, b) =>
      (a.fullname || a.email || "").localeCompare(b.fullname || b.email || "")
    );
    const students = [];
    const others = [];
    for (const u of sorted) {
      if ((u.role || "student").toLowerCase() === "student") {
        students.push(u);
      } else {
        others.push(u);
      }
    }
    return { studentUsers: students, otherUsers: others };
  }, [users]);

  const selectedFilterUser = useMemo(
    () =>
      userFilter !== "all"
        ? users.find((u) => String(u._id) === String(userFilter)) || null
        : null,
    [users, userFilter]
  );

  const hasActiveFilters =
    userFilter !== "all" ||
    statusFilter !== "all" ||
    methodFilter !== "all" ||
    invoiceSentFilter !== "all" ||
    searchTerm.trim() !== "";

  const handleResetAllFilters = () => {
    setUserFilter("all");
    setStatusFilter("all");
    setMethodFilter("all");
    setInvoiceSentFilter("all");
    setSearchTerm("");
    setPage(1);
  };

  const fetchPayments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {
        page,
        limit: 15,
      };
      if (userFilter !== "all") params.userId = userFilter;
      if (statusFilter !== "all") params.status = statusFilter;
      if (methodFilter !== "all") params.paymentMethod = methodFilter;
      if (invoiceSentFilter !== "all") params.invoiceSent = invoiceSentFilter;
      if (searchTerm.trim()) params.search = searchTerm.trim();

      const data = await paymentApi.getAllPayments(params);
      setPayments(data.payments || []);
      if (data.stats) setStats(data.stats);
      setTotalPages(data.totalPages || 1);
      setTotalCount(data.count || 0);
    } catch (err) {
      console.error("Error fetching payments:", err);
      const errMsg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to load payments";
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  }, [page, userFilter, statusFilter, methodFilter, invoiceSentFilter, searchTerm]);

  useEffect(() => {
    fetchPayments();
  }, [page, userFilter, statusFilter, methodFilter, invoiceSentFilter]);

  // Open Add Modal automatically if ?userId= is present in URL
  useEffect(() => {
    if (initialUserId) {
      setIsAddModalOpen(true);
    }
  }, [initialUserId]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchPayments();
  };

  const handleAddSuccess = (savedPayment, meta = {}) => {
    setIsAddModalOpen(false);
    setEditingPayment(null);
    if (initialUserId) {
      searchParams.delete("userId");
      setSearchParams(searchParams, { replace: true });
    }
    if (meta?.isEdit && savedPayment?._id) {
      setPayments((prev) =>
        prev.map((p) => (p._id === savedPayment._id ? savedPayment : p))
      );
      if (recentAddedPayment?._id === savedPayment._id) {
        setRecentAddedPayment(savedPayment);
      }
      fetchPayments();
      return;
    }
    setRecentAddedPayment(savedPayment);
    setPage(1);
    fetchPayments();
  };

  const handleCloseAddModal = () => {
    setIsAddModalOpen(false);
    setEditingPayment(null);
    if (initialUserId) {
      searchParams.delete("userId");
      setSearchParams(searchParams, { replace: true });
    }
  };

  const handleDownloadPdf = async (payment) => {
    try {
      setDownloadingId(payment._id);
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
      setDownloadingId(null);
    }
  };

  const handleInvoiceSent = (updatedPayment) => {
    if (!updatedPayment) {
      fetchPayments();
      return;
    }
    setPayments((prev) =>
      prev.map((p) => (p._id === updatedPayment._id ? updatedPayment : p))
    );
    if (recentAddedPayment?._id === updatedPayment._id) {
      setRecentAddedPayment(updatedPayment);
    }
    fetchPayments();
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <h1 id={tableHeadingId} className="text-2xl font-bold text-gray-900 tracking-tight">
            Student Payments &amp; Invoices
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Record payments for students from the user database, preview GST invoices, and email receipts.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/admin/payment-links"
            className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-xs hover:bg-gray-50 transition-colors"
          >
            <Link2 className="h-4 w-4 text-gray-500" />
            Payment Links
          </Link>

          <button
            type="button"
            onClick={() => {
              setEditingPayment(null);
              setIsAddModalOpen(true);
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-700 transition-all"
          >
            <Plus className="h-4 w-4" />
            Add Student Payment
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Total Collected
            </p>
            <p className="mt-1 text-2xl font-bold text-gray-900">
              {formatCurrencyINR(stats.totalCollected)}
            </p>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <IndianRupee className="h-5 w-5" />
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Completed Payments
            </p>
            <p className="mt-1 text-2xl font-bold text-emerald-600">
              {stats.completedCount}
            </p>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Invoices Sent
            </p>
            <p className="mt-1 text-2xl font-bold text-indigo-700">
              {stats.invoicesSentCount}
            </p>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <Mail className="h-5 w-5" />
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Pending Records
            </p>
            <p className="mt-1 text-2xl font-bold text-amber-600">
              {stats.pendingCount}
            </p>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
            <Clock className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Just-Added Payment Banner with direct "Send Payment Invoice Mail" action */}
      {recentAddedPayment && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/90 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white">
              <Receipt className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-emerald-950">
                Payment Added Successfully ({recentAddedPayment.invoiceNumber})
              </h2>
              <p className="text-xs text-emerald-800 mt-0.5">
                {recentAddedPayment.name} &bull; {recentAddedPayment.course} &bull;{" "}
                <strong>{formatCurrencyINR(recentAddedPayment.paymentAmount, true)}</strong>{" "}
                ({getPaymentMethodLabel(recentAddedPayment.paymentMethod)})
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setInvoiceModalPayment(recentAddedPayment)}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 transition-colors"
            >
              <Send className="h-3.5 w-3.5" />
              Send Payment Invoice Mail
            </button>
            {(Number(recentAddedPayment.balanceDue) > 0 ||
              recentAddedPayment.status === "pending") && (
              <button
                type="button"
                onClick={() => setAlertModalPayment(recentAddedPayment)}
                className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-amber-700 transition-colors"
              >
                <BellRing className="h-3.5 w-3.5" />
                Send Pending Payment Alert
              </button>
            )}
            <button
              type="button"
              onClick={() => setRecentAddedPayment(null)}
              aria-label="Dismiss payment banner"
              className="rounded-lg p-1.5 text-emerald-700 hover:bg-emerald-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Search & Filter Bar */}
      <search>
        <form
          onSubmit={handleSearchSubmit}
          className="rounded-2xl border border-gray-200 bg-white p-4 shadow-xs flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between"
        >
          <div className="flex-1 flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <label htmlFor={searchInputId} className="sr-only">
                Search payments by student, email, phone, course, invoice number, or transaction ID
              </label>
              <input
                id={searchInputId}
                type="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search student name, email, course, invoice no, or transaction ID..."
                autoCorrect="off"
                autoCapitalize="none"
                spellCheck={false}
                className="w-full rounded-xl border border-gray-200 pl-10 pr-4 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <button
              type="submit"
              className="rounded-xl bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors"
            >
              Search
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-gray-50 px-3 py-1.5 max-w-[230px]">
              <User className="h-3.5 w-3.5 text-gray-500 shrink-0" />
              <select
                aria-label="Filter by student or user"
                value={userFilter}
                onChange={(e) => {
                  setUserFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full bg-transparent text-xs font-medium text-gray-700 outline-none cursor-pointer truncate"
              >
                <option value="all">All Students / Users</option>
                {studentUsers.length > 0 && (
                  <optgroup label="Students">
                    {studentUsers.map((u) => (
                      <option key={u._id} value={u._id}>
                        {u.fullname ? `${u.fullname} (${u.email})` : u.email}
                      </option>
                    ))}
                  </optgroup>
                )}
                {otherUsers.length > 0 && (
                  <optgroup label="Other Users">
                    {otherUsers.map((u) => (
                      <option key={u._id} value={u._id}>
                        {u.fullname ? `${u.fullname} (${u.email})` : u.email}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
            </div>

            <div className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-gray-50 px-3 py-1.5">
              <Filter className="h-3.5 w-3.5 text-gray-500" />
              <select
                aria-label="Filter by payment status"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="bg-transparent text-xs font-medium text-gray-700 outline-none cursor-pointer"
              >
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-gray-50 px-3 py-1.5">
              <CreditCard className="h-3.5 w-3.5 text-gray-500" />
              <select
                aria-label="Filter by payment method"
                value={methodFilter}
                onChange={(e) => {
                  setMethodFilter(e.target.value);
                  setPage(1);
                }}
                className="bg-transparent text-xs font-medium text-gray-700 outline-none cursor-pointer"
              >
                <option value="all">All Modes</option>
                <option value="upi">UPI</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="razorpay">Razorpay</option>
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="cheque">Cheque</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-gray-50 px-3 py-1.5">
              <Mail className="h-3.5 w-3.5 text-gray-500" />
              <select
                aria-label="Filter by invoice mail status"
                value={invoiceSentFilter}
                onChange={(e) => {
                  setInvoiceSentFilter(e.target.value);
                  setPage(1);
                }}
                className="bg-transparent text-xs font-medium text-gray-700 outline-none cursor-pointer"
              >
                <option value="all">All Invoice Mail</option>
                <option value="true">Invoice Sent</option>
                <option value="false">Not Sent Yet</option>
              </select>
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetAllFilters}
                className="inline-flex items-center gap-1 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
              >
                <X className="h-3.5 w-3.5" />
                Clear
              </button>
            )}

            <button
              type="button"
              onClick={fetchPayments}
              title="Refresh Payments"
              aria-label="Refresh Payments"
              className="rounded-xl border border-gray-200 p-2 text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </form>
      </search>

      {/* Active Student Filter Summary Banner */}
      {selectedFilterUser && (
        <div className="rounded-2xl border border-indigo-200 bg-indigo-50/70 px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
              {(selectedFilterUser.fullname || selectedFilterUser.email || "U")
                .charAt(0)
                .toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-bold text-indigo-950 truncate">
                  {selectedFilterUser.fullname || "Student"}
                </span>
                <span className="text-xs text-indigo-700 truncate">
                  {selectedFilterUser.email}
                </span>
                {selectedFilterUser.discountedCoursePrice !== null &&
                selectedFilterUser.discountedCoursePrice !== undefined &&
                Number(selectedFilterUser.discountCoursePrice) > 0 ? (
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
                    Offered {formatCurrencyINR(selectedFilterUser.discountedCoursePrice)} /{" "}
                    {formatCurrencyINR(selectedFilterUser.discountCoursePrice)} (
                    {formatDiscountPercent(selectedFilterUser.discount)} OFF)
                  </span>
                ) : (
                  Number(selectedFilterUser.discount) > 0 && (
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
                      {formatDiscountPercent(selectedFilterUser.discount)} Discount
                    </span>
                  )
                )}
              </div>
              <p className="text-xs text-indigo-700 mt-0.5">
                Showing {totalCount} payment record{totalCount === 1 ? "" : "s"} for this student
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Payment
            </button>
            <button
              type="button"
              onClick={() => {
                setUserFilter("all");
                setPage(1);
              }}
              className="inline-flex items-center gap-1 rounded-xl border border-indigo-200 bg-white px-3 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-50 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
              Show All Students
            </button>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="rounded-xl border-l-4 border-red-500 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Responsive Payments Table */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-xs overflow-hidden">
        <div
          tabIndex={0}
          role="region"
          aria-labelledby={tableHeadingId}
          className="overflow-x-auto"
        >
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="py-3.5 pl-6 pr-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Invoice &amp; Date
                </th>
                <th scope="col" className="px-3 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Student Details
                </th>
                <th scope="col" className="px-3 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Course &amp; Purpose
                </th>
                <th scope="col" className="px-3 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Amount &amp; Mode
                </th>
                <th scope="col" className="px-3 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Status &amp; Invoice Mail
                </th>
                <th scope="col" className="py-3.5 pl-3 pr-6 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-sm text-gray-500">
                    <div className="inline-flex items-center gap-2">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
                      <span>Loading payment records...</span>
                    </div>
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-14 text-center text-sm text-gray-500">
                    <Receipt className="mx-auto mb-2 h-10 w-10 text-gray-300" />
                    <p className="font-semibold text-gray-700">No payment records found</p>
                    <p className="mt-1 text-xs text-gray-400">
                      Add a student payment from the user database to generate an invoice and send receipts.
                    </p>
                    <button
                      type="button"
                      onClick={() => setIsAddModalOpen(true)}
                      className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add Student Payment
                    </button>
                  </td>
                </tr>
              ) : (
                payments.map((payment) => {
                  const invNo =
                    payment.invoiceNumber ||
                    `INV-${String(payment._id || "").slice(-6).toUpperCase()}`;
                  const isHighlighted = recentAddedPayment?._id === payment._id;
                  const rowUserId =
                    payment.userId?._id ||
                    (typeof payment.userId === "string" ? payment.userId : "") ||
                    users.find(
                      (u) =>
                        (u.email || "").toLowerCase() ===
                        (payment.email || "").toLowerCase()
                    )?._id ||
                    "";

                  return (
                    <tr
                      key={payment._id}
                      className={`transition-colors hover:bg-gray-50/80 ${
                        isHighlighted ? "bg-emerald-50/40" : ""
                      }`}
                    >
                      {/* Invoice & Date */}
                      <td className="whitespace-nowrap py-4 pl-6 pr-3 text-sm">
                        <div className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded inline-block">
                          {invNo}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {formatDate(payment.paymentDate || payment.createdAt)}
                        </div>
                        <div className="text-[10px] text-gray-400 mt-0.5 capitalize">
                          {payment.source === "admin_manual"
                            ? "Admin Entry"
                            : payment.source === "payment_link"
                            ? "Payment Link"
                            : "Online Form"}
                        </div>
                      </td>

                      {/* Student */}
                      <td className="py-4 px-3 text-sm">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-semibold text-gray-900">{payment.name}</span>
                          {rowUserId && String(userFilter) !== String(rowUserId) && (
                            <button
                              type="button"
                              onClick={() => {
                                setUserFilter(String(rowUserId));
                                setPage(1);
                              }}
                              className="inline-flex items-center gap-0.5 rounded bg-indigo-50 px-1.5 py-0.5 text-[10px] font-medium text-indigo-700 hover:bg-indigo-100 transition-colors"
                              title={`Filter payments for ${payment.name}`}
                            >
                              <Filter className="h-2.5 w-2.5" />
                              Filter
                            </button>
                          )}
                        </div>
                        <div className="text-xs text-gray-500">{payment.email}</div>
                        {payment.phone && payment.phone !== "Not provided" && (
                          <div className="text-xs text-gray-400">{payment.phone}</div>
                        )}
                      </td>

                      {/* Course */}
                      <td className="py-4 px-3 text-sm max-w-[260px]">
                        <div className="font-medium text-gray-900 truncate" title={payment.course}>
                          {payment.course}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {payment.installmentLabel || "Course Fee"}
                        </div>
                        {Number(payment.totalCourseFee) > 0 && (
                          <div className="mt-1 flex flex-wrap items-center gap-1 text-[10px]">
                            <span className="rounded bg-slate-100 px-1.5 py-0.5 font-medium text-slate-700">
                              Fee: {formatCurrencyINR(payment.totalCourseFee)}
                            </span>
                            {Number(payment.discountAmount) > 0 && (
                              <span className="rounded bg-emerald-50 px-1.5 py-0.5 font-semibold text-emerald-700 border border-emerald-200">
                                Offered:{" "}
                                {formatCurrencyINR(
                                  Math.max(
                                    0,
                                    Number(payment.totalCourseFee) - Number(payment.discountAmount)
                                  )
                                )}{" "}
                                (
                                {formatDiscountPercent(
                                  (Number(payment.discountAmount) / Number(payment.totalCourseFee)) *
                                    100
                                )}{" "}
                                off)
                              </span>
                            )}
                          </div>
                        )}
                        {Number(payment.balanceDue) > 0 && (
                          <span className="mt-1 inline-block rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800 border border-amber-200">
                            Due: {formatCurrencyINR(payment.balanceDue)}
                          </span>
                        )}
                      </td>

                      {/* Amount & Mode */}
                      <td className="whitespace-nowrap py-4 px-3 text-sm">
                        <div className="font-bold text-gray-900">
                          {formatCurrencyINR(payment.paymentAmount)}
                        </div>
                        <div className="text-[11px] text-gray-500 mt-0.5">
                          {getPaymentMethodLabel(payment.paymentMethod)}
                        </div>
                        {(payment.transactionId || payment.paymentId) && (
                          <div className="font-mono text-[10px] text-gray-400 mt-0.5 truncate max-w-[140px]">
                            {payment.transactionId || payment.paymentId}
                          </div>
                        )}
                      </td>

                      {/* Status & Mail */}
                      <td className="whitespace-nowrap py-4 px-3 text-sm space-y-1.5">
                        <div>
                          <span
                            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${
                              payment.status === "completed"
                                ? "bg-emerald-100 text-emerald-800"
                                : payment.status === "failed" || payment.status === "cancelled"
                                ? "bg-red-100 text-red-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {payment.status}
                          </span>
                        </div>
                        <div>
                          {payment.invoiceSent ? (
                            <span
                              className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-700 border border-indigo-100"
                              title={
                                payment.invoiceSentAt
                                  ? `Sent on ${new Date(payment.invoiceSentAt).toLocaleString("en-IN")}`
                                  : "Invoice Sent"
                              }
                            >
                              <CheckCircle2 className="h-3 w-3 text-indigo-600" />
                              Invoice Sent
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600">
                              Not Sent
                            </span>
                          )}
                        </div>
                        {payment.pendingAlertSent && (
                          <div>
                            <span
                              className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800 border border-amber-200"
                              title={
                                payment.pendingAlertSentAt
                                  ? `Alert sent on ${new Date(payment.pendingAlertSentAt).toLocaleString("en-IN")}`
                                  : "Pending Alert Sent"
                              }
                            >
                              <BellRing className="h-3 w-3 text-amber-600" />
                              Alert Sent ({payment.pendingAlertSentCount || 1}x)
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="whitespace-nowrap py-4 pl-3 pr-6 text-right text-sm">
                        <div className="inline-flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setInvoiceModalPayment(payment)}
                            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                              payment.invoiceSent
                                ? "border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                                : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-xs"
                            }`}
                          >
                            <Send className="h-3.5 w-3.5" />
                            {payment.invoiceSent ? "Resend Invoice Mail" : "Send Payment Invoice Mail"}
                          </button>

                          <button
                            type="button"
                            onClick={() => setAlertModalPayment(payment)}
                            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                              Number(payment.balanceDue) > 0 || payment.status === "pending"
                                ? payment.pendingAlertSent
                                  ? "border border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100"
                                  : "bg-amber-600 text-white hover:bg-amber-700 shadow-xs"
                                : "border border-gray-200 bg-white text-gray-600 hover:border-amber-300 hover:bg-amber-50 hover:text-amber-800"
                            }`}
                          >
                            <BellRing className="h-3.5 w-3.5" />
                            {payment.pendingAlertSent
                              ? "Resend Pending Alert"
                              : "Send Pending Payment Alert"}
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setEditingPayment(payment);
                              setIsAddModalOpen(true);
                            }}
                            title="Edit Payment"
                            aria-label={`Edit payment for ${payment.name}`}
                            className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-100 hover:text-indigo-700 transition-colors"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDownloadPdf(payment)}
                            disabled={downloadingId === payment._id}
                            title="Download Invoice PDF"
                            aria-label={`Download Invoice PDF for ${payment.name}`}
                            className="rounded-lg border border-gray-200 p-1.5 text-gray-600 hover:bg-gray-100 hover:text-gray-900 disabled:opacity-40 transition-colors"
                          >
                            {downloadingId === payment._id ? (
                              <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                              <Download className="h-4 w-4" />
                            )}
                          </button>

                          <Link
                            to={`/admin/payments/${payment._id}`}
                            title="View Payment Details"
                            aria-label={`View payment details for ${payment.name}`}
                            className="rounded-lg border border-gray-200 p-1.5 text-gray-600 hover:bg-gray-100 hover:text-indigo-700 transition-colors"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalCount > 0 && (
          <div className="flex items-center justify-between border-t border-gray-100 px-6 py-3.5 bg-gray-50/40">
            <span className="text-xs text-gray-500">
              Page {page} of {totalPages} &bull; {totalCount} total payment{totalCount === 1 ? "" : "s"}
            </span>
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add / Edit Student Payment Modal */}
      <AddPaymentModal
        open={isAddModalOpen}
        onClose={handleCloseAddModal}
        onSuccess={handleAddSuccess}
        initialUserId={initialUserId || (userFilter !== "all" ? userFilter : "")}
        editingPayment={editingPayment}
      />

      {/* Send Payment Invoice Mail Preview Popup */}
      <SendInvoiceMailModal
        open={Boolean(invoiceModalPayment)}
        payment={invoiceModalPayment}
        onClose={() => setInvoiceModalPayment(null)}
        onEmailSent={handleInvoiceSent}
      />

      {/* Send Pending Payment Alert Preview Popup */}
      <SendPendingAlertModal
        open={Boolean(alertModalPayment)}
        payment={alertModalPayment}
        onClose={() => setAlertModalPayment(null)}
        onAlertSent={handleInvoiceSent}
      />
    </div>
  );
}
