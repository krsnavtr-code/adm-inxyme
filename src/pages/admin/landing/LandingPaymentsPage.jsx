import React, { useState, useEffect } from "react";
import { getLandingPayments } from "../../../api/landingApi";
import { format, formatDistanceToNow } from "date-fns";
import {
  CreditCard,
  Search,
  RefreshCw,
  Phone,
  Mail,
  CheckCircle,
  DollarSign,
  Receipt,
  Eye,
  MessageCircle,
} from "lucide-react";
import { toast } from "react-toastify";

export default function LandingPaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 25,
    total: 0,
  });

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const params = {
        limit: pagination.limit,
        offset: (pagination.page - 1) * pagination.limit,
      };

      if (searchTerm.trim()) {
        params.search = searchTerm.trim();
      }

      const res = await getLandingPayments(params);
      if (res.success) {
        const list = res.data || [];
        setPayments(list);
        setPagination((prev) => ({
          ...prev,
          total: res.total || list.length,
        }));
      }
    } catch (err) {
      console.error("Error loading landing payments:", err);
      toast.error("Failed to load landing payments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [pagination.page]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchPayments();
  };

  // Quick stats
  const totalAmount = payments.reduce((acc, p) => acc + Number(p.amount || 0), 0);

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-emerald-100 dark:border-gray-700">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Webinar Payments (Landing Database)
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Verified ₹9 webinar registrations and Razorpay transaction records stored in Hostinger MySQL.
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={fetchPayments}
          disabled={loading}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition-all flex items-center gap-2 shadow-sm disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          {loading ? "Refreshing..." : "Refresh Payments"}
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
            Total Paid Registrations
          </p>
          <p className="text-2xl font-black text-gray-900 dark:text-white mt-1">
            {pagination.total}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-500">
            Total Revenue (Current View)
          </p>
          <p className="text-2xl font-black text-emerald-600 mt-1">
            ₹{totalAmount.toFixed(2)}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-indigo-500">
            Ticket Price
          </p>
          <p className="text-2xl font-black text-indigo-600 mt-1">
            ₹9.00 / seat
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-amber-500">
            Payment Gateway
          </p>
          <p className="text-sm font-bold text-gray-800 dark:text-gray-200 mt-2">
            Razorpay Live
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col sm:flex-row gap-4 justify-between items-center">
        <form onSubmit={handleSearch} className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by student, phone, email, pay_id..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </form>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/75 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <th className="py-3.5 px-4">Student</th>
                <th className="py-3.5 px-4">Transaction IDs</th>
                <th className="py-3.5 px-4">Course / Program</th>
                <th className="py-3.5 px-4">Amount</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Date & Time</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700 text-sm">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-gray-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="w-6 h-6 animate-spin text-emerald-500" />
                      <span>Loading payments...</span>
                    </div>
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-gray-400">
                    No payment records found in database.
                  </td>
                </tr>
              ) : (
                payments.map((p) => {
                  const cleanPhone = String(p.phone || "").replace(/[^0-9]/g, "");
                  const waText = encodeURIComponent(
                    `Hi ${p.name}, congratulations! Your seat for the Inxyme SAP Webinar is confirmed. Payment ID: ${p.payment_id}. Here is your webinar link: https://www.inxyme.com/sap-webinar`
                  );

                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-gray-50/60 dark:hover:bg-gray-750 transition-colors"
                    >
                      <td className="py-4 px-4">
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {p.name}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                          <Phone className="w-3 h-3 text-gray-400" />
                          <a href={`tel:${p.phone}`} className="hover:text-emerald-600">
                            {p.phone}
                          </a>
                        </div>
                        {p.email && (
                          <div className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                            <Mail className="w-3 h-3 text-gray-400" />
                            <span>{p.email}</span>
                          </div>
                        )}
                      </td>

                      <td className="py-4 px-4 font-mono text-xs">
                        <div className="text-gray-900 dark:text-gray-200 font-bold">
                          {p.payment_id}
                        </div>
                        <div className="text-[11px] text-gray-400 mt-0.5">
                          {p.order_id}
                        </div>
                      </td>

                      <td className="py-4 px-4 text-xs font-medium text-gray-700 dark:text-gray-300">
                        {p.course || "SAP Webinar"}
                      </td>

                      <td className="py-4 px-4 font-bold text-gray-900 dark:text-white text-sm">
                        ₹{Number(p.amount || 0).toFixed(2)}
                      </td>

                      <td className="py-4 px-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                          <CheckCircle className="w-3 h-3" />
                          {p.status || "success"}
                        </span>
                      </td>

                      <td className="py-4 px-4 text-xs text-gray-500 whitespace-nowrap">
                        {p.created_at ? (
                          <div>
                            <div>{format(new Date(p.created_at), "dd MMM yyyy, hh:mm a")}</div>
                            <div className="text-[11px] text-gray-400">
                              {formatDistanceToNow(new Date(p.created_at), { addSuffix: true })}
                            </div>
                          </div>
                        ) : (
                          "—"
                        )}
                      </td>

                      <td className="py-4 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          {cleanPhone.length >= 10 && (
                            <a
                              href={`https://wa.me/91${cleanPhone.slice(-10)}?text=${waText}`}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-1 shadow-sm transition-all"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                              Send Link
                            </a>
                          )}
                          <button
                            onClick={() => setSelectedPayment(p)}
                            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 rounded-lg"
                            title="View Receipt"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 bg-gray-50/50 dark:bg-gray-900/40 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <p className="text-xs text-gray-500">
            Showing Page {pagination.page} of{" "}
            {Math.max(1, Math.ceil(pagination.total / pagination.limit))} ({pagination.total} Total)
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPagination((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
              disabled={pagination.page <= 1}
              className="px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-medium disabled:opacity-40"
            >
              Previous
            </button>
            <button
              onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
              disabled={pagination.page * pagination.limit >= pagination.total}
              className="px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-medium disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Modal */}
      {selectedPayment && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 dark:border-gray-700 space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-700 pb-3">
              <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                Payment Receipt Details
              </h3>
              <button
                onClick={() => setSelectedPayment(null)}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold"
              >
                &times;
              </button>
            </div>
            <div className="space-y-2.5 text-sm">
              <div><strong className="text-gray-500">Amount Paid:</strong> ₹{selectedPayment.amount} {selectedPayment.currency}</div>
              <div><strong className="text-gray-500">Student Name:</strong> {selectedPayment.name}</div>
              <div><strong className="text-gray-500">Phone:</strong> {selectedPayment.phone}</div>
              <div><strong className="text-gray-500">Email:</strong> {selectedPayment.email}</div>
              <div><strong className="text-gray-500">Course:</strong> {selectedPayment.course}</div>
              <div><strong className="text-gray-500">Razorpay Payment ID:</strong> <code className="text-xs bg-gray-100 dark:bg-gray-700 p-1 rounded">{selectedPayment.payment_id}</code></div>
              <div><strong className="text-gray-500">Razorpay Order ID:</strong> <code className="text-xs bg-gray-100 dark:bg-gray-700 p-1 rounded">{selectedPayment.order_id}</code></div>
              <div><strong className="text-gray-500">Signature:</strong> <span className="text-xs font-mono text-gray-400 truncate block max-w-sm">{selectedPayment.signature}</span></div>
              <div><strong className="text-gray-500">Status:</strong> <span className="text-emerald-600 font-bold">{selectedPayment.status}</span></div>
              <div><strong className="text-gray-500">Timestamp:</strong> {selectedPayment.created_at}</div>
            </div>
            <div className="pt-3 border-t border-gray-100 dark:border-gray-700 text-right">
              <button
                onClick={() => setSelectedPayment(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-xl text-sm font-semibold"
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
