import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import api from "../../api/axios";
import {
  FiPlus,
  FiEdit,
  FiTrash2,
  FiToggleLeft,
  FiToggleRight,
  FiRefreshCw,
  FiExternalLink,
  FiCopy,
  FiX,
} from "react-icons/fi";
import { format } from "date-fns";

const RedirectManagement = () => {
  const [redirects, setRedirects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingRedirect, setEditingRedirect] = useState(null);

  const [formData, setFormData] = useState({
    sourceUrl: "",
    targetUrl: "",
    statusCode: 301,
    description: "",
  });

  useEffect(() => {
    fetchRedirects();
  }, [page]);

  const fetchRedirects = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/redirects?page=${page}&limit=10`);
      setRedirects(response.data.data);
      setTotalPages(response.data.pagination.pages);
    } catch (error) {
      console.error("Failed to fetch redirects:", error);
      toast.error("Failed to load redirects");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (redirect = null) => {
    if (redirect) {
      setEditingRedirect(redirect);
      setFormData({
        sourceUrl: redirect.sourceUrl,
        targetUrl: redirect.targetUrl,
        statusCode: redirect.statusCode,
        description: redirect.description || "",
      });
    } else {
      setEditingRedirect(null);
      setFormData({
        sourceUrl: "",
        targetUrl: "",
        statusCode: 301,
        description: "",
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingRedirect(null);
    setFormData({
      sourceUrl: "",
      targetUrl: "",
      statusCode: 301,
      description: "",
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Normalize URLs to store just the path if full URL is provided
      const normalizedData = {
        ...formData,
        sourceUrl: formData.sourceUrl.replace(/^https?:\/\/[^\/]+/, ""), // Remove domain from source
        targetUrl: formData.targetUrl.startsWith("http")
          ? formData.targetUrl
          : formData.targetUrl.startsWith("/")
            ? `${window.location.origin}${formData.targetUrl}`
            : `${window.location.origin}/${formData.targetUrl}`,
      };

      if (editingRedirect) {
        await api.patch(`/redirects/${editingRedirect._id}`, normalizedData);
        toast.success("Redirect updated successfully");
      } else {
        await api.post("/redirects", normalizedData);
        toast.success("Redirect created successfully");
      }

      handleCloseModal();
      fetchRedirects();
    } catch (error) {
      console.error("Failed to save redirect:", error);
      toast.error(error.response?.data?.message || "Failed to save redirect");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this redirect?")) {
      return;
    }

    try {
      await api.delete(`/redirects/${id}`);
      toast.success("Redirect deleted successfully");
      fetchRedirects();
    } catch (error) {
      console.error("Failed to delete redirect:", error);
      toast.error("Failed to delete redirect");
    }
  };

  const handleToggle = async (id) => {
    try {
      await api.patch(`/redirects/${id}/toggle`);
      toast.success("Redirect status updated");
      fetchRedirects();
    } catch (error) {
      console.error("Failed to toggle redirect:", error);
      toast.error("Failed to update redirect status");
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const getStatusBadge = (isActive) => {
    return isActive ? (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        Active
      </span>
    ) : (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
        Inactive
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              301 Redirect Management
            </h1>
            <p className="text-gray-600 mt-1">
              Manage URL redirects for SEO and site maintenance
            </p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <FiPlus className="mr-2" />
            Add Redirect
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                All Redirects ({redirects.length})
              </h2>
              <button
                onClick={fetchRedirects}
                className="text-indigo-600 hover:text-indigo-700"
              >
                <FiRefreshCw className="w-5 h-5" />
              </button>
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
              <p className="mt-4 text-gray-500">Loading redirects...</p>
            </div>
          ) : redirects.length === 0 ? (
            <div className="p-12 text-center">
              <FiExternalLink className="mx-auto h-12 w-12 text-gray-300" />
              <p className="mt-4 text-gray-500">No redirects configured yet</p>
              <button
                onClick={() => handleOpenModal()}
                className="mt-4 text-indigo-600 hover:text-indigo-700 font-medium"
              >
                Create your first redirect
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Source URL
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Target URL
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status Code
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Redirects
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {redirects.map((redirect) => (
                    <tr key={redirect._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <code className="text-sm text-gray-900 bg-gray-100 px-2 py-1 rounded">
                            {redirect.sourceUrl}
                          </code>
                          <button
                            onClick={() => copyToClipboard(redirect.sourceUrl)}
                            className="ml-2 text-gray-400 hover:text-gray-600"
                          >
                            <FiCopy className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <code className="text-sm text-gray-900 bg-gray-100 px-2 py-1 rounded">
                            {redirect.targetUrl}
                          </code>
                          <button
                            onClick={() => copyToClipboard(redirect.targetUrl)}
                            className="ml-2 text-gray-400 hover:text-gray-600"
                          >
                            <FiCopy className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {redirect.statusCode}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(redirect.isActive)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {redirect.redirectCount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleToggle(redirect._id)}
                            className="text-indigo-600 hover:text-indigo-700"
                            title={
                              redirect.isActive ? "Deactivate" : "Activate"
                            }
                          >
                            {redirect.isActive ? (
                              <FiToggleRight className="w-5 h-5" />
                            ) : (
                              <FiToggleLeft className="w-5 h-5" />
                            )}
                          </button>
                          <button
                            onClick={() => handleOpenModal(redirect)}
                            className="text-indigo-600 hover:text-indigo-700"
                            title="Edit"
                          >
                            <FiEdit className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(redirect._id)}
                            className="text-red-600 hover:text-red-700"
                            title="Delete"
                          >
                            <FiTrash2 className="w-5 h-5" />
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

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">
                    {editingRedirect ? "Edit Redirect" : "Create Redirect"}
                  </h3>
                  <button
                    onClick={handleCloseModal}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <FiX className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Source URL *
                    </label>
                    <input
                      type="text"
                      value={formData.sourceUrl}
                      onChange={(e) =>
                        setFormData({ ...formData, sourceUrl: e.target.value })
                      }
                      placeholder="/old-path or https://www.eklabya.com/old-path"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      The path to redirect from (e.g., /old-page). Full URLs
                      will be automatically converted to paths.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Target URL *
                    </label>
                    <input
                      type="text"
                      value={formData.targetUrl}
                      onChange={(e) =>
                        setFormData({ ...formData, targetUrl: e.target.value })
                      }
                      placeholder="/new-path or https://example.com/new-path"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      The path or full URL to redirect to (relative paths will
                      use current domain)
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status Code
                    </label>
                    <select
                      value={formData.statusCode}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          statusCode: parseInt(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value={301}>301 - Permanent Redirect</option>
                      <option value={302}>302 - Found (Temporary)</option>
                      <option value={307}>307 - Temporary Redirect</option>
                      <option value={308}>308 - Permanent Redirect</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                      placeholder="Optional description for this redirect"
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={handleCloseModal}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                    >
                      {editingRedirect ? "Update" : "Create"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RedirectManagement;
