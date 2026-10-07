import React, { useState, useEffect } from "react";
import { getLandingPageViews } from "../../../api/landingApi";
import { format, formatDistanceToNow } from "date-fns";
import {
  Activity,
  Search,
  RefreshCw,
  Globe,
  Filter,
  Layers,
  ArrowUpRight,
  ExternalLink,
} from "lucide-react";
import { toast } from "react-toastify";

export default function LandingPageViewsPage() {
  const [pageViews, setPageViews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [courseFilter, setCourseFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 25,
    total: 0,
  });

  const fetchPageViews = async () => {
    setLoading(true);
    try {
      const params = {
        limit: pagination.limit,
        offset: (pagination.page - 1) * pagination.limit,
      };

      if (courseFilter !== "all") {
        params.course = courseFilter;
      }

      if (searchTerm.trim()) {
        params.visitorId = searchTerm.trim();
      }

      const res = await getLandingPageViews(params);
      if (res.success) {
        const list = res.data || [];
        setPageViews(list);
        setPagination((prev) => ({
          ...prev,
          total: res.total || list.length,
        }));
      }
    } catch (err) {
      console.error("Error loading landing page views:", err);
      toast.error("Failed to load page views");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPageViews();
  }, [pagination.page, courseFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchPageViews();
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-purple-100 dark:border-gray-700">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Course &amp; Page Views Activity
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Live stream of individual page navigation and SAP module clicks logged in MySQL.
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={fetchPageViews}
          disabled={loading}
          className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-semibold transition-all flex items-center gap-2 shadow-sm disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          {loading ? "Refreshing..." : "Refresh Views"}
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
            Total Logged Hits
          </p>
          <p className="text-2xl font-black text-gray-900 dark:text-white mt-1">
            {pagination.total}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-purple-500">
            Current Batch
          </p>
          <p className="text-2xl font-black text-purple-600 mt-1">
            {pageViews.length}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-indigo-500">
            Tracked Path
          </p>
          <p className="text-sm font-bold text-gray-800 dark:text-gray-200 mt-2 truncate">
            /sap-webinar
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-amber-500">
            Storage Engine
          </p>
          <p className="text-sm font-bold text-gray-800 dark:text-gray-200 mt-2">
            visitor_page_views
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col sm:flex-row gap-4 justify-between items-center">
        <form onSubmit={handleSearch} className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by visitor UUID or fingerprint..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </form>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-gray-400 hidden sm:block" />
          <select
            value={courseFilter}
            onChange={(e) => {
              setCourseFilter(e.target.value);
              setPagination((prev) => ({ ...prev, page: 1 }));
            }}
            className="w-full sm:w-auto px-3.5 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">All Modules &amp; Pages</option>
            <option value="ABAP">SAP ABAP</option>
            <option value="FICO">SAP FICO</option>
            <option value="MM">SAP MM</option>
            <option value="SD">SAP SD</option>
            <option value="PP">SAP PP</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/75 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <th className="py-3.5 px-4">Page / Title</th>
                <th className="py-3.5 px-4">Module / Course Interest</th>
                <th className="py-3.5 px-4">Visitor UUID</th>
                <th className="py-3.5 px-4">Referrer</th>
                <th className="py-3.5 px-4">IP Address</th>
                <th className="py-3.5 px-4 text-right">Viewed At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700 text-sm">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-gray-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="w-6 h-6 animate-spin text-purple-500" />
                      <span>Loading page hits...</span>
                    </div>
                  </td>
                </tr>
              ) : pageViews.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-gray-400">
                    No page views recorded yet.
                  </td>
                </tr>
              ) : (
                pageViews.map((pv) => (
                  <tr
                    key={pv.id}
                    className="hover:bg-gray-50/60 dark:hover:bg-gray-750 transition-colors"
                  >
                    <td className="py-4 px-4">
                      <div className="font-semibold text-gray-900 dark:text-white flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5 text-gray-400" />
                        <span>{pv.page_url}</span>
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5 truncate max-w-xs">
                        {pv.page_title || "SAP Career Webinar"}
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      {pv.course_interest ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                          {pv.course_interest}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">General Overview</span>
                      )}
                    </td>

                    <td className="py-4 px-4 font-mono text-xs text-gray-600 dark:text-gray-300">
                      <span className="truncate block max-w-[150px]" title={pv.visitor_id}>
                        {pv.visitor_id}
                      </span>
                    </td>

                    <td className="py-4 px-4 text-xs text-gray-500">
                      <span className="truncate block max-w-[140px]">
                        {pv.referrer || "Direct / Internal"}
                      </span>
                    </td>

                    <td className="py-4 px-4 font-mono text-xs text-gray-500">
                      {pv.ip_address || "127.0.0.1"}
                    </td>

                    <td className="py-4 px-4 text-xs text-gray-500 text-right whitespace-nowrap">
                      {pv.created_at ? (
                        <div>
                          <div>{format(new Date(pv.created_at), "dd MMM, hh:mm:ss a")}</div>
                          <div className="text-[11px] text-gray-400">
                            {formatDistanceToNow(new Date(pv.created_at), { addSuffix: true })}
                          </div>
                        </div>
                      ) : (
                        "—"
                      )}
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
    </div>
  );
}
