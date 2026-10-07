import React, { useState, useEffect } from "react";
import { getPartialLeads } from "../../../api/landingApi";
import { format, formatDistanceToNow } from "date-fns";
import {
  AlertTriangle,
  Search,
  RefreshCw,
  Phone,
  Mail,
  CheckCircle2,
  Clock,
  Filter,
  Eye,
  MessageCircle,
  Smartphone,
  ExternalLink,
} from "lucide-react";
import { toast } from "react-toastify";

export default function PartialLeadsPage() {
  const [partialLeads, setPartialLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [conversionFilter, setConversionFilter] = useState("all"); // 'all' | '0' | '1'
  const [selectedLead, setSelectedLead] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 25,
    total: 0,
  });

  const fetchPartialLeads = async () => {
    setLoading(true);
    try {
      const params = {
        limit: pagination.limit,
        offset: (pagination.page - 1) * pagination.limit,
      };

      if (searchTerm.trim()) {
        params.search = searchTerm.trim();
      }

      if (conversionFilter !== "all") {
        params.converted = conversionFilter;
      }

      const res = await getPartialLeads(params);
      if (res.success) {
        const list = res.data || [];
        setPartialLeads(list);
        setPagination((prev) => ({
          ...prev,
          total: res.total || list.length,
        }));
      }
    } catch (err) {
      console.error("Error loading partial leads:", err);
      toast.error("Failed to load partial leads");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPartialLeads();
  }, [pagination.page, conversionFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchPartialLeads();
  };

  // Quick stats
  const abandonedCount = partialLeads.filter((l) => !l.converted).length;
  const convertedCount = partialLeads.filter((l) => Boolean(l.converted)).length;

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-orange-100 dark:border-gray-700">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-orange-50 text-orange-600 rounded-xl">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Partial Form Leads (Abandoned Fills)
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                High-intent prospects who typed their mobile/email in the registration form but dropped off before paying.
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={fetchPartialLeads}
          disabled={loading}
          className="px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-sm font-semibold transition-all flex items-center gap-2 shadow-sm disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          {loading ? "Refreshing..." : "Refresh Leads"}
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
            Total Drop-Offs Captured
          </p>
          <p className="text-2xl font-black text-gray-900 dark:text-white mt-1">
            {pagination.total}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-orange-500">
            Pending Conversion (High Intent)
          </p>
          <p className="text-2xl font-black text-orange-600 mt-1">
            {abandonedCount}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-500">
            Successfully Converted Later
          </p>
          <p className="text-2xl font-black text-emerald-600 mt-1">
            {convertedCount}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-indigo-500">
            Recovery Action
          </p>
          <p className="text-xs font-bold text-indigo-600 mt-2">
            1-Click WhatsApp Follow-up Available
          </p>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col sm:flex-row gap-4 justify-between items-center">
        <form onSubmit={handleSearch} className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, phone, email, course..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </form>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-gray-400 hidden sm:block" />
          <select
            value={conversionFilter}
            onChange={(e) => {
              setConversionFilter(e.target.value);
              setPagination((prev) => ({ ...prev, page: 1 }));
            }}
            className="w-full sm:w-auto px-3.5 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="all">All Drop-offs</option>
            <option value="0">Unconverted (Needs Follow-up)</option>
            <option value="1">Converted (Paid Later)</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/75 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <th className="py-3.5 px-4">Contact Details</th>
                <th className="py-3.5 px-4">Course / Source</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Last Active</th>
                <th className="py-3.5 px-4 text-right">Instant Follow-up</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700 text-sm">
              {loading ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-gray-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="w-6 h-6 animate-spin text-orange-500" />
                      <span>Loading drop-offs...</span>
                    </div>
                  </td>
                </tr>
              ) : partialLeads.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-gray-400">
                    No abandoned form leads recorded yet.
                  </td>
                </tr>
              ) : (
                partialLeads.map((lead) => {
                  const cleanPhone = String(lead.phone || "").replace(/[^0-9]/g, "");
                  const isConverted = Boolean(lead.converted);
                  const waText = encodeURIComponent(
                    `Hi ${lead.name || "there"}, we noticed you were registering for the Inxyme SAP Webinar. Did you face any issue completing your registration? Let us know so we can assist you!`
                  );

                  return (
                    <tr
                      key={lead.id}
                      className="hover:bg-gray-50/60 dark:hover:bg-gray-750 transition-colors"
                    >
                      <td className="py-4 px-4">
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {lead.name || (
                            <span className="text-gray-400 italic">Name not filled</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          {lead.phone && (
                            <div className="flex items-center gap-1 text-xs font-mono text-gray-700 dark:text-gray-300">
                              <Phone className="w-3 h-3 text-orange-500" />
                              <a href={`tel:${lead.phone}`} className="hover:text-orange-600">
                                {lead.phone}
                              </a>
                            </div>
                          )}
                          {lead.email && (
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <Mail className="w-3 h-3 text-gray-400" />
                              <a href={`mailto:${lead.email}`} className="hover:underline truncate max-w-[150px]">
                                {lead.email}
                              </a>
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <span className="font-medium text-gray-900 dark:text-white text-xs">
                          {lead.course_title || "SAP Webinar"}
                        </span>
                        <div className="text-xs text-gray-400 mt-0.5">
                          {lead.source || "onBlur capture"} • {lead.page_url}
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        {isConverted ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                            <CheckCircle2 className="w-3 h-3" />
                            Converted
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">
                            <Clock className="w-3 h-3" />
                            Abandoned
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-4 text-xs text-gray-500 whitespace-nowrap">
                        {lead.updated_at || lead.created_at ? (
                          <div>
                            <div>{format(new Date(lead.updated_at || lead.created_at), "dd MMM, hh:mm a")}</div>
                            <div className="text-[11px] text-gray-400">
                              {formatDistanceToNow(new Date(lead.updated_at || lead.created_at), { addSuffix: true })}
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
                              className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 shadow-sm transition-all"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                              WhatsApp
                            </a>
                          )}
                          <button
                            onClick={() => setSelectedLead(lead)}
                            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 rounded-lg"
                            title="Inspect Details"
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
      {selectedLead && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 dark:border-gray-700 space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-700 pb-3">
              <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                Partial Lead Inspection
              </h3>
              <button
                onClick={() => setSelectedLead(null)}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold"
              >
                &times;
              </button>
            </div>
            <div className="space-y-2.5 text-sm">
              <div><strong className="text-gray-500">Name:</strong> {selectedLead.name || "N/A"}</div>
              <div><strong className="text-gray-500">Phone:</strong> {selectedLead.phone || "N/A"}</div>
              <div><strong className="text-gray-500">Email:</strong> {selectedLead.email || "N/A"}</div>
              <div><strong className="text-gray-500">Course Viewed:</strong> {selectedLead.course_title}</div>
              <div><strong className="text-gray-500">Page:</strong> {selectedLead.page_url}</div>
              <div><strong className="text-gray-500">Session FP:</strong> <code className="text-xs bg-gray-100 dark:bg-gray-700 p-1 rounded">{selectedLead.session_fingerprint}</code></div>
              <div><strong className="text-gray-500">Visitor UUID:</strong> {selectedLead.visitor_id || "N/A"}</div>
              <div><strong className="text-gray-500">Device Hardware FP:</strong> {selectedLead.fingerprint || "N/A"}</div>
              <div><strong className="text-gray-500">Device Info:</strong> <pre className="text-xs bg-gray-50 dark:bg-gray-900 p-2 rounded overflow-x-auto">{selectedLead.device || "N/A"}</pre></div>
              <div><strong className="text-gray-500">Alert Sent to Admin:</strong> {selectedLead.alert_sent ? "Yes" : "No"}</div>
              <div><strong className="text-gray-500">Created:</strong> {selectedLead.created_at}</div>
            </div>
            <div className="pt-3 border-t border-gray-100 dark:border-gray-700 text-right">
              <button
                onClick={() => setSelectedLead(null)}
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
