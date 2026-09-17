import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import api from "../../api/axios";
import {
  FiCheckCircle,
  FiXCircle,
  FiEye,
  FiDownload,
  FiRefreshCw,
  FiFilter,
  FiSearch,
  FiUser,
  FiFileText,
  FiCalendar,
  FiX,
} from "react-icons/fi";
import { format } from "date-fns";

const DocumentVerification = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [documentTypeFilter, setDocumentTypeFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const documentTypes = [
    { key: "aadhar_front", label: "Aadhar Card (Front)" },
    { key: "aadhar_back", label: "Aadhar Card (Back)" },
    { key: "pan_card", label: "PAN Card" },
    { key: "qualification_certificate", label: "Qualification Certificate" },
  ];

  useEffect(() => {
    fetchDocuments();
  }, [page, statusFilter, documentTypeFilter]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      let url = `/student-documents/admin/all?page=${page}&limit=10`;
      if (statusFilter) url += `&status=${statusFilter}`;
      if (documentTypeFilter) url += `&documentType=${documentTypeFilter}`;

      const response = await api.get(url);
      setDocuments(response.data.data);
      setTotalPages(response.data.pagination.pages);
    } catch (error) {
      console.error("Failed to fetch documents:", error);
      toast.error("Failed to load documents");
    } finally {
      setLoading(false);
    }
  };

  const handleViewDocument = (document) => {
    setSelectedDocument(document);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedDocument(null);
  };

  const handleVerifyDocument = async (status, rejectionReason = "") => {
    if (!selectedDocument) return;

    try {
      setActionLoading(true);
      await api.patch(
        `/student-documents/admin/${selectedDocument._id}/verify`,
        {
          status,
          rejectionReason,
        },
      );

      toast.success(
        status === "approved"
          ? "Document approved successfully"
          : "Document rejected successfully",
      );

      handleCloseModal();
      fetchDocuments();
    } catch (error) {
      console.error("Failed to verify document:", error);
      toast.error(error.response?.data?.message || "Failed to verify document");
    } finally {
      setActionLoading(false);
    }
  };

  const getDocumentTypeLabel = (type) => {
    const docType = documentTypes.find((dt) => dt.key === type);
    return docType ? docType.label : type;
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "approved":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <FiCheckCircle className="w-3 h-3 mr-1" />
            Approved
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <FiXCircle className="w-3 h-3 mr-1" />
            Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            Pending
          </span>
        );
    }
  };

  const getFileUrl = (filePath) => {
    if (!filePath) return "";
    // If the path is already a full URL, return it as is
    if (filePath.startsWith("http://") || filePath.startsWith("https://")) {
      return filePath;
    }
    // Otherwise, construct the full URL using the base URL (without /api)
    const baseUrl =
      import.meta.env.VITE_API_BASE_URL?.replace("/api", "") ||
      "https://www.eklabya.com";
    // Remove leading slash if present to avoid double slashes
    const cleanPath = filePath.startsWith("/") ? filePath.slice(1) : filePath;
    return `${baseUrl}/${cleanPath}`;
  };

  const filteredDocuments = documents.filter((doc) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        doc.student?.fullname?.toLowerCase().includes(query) ||
        doc.student?.email?.toLowerCase().includes(query) ||
        doc.originalName?.toLowerCase().includes(query)
      );
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            Document Verification
          </h1>
          <p className="text-gray-600 mt-1">
            Review and verify student submitted documents
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center">
              <FiFilter className="text-gray-400 mr-2" />
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <div className="flex items-center">
              <select
                value={documentTypeFilter}
                onChange={(e) => {
                  setDocumentTypeFilter(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">All Document Types</option>
                {documentTypes.map((type) => (
                  <option key={type.key} value={type.key}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1 min-w-64">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by student name, email, or file name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            <button
              onClick={fetchDocuments}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center"
            >
              <FiRefreshCw className="mr-2" />
              Refresh
            </button>
          </div>
        </div>

        {/* Documents Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Documents ({filteredDocuments.length})
            </h2>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
              <p className="mt-4 text-gray-500">Loading documents...</p>
            </div>
          ) : filteredDocuments.length === 0 ? (
            <div className="p-12 text-center">
              <FiFileText className="mx-auto h-12 w-12 text-gray-300" />
              <p className="mt-4 text-gray-500">No documents found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Document Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      File Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Submitted
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredDocuments.map((document) => (
                    <tr key={document._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <FiUser className="text-gray-400 mr-2" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {document.student?.fullname || "Unknown"}
                            </div>
                            <div className="text-sm text-gray-500">
                              {document.student?.email || ""}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {getDocumentTypeLabel(document.documentType)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center">
                          <FiFileText className="text-gray-400 mr-2" />
                          <span className="truncate max-w-xs">
                            {document.originalName}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(document.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          <FiCalendar className="text-gray-400 mr-2" />
                          {format(new Date(document.createdAt), "MMM dd, yyyy")}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleViewDocument(document)}
                            className="text-indigo-600 hover:text-indigo-700"
                            title="View Document"
                          >
                            <FiEye className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() =>
                              window.open(
                                getFileUrl(document.filePath),
                                "_blank",
                              )
                            }
                            className="text-indigo-600 hover:text-indigo-700"
                            title="Download Document"
                          >
                            <FiDownload className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    Page {page} of {totalPages}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                      disabled={page === 1}
                      className="px-3 py-1 border border-gray-300 rounded-lg text-sm disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() =>
                        setPage((prev) => Math.min(totalPages, prev + 1))
                      }
                      disabled={page === totalPages}
                      className="px-3 py-1 border border-gray-300 rounded-lg text-sm disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Document Verification Modal */}
        {showModal && selectedDocument && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">
                    Verify Document
                  </h3>
                  <button
                    onClick={handleCloseModal}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <FiX className="w-6 h-6" />
                  </button>
                </div>

                {/* Student Info */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <div className="flex items-center mb-3">
                    <FiUser className="text-indigo-600 mr-2" />
                    <span className="font-semibold text-gray-900">
                      Student Information
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Name:</span>
                      <span className="ml-2 text-gray-900">
                        {selectedDocument.student?.fullname || "Unknown"}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Email:</span>
                      <span className="ml-2 text-gray-900">
                        {selectedDocument.student?.email || ""}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Phone:</span>
                      <span className="ml-2 text-gray-900">
                        {selectedDocument.student?.phone || "N/A"}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Document Type:</span>
                      <span className="ml-2 text-gray-900">
                        {getDocumentTypeLabel(selectedDocument.documentType)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Document Preview */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <FiFileText className="text-indigo-600 mr-2" />
                      <span className="font-semibold text-gray-900">
                        Document Preview
                      </span>
                    </div>
                    <button
                      onClick={() =>
                        window.open(
                          getFileUrl(selectedDocument.filePath),
                          "_blank",
                        )
                      }
                      className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                    >
                      Open in New Tab
                    </button>
                  </div>
                  <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    {selectedDocument.mimetype &&
                    selectedDocument.mimetype.startsWith("image/") ? (
                      <img
                        src={getFileUrl(selectedDocument.filePath)}
                        alt={selectedDocument.originalName}
                        className="max-w-full max-h-96 mx-auto rounded"
                      />
                    ) : (
                      <div className="text-center py-8">
                        <FiFileText className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                        <p className="text-gray-500">
                          {selectedDocument.originalName}
                        </p>
                        <p className="text-sm text-gray-400 mt-1">
                          {(selectedDocument.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                        <button
                          onClick={() =>
                            window.open(
                              getFileUrl(selectedDocument.filePath),
                              "_blank",
                            )
                          }
                          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                        >
                          Download File
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Verification Actions */}
                {selectedDocument.status === "pending" && (
                  <div className="border-t border-gray-200 pt-6">
                    <h4 className="font-semibold text-gray-900 mb-4">
                      Verification Action
                    </h4>
                    <div className="flex items-center space-x-4">
                      <button
                        onClick={() => handleVerifyDocument("approved")}
                        disabled={actionLoading}
                        className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                      >
                        <FiCheckCircle className="mr-2" />
                        Approve
                      </button>
                      <button
                        onClick={() => {
                          const reason = prompt(
                            "Please enter rejection reason:",
                          );
                          if (reason) {
                            handleVerifyDocument("rejected", reason);
                          }
                        }}
                        disabled={actionLoading}
                        className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                      >
                        <FiXCircle className="mr-2" />
                        Reject
                      </button>
                    </div>
                  </div>
                )}

                {/* Already Verified Info */}
                {selectedDocument.status !== "pending" && (
                  <div className="border-t border-gray-200 pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">
                          This document has been{" "}
                          <span className="font-semibold">
                            {selectedDocument.status}
                          </span>
                        </p>
                        {selectedDocument.verifiedAt && (
                          <p className="text-sm text-gray-500">
                            Verified on{" "}
                            {format(
                              new Date(selectedDocument.verifiedAt),
                              "MMM dd, yyyy HH:mm",
                            )}
                          </p>
                        )}
                        {selectedDocument.rejectionReason && (
                          <p className="text-sm text-red-600 mt-2">
                            Rejection Reason: {selectedDocument.rejectionReason}
                          </p>
                        )}
                      </div>
                      {getStatusBadge(selectedDocument.status)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentVerification;
