import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getContacts, updateContactStatus } from "../../api/contactApi";
import { format, parseISO } from "date-fns";
import { toast } from "react-toastify";
import { useAuth } from "../../contexts/AuthContext";
import { saveAs } from "file-saver";

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
                <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
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
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {contact.trackingId ? (
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-green-600">✓ Tracked</span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Visits: {contact.visitHistory?.length || 1}
                        </div>
                        {contact.visitHistory &&
                          contact.visitHistory.length > 0 && (
                            <div className="text-xs text-gray-500 mt-1">
                              Last:{" "}
                              {contact.visitHistory[
                                contact.visitHistory.length - 1
                              ]?.pageUrl || "N/A"}
                            </div>
                          )}
                      </div>
                    ) : (
                      <span className="text-gray-400">Not tracked</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-black">
                    <span className="text-blue-600">Course Name:</span>{" "}
                    {contact.courseTitle}
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
    </div>
  );
};

export default ContactsList;
