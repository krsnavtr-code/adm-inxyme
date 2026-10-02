import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getContacts, updateContactStatus, getServerTrackingStats } from "../../api/contactApi";
import { format, parseISO } from "date-fns";
import { toast } from "react-toastify";
import { useAuth } from "../../contexts/AuthContext";
import { saveAs } from "file-saver";
import { buildContactMagicUrl, buildWhatsAppMagicLink } from "../../utils/magicLink";

const statusColors = {
  new: "bg-blue-100 text-blue-800",
  contacted: "bg-purple-100 text-purple-800",
  in_progress: "bg-yellow-100 text-yellow-800",
  spam: "bg-red-100 text-red-800",
  admission_done: "bg-green-100 text-green-800",
};

const statusOptions = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "in_progress", label: "In Progress" },
  { value: "spam", label: "Spam" },
  { value: "admission_done", label: "Admission Done" },
];

const ContactsList = () => {
  const {
    currentUser,
    isAuthenticated,
    loading: authLoading,
    logout,
  } = useAuth();
  const navigate = useNavigate();
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 15,
    total: 0,
    totalPages: 1,
  });
  const [filters, setFilters] = useState({
    status: "",
    date: "",
    course: "",
  });
  const [selectedJourneyContact, setSelectedJourneyContact] = useState(null);
  const [serverStats, setServerStats] = useState(null);
  const [showServerStatsModal, setShowServerStatsModal] = useState(false);

  const fetchServerStats = async () => {
    try {
      const data = await getServerTrackingStats();
      if (data && data.success) {
        setServerStats(data);
      }
    } catch (e) {
      console.error("Error loading server tracking stats:", e);
    }
  };

  const handleExport = async () => {
    try {
      // Get all contacts with current filters
      const response = await getContacts({
        ...(filters.status && { status: filters.status }),
        ...(filters.date && { date: filters.date }),
        ...(filters.course && { course: filters.course }),
        limit: 1000, // Get more records for export
      });

      if (response.success && response.data?.length > 0) {
        // Convert data to CSV format
        const headers = [
          "S.No",
          "Name",
          "Email",
          "Phone",
          "Course",
          "Message",
          "Status",
          "Submitted Date",
          "Submitted Time",
        ];

        const csvRows = [];

        // Add headers
        csvRows.push(headers.join(","));

        // Add data rows
        response.data.forEach((contact, index) => {
          // Format phone number to prevent Excel from interpreting it as a formula
          const formatPhoneNumber = (phone) => {
            if (!phone) return "";
            // If the number starts with +, prefix with ' to force text format in Excel
            return phone.startsWith("+") ? `'${phone}` : phone;
          };

          const row = [
            index + 1,
            `"${contact.name.replace(/"/g, '""')}"`,
            `"${contact.email}"`,
            `"${formatPhoneNumber(contact.phone)}"`,
            `"${contact.courseTitle || ""}"`,
            `"${(contact.message || "").replace(/"/g, '""').replace(/\n/g, " ")}"`,
            `"${contact.status.replace("_", " ")}"`,
            `"${format(new Date(contact.submittedAt || contact.createdAt), "MMM d, yyyy")}"`,
            `"${format(new Date(contact.submittedAt || contact.createdAt), "h:mm a")}"`,
          ];
          csvRows.push(row.join(","));
        });

        // Create CSV file
        const csvContent = csvRows.join("\n");
        const blob = new Blob([csvContent], {
          type: "text/csv;charset=utf-8;",
        });
        const fileName = `contacts_export_${format(new Date(), "yyyyMMdd_HHmmss")}.csv`;

        // Download the file
        saveAs(blob, fileName);
        toast.success("Export completed successfully");
      } else {
        toast.warning("No data available to export");
      }
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export contacts");
    }
  };

  const fetchContacts = async (exportMode = false) => {
    if (!isAuthenticated) {
      setLoading(false);
      return { success: false };
    }

    try {
      if (!exportMode) {
        setLoading(true);
      }

      const params = {
        page: exportMode ? 1 : pagination.page,
        limit: exportMode ? 1000 : pagination.limit, // Get more records for export
        ...(filters.status && { status: filters.status }),
        ...(filters.date && { date: filters.date }),
        ...(filters.course && { course: filters.course }), // Add course filter
      };

      const response = await getContacts(params);

      if (response.success) {
        setContacts(response.data || []);

        // Calculate pagination values
        const totalItems =
          response.meta?.total ||
          response.meta?.totalItems ||
          response.data?.length ||
          0;
        const itemsPerPage = response.meta?.limit || pagination.limit;
        const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
        const currentPage =
          response.meta?.currentPage || response.meta?.page || pagination.page;

        // Update pagination state with calculated values
        setPagination((prev) => ({
          ...prev,
          total: totalItems,
          totalPages: totalPages,
          page: currentPage,
          limit: itemsPerPage,
        }));
      } else {
        // Handle API error response
        console.error(
          "Error fetching contacts:",
          response.error || response.message,
        );
        toast.error(response.message || "Failed to load contacts");

        if (response.shouldLogout) {
          // Handle logout if token is invalid/expired
          logout();
          navigate("/login", { state: { from: "/admin/contacts" } });
        }
      }
    } catch (error) {
      console.error("Error in fetchContacts:", error);
      toast.error(error.message || "An error occurred while fetching contacts");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      // Get the token from localStorage since we need it for the API call
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Authentication required");
        return;
      }

      await updateContactStatus(id, newStatus, token);
      await fetchContacts();
      toast.success("Status updated successfully");
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error(error.message || "Failed to update status");

      // If the error is due to authentication, log the user out
      if (error.response?.status === 401) {
        logout();
      }
    }
  };

  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      fetchContacts();
      fetchServerStats();
    }
  }, [pagination.page, filters, isAuthenticated, authLoading]);

  if (!isAuthenticated && !authLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-white rounded-lg shadow p-6">
        <div className="text-lg font-medium text-gray-900 mb-4">
          Authentication Required
        </div>
        <p className="text-gray-600 mb-6 text-center">
          You need to be logged in to view contacts.
        </p>
        <button
          onClick={() =>
            navigate("/login", { state: { from: "/admin/contacts" } })
          }
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Go to Login
        </button>
      </div>
    );
  }

  if (authLoading || (loading && !contacts.length)) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-white rounded-lg shadow p-6">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-gray-600">Loading contacts...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-medium text-gray-900">
            Contact Submissions
          </h2>
          <button
            onClick={handleExport}
            className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 flex items-center"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 mr-1.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Export
          </button>

          <button
            onClick={() => {
              fetchServerStats();
              setShowServerStatsModal(true);
            }}
            className="px-3 py-1.5 text-xs font-semibold bg-indigo-600 text-white rounded-md hover:bg-indigo-700 shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Conversions API & GA4 Server-Side Tracking (Bypassing Ad-Blockers)"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>🛡️ Server-Side Tracking</span>
            {serverStats?.totalEvents > 0 && (
              <span className="bg-indigo-900 text-indigo-100 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {serverStats.totalEvents} Bypassed
              </span>
            )}
          </button>
        </div>

        {/* Filter By Status */}
        <div className="w-full sm:w-auto flex gap-2">
          <select
            value={filters.status}
            onChange={(e) => {
              setFilters({ ...filters, status: e.target.value });
              setPagination((prev) => ({ ...prev, page: 1 }));
            }}
            className="block w-full px-2 py-1 sm:w-40 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
          >
            <option value="">All Status</option>
            {statusOptions.map((option) => (
              <option key={`status-${option.value}`} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {/* Filter By Course */}
          <select
            value={filters.course}
            onChange={(e) => {
              setFilters({ ...filters, course: e.target.value });
              setPagination((prev) => ({ ...prev, page: 1 }));
            }}
            className="block w-full px-2 py-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
          >
            <option value="">All Courses</option>
            {Array.from(
              new Set(
                contacts.map((contact) => contact.courseTitle).filter(Boolean),
              ),
            ).map((course, index) => (
              <option key={`course-${index}`} value={course}>
                {course}
              </option>
            ))}
          </select>
        </div>

        {/* Filter By Date */}
        <div className="w-full sm:w-auto flex gap-2">
          <input
            type="date"
            value={filters.date || ""}
            onChange={(e) => {
              setFilters({ ...filters, date: e.target.value });
              setPagination((prev) => ({ ...prev, page: 1 }));
            }}
            className="block w-full px-2 py-1 sm:w-40 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
          />
          {filters.date && (
            <button
              onClick={() => setFilters({ ...filters, date: "" })}
              className="text-gray-400 hover:text-gray-600"
              title="Clear date filter"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                S.No
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Contact Info
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Tracking Info
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Courses
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Submitted
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {contacts.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                  No contact submissions found
                </td>
              </tr>
            ) : (
              contacts.map((contact, index) => (
                <tr
                  key={contact._id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {/* Incress number with pagination */}
                    {index + 1 + (pagination.page - 1) * pagination.limit}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div>
                      <span className="text-blue-600">Name:</span>{" "}
                      {contact.name}
                    </div>
                    <div>
                      <span className="text-blue-600">Email:</span>{" "}
                      {contact.email}
                    </div>
                    {contact.phone && (
                      <div>
                        <span className="text-blue-600">Number:</span>{" "}
                        {contact.phone}
                      </div>
                    )}
                    {contact.message && (
                      <div className="mt-2 line-clamp-2">
                        <span className="text-blue-600">Message:</span>{" "}
                        {contact.message}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 min-w-[210px]">
                    <div className="flex flex-col gap-1.5">
                      {/* Status Badges */}
                      <div className="flex items-center flex-wrap gap-1">
                        {contact.isPartial ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                            ⚡ Partial Lead
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            ✓ Tracked
                          </span>
                        )}

                        {(contact.totalVisits > 1 || contact.isReturning) && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-purple-100 text-purple-800 border border-purple-200">
                            🔁 {contact.totalVisits} Visits
                          </span>
                        )}

                        {contact.isFingerprintMatched && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-violet-100 text-violet-800 border border-violet-200">
                            🕵️ Incognito/FP
                          </span>
                        )}
                      </div>

                      {/* Device info if available */}
                      {contact.device?.os && (
                        <div className="text-[11px] text-gray-500 flex items-center gap-1 truncate max-w-[210px]">
                          <span>{contact.device.deviceType === "mobile" ? "📱" : "💻"}</span>
                          <span>{contact.device.os} • {contact.device.browser}</span>
                        </div>
                      )}

                      {/* Visit Counts & Page Views */}
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <span>
                          Visits: <strong className="text-gray-900">{contact.totalVisits || 1}</strong>
                        </span>
                        <span>•</span>
                        <span>
                          Views: <strong className="text-gray-900">{contact.pageViews || contact.visitHistory?.length || 1}</strong>
                        </span>
                      </div>

                      {/* Last Visited Page / Course URL */}
                      {(contact.lastPageVisited || contact.pageUrl || (contact.visitHistory?.length > 0 && contact.visitHistory[contact.visitHistory.length - 1]?.pageUrl)) && (
                        <div
                          className="text-xs text-gray-500 max-w-[210px] truncate"
                          title={contact.lastPageVisited || contact.pageUrl || contact.visitHistory[contact.visitHistory.length - 1]?.pageUrl}
                        >
                          <span className="font-medium text-gray-700">Last:</span>{" "}
                          <span className="font-mono text-[11px] text-blue-600 bg-blue-50 px-1 py-0.5 rounded border border-blue-100">
                            {contact.lastPageVisited || contact.pageUrl || contact.visitHistory[contact.visitHistory.length - 1]?.pageUrl}
                          </span>
                        </div>
                      )}

                      {/* Journey View Button */}
                      {contact.visitHistory && contact.visitHistory.length > 0 ? (
                        <div className="pt-0.5">
                          <button
                            type="button"
                            onClick={() => setSelectedJourneyContact(contact)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-md transition-colors shadow-xs"
                          >
                            <span>👁️ View Journey</span>
                            <span className="bg-indigo-200 text-indigo-900 text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                              {contact.visitHistory.length}
                            </span>
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-gray-400 italic">Single page submission</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-black">
                    <div>
                      <span className="text-blue-600 font-medium">Course:</span>{" "}
                      <span className="font-semibold">{contact.courseTitle || "General Enquiry"}</span>
                    </div>

                    {/* 09 - Pre-filled Magic Link Follow-up Actions */}
                    <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                      {contact.phone && (
                        <a
                          href={buildWhatsAppMagicLink(contact)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-white bg-green-600 hover:bg-green-700 active:bg-green-800 rounded-md shadow-xs transition-colors"
                          title="Send follow-up WhatsApp message with pre-filled details"
                        >
                          <span>💬</span> WhatsApp Magic
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          const url = buildContactMagicUrl(contact);
                          navigator.clipboard.writeText(url);
                          toast.success("Magic Link copied! 📋 (User details will be pre-filled)");
                        }}
                        className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-md shadow-xs transition-colors"
                        title="Copy Pre-filled Magic Link to clipboard"
                      >
                        <span>🪄</span> Copy Link
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div>
                      {format(
                        new Date(contact.submittedAt || contact.createdAt),
                        "MMM d, yyyy",
                      )}
                    </div>
                    <div className="text-xs text-gray-400">
                      {format(
                        new Date(contact.submittedAt || contact.createdAt),
                        "h:mm a",
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div className="flex flex-col gap-2">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          statusColors[contact.status]
                        }`}
                      >
                        {contact.status.replace("_", " ")}
                      </span>
                      <select
                        value={contact.status}
                        onChange={(e) =>
                          handleStatusChange(contact._id, e.target.value)
                        }
                        className={`block w-full sm:w-32 text-xs rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                          statusColors[contact.status]
                        }`}
                      >
                        {statusOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Debug Info - Commented out for production
      <div className="bg-yellow-50 p-2 mb-4 rounded text-xs text-gray-700">
        <p>Debug Info:</p>
        <p>Total Items: {pagination.total}</p>
        <p>Items per Page: {pagination.limit}</p>
        <p>Total Pages: {pagination.totalPages}</p>
        <p>Current Page: {pagination.page}</p>
        <p>Show Pagination: {pagination.total > pagination.limit ? 'Yes' : 'No'}</p>
      </div>
      */}

      {/* Pagination */}
      <div className="bg-white px-6 py-3 border-t border-gray-200">
        {pagination.total > 0 && (
          <div className="bg-white px-6 py-3 flex items-center justify-between border-t border-gray-200">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() =>
                  setPagination((prev) => ({
                    ...prev,
                    page: Math.max(1, prev.page - 1),
                  }))
                }
                disabled={pagination.page === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() =>
                  setPagination((prev) => ({ ...prev, page: prev.page + 1 }))
                }
                disabled={
                  pagination.page * pagination.limit >= pagination.total
                }
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4">
              <div className="text-sm text-gray-600">
                Showing{" "}
                <span className="font-medium">
                  {pagination.total === 0
                    ? 0
                    : (pagination.page - 1) * pagination.limit + 1}
                </span>{" "}
                to{" "}
                <span className="font-medium">
                  {Math.min(
                    pagination.page * pagination.limit,
                    pagination.total,
                  )}
                </span>{" "}
                of <span className="font-medium">{pagination.total}</span>{" "}
                {pagination.total === 1 ? "entry" : "entries"}
              </div>

              {pagination.totalPages > 1 && (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      const newPage = Math.max(1, pagination.page - 1);
                      setPagination((prev) => ({ ...prev, page: newPage }));
                    }}
                    disabled={pagination.page === 1}
                    className="px-3 py-1.5 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                  >
                    Previous
                  </button>

                  <div className="flex items-center space-x-1">
                    {Array.from(
                      { length: Math.min(5, pagination.totalPages) },
                      (_, i) => {
                        let pageNum;
                        if (pagination.totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (pagination.page <= 3) {
                          pageNum = i + 1;
                        } else if (
                          pagination.page >=
                          pagination.totalPages - 2
                        ) {
                          pageNum = pagination.totalPages - 4 + i;
                        } else {
                          pageNum = pagination.page - 2 + i;
                        }

                        return (
                          <button
                            key={pageNum}
                            onClick={() =>
                              setPagination((prev) => ({
                                ...prev,
                                page: pageNum,
                              }))
                            }
                            className={`min-w-[32px] h-8 flex items-center justify-center rounded-md ${
                              pagination.page === pageNum
                                ? "bg-blue-600 text-white border-blue-600"
                                : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                            } text-sm font-medium`}
                          >
                            {pageNum}
                          </button>
                        );
                      },
                    )}

                    {pagination.totalPages > 5 &&
                      pagination.page < pagination.totalPages - 2 && (
                        <span className="px-2 text-gray-500">...</span>
                      )}

                    {pagination.totalPages > 5 &&
                      pagination.page < pagination.totalPages - 2 && (
                        <button
                          onClick={() =>
                            setPagination((prev) => ({
                              ...prev,
                              page: pagination.totalPages,
                            }))
                          }
                          className="min-w-[32px] h-8 flex items-center justify-center rounded-md bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-medium"
                        >
                          {pagination.totalPages}
                        </button>
                      )}
                  </div>

                  <button
                    onClick={() => {
                      const newPage = Math.min(
                        pagination.page + 1,
                        pagination.totalPages,
                      );
                      setPagination((prev) => ({ ...prev, page: newPage }));
                    }}
                    disabled={pagination.page >= pagination.totalPages}
                    className="px-3 py-1.5 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Browsing Journey Modal */}
      {selectedJourneyContact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col border border-gray-200 overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-gray-100 flex justify-between items-start bg-gradient-to-r from-blue-50/80 to-indigo-50/80">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl">🗺️</span>
                  <h3 className="text-lg font-bold text-gray-900">
                    Visitor Journey & Activity
                  </h3>
                  {selectedJourneyContact.isPartial && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                      ⚡ Partial Lead (onBlur)
                    </span>
                  )}
                  {(selectedJourneyContact.totalVisits > 1 || selectedJourneyContact.isReturning) && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-200">
                      🔁 Returning ({selectedJourneyContact.totalVisits} visits)
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-600 mt-1.5 flex items-center flex-wrap gap-2">
                  <span className="font-semibold text-gray-900">{selectedJourneyContact.name || "Website Lead"}</span>
                  {selectedJourneyContact.phone && (
                    <span className="text-gray-500">• 📞 {selectedJourneyContact.phone}</span>
                  )}
                  {selectedJourneyContact.email && (
                    <span className="text-gray-500">• ✉️ {selectedJourneyContact.email}</span>
                  )}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedJourneyContact(null)}
                className="w-8 h-8 rounded-full bg-white hover:bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-800 transition-colors shadow-xs"
              >
                ✕
              </button>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-3 gap-2 p-3 bg-gray-50 border-b border-gray-100 text-center text-xs">
              <div className="bg-white p-2.5 rounded-lg border border-gray-200 shadow-xs">
                <span className="text-gray-500 block text-[11px]">Total Visits</span>
                <span className="text-base font-bold text-blue-600">
                  {selectedJourneyContact.totalVisits || 1}
                </span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-gray-200 shadow-xs">
                <span className="text-gray-500 block text-[11px]">Page Views</span>
                <span className="text-base font-bold text-indigo-600">
                  {selectedJourneyContact.pageViews || selectedJourneyContact.visitHistory?.length || 1}
                </span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-gray-200 shadow-xs">
                <span className="text-gray-500 block text-[11px]">Tracking ID</span>
                <span className="text-[11px] font-mono font-semibold text-gray-700 truncate block mt-0.5" title={selectedJourneyContact.trackingId || selectedJourneyContact.visitorId}>
                  {selectedJourneyContact.trackingId || selectedJourneyContact.visitorId || "N/A"}
                </span>
              </div>
            </div>

            {/* Hardware Fingerprint & Device Bar */}
            {(selectedJourneyContact.fingerprint || selectedJourneyContact.device?.os) && (
              <div className="px-4 py-2 bg-indigo-50/50 border-b border-gray-100 text-xs flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-gray-700">
                  <span className="text-sm">{selectedJourneyContact.device?.deviceType === "mobile" ? "📱" : "💻"}</span>
                  <span className="font-semibold">
                    {selectedJourneyContact.device?.os || "Device"} • {selectedJourneyContact.device?.browser || "Browser"}
                  </span>
                  {selectedJourneyContact.device?.screenResolution && (
                    <span className="text-gray-400 font-mono text-[11px]">
                      ({selectedJourneyContact.device.screenResolution})
                    </span>
                  )}
                  {selectedJourneyContact.isFingerprintMatched && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                      🕵️ Incognito / Cache Cleared Matched
                    </span>
                  )}
                </div>
                {selectedJourneyContact.fingerprint && (
                  <div className="flex items-center gap-1.5 bg-white px-2 py-0.5 rounded border border-gray-200">
                    <span className="text-[10px] text-gray-400 font-semibold uppercase">Fingerprint:</span>
                    <span className="font-mono text-[11px] text-indigo-600 font-bold" title={selectedJourneyContact.fingerprint}>
                      {selectedJourneyContact.fingerprint}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Timeline of Visited Pages */}
            <div className="p-5 overflow-y-auto flex-1 space-y-3">
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Pages Visited Timeline ({selectedJourneyContact.visitHistory?.length || 0})
              </h4>

              {(!selectedJourneyContact.visitHistory || selectedJourneyContact.visitHistory.length === 0) ? (
                <div className="text-center py-8 text-gray-400 text-sm">
                  No browsing history recorded yet.
                </div>
              ) : (
                <div className="relative pl-6 border-l-2 border-indigo-200 space-y-3.5 my-2">
                  {selectedJourneyContact.visitHistory.map((step, idx) => (
                    <div key={idx} className="relative group">
                      <div className="absolute -left-[31px] top-1.5 w-3.5 h-3.5 rounded-full bg-indigo-600 border-2 border-white ring-2 ring-indigo-200" />
                      <div className="bg-gray-50 hover:bg-indigo-50/40 transition-colors p-3 rounded-xl border border-gray-200">
                        <div className="flex justify-between items-start gap-2">
                          <div className="flex-1">
                            <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wide">
                              Step {idx + 1}
                            </span>
                            <div className="text-sm font-semibold text-gray-900 mt-0.5">
                              {step.pageTitle || (step.pageUrl === "/" ? "Home Page" : step.pageUrl)}
                            </div>
                            <div className="text-xs font-mono text-gray-500 mt-0.5 break-all">
                              {step.pageUrl}
                            </div>
                          </div>
                          {step.visitedAt && (
                            <span className="text-[11px] text-gray-400 whitespace-nowrap bg-white px-2 py-0.5 rounded border border-gray-100">
                              {format(new Date(step.visitedAt), "MMM d, h:mm a")}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer Quick Actions */}
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs text-gray-500">
                Submitted:{" "}
                <strong className="text-gray-700">
                  {format(
                    new Date(selectedJourneyContact.submittedAt || selectedJourneyContact.createdAt || Date.now()),
                    "MMM d, yyyy h:mm a"
                  )}
                </strong>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {selectedJourneyContact.phone && (
                  <>
                    <a
                      href={buildWhatsAppMagicLink(selectedJourneyContact)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-green-600 hover:bg-green-700 rounded-lg shadow-xs transition-colors"
                      title="Send WhatsApp follow-up with pre-filled magic link"
                    >
                      <span>🪄</span> WhatsApp Magic Link
                    </a>
                    <button
                      type="button"
                      onClick={() => {
                        const url = buildContactMagicUrl(selectedJourneyContact);
                        navigator.clipboard.writeText(url);
                        toast.success("Magic Link copied! 📋");
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg shadow-xs transition-colors"
                    >
                      <span>📋</span> Copy Magic Link
                    </button>
                    <a
                      href={`tel:${selectedJourneyContact.phone}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-100 border border-gray-300 rounded-lg shadow-xs transition-colors"
                    >
                      <span>📞</span> Call
                    </a>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedJourneyContact(null)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-gray-600 hover:text-gray-800 bg-white hover:bg-gray-100 border border-gray-300 rounded-lg shadow-xs transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 07 - Server-Side Tracking (Bypassing Ad-Blockers) Modal */}
      {showServerStatsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden border border-gray-100 flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-5 bg-gradient-to-r from-gray-900 via-indigo-950 to-gray-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-400/40 flex items-center justify-center text-xl shadow-inner">
                  🛡️
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base text-white">
                      Server-Side Tracking (Conversions API)
                    </h3>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      100% Ad-Blocker Immune
                    </span>
                  </div>
                  <p className="text-xs text-indigo-200 mt-0.5">
                    Direct Node.js Server-to-Server dispatch to Meta CAPI & Google Analytics 4
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowServerStatsModal(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-gray-50 border-b border-gray-200">
              <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-xs">
                <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                  Ad-Blockers Bypassed
                </div>
                <div className="text-2xl font-black text-indigo-600 mt-1">
                  {serverStats?.totalEvents || 0}
                </div>
                <div className="text-[10px] text-gray-400 mt-0.5">
                  100% Captured via First-Party Backend
                </div>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-xs">
                <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide flex items-center justify-between">
                  <span>Meta CAPI</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${serverStats?.metaCapiConfigured ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                    {serverStats?.metaCapiConfigured ? 'Live API' : 'Simulated'}
                  </span>
                </div>
                <div className="text-xs font-mono font-bold text-gray-800 mt-2 truncate" title={serverStats?.metaPixelId}>
                  Pixel: {serverStats?.metaPixelId || "1612208420573846"}
                </div>
                <div className="text-[10px] text-gray-400 mt-0.5">
                  SHA-256 Hashed PII (em, ph, fn)
                </div>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-xs">
                <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide flex items-center justify-between">
                  <span>GA4 Protocol</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${serverStats?.ga4Configured ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                    {serverStats?.ga4Configured ? 'Live API' : 'Simulated'}
                  </span>
                </div>
                <div className="text-xs font-mono font-bold text-gray-800 mt-2">
                  Measurement Protocol
                </div>
                <div className="text-[10px] text-gray-400 mt-0.5">
                  Direct server collect endpoint
                </div>
              </div>
            </div>

            {/* Event Distribution */}
            {serverStats?.eventsByType?.length > 0 && (
              <div className="px-4 py-2.5 bg-indigo-50/40 border-b border-gray-200 flex flex-wrap items-center gap-2 text-xs">
                <span className="font-semibold text-gray-600">Event Breakdown:</span>
                {serverStats.eventsByType.map((item) => (
                  <span
                    key={item._id}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-medium bg-white text-indigo-700 border border-indigo-200 shadow-xs"
                  >
                    <span>{item._id}:</span>
                    <strong className="text-indigo-900">{item.count}</strong>
                  </span>
                ))}
              </div>
            )}

            {/* Live Audit Stream Table */}
            <div className="p-4 overflow-y-auto flex-1">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Recent Server-Dispatched Events (Bypassing Ad-Blockers)
                </h4>
                <button
                  onClick={fetchServerStats}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                >
                  <span>🔄</span> Refresh
                </button>
              </div>

              {!serverStats?.recentEvents || serverStats.recentEvents.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm">
                  No server-side events logged yet. Visit pages or fill lead forms to see events!
                </div>
              ) : (
                <div className="overflow-x-auto border border-gray-200 rounded-xl">
                  <table className="min-w-full divide-y divide-gray-200 text-xs text-left">
                    <thead className="bg-gray-50 text-gray-500 font-semibold uppercase">
                      <tr>
                        <th className="px-3 py-2">Event</th>
                        <th className="px-3 py-2">Target Page / Course</th>
                        <th className="px-3 py-2">Visitor / Lead</th>
                        <th className="px-3 py-2">Meta / GA4 Status</th>
                        <th className="px-3 py-2">Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {serverStats.recentEvents.map((evt) => (
                        <tr key={evt._id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-3 py-2 whitespace-nowrap">
                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                              evt.eventType === 'Lead'
                                ? 'bg-green-100 text-green-800'
                                : evt.eventType === 'PartialLead'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {evt.eventType}
                            </span>
                          </td>
                          <td className="px-3 py-2 max-w-[200px] truncate" title={evt.pageUrl}>
                            <div className="font-medium text-gray-800 truncate">
                              {evt.pageTitle || evt.pageUrl}
                            </div>
                            <div className="text-[10px] font-mono text-gray-400 truncate">
                              {evt.pageUrl}
                            </div>
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            {evt.userData?.name || evt.userData?.phone ? (
                              <div>
                                <span className="font-semibold text-gray-800">
                                  {evt.userData?.name || "Lead"}
                                </span>
                                <span className="text-[10px] text-gray-500 block">
                                  {evt.userData?.phone || evt.userData?.email}
                                </span>
                              </div>
                            ) : (
                              <span className="font-mono text-[10px] text-gray-400 truncate max-w-[120px] block" title={evt.visitorId}>
                                {evt.visitorId || "Anonymous"}
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <span className="px-1.5 py-0.2 bg-blue-50 text-blue-700 rounded text-[9px] font-bold border border-blue-200">
                                Meta: {evt.metaCapi?.status || 'ok'}
                              </span>
                              <span className="px-1.5 py-0.2 bg-emerald-50 text-emerald-700 rounded text-[9px] font-bold border border-emerald-200">
                                GA4: {evt.ga4MeasurementProtocol?.status || 'ok'}
                              </span>
                            </div>
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-gray-400 text-[10px]">
                            {evt.createdAt ? format(new Date(evt.createdAt), "MMM d, h:mm a") : "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between text-xs">
              <span className="text-gray-500">
                🛡️ All server events bypass browser extensions (uBlock, AdGuard, Brave Shields) completely.
              </span>
              <button
                type="button"
                onClick={() => setShowServerStatsModal(false)}
                className="px-4 py-1.5 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-100 border border-gray-300 rounded-lg shadow-xs transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContactsList;
