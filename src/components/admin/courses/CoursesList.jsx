import React, { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import {
  FaSearch,
  FaEdit,
  FaTrash,
  FaFilePdf,
  FaDownload,
  FaPaperPlane,
} from "react-icons/fa";
import { getCourses, getCategoriesForForm } from "../../../api/courseApi";
import api from "../../../api/axios";
import SendCoursePdfModal from "./SendCoursePdfModal";

const CoursesList = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [showHomeFilter, setShowHomeFilter] = useState("all");

  // Search States
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const searchTimerRef = useRef(null); // Use ref for timer to avoid re-renders

  const [generatingPdf, setGeneratingPdf] = useState(null);
  const [deletingPdf, setDeletingPdf] = useState(null);
  const [showSendPdfModal, setShowSendPdfModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [togglingStatus, setTogglingStatus] = useState(null);

  const [pdfUrls, setPdfUrls] = useState(() => {
    const saved = localStorage.getItem("pdfUrls");
    return saved ? JSON.parse(saved) : {};
  });

  // 1. Improved Debounce Logic
  useEffect(() => {
    // Clear existing timer
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);

    // Set new timer
    searchTimerRef.current = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => clearTimeout(searchTimerRef.current);
  }, [searchTerm]);

  // 2. Fetch Logic
  const fetchCourses = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        category: selectedCategory || undefined,
        search: debouncedSearchTerm || undefined,
        showOnHome:
          showHomeFilter !== "all"
            ? showHomeFilter === "yes"
              ? "true"
              : "false"
            : undefined,
        all: "true",
      };

      Object.keys(params).forEach(
        (key) => params[key] === undefined && delete params[key],
      );
      const response = await getCourses(
        new URLSearchParams(params).toString(),
        true,
      );

      let data = Array.isArray(response) ? response : response?.data || [];
      if (!Array.isArray(data)) data = Object.values(data);
      setCourses(data);
    } catch (error) {
      toast.error("Failed to load courses");
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, debouncedSearchTerm, showHomeFilter]);

  useEffect(() => {
    const loadCategories = async () => {
      const data = await getCategoriesForForm();
      setCategories(data);
    };
    loadCategories();
  }, []);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  useEffect(() => {
    localStorage.setItem("pdfUrls", JSON.stringify(pdfUrls));
  }, [pdfUrls]);

  // UI Handlers
  const handleGeneratePdf = async (course) => {
    try {
      setGeneratingPdf(course._id);
      const { data } = await api.post(`/courses/${course._id}/generate-pdf`);
      setPdfUrls((prev) => ({
        ...prev,
        [course._id]: { url: data.fileUrl, filename: data.filename },
      }));
      toast.success("PDF Generated");
    } catch (error) {
      toast.error("Generation failed");
    } finally {
      setGeneratingPdf(null);
    }
  };

  const handleDeletePdf = async (course) => {
    if (!window.confirm("Delete this PDF?")) return;
    try {
      setDeletingPdf(course._id);
      await api.delete(`/courses/${course._id}/pdf`, {
        data: { fileUrl: pdfUrls[course._id]?.url },
      });
      setPdfUrls((prev) => {
        const next = { ...prev };
        delete next[course._id];
        return next;
      });
      toast.success("PDF Deleted");
    } catch (error) {
      toast.error("Delete failed");
    } finally {
      setDeletingPdf(null);
    }
  };

  const handleTogglePublishStatus = async (course) => {
    const newStatus = !course.isPublished;
    const action = newStatus ? "publish" : "unpublish";

    try {
      setTogglingStatus(course._id);
      await api.patch(`/courses/${course._id}/publish`, {
        isPublished: newStatus,
      });

      // Update local state
      setCourses(
        courses.map((c) =>
          c._id === course._id ? { ...c, isPublished: newStatus } : c,
        ),
      );

      toast.success(
        `Course ${newStatus ? "published" : "unpublished"} successfully`,
      );
    } catch (error) {
      toast.error(`Failed to ${action} course`);
    } finally {
      setTogglingStatus(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Courses List</h1>
          <p className="text-[11px] text-gray-500 uppercase tracking-wider">
            Manage your content
          </p>
        </div>
        <Link
          to="new"
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1.5 rounded text-sm font-semibold transition shadow-sm"
        >
          + Add New
        </Link>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-2.5 rounded-md border border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 shadow-sm">
        <div className="">
          <label className="text-[10px] font-bold text-gray-800 uppercase ml-1">
            Search Database
          </label>
          <div className="relative mt-0.5">
            <FaSearch className="absolute left-2.5 top-2.5 text-gray-400 text-[10px]" />
            <input
              className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded focus:border-indigo-400 outline-none transition-all"
              placeholder="Search by title or level..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onBlur={() => setDebouncedSearchTerm(searchTerm)} // Immediate search on blur
            />
          </div>
        </div>

        <div className="">
          <label className="text-[10px] font-bold text-gray-800 uppercase ml-1">
            Category
          </label>
          <select
            className="w-full mt-0.5 py-1.5 px-2 text-sm border border-gray-200 rounded outline-none text-gray-800 bg-gray-200 focus:bg-white"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        <div className="">
          <label className="text-[10px] font-bold text-gray-800 uppercase ml-1">
            Home Feed
          </label>
          <select
            className="w-full mt-0.5 py-1.5 px-2 text-sm border border-gray-200 rounded outline-none text-gray-800 bg-gray-200"
            value={showHomeFilter}
            onChange={(e) => setShowHomeFilter(e.target.value)}
          >
            <option value="all">All</option>
            <option value="yes">Visible</option>
            <option value="no">Hidden</option>
          </select>
        </div>
      </div>

      {/* Main Table */}
      <div className="border border-gray-200 rounded-md bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="h-32 flex items-center justify-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-[10px] font-bold text-gray-400 uppercase">
                  Course Info
                </th>
                <th className="px-3 py-2 text-left text-[10px] font-bold text-gray-400 uppercase">
                  Category
                </th>
                <th className="px-3 py-2 text-left text-[10px] font-bold text-gray-400 uppercase">
                  Price
                </th>
                <th className="px-3 py-2 text-left text-[10px] font-bold text-gray-400 uppercase">
                  Status
                </th>
                <th className="px-4 py-2 text-right text-[10px] font-bold text-gray-400 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {courses.length === 0 ? (
                <tr>
                  <td
                    colSpan="5"
                    className="py-10 text-center text-xs text-gray-400 uppercase tracking-widest"
                  >
                    No matching results
                  </td>
                </tr>
              ) : (
                courses.map((course) => (
                  <tr
                    key={course._id}
                    className="hover:bg-indigo-50/30 transition-colors"
                  >
                    <td className="px-4 py-2 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-800">
                        {course.title}
                      </div>
                      <div className="text-[10px] text-gray-400 uppercase font-medium">
                        {course.level}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-600">
                      {course.category?.name || "—"}
                    </td>
                    <td className="px-3 py-2 text-xs font-mono text-gray-700">
                      ₹{course.price?.toLocaleString()}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <button
                        onClick={() => handleTogglePublishStatus(course)}
                        disabled={togglingStatus === course._id}
                        className={`px-2 py-0.5 rounded-sm text-[9px] font-bold uppercase tracking-tighter cursor-pointer transition-all hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed ${
                          course.isPublished
                            ? "bg-green-100 text-green-700 border border-green-200"
                            : "bg-orange-100 text-orange-700 border border-orange-200"
                        }`}
                      >
                        {togglingStatus === course._id ? (
                          <span className="flex items-center gap-1">
                            <div className="h-2 w-2 animate-spin border-2 border-current border-t-transparent rounded-full" />
                            Updating...
                          </span>
                        ) : course.isPublished ? (
                          "Published"
                        ) : (
                          "Draft"
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-2 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end space-x-1">
                        <Link
                          to={`/admin/courses/${course._id}/edit`}
                          className="p-1.5 text-blue-500 hover:bg-white border border-transparent hover:border-blue-100 rounded shadow-sm"
                          title="Edit"
                        >
                          <FaEdit size={12} />
                        </Link>
                        <button
                          onClick={() => {
                            setSelectedCourse(course);
                            setShowSendPdfModal(true);
                          }}
                          className="p-1.5 text-emerald-500 hover:bg-white border border-transparent hover:border-emerald-100 rounded shadow-sm"
                        >
                          <FaPaperPlane size={12} />
                        </button>
                        {pdfUrls[course._id] ? (
                          <>
                            <a
                              href={pdfUrls[course._id].url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 text-indigo-500 hover:bg-white border border-transparent hover:border-indigo-100 rounded shadow-sm"
                            >
                              <FaDownload size={12} />
                            </a>
                            <button
                              onClick={() => handleDeletePdf(course)}
                              disabled={deletingPdf === course._id}
                              className="p-1.5 text-red-500 hover:bg-white border border-transparent hover:border-red-100 rounded shadow-sm"
                            >
                              {deletingPdf === course._id ? (
                                <div className="h-3 w-3 animate-spin border-2 border-red-500 border-t-transparent rounded-full" />
                              ) : (
                                <FaTrash size={12} />
                              )}
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => handleGeneratePdf(course)}
                            disabled={generatingPdf === course._id}
                            className="p-1.5 text-gray-400 hover:bg-white border border-transparent hover:border-gray-200 rounded shadow-sm"
                          >
                            {generatingPdf === course._id ? (
                              <div className="h-3 w-3 animate-spin border-2 border-indigo-500 border-t-transparent rounded-full" />
                            ) : (
                              <FaFilePdf size={12} />
                            )}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {selectedCourse && (
        <SendCoursePdfModal
          course={selectedCourse}
          isOpen={showSendPdfModal}
          onClose={() => {
            setShowSendPdfModal(false);
            setSelectedCourse(null);
          }}
          onSuccess={fetchCourses}
        />
      )}
    </div>
  );
};

export default CoursesList;
