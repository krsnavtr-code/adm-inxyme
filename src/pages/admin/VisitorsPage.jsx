import React, { useState, useEffect } from "react";
import { getVisitors } from "../../api/visitorApi";
import { format, formatDistanceToNow } from "date-fns";
import { toast } from "react-toastify";

export default function VisitorsPage() {
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVisitor, setSelectedVisitor] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all"); // 'all' | 'returning' | 'leads'
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 25,
    total: 0,
    pages: 1,
  });

  const fetchVisitors = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
      };

      if (searchTerm.trim()) {
        params.search = searchTerm.trim();
      }
      if (filterType === "returning") {
        params.returningOnly = "true";
      } else if (filterType === "leads") {
        params.isKnownLead = "true";
      }

      const res = await getVisitors(params);
      if (res.success) {
        setVisitors(res.data || []);
        if (res.pagination) {
          setPagination((prev) => ({
            ...prev,
            total: res.pagination.total,
            pages: res.pagination.pages,
          }));
        }
      }
    } catch (error) {
      console.error("Error loading visitors:", error);
      toast.error("Failed to load visitors");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVisitors();
  }, [pagination.page, filterType]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchVisitors();
  };

  // Quick stats
  const returningCount = visitors.filter(
    (v) => (v.totalVisits > 1 || v.pageViews > 1)
  ).length;
  const leadCount = visitors.filter((v) => v.isKnownLead).length;
  const totalPageViews = visitors.reduce(
    (acc, v) => acc + (v.pageViews || 0),
    0
  );

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <span>👁️</span> Returning Visitors & Live Activity
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            See who visited your website, at what time, and which courses they browsed.
          </p>
        </div>
        <button
          onClick={fetchVisitors}
          disabled={loading}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-all flex items-center gap-2 shadow-sm disabled:opacity-50"
        >
          <span>🔄</span> {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Total Tracked</p>
          <p className="text-2xl font-extrabold text-gray-900 dark:text-white mt-1">{pagination.total}</p>
          <p className="text-xs text-gray-400 mt-1">Unique visitor UUIDs</p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-amber-500">Returning Visitors</p>
          <p className="text-2xl font-extrabold text-amber-600 mt-1">{returningCount}</p>
          <p className="text-xs text-gray-400 mt-1">Visited 2+ times/pages</p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-500">Identified Leads</p>
          <p className="text-2xl font-extrabold text-emerald-600 mt-1">{leadCount}</p>
          <p className="text-xs text-gray-400 mt-1">Filled name/phone on forms</p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-indigo-500">Page Views</p>
          <p className="text-2xl font-extrabold text-indigo-600 mt-1">{totalPageViews}</p>
          <p className="text-xs text-gray-400 mt-1">Across listed visitors</p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
        {/* Filter Tabs */}
        <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-lg w-full sm:w-auto">
          <button
            onClick={() => { setFilterType("all"); setPagination((p) => ({ ...p, page: 1 })); }}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              filterType === "all"
                ? "bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm"
                : "text-gray-500 hover:text-gray-900 dark:text-gray-300"
            }`}
          >
            All Visitors
          </button>
          <button
            onClick={() => { setFilterType("returning"); setPagination((p) => ({ ...p, page: 1 })); }}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              filterType === "returning"
                ? "bg-white dark:bg-gray-900 text-amber-600 shadow-sm"
                : "text-gray-500 hover:text-gray-900 dark:text-gray-300"
            }`}
          >
            🔥 Returning Only
          </button>
          <button
            onClick={() => { setFilterType("leads"); setPagination((p) => ({ ...p, page: 1 })); }}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              filterType === "leads"
                ? "bg-white dark:bg-gray-900 text-emerald-600 shadow-sm"
                : "text-gray-500 hover:text-gray-900 dark:text-gray-300"
            }`}
          >
            ⭐ Identified Leads
          </button>
        </div>

        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2 w-full sm:w-80">
          <input
            type="text"
            placeholder="Search name, phone, email, UUID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="submit"
            className="px-3 py-2 bg-gray-900 text-white dark:bg-gray-600 text-xs font-semibold rounded-lg hover:bg-gray-800"
          >
            Search
          </button>
        </form>
      </div>

      {/* Visitors Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs uppercase font-bold tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Visitor / Lead</th>
                <th className="py-3.5 px-4">Last Active Time</th>
                <th className="py-3.5 px-4">Last Page Visited</th>
                <th className="py-3.5 px-4 text-center">Visits</th>
                <th className="py-3.5 px-4 text-center">Page Views</th>
                <th className="py-3.5 px-4 text-center">Journey</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center py-12 text-gray-400">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600 mb-2"></div>
                    <p>Loading visitor activity...</p>
                  </td>
                </tr>
              ) : visitors.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-12 text-gray-400">
                    No visitor records found.
                  </td>
                </tr>
              ) : (
                visitors.map((v) => {
                  const lastSeenDate = v.lastSeen ? new Date(v.lastSeen) : new Date(v.updatedAt);
                  const isLead = Boolean(v.isKnownLead && (v.name || v.phone || v.email));

                  return (
                    <tr
                      key={v._id}
                      className="hover:bg-gray-50/80 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      {/* Identity */}
                      <td className="py-3.5 px-4">
                        {isLead ? (
                          <div>
                            <div className="flex items-center gap-1.5 font-bold text-gray-900 dark:text-white">
                              <span>⭐</span>
                              <span>{v.name || "Student Lead"}</span>
                              <span className="text-[10px] uppercase font-black px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                                Lead
                              </span>
                            </div>
                            {v.phone && (
                              <p className="text-xs font-mono text-indigo-600 dark:text-indigo-400 font-semibold mt-0.5">
                                📞 {v.phone}
                              </p>
                            )}
                            {v.email && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[200px]">
                                {v.email}
                              </p>
                            )}
                            {v.isFingerprintMatched && (
                              <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 border border-purple-200">
                                🕵️ Incognito / FP Matched
                              </span>
                            )}
                            {v.device?.os && (
                              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1 truncate">
                                <span>{v.device.deviceType === "mobile" ? "📱" : "💻"}</span>
                                <span>{v.device.os} • {v.device.browser}</span>
                                {v.device.screenResolution && (
                                  <span className="text-[10px] text-gray-400">({v.device.screenResolution})</span>
                                )}
                              </p>
                            )}
                          </div>
                        ) : (
                          <div>
                            <div className="flex items-center gap-1.5 font-semibold text-gray-700 dark:text-gray-300">
                              <span>👤</span>
                              <span>Anonymous Visitor</span>
                            </div>
                            <p className="text-[11px] font-mono text-gray-400 truncate max-w-[180px]">
                              {v.visitorId}
                            </p>
                            {v.isFingerprintMatched && (
                              <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 border border-purple-200">
                                🕵️ Incognito / FP Matched
                              </span>
                            )}
                            {v.device?.os && (
                              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-1 truncate">
                                <span>{v.device.deviceType === "mobile" ? "📱" : "💻"}</span>
                                <span>{v.device.os} • {v.device.browser}</span>
                              </p>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Time */}
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-gray-900 dark:text-white text-xs">
                          {format(lastSeenDate, "MMM d, yyyy · h:mm a")}
                        </p>
                        <p className="text-[11px] text-gray-400">
                          {formatDistanceToNow(lastSeenDate, { addSuffix: true })}
                        </p>
                      </td>

                      {/* Last Page */}
                      <td className="py-3.5 px-4">
                        <span className="inline-block px-2.5 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-100 dark:border-blue-900/40 max-w-[240px] truncate" title={v.lastPageVisited}>
                          {v.lastPageVisited || "/"}
                        </span>
                        {v.lastPageTitle && (
                          <p className="text-[11px] text-gray-400 truncate max-w-[240px] mt-0.5" title={v.lastPageTitle}>
                            {v.lastPageTitle}
                          </p>
                        )}
                      </td>

                      {/* Total Visits */}
                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${
                          v.totalVisits > 1
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
                            : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                        }`}>
                          {v.totalVisits || 1}
                        </span>
                      </td>

                      {/* Page Views */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                          {v.pageViews || (v.history?.length || 1)}
                        </span>
                      </td>

                      {/* Journey Action */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => setSelectedVisitor(v)}
                          className="px-2.5 py-1 text-xs font-semibold rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 transition-all border border-indigo-200 dark:border-indigo-800"
                        >
                          View ({v.history?.length || 0})
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex justify-between items-center p-4 border-t border-gray-100 dark:border-gray-700 text-sm">
            <span className="text-xs text-gray-500">
              Page {pagination.page} of {pagination.pages} ({pagination.total} visitors)
            </span>
            <div className="flex gap-2">
              <button
                disabled={pagination.page <= 1}
                onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
                className="px-3 py-1 border rounded text-xs disabled:opacity-40"
              >
                Previous
              </button>
              <button
                disabled={pagination.page >= pagination.pages}
                onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
                className="px-3 py-1 border rounded text-xs disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Browsing Journey Modal */}
      {selectedVisitor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col border border-gray-100 dark:border-gray-700">
            {/* Modal Header */}
            <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-start">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <span>🗺️</span> Browsing Journey
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {selectedVisitor.isKnownLead && selectedVisitor.name
                    ? `${selectedVisitor.name} (${selectedVisitor.phone || selectedVisitor.email})`
                    : `Visitor ID: ${selectedVisitor.visitorId}`}
                </p>
              </div>
              <button
                onClick={() => setSelectedVisitor(null)}
                className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-500 hover:text-gray-800 dark:text-gray-300"
              >
                ✕
              </button>
            </div>

            {/* Device & Hardware Fingerprint Bar */}
            <div className="p-3 bg-gray-50 dark:bg-gray-700/40 border-b border-gray-100 dark:border-gray-700 text-xs flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-sm">{selectedVisitor.device?.deviceType === "mobile" ? "📱" : "💻"}</span>
                <span className="font-semibold text-gray-800 dark:text-gray-200">
                  {selectedVisitor.device?.os || "Device Details"} • {selectedVisitor.device?.browser || "Browser"}
                </span>
                {selectedVisitor.device?.screenResolution && (
                  <span className="text-gray-400 font-mono text-[11px]">
                    ({selectedVisitor.device.screenResolution})
                  </span>
                )}
                {selectedVisitor.isFingerprintMatched && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                    🕵️ Identified Across Sessions
                  </span>
                )}
              </div>
              {selectedVisitor.fingerprint && (
                <div className="flex items-center gap-1.5 bg-white dark:bg-gray-800 px-2.5 py-1 rounded-md border border-gray-200 dark:border-gray-600">
                  <span className="text-[10px] text-gray-400 font-semibold uppercase">Fingerprint:</span>
                  <span className="font-mono text-[11px] text-indigo-600 dark:text-indigo-400 font-bold" title={selectedVisitor.fingerprint}>
                    {selectedVisitor.fingerprint}
                  </span>
                </div>
              )}
            </div>

            {/* Timeline */}
            <div className="p-5 overflow-y-auto flex-1 space-y-4">
              {!selectedVisitor.history || selectedVisitor.history.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">
                  No recorded page views for this visitor.
                </p>
              ) : (
                <div className="relative border-l-2 border-indigo-200 dark:border-indigo-900 ml-3 space-y-6 py-2">
                  {selectedVisitor.history
                    .slice()
                    .reverse()
                    .map((item, idx) => {
                      const visitTime = item.visitedAt
                        ? new Date(item.visitedAt)
                        : new Date();

                      return (
                        <div key={idx} className="relative pl-6">
                          {/* Dot */}
                          <div className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full bg-indigo-600 border-2 border-white dark:border-gray-800"></div>

                          {/* Content */}
                          <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg border border-gray-100 dark:border-gray-600/50">
                            <div className="flex justify-between items-start gap-2">
                              <span className="font-semibold text-xs text-indigo-600 dark:text-indigo-400 break-all">
                                {item.pageUrl}
                              </span>
                              <span className="text-[11px] font-mono text-gray-400 whitespace-nowrap">
                                {format(visitTime, "h:mm:ss a")}
                              </span>
                            </div>
                            {item.pageTitle && (
                              <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                                {item.pageTitle}
                              </p>
                            )}
                            <p className="text-[10px] text-gray-400 mt-1">
                              {format(visitTime, "MMM d, yyyy")}
                              {item.referrer ? ` · Ref: ${item.referrer}` : ""}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex justify-end">
              <button
                onClick={() => setSelectedVisitor(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 text-xs font-semibold rounded-lg"
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
