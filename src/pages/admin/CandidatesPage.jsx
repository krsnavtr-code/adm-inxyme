import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import api from "../../api/axios";
import { saveAs } from "file-saver";
import { format } from "date-fns";

const statusColors = {
  pending: "gray",
  reviewed: "blue",
  contacted: "orange",
  rejected: "red",
};

const CandidatesPage = () => {
  const { user } = useAuth();
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [status, setStatus] = useState("");
  const [notes, setNotes] = useState("");

  const fetchCandidates = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/candidates?page=${page}&limit=10`);
      const responseData = response.data;

      // Check if the response data is in the expected format
      if (
        responseData &&
        responseData.data &&
        Array.isArray(responseData.data)
      ) {
        setCandidates(responseData.data);
        setTotalPages(Math.ceil(responseData.total / 10) || 1);
      } else {
        console.error("Unexpected API response format:", responseData);
        setCandidates([]);
        setTotalPages(1);
      }
    } catch (error) {
      console.error("Error fetching candidates:", error);
      setCandidates([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, [page]);

  const handleOpenModal = (candidate) => {
    setSelectedCandidate(candidate);
    setStatus(candidate.status);
    setNotes(candidate.notes || "");
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedCandidate(null);
    setStatus("");
    setNotes("");
  };

  const exportToCSV = async () => {
    try {
      const response = await api.get("/candidates?limit=1000");
      const responseData = response.data;
      const allCandidates = Array.isArray(responseData.data)
        ? responseData.data
        : [];

      // ✅ Headers — including payment & user-type fields
      const headers = [
        "Registration ID",
        "Name",
        "Email",
        "Phone",
        "User Type",
        "Course",
        "College",
        "University",
        "Company Name",
        "Payment Status",
        "Payment Amount",
        "Payment Date",
        "Payment Method",
        "Order ID",
        "Status",
        "Notes",
        "Created At",
      ];

      // ✅ CSV rows (formatted properly)
      const csvRows = allCandidates.map((c) => {
        // Format payment date nicely
        const paymentDate = c.paymentDetails?.date
          ? format(new Date(c.paymentDetails.date), "dd MMM yyyy, hh:mm a")
          : "";

        // Format created date
        const createdAt = c.createdAt
          ? format(new Date(c.createdAt), "yyyy-MM-dd HH:mm")
          : "";

        return [
          `"${c.registrationId || ""}"`,
          `"${c.name || ""}"`,
          `"${c.email || ""}"`,
          `"${c.phone || ""}"`,
          `"${c.userType || ""}"`,

          // Student fields
          `"${c.userType === "student" ? c.course || "" : ""}"`,
          `"${c.userType === "student" ? c.college || "" : ""}"`,
          `"${c.userType === "student" ? c.university || "" : ""}"`,

          // Company field
          `"${c.userType === "company" ? c.companyName || "" : ""}"`,

          // Payment info
          `"${
            c.isPaymentDone
              ? "Paid"
              : c.userType === "student"
              ? "No Need"
              : "Not Paid"
          }"`,
          `"${c.paymentDetails?.amount || ""}"`,
          `"${paymentDate}"`,
          `"${c.paymentDetails?.paymentMethod || ""}"`,
          `"${c.paymentDetails?.orderId || ""}"`,

          // Status & notes
          `"${c.status || ""}"`,
          `"${(c.notes || "").replace(/"/g, '""')}"`,
          `"${createdAt}"`,
        ].join(",");
      });

      // ✅ Combine into final CSV string
      const csvContent = [headers.join(","), ...csvRows].join("\n");

      // ✅ Save as downloadable file
      const blob = new Blob(["\uFEFF" + csvContent], {
        type: "text/csv;charset=utf-8;",
      });
      saveAs(blob, `candidates_${format(new Date(), "yyyyMMdd_HHmmss")}.csv`);
    } catch (error) {
      console.error("Error exporting to CSV:", error);
      alert("Failed to export candidates. Please try again.");
    }
  };

  return (
    <div className="p-6 text-black">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">
          Candidate Management
        </h2>
        <button
          onClick={exportToCSV}
          disabled={loading}
          className="mt-3 sm:mt-0 bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg shadow transition-all duration-200 disabled:opacity-60"
        >
          ⬇ Export to CSV
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto bg-white shadow rounded-lg">
        <table className="min-w-full border-collapse">
          <thead className="bg-gray-100 text-gray-700 text-sm uppercase">
            <tr>
              <th className="px-6 py-3 text-left">Name</th>
              <th className="px-6 py-3 text-left">Registration ID</th>
              <th className="px-6 py-3 text-left">Email</th>
              <th className="px-6 py-3 text-left">Type</th>
              <th className="px-6 py-3 text-left w-[150px]">Payment</th>
              <th className="px-6 py-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="text-gray-800">
            {loading ? (
              <tr>
                <td colSpan="8" className="px-6 py-4 text-center text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : candidates.length === 0 ? (
              <tr>
                <td colSpan="8" className="px-6 py-4 text-center text-gray-500">
                  No candidates found
                </td>
              </tr>
            ) : (
              candidates.map((c) => (
                <tr
                  key={c._id}
                  className="border-b hover:bg-gray-50 transition duration-150"
                >
                  <td className="px-6 py-3">{c.name}</td>
                  <td className="px-6 py-3">{c.registrationId}</td>
                  <td className="px-6 py-3">{c.email}</td>
                  <td className="px-6 py-3">
                    <span
                      className={`px-3 py-1 text-sm font-medium rounded-full ${
                        c.userType === "student"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-green-100 text-green-700"
                      }`}
                    >
                      {c.userType === "student" ? "Student" : "Company"}
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    <span
                      className={`px-3 py-1 text-sm font-medium rounded-full
                        ${
                          c.isPaymentDone
                            ? "bg-green-100 text-green-700" // ✅ Paid
                            : c.userType === "student"
                            ? "bg-blue-100 text-blue-700" // 🧑‍🎓 No Need (for students)
                            : "bg-red-100 text-red-700" // ❌ Not Paid (for companies)
                        }
                      `}
                    >
                      {c.isPaymentDone
                        ? "Paid"
                        : c.userType === "student"
                        ? "No Need"
                        : "Not Paid"}
                      <span className="ml-2 text-xs text-red-600">
                        {c.paymentDetails?.amount || ""}
                      </span>
                    </span>
                  </td>

                  <td className="px-6 py-3 text-center">
                    <button
                      onClick={() => handleOpenModal(c)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg shadow transition-all duration-200"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
            <button
              key={num}
              onClick={() => setPage(num)}
              className={`px-3 py-1 rounded-lg border text-sm font-medium transition-all duration-150 ${
                page === num
                  ? "bg-blue-600 text-white border-blue-600"
                  : "border-gray-300 text-gray-700 hover:bg-gray-100"
              }`}
            >
              {num}
            </button>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && selectedCandidate && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white w-full max-w-2xl rounded-xl shadow-xl p-6 relative overflow-y-auto max-h-[90vh]">
            <h3 className="text-2xl font-semibold text-gray-800 mb-6 border-b pb-3">
              Candidate Details
            </h3>

            <table className="min-w-full border border-gray-200 rounded-lg overflow-hidden">
              <tbody className="divide-y divide-gray-100 text-gray-700">
                <tr>
                  <td className="px-4 py-2 font-medium text-gray-600 w-1/3">
                    Name
                  </td>
                  <td className="px-4 py-2">{selectedCandidate.name}</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 font-medium text-gray-600">
                    Invitation ID
                  </td>
                  <td className="px-4 py-2">
                    {selectedCandidate.registrationId}
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-2 font-medium text-gray-600">Email</td>
                  <td className="px-4 py-2">{selectedCandidate.email}</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 font-medium text-gray-600">Phone</td>
                  <td className="px-4 py-2">{selectedCandidate.phone}</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 font-medium text-gray-600">Type</td>
                  <td className="px-4 py-2">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        selectedCandidate.userType === "student"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-green-100 text-green-700"
                      }`}
                    >
                      {selectedCandidate.userType === "student"
                        ? "Student"
                        : "Company"}
                    </span>
                  </td>
                </tr>

                {selectedCandidate.userType === "student" ? (
                  <>
                    <tr>
                      <td className="px-4 py-2 font-medium text-gray-600">
                        Course
                      </td>
                      <td className="px-4 py-2">
                        {selectedCandidate.course || "-"}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 font-medium text-gray-600">
                        College
                      </td>
                      <td className="px-4 py-2">
                        {selectedCandidate.college || "-"}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 font-medium text-gray-600">
                        University
                      </td>
                      <td className="px-4 py-2">
                        {selectedCandidate.university || "-"}
                      </td>
                    </tr>
                  </>
                ) : (
                  <tr>
                    <td className="px-4 py-2 font-medium text-gray-600">
                      Company Name
                    </td>
                    <td className="px-4 py-2">
                      {selectedCandidate.companyName || "-"}
                    </td>
                  </tr>
                )}

                {/* Payment Info */}
                <tr className="bg-gray-50">
                  <td
                    colSpan="2"
                    className="px-4 py-2 text-gray-700 font-semibold text-sm uppercase"
                  >
                    Payment Information
                  </td>
                </tr>

                <tr>
                  <td className="px-4 py-2 font-medium text-gray-600">
                    Payment
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        selectedCandidate.isPaymentDone
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {selectedCandidate.isPaymentDone ? "Paid" : "Not Paid"}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-2 font-medium text-gray-600">
                    Amount
                  </td>
                  <td className="px-4 py-2">
                    ₹{selectedCandidate.paymentDetails?.amount || "-"}
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-2 font-medium text-gray-600">Date</td>
                  <td className="px-4 py-2">
                    {selectedCandidate.paymentDetails?.date
                      ? new Date(
                          selectedCandidate.paymentDetails.date
                        ).toLocaleString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: true,
                        })
                      : "-"}
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-2 font-medium text-gray-600">
                    Status
                  </td>
                  <td className="px-4 py-2">
                    {selectedCandidate.paymentDetails?.status || "-"}
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-2 font-medium text-gray-600">
                    Order ID
                  </td>
                  <td className="px-4 py-2">
                    {selectedCandidate.paymentDetails?.orderId || "-"}
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-2 font-medium text-gray-600">
                    Payment Method
                  </td>
                  <td className="px-4 py-2">
                    {selectedCandidate.paymentDetails?.paymentMethod || "-"}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Buttons */}
            <div className="flex justify-end mt-6">
              <button
                onClick={handleCloseModal}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition"
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

export default CandidatesPage;
