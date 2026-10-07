import React, { useState, useEffect } from "react";
import { getLandingVisitors } from "../../../api/landingApi";
import { format, formatDistanceToNow } from "date-fns";
import {
  Eye,
  Search,
  RefreshCw,
  Phone,
  Mail,
  Fingerprint,
  Monitor,
  Smartphone,
  Globe,
  Filter,
  UserCheck,
} from "lucide-react";
import { toast } from "react-toastify";

export default function LandingVisitorsPage() {
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all"); // 'all' | 'returning' | 'leads'
  const [selectedVisitor, setSelectedVisitor] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 25,
    total: 0,
  });

  const fetchVisitors = async () => {
    setLoading(true);
    try {
      const params = {
        limit: pagination.limit,
        offset: (pagination.page - 1) * pagination.limit,
      };

      if (searchTerm.trim()) {
        params.search = searchTerm.trim();
      }

      if (filterType === "returning") {
        params.returningOnly = "true";
      } else if (filterType === "leads") {
        params.isKnownLead = "true";
      }

      const res = await getLandingVisitors(params);
      if (res.success) {
        const list = res.data || [];
        setVisitors(list);
        setPagination((prev) => ({
          ...prev,
          total: res.total || list.length,
        }));
      }
    } catch (err) {
      console.error("Error loading landing visitors:", err);
      toast.error("Failed to load visitors");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVisitors();
  }, [pagination.page, filterType]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchVisitors();
  };

  // Quick stats
  const returningCount = visitors.filter((v) => Number(v.total_visits || 1) > 1).length;
  const knownCount = visitors.filter((v) => Boolean(v.is_known_lead) || Boolean(v.phone || v.email)).length;

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-indigo-100 dark:border-gray-700">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
              <Fingerprint className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Landing Page Visitors & Fingerprints
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Cross-session visitor tracking via UUID cookies, canvas hardware hashes, and returning user profiles.
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={fetchVisitors}
          disabled={loading}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-all flex items-center gap-2 shadow-sm disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          {loading ? "Refreshing..." : "Refresh Visitors"}
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
            Total Tracked Visitors
          </p>
          <p className="text-2xl font-black text-gray-900 dark:text-white mt-1">
            {pagination.total}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-indigo-500">
            Returning Visitors (Visits &gt; 1)
          </p>
          <p className="text-2xl font-black text-indigo-600 mt-1">
            {returningCount}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-500">
            Identified Leads
          </p>
          <p className="text-2xl font-black text-emerald-600 mt-1">
            {knownCount}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-amber-500">
            Fingerprinting
          </p>
          <p className="text-sm font-bold text-gray-800 dark:text-gray-200 mt-2">
            Canvas + Audio + WebGL
          </p>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col sm:flex-row gap-4 justify-between items-center">
        <form onSubmit={handleSearch} className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by visitor UUID, name, phone, IP..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </form>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-gray-400 hidden sm:block" />
          <select
            value={filterType}
            onChange={(e) => {
              setFilterType(e.target.value);
              setPagination((prev) => ({ ...prev, page: 1 }));
            }}
            className="w-full sm:w-auto px-3.5 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Visitors</option>
            <option value="returning">Returning Only (Visits &gt; 1)</option>
            <option value="leads">Known Leads Only</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/75 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <th className="py-3.5 px-4">Visitor / Profile</th>
                <th className="py-3.5 px-4">Hardware Fingerprint</th>
                <th className="py-3.5 px-4">Visits &amp; Views</th>
                <th className="py-3.5 px-4">Device &amp; IP</th>
                <th className="py-3.5 px-4">Last Course / Page</th>
                <th className="py-3.5 px-4">Last Seen</th>
                <th className="py-3.5 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700 text-sm">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-gray-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="w-6 h-6 animate-spin text-indigo-500" />
                      <span>Loading visitors...</span>
                    </div>
                  </td>
                </tr>
              ) : visitors.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-gray-400">
                    No visitor records found.
                  </td>
                </tr>
              ) : (
                visitors.map((v) => {
                  const isReturning = Number(v.total_visits || 1) > 1;
                  const isLead = Boolean(v.is_known_lead) || Boolean(v.name || v.phone);

                  return (
                    <tr
                      key={v.id}
                      className="hover:bg-gray-50/60 dark:hover:bg-gray-750 transition-colors"
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-gray-900 dark:text-white font-bold truncate max-w-[140px]">
                            {v.name || v.visitor_id}
                          </span>
                          {isLead && (
                            <span className="p-1 bg-emerald-50 text-emerald-600 rounded-md" title="Known Lead">
                              <UserCheck className="w-3 h-3" />
                            </span>
                          )}
                        </div>
                        {v.phone && (
                          <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                            <Phone className="w-3 h-3 text-gray-400" />
                            <span>{v.phone}</span>
                          </div>
                        )}
                        {v.email && (
                          <div className="text-xs text-gray-400 mt-0.5 truncate max-w-[160px]">
                            {v.email}
                          </div>
                        )}
                      </td>

                      <td className="py-4 px-4 font-mono text-xs text-gray-500">
                        {v.fingerprint ? (
                          <span className="bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded text-[11px]">
                            {v.fingerprint.substring(0, 14)}...
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>

                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${isReturning ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300" : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"}`}>
                            {v.total_visits || 1} {v.total_visits > 1 ? "visits" : "visit"}
                          </span>
                          <span className="text-xs text-gray-400">
                            ({v.page_views || 1} views)
                          </span>
                        </div>
                      </td>

                      <td className="py-4 px-4 text-xs">
                        <div className="text-gray-800 dark:text-gray-200 font-medium">
                          {v.device_os || "Unknown"} • {v.device_browser || "Browser"}
                        </div>
                        <div className="text-gray-400 font-mono text-[11px] mt-0.5">
                          {v.ip_address || "127.0.0.1"}
                        </div>
                      </td>

                      <td className="py-4 px-4 text-xs text-gray-600 dark:text-gray-300">
                        <div className="font-medium text-gray-900 dark:text-white truncate max-w-[150px]">
                          {v.last_course || "SAP Webinar"}
                        </div>
                        <div className="text-gray-400 truncate max-w-[150px] text-[11px]">
                          {v.last_page || "/sap-webinar"}
                        </div>
                      </td>

                      <td className="py-4 px-4 text-xs text-gray-500 whitespace-nowrap">
                        {v.last_seen ? (
                          <div>
                            <div>{format(new Date(v.last_seen), "dd MMM, hh:mm a")}</div>
                            <div className="text-[11px] text-gray-400">
                              {formatDistanceToNow(new Date(v.last_seen), { addSuffix: true })}
                            </div>
                          </div>
                        ) : (
                          "—"
                        )}
                      </td>

                      <td className="py-4 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => setSelectedVisitor(v)}
                          className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 rounded-lg"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
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
      {selectedVisitor && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 dark:border-gray-700 space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-700 pb-3">
              <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                Visitor Fingerprint Profile
              </h3>
              <button
                onClick={() => setSelectedVisitor(null)}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold"
              >
                &times;
              </button>
            </div>
            <div className="space-y-2.5 text-sm">
              <div><strong className="text-gray-500">Visitor UUID:</strong> <code className="text-xs bg-gray-100 dark:bg-gray-700 p-1 rounded">{selectedVisitor.visitor_id}</code></div>
              <div><strong className="text-gray-500">Hardware Fingerprint:</strong> <code className="text-xs bg-gray-100 dark:bg-gray-700 p-1 rounded">{selectedVisitor.fingerprint || "N/A"}</code></div>
              <div><strong className="text-gray-500">Name:</strong> {selectedVisitor.name || "Anonymous Visitor"}</div>
              <div><strong className="text-gray-500">Phone:</strong> {selectedVisitor.phone || "N/A"}</div>
              <div><strong className="text-gray-500">Email:</strong> {selectedVisitor.email || "N/A"}</div>
              <div><strong className="text-gray-500">Total Visits:</strong> {selectedVisitor.total_visits}</div>
              <div><strong className="text-gray-500">Total Page Views:</strong> {selectedVisitor.page_views}</div>
              <div><strong className="text-gray-500">IP Address:</strong> {selectedVisitor.ip_address}</div>
              <div><strong className="text-gray-500">Operating System:</strong> {selectedVisitor.device_os}</div>
              <div><strong className="text-gray-500">Browser:</strong> {selectedVisitor.device_browser}</div>
              <div><strong className="text-gray-500">Device Type:</strong> {selectedVisitor.device_type}</div>
              <div><strong className="text-gray-500">User Agent:</strong> <span className="text-xs text-gray-400 block break-all">{selectedVisitor.user_agent}</span></div>
              <div><strong className="text-gray-500">First Seen:</strong> {selectedVisitor.created_at}</div>
              <div><strong className="text-gray-500">Last Seen:</strong> {selectedVisitor.last_seen}</div>
            </div>
            <div className="pt-3 border-t border-gray-100 dark:border-gray-700 text-right">
              <button
                onClick={() => setSelectedVisitor(null)}
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
