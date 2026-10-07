import React, { useState, useEffect } from "react";
import { getLandingLeads } from "../../../api/landingApi";
import { format, formatDistanceToNow } from "date-fns";
import {
  Users,
  Search,
  RefreshCw,
  Phone,
  Mail,
  Calendar,
  ExternalLink,
  Filter,
  CheckCircle,
  Eye,
  FileSpreadsheet,
} from "lucide-react";
import { toast } from "react-toastify";

export default function LandingLeadsPage() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [subdomainFilter, setSubdomainFilter] = useState("all");
  const [selectedLead, setSelectedLead] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 25,
    total: 0,
  });

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const params = {
        limit: pagination.limit,
        offset: (pagination.page - 1) * pagination.limit,
      };

      if (searchTerm.trim()) {
        params.search = searchTerm.trim();
      }

      if (subdomainFilter !== "all") {
        params.subdomain = subdomainFilter;
      }

      const res = await getLandingLeads(params);
      if (res.success) {
        const list = res.leads || res.data || [];
        setLeads(list);
        setPagination((prev) => ({
          ...prev,
          total: res.total || list.length,
        }));
      }
    } catch (err) {
      console.error("Error loading leads:", err);
      toast.error("Failed to load landing leads");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [pagination.page, subdomainFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchLeads();
  };

  // Quick Stats
  const sapCount = leads.filter(
    (l) => (l.subdomain || "").toLowerCase().includes("sap")
  ).length;

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Landing Page Leads
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Registered student leads submitted from all active landing page subdomains.
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={fetchLeads}
          disabled={loading}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-all flex items-center gap-2 shadow-sm disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          {loading ? "Refreshing..." : "Refresh Data"}
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
            Total Leads
          </p>
          <p className="text-2xl font-black text-gray-900 dark:text-white mt-1">
            {pagination.total}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-indigo-500">
            SAP Webinar Leads
          </p>
          <p className="text-2xl font-black text-indigo-600 mt-1">
            {sapCount}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-500">
            Current Page Count
          </p>
          <p className="text-2xl font-black text-emerald-600 mt-1">
            {leads.length}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-amber-500">
            Database Source
          </p>
          <p className="text-sm font-bold text-gray-800 dark:text-gray-200 mt-2">
            MySQL (Hostinger)
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col sm:flex-row gap-4 justify-between items-center">
        <form onSubmit={handleSearch} className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, email, phone, or program..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </form>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-gray-400 hidden sm:block" />
          <select
            value={subdomainFilter}
            onChange={(e) => {
              setSubdomainFilter(e.target.value);
              setPagination((prev) => ({ ...prev, page: 1 }));
            }}
            className="w-full sm:w-auto px-3.5 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Subdomains</option>
            <option value="sap-webinar">SAP Webinar</option>
            <option value="sap">SAP</option>
            <option value="data-science">Data Science</option>
            <option value="fde">Full Stack (FDE)</option>
          </select>
        </div>
      </div>

      {/* Leads Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/75 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <th className="py-3.5 px-4">Student</th>
                <th className="py-3.5 px-4">Contact Info</th>
                <th className="py-3.5 px-4">Subdomain / Course</th>
                <th className="py-3.5 px-4">Time Slot / Note</th>
                <th className="py-3.5 px-4">Created At</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700 text-sm">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-gray-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="w-6 h-6 animate-spin text-indigo-500" />
                      <span>Loading leads...</span>
                    </div>
                  </td>
                </tr>
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-gray-400">
                    No leads found matching your criteria.
                  </td>
                </tr>
              ) : (
                leads.map((lead) => {
                  const cleanPhone = String(lead.phone || "").replace(/[^0-9]/g, "");
                  return (
                    <tr
                      key={lead.id}
                      className="hover:bg-gray-50/60 dark:hover:bg-gray-750 transition-colors"
                    >
                      <td className="py-4 px-4">
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {lead.name}
                        </div>
                        {lead.qualification && (
                          <div className="text-xs text-gray-400 mt-0.5">
                            {lead.qualification}
                          </div>
                        )}
                      </td>

                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300 font-mono text-xs">
                          <Phone className="w-3.5 h-3.5 text-gray-400" />
                          <a
                            href={`tel:${lead.phone}`}
                            className="hover:text-indigo-600"
                          >
                            {lead.phone}
                          </a>
                        </div>
                        {lead.email && (
                          <div className="flex items-center gap-1.5 text-gray-500 text-xs mt-1">
                            <Mail className="w-3.5 h-3.5 text-gray-400" />
                            <a
                              href={`mailto:${lead.email}`}
                              className="hover:underline truncate max-w-[180px]"
                            >
                              {lead.email}
                            </a>
                          </div>
                        )}
                      </td>

                      <td className="py-4 px-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
                          {lead.subdomain || "sap-webinar"}
                        </span>
                        <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mt-1">
                          {lead.specialisation || lead.program || "General"}
                        </div>
                      </td>

                      <td className="py-4 px-4 text-xs text-gray-500">
                        {lead.time_slot ? (
                          <span className="bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 px-2 py-0.5 rounded text-xs">
                            {lead.time_slot}
                          </span>
                        ) : (
                          <span className="text-gray-400">Regular</span>
                        )}
                      </td>

                      <td className="py-4 px-4 text-xs text-gray-500 whitespace-nowrap">
                        {lead.created_at ? (
                          <div>
                            <div>{format(new Date(lead.created_at), "dd MMM yyyy, hh:mm a")}</div>
                            <div className="text-[11px] text-gray-400">
                              {formatDistanceToNow(new Date(lead.created_at), { addSuffix: true })}
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
                              href={`https://wa.me/91${cleanPhone.slice(-10)}`}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-semibold transition-all inline-flex items-center gap-1"
                            >
                              WhatsApp
                            </a>
                          )}
                          <button
                            onClick={() => setSelectedLead(lead)}
                            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 rounded-lg"
                            title="View Details"
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

      {/* Modal for Details */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 dark:border-gray-700 space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-700 pb-3">
              <h3 className="font-bold text-lg text-gray-900 dark:text-white">Lead Details</h3>
              <button
                onClick={() => setSelectedLead(null)}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold"
              >
                &times;
              </button>
            </div>
            <div className="space-y-2.5 text-sm">
              <div><strong className="text-gray-500">Name:</strong> {selectedLead.name}</div>
              <div><strong className="text-gray-500">Phone:</strong> {selectedLead.phone}</div>
              <div><strong className="text-gray-500">Email:</strong> {selectedLead.email}</div>
              <div><strong className="text-gray-500">Subdomain:</strong> {selectedLead.subdomain}</div>
              <div><strong className="text-gray-500">Program:</strong> {selectedLead.program}</div>
              <div><strong className="text-gray-500">Specialisation:</strong> {selectedLead.specialisation}</div>
              <div><strong className="text-gray-500">Qualification:</strong> {selectedLead.qualification}</div>
              <div><strong className="text-gray-500">Time Slot / Note:</strong> {selectedLead.time_slot}</div>
              <div><strong className="text-gray-500">Source:</strong> {selectedLead.source}</div>
              <div><strong className="text-gray-500">Submitted:</strong> {selectedLead.created_at}</div>
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
