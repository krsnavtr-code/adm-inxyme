import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import api from "../../api/axios";
import {
  Link2,
  Plus,
  Copy,
  Check,
  Send,
  Eye,
  Trash2,
  Ban,
  Search,
  Filter,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertCircle,
  IndianRupee,
  ExternalLink,
  MessageCircle,
  Calendar,
  X,
  CreditCard,
  User,
  BookOpen,
} from "lucide-react";

export default function PaymentLinksPage() {
  const [links, setLinks] = useState([]);
  const [stats, setStats] = useState({
    totalLinks: 0,
    paidLinks: 0,
    activeLinks: 0,
    totalAmountCollected: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedLink, setSelectedLink] = useState(null);
  const [createdLinkData, setCreatedLinkData] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  // Available courses for dropdown
  const [courses, setCourses] = useState([]);

  // Create form fields
  const [formData, setFormData] = useState({
    title: "",
    amount: "",
    course: "",
    studentName: "",
    studentEmail: "",
    studentPhone: "",
    description: "",
    expiresInDays: "7",
  });

  // Fetch Payment Links
  const fetchPaymentLinks = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 15,
      };
      if (statusFilter !== "all") params.status = statusFilter;
      if (searchTerm.trim()) params.search = searchTerm.trim();

      const response = await api.get("/admin/payment-links", { params });

      if (response.data?.success) {
        setLinks(response.data.paymentLinks || []);
        setStats(response.data.stats || stats);
        setTotalPages(response.data.totalPages || 1);
      }
    } catch (err) {
      console.error("Error fetching payment links:", err);
      toast.error("Failed to load payment links");
    } finally {
      setLoading(false);
    }
  };

  // Fetch courses list for dropdown
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await api.get("/courses", {
          params: { limit: 100, fields: "_id,title" },
        });
        const list = response?.data?.data || response?.data?.courses || response?.data || [];
        if (Array.isArray(list)) {
          setCourses(list);
        }
      } catch (err) {
        console.error("Error loading courses:", err);
      }
    };
    fetchCourses();
  }, []);

  useEffect(() => {
    fetchPaymentLinks();
  }, [page, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchPaymentLinks();
  };

  const handleCopyLink = (url, id) => {
    if (!url) return;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    toast.success("Payment link copied to clipboard!");
    setTimeout(() => {
      setCopiedId(null);
    }, 2500);
  };

  const handleWhatsAppShare = (linkItem) => {
    const studentName = linkItem.studentName ? `Hi ${linkItem.studentName}, ` : "Hi, ";
    const msg = `${studentName}here is your secure payment link from Inxyme for "${linkItem.title}" (Amount: ₹${linkItem.amount?.toLocaleString("en-IN")}):\n\n👉 Pay securely: ${linkItem.paymentUrl}\n\nPlease let us know once completed. Thank you!`;
    const phone = linkItem.studentPhone ? linkItem.studentPhone.replace(/\D/g, "") : "";
    const waUrl = phone
      ? `https://wa.me/${phone.startsWith("91") ? phone : "91" + phone}?text=${encodeURIComponent(msg)}`
      : `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(waUrl, "_blank");
  };

  const handleCancelLink = async (id) => {
    if (!window.confirm("Are you sure you want to cancel this payment link?")) return;
    try {
      const response = await api.patch(`/admin/payment-links/${id}/cancel`);
      if (response.data?.success) {
        toast.success("Payment link cancelled");
        fetchPaymentLinks();
      }
    } catch (err) {
      console.error("Error cancelling payment link:", err);
      toast.error(err.response?.data?.message || "Failed to cancel payment link");
    }
  };

  const handleDeleteLink = async (id) => {
    if (!window.confirm("Are you sure you want to permanently delete this payment link?")) return;
    try {
      const response = await api.delete(`/admin/payment-links/${id}`);
      if (response.data?.success) {
        toast.success("Payment link deleted");
        fetchPaymentLinks();
      }
    } catch (err) {
      console.error("Error deleting payment link:", err);
      toast.error(err.response?.data?.message || "Failed to delete payment link");
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error("Please enter a payment title or purpose");
      return;
    }
    const num = Number(formData.amount);
    if (!num || num < 1) {
      toast.error("Please enter a valid amount (minimum ₹1)");
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        title: formData.title.trim(),
        amount: num,
        course: formData.course.trim(),
        studentName: formData.studentName.trim(),
        studentEmail: formData.studentEmail.trim(),
        studentPhone: formData.studentPhone.trim(),
        description: formData.description.trim(),
        expiresInDays: formData.expiresInDays === "none" ? null : Number(formData.expiresInDays),
      };

      const response = await api.post("/admin/payment-links", payload);

      if (response.data?.success) {
        toast.success("Payment link created successfully!");
        setCreatedLinkData({
          ...response.data.paymentLink,
          paymentUrl: response.data.paymentUrl,
        });
        setIsCreateOpen(false);
        setIsSuccessOpen(true);
        // Reset form
        setFormData({
          title: "",
          amount: "",
          course: "",
          studentName: "",
          studentEmail: "",
          studentPhone: "",
          description: "",
          expiresInDays: "7",
        });
        fetchPaymentLinks();
      }
    } catch (err) {
      console.error("Error creating payment link:", err);
      toast.error(err.response?.data?.message || "Failed to create payment link");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Header & Navigation Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Payment Links</h1>
            <span className="bg-indigo-100 text-indigo-700 text-xs font-semibold px-2.5 py-0.5 rounded-full">
              Razorpay Integrated
            </span>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Generate custom payment links with specific amounts and send directly to students.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/admin/payments"
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-xl shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none transition-colors"
          >
            <CreditCard className="w-4 h-4 mr-2 text-gray-500" />
            Payment Records
          </Link>

          <button
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none transition-all shadow-indigo-500/25"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Create Payment Link
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Links</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalLinks}</p>
          </div>
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
            <Link2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Active Links</p>
            <p className="text-2xl font-bold text-amber-600 mt-1">{stats.activeLinks}</p>
          </div>
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Paid / Settled</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">{stats.paidLinks}</p>
          </div>
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Amount Collected</p>
            <p className="text-2xl font-bold text-indigo-900 mt-1">
              ₹{(stats.totalAmountCollected || 0).toLocaleString("en-IN")}
            </p>
          </div>
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
            <IndianRupee className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="flex-1 w-full flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by student name, email, phone, purpose or link ID..."
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-xl transition-colors"
          >
            Search
          </button>
        </form>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-1.5 border border-gray-200 rounded-xl px-3 py-1.5 bg-gray-50">
            <Filter className="w-3.5 h-3.5 text-gray-500" />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="bg-transparent text-xs font-medium text-gray-700 outline-none cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="active">Active / Pending</option>
              <option value="paid">Paid</option>
              <option value="expired">Expired</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <button
            onClick={() => fetchPaymentLinks()}
            title="Refresh List"
            className="p-2 border border-gray-200 hover:bg-gray-50 rounded-xl text-gray-600 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Payment Links Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-3.5 pl-6 pr-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Link ID &amp; Purpose
                </th>
                <th className="px-3 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Student Details
                </th>
                <th className="px-3 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-3 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-3 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Created Date
                </th>
                <th className="relative py-3.5 pl-3 pr-6 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-sm text-gray-500">
                    <div className="flex justify-center items-center gap-2">
                      <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                      <span>Loading payment links...</span>
                    </div>
                  </td>
                </tr>
              ) : links.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-sm text-gray-500">
                    <div className="max-w-sm mx-auto">
                      <Link2 className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                      <p className="font-medium text-gray-700">No payment links found</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Create your first custom payment link to send directly to a student.
                      </p>
                      <button
                        onClick={() => setIsCreateOpen(true)}
                        className="mt-4 inline-flex items-center px-3.5 py-1.5 rounded-lg text-xs font-medium bg-indigo-600 text-white hover:bg-indigo-700"
                      >
                        <Plus className="w-3.5 h-3.5 mr-1" /> Create Link
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                links.map((link) => (
                  <tr key={link._id} className="hover:bg-gray-50/70 transition-colors">
                    {/* Link ID & Purpose */}
                    <td className="py-4 pl-6 pr-3 text-sm">
                      <div className="font-semibold text-gray-900">{link.title}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="font-mono text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                          {link.linkId}
                        </span>
                        {link.course && (
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded truncate max-w-[150px]">
                            {link.course}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Student Info */}
                    <td className="px-3 py-4 text-sm text-gray-600">
                      {link.studentName ? (
                        <div className="font-medium text-gray-900">{link.studentName}</div>
                      ) : (
                        <span className="text-gray-400 text-xs italic">Not pre-filled</span>
                      )}
                      {link.studentEmail && (
                        <div className="text-xs text-gray-500 truncate max-w-[180px]">{link.studentEmail}</div>
                      )}
                      {link.studentPhone && (
                        <div className="text-xs text-gray-500">{link.studentPhone}</div>
                      )}
                    </td>

                    {/* Amount */}
                    <td className="px-3 py-4 text-sm font-bold text-gray-900">
                      ₹{link.amount?.toLocaleString("en-IN")}
                    </td>

                    {/* Status */}
                    <td className="px-3 py-4 text-sm">
                      {link.status === "paid" ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Paid
                        </span>
                      ) : link.status === "active" ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                          <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mr-1.5 animate-pulse"></span>
                          Pending
                        </span>
                      ) : link.status === "expired" ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                          Expired
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                          Cancelled
                        </span>
                      )}
                      {link.paidAt && (
                        <div className="text-[10px] text-gray-400 mt-1">
                          {new Date(link.paidAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                          })}
                        </div>
                      )}
                    </td>

                    {/* Created Date */}
                    <td className="px-3 py-4 text-xs text-gray-500">
                      <div>
                        {new Date(link.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </div>
                      <div className="text-[10px] text-gray-400">
                        by {link.createdByName || "Admin"}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-4 pl-3 pr-6 text-right text-sm">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Copy Link */}
                        <button
                          onClick={() => handleCopyLink(link.paymentUrl, link._id)}
                          title="Copy Link to Clipboard"
                          className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        >
                          {copiedId === link._id ? (
                            <Check className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>

                        {/* WhatsApp Share */}
                        <button
                          onClick={() => handleWhatsAppShare(link)}
                          title="Share on WhatsApp"
                          className="p-1.5 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </button>

                        {/* Open in new tab */}
                        <a
                          href={link.paymentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Open Link"
                          className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>

                        {/* View Details */}
                        <button
                          onClick={() => {
                            setSelectedLink(link);
                            setIsDetailsOpen(true);
                          }}
                          title="View Details"
                          className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Cancel link if active */}
                        {link.status === "active" && (
                          <button
                            onClick={() => handleCancelLink(link._id)}
                            title="Cancel / Deactivate Link"
                            className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                          >
                            <Ban className="w-4 h-4" />
                          </button>
                        )}

                        {/* Delete link if not paid */}
                        {link.status !== "paid" && (
                          <button
                            onClick={() => handleDeleteLink(link._id)}
                            title="Delete Link"
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
            <span className="text-xs text-gray-500">
              Page {page} of {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* CREATE PAYMENT LINK MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-gray-100 overflow-hidden transform transition-all">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-indigo-900 to-indigo-800 px-6 py-5 text-white flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold">Create Custom Payment Link</h3>
                <p className="text-xs text-indigo-200 mt-0.5">
                  Set amount, student details &amp; generate a shareable Razorpay payment link
                </p>
              </div>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* Payment Purpose / Title */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Payment Title / Purpose <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Course Admission Fee - SAP FICO"
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                />
                {/* Suggestions pill */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {[
                    "Full Course Fee",
                    "Seat Booking Advance",
                    "1st Installment",
                    "2nd Installment",
                    "Exam & Certification Fee",
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setFormData({ ...formData, title: preset })}
                      className="text-[11px] bg-gray-100 hover:bg-indigo-50 hover:text-indigo-600 text-gray-600 px-2 py-0.5 rounded-full border border-gray-200 transition-colors"
                    >
                      + {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount in INR */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Amount to Collect (₹) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 font-bold">
                    ₹
                  </span>
                  <input
                    type="number"
                    required
                    min="1"
                    step="1"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="e.g. 15000"
                    className="w-full pl-8 pr-4 py-2.5 text-base font-bold text-gray-900 border border-gray-300 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              {/* Course (Optional) */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Associated Course <span className="text-gray-400 font-normal lowercase">(optional)</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.course}
                    onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                    placeholder="e.g. SAP FICO Certification Course"
                    className="flex-1 px-3.5 py-2 text-sm border border-gray-300 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                  />
                  {courses.length > 0 && (
                    <select
                      onChange={(e) => {
                        if (e.target.value) setFormData({ ...formData, course: e.target.value });
                      }}
                      className="px-3 py-2 text-xs border border-gray-300 rounded-xl bg-gray-50 text-gray-700 outline-none"
                    >
                      <option value="">Select from list</option>
                      {courses.map((c) => (
                        <option key={c._id} value={c.title}>
                          {c.title}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {/* Student Details (Optional Pre-fill) */}
              <div className="pt-2 border-t border-gray-100">
                <p className="text-xs font-bold text-gray-800 mb-2">
                  Student Pre-fill Information <span className="text-gray-400 font-normal">(optional)</span>
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-gray-600 mb-1">Student Name</label>
                    <input
                      type="text"
                      value={formData.studentName}
                      onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                      placeholder="e.g. Amit Patel"
                      className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-gray-600 mb-1">Student Email</label>
                    <input
                      type="email"
                      value={formData.studentEmail}
                      onChange={(e) => setFormData({ ...formData, studentEmail: e.target.value })}
                      placeholder="e.g. amit@example.com"
                      className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-gray-600 mb-1">Student Phone</label>
                    <input
                      type="tel"
                      value={formData.studentPhone}
                      onChange={(e) => setFormData({ ...formData, studentPhone: e.target.value })}
                      placeholder="e.g. 9876543210"
                      className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-gray-600 mb-1">Link Expiry</label>
                    <select
                      value={formData.expiresInDays}
                      onChange={(e) => setFormData({ ...formData, expiresInDays: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg outline-none focus:border-indigo-500 bg-white"
                    >
                      <option value="none">Never (No expiry)</option>
                      <option value="1">24 Hours (1 Day)</option>
                      <option value="3">3 Days</option>
                      <option value="7">7 Days (1 Week)</option>
                      <option value="15">15 Days</option>
                      <option value="30">30 Days (1 Month)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Description / Notes */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Notes / Instructions <span className="text-gray-400 font-normal lowercase">(optional)</span>
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="e.g. Special discounted fee as discussed during counseling."
                  className="w-full px-3.5 py-2 text-xs border border-gray-300 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                />
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-indigo-600/20 disabled:opacity-50 transition-all flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Creating Link...</span>
                    </>
                  ) : (
                    <>
                      <Link2 className="w-4 h-4" />
                      <span>Generate Payment Link</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LINK CREATED SUCCESS POPUP */}
      {isSuccessOpen && createdLinkData && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-gray-100 overflow-hidden p-6 sm:p-8 text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8" />
            </div>

            <h3 className="text-xl font-bold text-gray-900">Payment Link Created!</h3>
            <p className="text-xs text-gray-500 mt-1">
              Your link is active and ready to be shared with the student.
            </p>

            <div className="my-6 p-4 bg-gray-50 rounded-2xl border border-gray-200 text-left space-y-2">
              <div className="flex justify-between items-center pb-2 border-b border-gray-200/80">
                <span className="text-xs text-gray-500">Purpose</span>
                <span className="text-xs font-semibold text-gray-900">{createdLinkData.title}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-gray-200/80">
                <span className="text-xs text-gray-500">Amount</span>
                <span className="text-base font-bold text-indigo-600">
                  ₹{createdLinkData.amount?.toLocaleString("en-IN")}
                </span>
              </div>
              {createdLinkData.studentName && (
                <div className="flex justify-between items-center pb-2 border-b border-gray-200/80">
                  <span className="text-xs text-gray-500">Student</span>
                  <span className="text-xs font-semibold text-gray-900">{createdLinkData.studentName}</span>
                </div>
              )}
              {createdLinkData.expiresAt && (
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">Expires On</span>
                  <span className="text-xs text-gray-700">
                    {new Date(createdLinkData.expiresAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>
              )}
            </div>

            {/* Copyable Link Input */}
            <div className="flex items-center gap-2 p-1.5 bg-gray-100 rounded-xl border border-gray-200 mb-6">
              <input
                type="text"
                readOnly
                value={createdLinkData.paymentUrl}
                className="bg-transparent flex-1 px-2.5 text-xs text-gray-700 outline-none truncate font-mono"
              />
              <button
                onClick={() => handleCopyLink(createdLinkData.paymentUrl, "created-link")}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                {copiedId === "created-link" ? (
                  <>
                    <Check className="w-3.5 h-3.5" /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" /> Copy
                  </>
                )}
              </button>
            </div>

            {/* Quick Share Buttons */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <button
                onClick={() => handleWhatsAppShare(createdLinkData)}
                className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-sm"
              >
                <MessageCircle className="w-4 h-4" /> Share WhatsApp
              </button>
              <a
                href={createdLinkData.paymentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2.5 px-4 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                <ExternalLink className="w-4 h-4" /> Test Open Page
              </a>
            </div>

            <button
              onClick={() => setIsSuccessOpen(false)}
              className="w-full py-2.5 text-xs font-medium text-gray-500 hover:text-gray-800 transition-colors"
            >
              Done &amp; Close
            </button>
          </div>
        </div>
      )}

      {/* VIEW LINK DETAILS MODAL */}
      {isDetailsOpen && selectedLink && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-gray-900 to-indigo-950 px-6 py-5 text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold">Payment Link Details</h3>
                <span className="font-mono text-xs text-indigo-300">{selectedLink.linkId}</span>
              </div>
              <button
                onClick={() => setIsDetailsOpen(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 pb-3 border-b border-gray-100">
                <div>
                  <span className="text-gray-400 block">Title / Purpose</span>
                  <span className="font-bold text-gray-900 text-sm">{selectedLink.title}</span>
                </div>
                <div>
                  <span className="text-gray-400 block">Amount</span>
                  <span className="font-black text-indigo-600 text-base">
                    ₹{selectedLink.amount?.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pb-3 border-b border-gray-100">
                <div>
                  <span className="text-gray-400 block">Status</span>
                  <span
                    className={`inline-block mt-0.5 px-2.5 py-0.5 rounded-full font-semibold uppercase text-[10px] ${
                      selectedLink.status === "paid"
                        ? "bg-emerald-100 text-emerald-800"
                        : selectedLink.status === "active"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {selectedLink.status}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 block">Created On</span>
                  <span className="font-medium text-gray-800">
                    {new Date(selectedLink.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Student details */}
              <div className="bg-gray-50 p-3.5 rounded-xl space-y-1.5 border border-gray-200/60">
                <span className="font-bold text-gray-800 block text-xs mb-1">Student Information</span>
                <div>
                  <span className="text-gray-500">Name:</span>{" "}
                  <span className="font-medium text-gray-800">
                    {selectedLink.studentName || "Not pre-filled"}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Email:</span>{" "}
                  <span className="font-medium text-gray-800">
                    {selectedLink.studentEmail || "Not pre-filled"}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Phone:</span>{" "}
                  <span className="font-medium text-gray-800">
                    {selectedLink.studentPhone || "Not pre-filled"}
                  </span>
                </div>
                {selectedLink.course && (
                  <div>
                    <span className="text-gray-500">Course:</span>{" "}
                    <span className="font-medium text-gray-800">{selectedLink.course}</span>
                  </div>
                )}
              </div>

              {/* Payment Details if Paid */}
              {selectedLink.status === "paid" && (
                <div className="bg-emerald-50/80 p-3.5 rounded-xl space-y-1.5 border border-emerald-200 text-emerald-950">
                  <span className="font-bold text-emerald-900 block text-xs mb-1">
                    Settlement Details (Razorpay)
                  </span>
                  <div>
                    <span className="text-emerald-700">Payment ID:</span>{" "}
                    <span className="font-mono font-medium">
                      {selectedLink.paymentDetails?.paymentId || "N/A"}
                    </span>
                  </div>
                  <div>
                    <span className="text-emerald-700">Order ID:</span>{" "}
                    <span className="font-mono font-medium">
                      {selectedLink.paymentDetails?.orderId || "N/A"}
                    </span>
                  </div>
                  <div>
                    <span className="text-emerald-700">Paid At:</span>{" "}
                    <span className="font-medium">
                      {selectedLink.paidAt ? new Date(selectedLink.paidAt).toLocaleString() : "N/A"}
                    </span>
                  </div>
                  <div>
                    <span className="text-emerald-700">Payer Name:</span>{" "}
                    <span className="font-medium">
                      {selectedLink.paymentDetails?.payerName || selectedLink.studentName}
                    </span>
                  </div>
                </div>
              )}

              {/* URL */}
              <div>
                <span className="text-gray-400 block mb-1">Payment Link URL</span>
                <div className="flex items-center gap-2 p-2 bg-gray-100 rounded-xl font-mono text-xs">
                  <span className="truncate flex-1">{selectedLink.paymentUrl}</span>
                  <button
                    onClick={() => handleCopyLink(selectedLink.paymentUrl, "details-link")}
                    className="p-1 hover:text-indigo-600 transition-colors"
                  >
                    {copiedId === "details-link" ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setIsDetailsOpen(false)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl text-xs font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
