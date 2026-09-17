import React, { useState, useEffect } from "react";
import { getEmailRecords } from "../../api/adminApi";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";
import {
  FiX,
  FiPaperclip,
  FiUser,
  FiMail,
  FiCalendar,
  FiFileText,
  FiAlertCircle,
  FiFilter,
} from "react-icons/fi";

const EmailRecords = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { t } = useTranslation();

  const handleViewDetails = (email) => {
    setSelectedEmail(email);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedEmail(null);
  };

  const fetchEmailRecords = async () => {
    try {
      setLoading(true);
      const { data } = await getEmailRecords({
        page: page + 1,
        limit: rowsPerPage,
        ...(searchTerm && { to: searchTerm }), // Add search filter if searchTerm exists
      });

      // Update to match the backend response structure
      setRecords(data.records || []);
      setTotalCount(data.total || 0);
    } catch (error) {
      console.error("Failed to fetch email records:", error);
      // Set empty state on error
      setRecords([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmailRecords();
  }, [page, rowsPerPage]);

  const handleSearch = (e) => {
    if (e.key === "Enter") {
      setPage(0);
      fetchEmailRecords();
    }
  };

  const handleChangePage = (newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (e) => {
    setRowsPerPage(parseInt(e.target.value, 10));
    setPage(0);
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "sent":
        return "bg-green-100 text-green-800";
      case "failed":
        return "bg-red-100 text-red-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-800">
          {t("emailRecords.title", "Email Records")}
        </h1>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg
                className="h-5 w-5 text-gray-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder={t("common.search", "Search...")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={handleSearch}
            />
          </div>
          <button
            onClick={fetchEmailRecords}
            className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {t("common.refresh", "Refresh")}
          </button>
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {t("emailRecords.studentName", "Recipient Name")}
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {t("emailRecords.recipient", "Recipient Email")}
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {t("emailRecords.status", "Status")}
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {t("emailRecords.sentAt", "Sent At")}
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {t("common.actions", "Actions")}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center">
                    <div className="animate-pulse">
                      {t("common.loading", "Loading...")}
                    </div>
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td
                    colSpan="5"
                    className="px-6 py-4 text-center text-gray-500"
                  >
                    {t("common.noData", "No records found")}
                  </td>
                </tr>
              ) : (
                records.map((record) => (
                  <tr key={record._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div
                        className={`px-3 py-2 rounded-md text-sm font-medium ${
                          record.studentName &&
                          record.studentName.trim() !== "" &&
                          record.studentName.toLowerCase() !== "null"
                            ? "bg-white text-gray-800" // Normal records
                            : "bg-yellow-100 text-yellow-800" // Proposal / missing student name
                        }`}
                      >
                        {record.studentName &&
                        record.studentName.trim() !== "" &&
                        record.studentName.toLowerCase() !== "null"
                          ? record.studentName
                          : "Proposal"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.to}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                          record.status
                        )}`}
                      >
                        {record.status}
                      </span>
                      {record.error && (
                        <span
                          className="ml-2 text-red-500 cursor-help"
                          title={record.error}
                        >
                          ⚠️
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {record.createdAt
                        ? format(new Date(record.createdAt), "PPpp")
                        : "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleViewDetails(record)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                        title={t("common.view", "View")}
                      >
                        👁️
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Email Details Modal */}
        {isModalOpen && selectedEmail && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">
                  Email Details
                </h3>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <FiX className="h-6 w-6" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start">
                    <FiUser className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Recipient</p>
                      <p className="text-sm font-medium text-gray-900">
                        {selectedEmail.to}
                        {selectedEmail.studentName &&
                          ` (${selectedEmail.studentName})`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <FiCalendar className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Sent At</p>
                      <p className="text-sm font-medium text-gray-900">
                        {selectedEmail.createdAt
                          ? format(new Date(selectedEmail.createdAt), "PPpp")
                          : "N/A"}
                      </p>
                    </div>
                  </div>

                  {selectedEmail.courseName && (
                    <div className="flex items-start">
                      <FiFileText className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-500">Course</p>
                        <p className="text-sm font-medium text-gray-900">
                          {selectedEmail.courseName}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start">
                    <FiMail className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Status</p>
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                          selectedEmail.status
                        )}`}
                      >
                        {selectedEmail.status}
                      </span>
                      {selectedEmail.error && (
                        <div className="mt-1 flex items-center text-sm text-red-600">
                          <FiAlertCircle className="h-4 w-4 mr-1" />
                          {selectedEmail.error}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <p className="text-sm font-medium text-gray-500 mb-2">
                    Subject
                  </p>
                  <p className="text-base font-medium text-gray-900 mb-4">
                    {selectedEmail.subject}
                  </p>

                  <p className="text-sm font-medium text-gray-500 mb-2">
                    Message
                  </p>
                  <div
                    className="prose max-w-none text-sm text-gray-700 border rounded p-4 bg-gray-50"
                    dangerouslySetInnerHTML={{ __html: selectedEmail.message }}
                  />
                </div>

                {selectedEmail.attachments &&
                  selectedEmail.attachments.length > 0 && (
                    <div className="border-t border-gray-200 pt-4">
                      <p className="text-sm font-medium text-gray-500 mb-2">
                        Attachments
                      </p>
                      <div className="space-y-2">
                        {selectedEmail.attachments.map((file, index) => (
                          <a
                            key={index}
                            href={file.path}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center text-sm text-blue-600 hover:text-blue-800"
                          >
                            <FiPaperclip className="h-4 w-4 mr-2" />
                            {file.name || `Attachment ${index + 1}`}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
              </div>

              <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Close
                </button>
                {selectedEmail.status === "failed" && (
                  <button
                    type="button"
                    onClick={() => {
                      // TODO: Implement resend functionality
                      toast.success(
                        "Resend functionality will be implemented here"
                      );
                    }}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Resend
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Pagination */}
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => handleChangePage(page - 1)}
              disabled={page === 0}
              className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                page === 0
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              {t("common.previous", "Previous")}
            </button>
            <button
              onClick={() => handleChangePage(page + 1)}
              disabled={(page + 1) * rowsPerPage >= totalCount}
              className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                (page + 1) * rowsPerPage >= totalCount
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              {t("common.next", "Next")}
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                {t("common.showing", "Showing")}{" "}
                <span className="font-medium">{page * rowsPerPage + 1}</span>{" "}
                {t("common.to", "to")}{" "}
                <span className="font-medium">
                  {Math.min((page + 1) * rowsPerPage, totalCount)}
                </span>{" "}
                {t("common.of", "of")}{" "}
                <span className="font-medium">{totalCount}</span>{" "}
                {t("common.results", "results")}
              </p>
            </div>
            <div className="flex items-center">
              <span className="text-sm text-gray-700 mr-2">
                {t("common.rowsPerPage", "Rows per page:")}
              </span>
              <select
                className="mt-1 block pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                value={rowsPerPage}
                onChange={handleChangeRowsPerPage}
              >
                {[5, 10, 25].map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
              <div className="ml-4 flex">
                <button
                  onClick={() => handleChangePage(page - 1)}
                  disabled={page === 0}
                  className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 ${
                    page === 0
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-white text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  <span className="sr-only">
                    {t("common.previous", "Previous")}
                  </span>
                  <svg
                    className="h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
                <button
                  onClick={() => handleChangePage(page + 1)}
                  disabled={(page + 1) * rowsPerPage >= totalCount}
                  className={`-ml-px relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 ${
                    (page + 1) * rowsPerPage >= totalCount
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-white text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  <span className="sr-only">{t("common.next", "Next")}</span>
                  <svg
                    className="h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailRecords;
