import React, { useState, useEffect } from "react";
import { getServerTrackingLogs } from "../../../api/landingApi";
import { format, formatDistanceToNow } from "date-fns";
import {
  ShieldCheck,
  Search,
  RefreshCw,
  Zap,
  Filter,
  Eye,
  CheckCircle2,
  Terminal,
  Code,
} from "lucide-react";
import { toast } from "react-toastify";

export default function ServerTrackingLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [eventTypeFilter, setEventTypeFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLog, setSelectedLog] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 25,
    total: 0,
  });

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = {
        limit: pagination.limit,
        offset: (pagination.page - 1) * pagination.limit,
      };

      if (eventTypeFilter !== "all") {
        params.eventType = eventTypeFilter;
      }

      if (searchTerm.trim()) {
        params.search = searchTerm.trim();
      }

      const res = await getServerTrackingLogs(params);
      if (res.success) {
        const list = res.data || [];
        setLogs(list);
        setPagination((prev) => ({
          ...prev,
          total: res.total || list.length,
        }));
      }
    } catch (err) {
      console.error("Error loading server tracking logs:", err);
      toast.error("Failed to load server tracking logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [pagination.page, eventTypeFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchLogs();
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-cyan-100 dark:border-gray-700">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-cyan-50 text-cyan-600 rounded-xl">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Server-Side Tracking &amp; Meta CAPI Logs
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Server-to-server tracking event logs that bypass browser ad-blockers and iOS privacy restrictions.
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={fetchLogs}
          disabled={loading}
          className="px-4 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-sm font-semibold transition-all flex items-center gap-2 shadow-sm disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          {loading ? "Refreshing..." : "Refresh Logs"}
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
            Total Server Events
          </p>
          <p className="text-2xl font-black text-gray-900 dark:text-white mt-1">
            {pagination.total}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-cyan-500">
            Ad-Blocker Bypass
          </p>
          <p className="text-2xl font-black text-cyan-600 mt-1">
            100% Active
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-indigo-500">
            Target Service
          </p>
          <p className="text-sm font-bold text-gray-800 dark:text-gray-200 mt-2 truncate">
            Meta Conversions API (CAPI)
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-500">
            Hashing Standard
          </p>
          <p className="text-sm font-bold text-gray-800 dark:text-gray-200 mt-2">
            SHA-256 (GDPR Compliant)
          </p>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col sm:flex-row gap-4 justify-between items-center">
        <form onSubmit={handleSearch} className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by page, visitor, IP, or payload..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
        </form>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-gray-400 hidden sm:block" />
          <select
            value={eventTypeFilter}
            onChange={(e) => {
              setEventTypeFilter(e.target.value);
              setPagination((prev) => ({ ...prev, page: 1 }));
            }}
            className="w-full sm:w-auto px-3.5 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            <option value="all">All Events</option>
            <option value="PageView">PageView</option>
            <option value="PartialLead">PartialLead</option>
            <option value="Purchase">Purchase</option>
            <option value="InitiateCheckout">InitiateCheckout</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/75 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <th className="py-3.5 px-4">Event Type</th>
                <th className="py-3.5 px-4">Page Source</th>
                <th className="py-3.5 px-4">Visitor / Fingerprint</th>
                <th className="py-3.5 px-4">Client IP</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Dispatched At</th>
                <th className="py-3.5 px-4 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700 text-sm">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-gray-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="w-6 h-6 animate-spin text-cyan-500" />
                      <span>Loading server events...</span>
                    </div>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-gray-400">
                    No server tracking logs recorded yet.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr
                    key={log.id}
                    className="hover:bg-gray-50/60 dark:hover:bg-gray-750 transition-colors"
                  >
                    <td className="py-4 px-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-cyan-50 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300">
                        {log.event_type}
                      </span>
                    </td>

                    <td className="py-4 px-4 text-xs">
                      <div className="font-medium text-gray-900 dark:text-white truncate max-w-xs">
                        {log.page_url || "/sap-webinar"}
                      </div>
                      <div className="text-gray-400 text-[11px] truncate max-w-xs">
                        {log.page_title}
                      </div>
                    </td>

                    <td className="py-4 px-4 font-mono text-xs text-gray-500">
                      <span className="truncate block max-w-[140px]">
                        {log.visitor_id || log.fingerprint || "—"}
                      </span>
                    </td>

                    <td className="py-4 px-4 font-mono text-xs text-gray-500">
                      {log.ip_address || "127.0.0.1"}
                    </td>

                    <td className="py-4 px-4">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {log.status || "dispatched"}
                      </span>
                    </td>

                    <td className="py-4 px-4 text-xs text-gray-500 whitespace-nowrap">
                      {log.created_at ? (
                        <div>
                          <div>{format(new Date(log.created_at), "dd MMM, hh:mm:ss a")}</div>
                          <div className="text-[11px] text-gray-400">
                            {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                          </div>
                        </div>
                      ) : (
                        "—"
                      )}
                    </td>

                    <td className="py-4 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 rounded-lg"
                        title="View Payload"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
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
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 dark:border-gray-700 space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-700 pb-3">
              <h3 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                <Code className="w-5 h-5 text-cyan-500" />
                CAPI Server Event Payload
              </h3>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold"
              >
                &times;
              </button>
            </div>
            <div className="space-y-2.5 text-sm">
              <div><strong className="text-gray-500">Event:</strong> {selectedLog.event_type}</div>
              <div><strong className="text-gray-500">URL:</strong> {selectedLog.page_url}</div>
              <div><strong className="text-gray-500">Visitor UUID:</strong> {selectedLog.visitor_id || "N/A"}</div>
              <div><strong className="text-gray-500">Fingerprint:</strong> {selectedLog.fingerprint || "N/A"}</div>
              <div><strong className="text-gray-500">IP:</strong> {selectedLog.ip_address}</div>
              <div>
                <strong className="text-gray-500">User Data (Hashed Payload):</strong>
                <pre className="text-xs bg-gray-50 dark:bg-gray-900 p-2 rounded mt-1 overflow-x-auto">
                  {selectedLog.user_data || "None"}
                </pre>
              </div>
              <div>
                <strong className="text-gray-500">Custom Data:</strong>
                <pre className="text-xs bg-gray-50 dark:bg-gray-900 p-2 rounded mt-1 overflow-x-auto">
                  {selectedLog.custom_data || "None"}
                </pre>
              </div>
              <div><strong className="text-gray-500">Timestamp:</strong> {selectedLog.created_at}</div>
            </div>
            <div className="pt-3 border-t border-gray-100 dark:border-gray-700 text-right">
              <button
                onClick={() => setSelectedLog(null)}
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
