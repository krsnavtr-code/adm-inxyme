import React, { useState, useEffect, useMemo } from "react";
import {
  Star,
  Plus,
  Trash2,
  Edit3,
  ExternalLink,
  Search,
  BookOpen,
  MessageSquare,
  Sparkles,
  Info,
  Check,
  AlertCircle,
  X,
} from "lucide-react";
import {
  FaGoogle,
  FaFacebookF,
  FaInstagram,
  FaStar as FaStarSolid,
  FaQuoteLeft,
} from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import toast from "react-hot-toast";
import {
  getCourses,
  getCourseTestimonials,
  addCourseTestimonial,
  updateCourseTestimonial,
  deleteCourseTestimonial,
} from "../../api/courseApi";

const PLATFORMS = [
  {
    key: "google",
    label: "Google",
    icon: FaGoogle,
    color: "text-red-500",
    border: "border-t-red-500",
    bg: "bg-red-50 text-red-600 border-red-200",
    badgeBg: "bg-red-50",
  },
  {
    key: "facebook",
    label: "Facebook",
    icon: FaFacebookF,
    color: "text-blue-600",
    border: "border-t-blue-600",
    bg: "bg-blue-50 text-blue-600 border-blue-200",
    badgeBg: "bg-blue-50",
  },
  {
    key: "x",
    label: "X (Twitter)",
    icon: FaXTwitter,
    color: "text-slate-900",
    border: "border-t-slate-900",
    bg: "bg-slate-100 text-slate-900 border-slate-300",
    badgeBg: "bg-slate-100",
  },
  {
    key: "instagram",
    label: "Instagram",
    icon: FaInstagram,
    color: "text-pink-500",
    border: "border-t-pink-500",
    bg: "bg-pink-50 text-pink-600 border-pink-200",
    badgeBg: "bg-pink-50",
  },
];

const DATE_PRESETS = [
  "Just now",
  "3 days ago",
  "1 week ago",
  "2 weeks ago",
  "1 month ago",
  "2 months ago",
  "3 months ago",
  "6 months ago",
];

const CourseTestimonials = () => {
  const [courses, setCourses] = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [courseSearch, setCourseSearch] = useState("");

  const [testimonials, setTestimonials] = useState([]);
  const [loadingTestimonials, setLoadingTestimonials] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    platform: "google",
    rating: 5,
    text: "",
    date: "1 month ago",
  });

  // Delete Confirm State
  const [deletingId, setDeletingId] = useState(null);

  // Fetch courses on mount
  useEffect(() => {
    fetchCoursesList();
  }, []);

  const fetchCoursesList = async () => {
    setCoursesLoading(true);
    try {
      const data = await getCourses("", true);
      const list = Array.isArray(data) ? data : [];
      setCourses(list);
      if (list.length > 0 && !selectedCourseId) {
        setSelectedCourseId(list[0]._id);
      }
    } catch (err) {
      console.error("Failed to load courses:", err);
      toast.error("Failed to load courses list");
    } finally {
      setCoursesLoading(false);
    }
  };

  // Fetch testimonials when selected course changes
  useEffect(() => {
    if (selectedCourseId) {
      loadCourseTestimonials(selectedCourseId);
    } else {
      setTestimonials([]);
    }
  }, [selectedCourseId]);

  const loadCourseTestimonials = async (courseId) => {
    setLoadingTestimonials(true);
    try {
      const res = await getCourseTestimonials(courseId);
      const items = res.data || [];
      setTestimonials(items);
    } catch (err) {
      console.error("Failed to load testimonials:", err);
      toast.error("Failed to load course testimonials");
      setTestimonials([]);
    } finally {
      setLoadingTestimonials(false);
    }
  };

  const selectedCourse = useMemo(() => {
    return courses.find((c) => c._id === selectedCourseId) || null;
  }, [courses, selectedCourseId]);

  const filteredCourses = useMemo(() => {
    if (!courseSearch.trim()) return courses;
    const q = courseSearch.toLowerCase();
    return courses.filter(
      (c) =>
        c.title?.toLowerCase().includes(q) ||
        c.category?.name?.toLowerCase().includes(q),
    );
  }, [courses, courseSearch]);

  const stats = useMemo(() => {
    const total = testimonials.length;
    if (total === 0) return { total: 0, avgRating: "0.0", platformCounts: {} };
    const sum = testimonials.reduce((acc, t) => acc + (Number(t.rating) || 5), 0);
    const avg = (sum / total).toFixed(1);

    const counts = {};
    testimonials.forEach((t) => {
      const p = t.platform || "google";
      counts[p] = (counts[p] || 0) + 1;
    });

    return { total, avgRating: avg, platformCounts: counts };
  }, [testimonials]);

  // Open Modal for New
  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      name: "",
      platform: "google",
      rating: 5,
      text: "",
      date: "1 month ago",
    });
    setIsModalOpen(true);
  };

  // Open Modal for Edit
  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name || "",
      platform: item.platform || "google",
      rating: item.rating || 5,
      text: item.text || "",
      date: item.date || "1 month ago",
    });
    setIsModalOpen(true);
  };

  // Submit Add / Edit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Please enter student name");
      return;
    }
    if (!formData.text.trim()) {
      toast.error("Please enter review text");
      return;
    }

    setSubmitting(true);
    try {
      if (editingItem) {
        const res = await updateCourseTestimonial(
          selectedCourseId,
          editingItem._id,
          formData,
        );
        toast.success("Testimonial updated successfully!");
        setTestimonials(res.data || []);
      } else {
        const res = await addCourseTestimonial(selectedCourseId, formData);
        toast.success("Testimonial added successfully!");
        setTestimonials(res.data || []);
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error("Save testimonial error:", err);
      toast.error(err.response?.data?.message || "Failed to save testimonial");
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Testimonial
  const handleDelete = async (testimonialId) => {
    if (!window.confirm("Are you sure you want to delete this testimonial?")) {
      return;
    }

    setDeletingId(testimonialId);
    try {
      const res = await deleteCourseTestimonial(selectedCourseId, testimonialId);
      toast.success("Testimonial deleted successfully!");
      setTestimonials(res.data || []);
    } catch (err) {
      console.error("Delete testimonial error:", err);
      toast.error(err.response?.data?.message || "Failed to delete testimonial");
    } finally {
      setDeletingId(null);
    }
  };

  // Dynamic width helper for preview
  const getCardWidthBadge = (textLen) => {
    if (textLen > 220) return { label: "Long (500px wide)", color: "text-purple-600 bg-purple-50" };
    if (textLen > 120) return { label: "Medium (400px wide)", color: "text-blue-600 bg-blue-50" };
    return { label: "Compact (300px wide)", color: "text-emerald-600 bg-emerald-50" };
  };

  const previewConfig = PLATFORMS.find((p) => p.key === formData.platform) || PLATFORMS[0];
  const PreviewIcon = previewConfig.icon;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <MessageSquare className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold text-slate-900">
              Course Testimonials
            </h1>
          </div>
          <p className="text-sm text-slate-500">
            Manage the dynamic &ldquo;What Our Students Say&rdquo; testimonials
            for each course detail page.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          disabled={!selectedCourseId}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow"
        >
          <Plus className="w-4 h-4" />
          Add Testimonial
        </button>
      </div>

      {/* Course Selection & Overview Bar */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          {/* Course Dropdown */}
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              Select Course to Manage Testimonials
            </label>
            {coursesLoading ? (
              <div className="h-10 bg-slate-100 animate-pulse rounded-xl" />
            ) : (
              <div className="relative">
                <select
                  value={selectedCourseId}
                  onChange={(e) => setSelectedCourseId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                >
                  {courses.map((course) => (
                    <option key={course._id} value={course._id}>
                      {course.title}{" "}
                      {course.isPublished ? "(Published)" : "(Draft)"}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Quick Stats / View on Website */}
          <div className="flex items-center justify-between md:justify-end gap-3">
            {selectedCourse?.slug && (
              <a
                href={`https://www.inxyme.com/course/${selectedCourse.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors border border-indigo-200"
              >
                <span>View Live Course</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>

        {/* Selected Course Quick Info & Stats */}
        {selectedCourse && (
          <div className="pt-4 border-t border-slate-100 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-xs text-slate-500 font-medium">
                Active Testimonials
              </span>
              <div className="text-xl font-bold text-slate-800 mt-0.5">
                {stats.total}
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-xs text-slate-500 font-medium">
                Average Rating
              </span>
              <div className="flex items-center gap-1.5 text-xl font-bold text-slate-800 mt-0.5">
                <span>{stats.avgRating}</span>
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-xs text-slate-500 font-medium">
                Course Status
              </span>
              <div className="mt-1">
                <span
                  className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    selectedCourse.isPublished
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-amber-50 text-amber-700 border border-amber-200"
                  }`}
                >
                  {selectedCourse.isPublished ? "Published" : "Draft"}
                </span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-xs text-slate-500 font-medium">
                Platforms Used
              </span>
              <div className="flex items-center gap-1.5 mt-1 text-xs font-semibold text-slate-700">
                {PLATFORMS.map((p) => {
                  const count = stats.platformCounts[p.key] || 0;
                  if (count === 0) return null;
                  const Icon = p.icon;
                  return (
                    <span
                      key={p.key}
                      title={`${count} on ${p.label}`}
                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-700"
                    >
                      <Icon className={`w-3 h-3 ${p.color}`} />
                      <span>{count}</span>
                    </span>
                  );
                })}
                {stats.total === 0 && (
                  <span className="text-slate-400 font-normal">None yet</span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      {loadingTestimonials ? (
        <div className="bg-white p-12 rounded-2xl shadow-sm border border-slate-200 text-center">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-500">
            Loading testimonials for {selectedCourse?.title}...
          </p>
        </div>
      ) : testimonials.length === 0 ? (
        /* Empty State */
        <div className="bg-white p-12 rounded-2xl shadow-sm border border-slate-200 text-center space-y-4">
          <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto">
            <Sparkles className="w-7 h-7" />
          </div>
          <div className="max-w-md mx-auto">
            <h3 className="text-lg font-bold text-slate-800">
              No Custom Testimonials for this Course
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              Currently, the course detail page displays the default verified
              testimonials. Once you add custom testimonials here, they will
              dynamically appear on this course&apos;s page!
            </p>
          </div>
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            Add First Testimonial
          </button>
        </div>
      ) : (
        /* Testimonials Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((item) => {
            const platformConfig =
              PLATFORMS.find((p) => p.key === item.platform) || PLATFORMS[0];
            const PlatformIcon = platformConfig.icon;
            const textLen = item.text?.length || 0;
            const widthInfo = getCardWidthBadge(textLen);

            return (
              <div
                key={item._id}
                className={`bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between relative group hover:shadow-md transition-shadow border-t-4 ${platformConfig.border}`}
              >
                {/* Top Badge & Actions */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${platformConfig.bg}`}
                    >
                      <PlatformIcon className="w-3 h-3" />
                      {platformConfig.label}
                    </span>

                    <div className="flex items-center gap-1 opacity-90 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Edit testimonial"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(item._id)}
                        disabled={deletingId === item._id}
                        className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete testimonial"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Rating & Date */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <FaStarSolid
                          key={i}
                          className={`w-3.5 h-3.5 ${
                            i < item.rating
                              ? "text-amber-400"
                              : "text-slate-200"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-slate-400 font-medium">
                      {item.date || "Recently"}
                    </span>
                  </div>

                  {/* Review Text */}
                  <p className="text-sm text-slate-700 leading-relaxed mb-4">
                    &ldquo;{item.text}&rdquo;
                  </p>
                </div>

                {/* Bottom Footer: Student Initials & Name */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between mt-auto">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shadow-xs">
                      {item.name
                        ? item.name
                            .split(" ")
                            .filter(Boolean)
                            .map((n) => n[0])
                            .join("")
                            .slice(0, 2)
                            .toUpperCase()
                        : "IN"}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">
                        {item.name}
                      </h4>
                      <p className="text-[10px] text-slate-400">
                        Inxyme Verified Learner
                      </p>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${widthInfo.color}`}
                  >
                    {widthInfo.label.split(" ")[0]}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Testimonial Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 md:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  {editingItem ? (
                    <Edit3 className="w-5 h-5" />
                  ) : (
                    <Plus className="w-5 h-5" />
                  )}
                </span>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    {editingItem
                      ? "Edit Student Testimonial"
                      : "Add Student Testimonial"}
                  </h2>
                  <p className="text-xs text-slate-500">
                    For course:{" "}
                    <span className="font-semibold text-slate-700">
                      {selectedCourse?.title}
                    </span>
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Student Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Student Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Vaibhav Thakur"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Review Platform Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Review Platform <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {PLATFORMS.map((p) => {
                    const Icon = p.icon;
                    const isSelected = formData.platform === p.key;
                    return (
                      <button
                        type="button"
                        key={p.key}
                        onClick={() =>
                          setFormData({ ...formData, platform: p.key })
                        }
                        className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                          isSelected
                            ? `${p.bg} ring-2 ring-indigo-500 shadow-xs font-bold`
                            : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        <Icon className={`w-3.5 h-3.5 ${p.color}`} />
                        <span>{p.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Star Rating & Relative Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Rating */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Rating ({formData.rating} Stars)
                  </label>
                  <div className="flex items-center gap-1.5 py-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() =>
                          setFormData({ ...formData, rating: star })
                        }
                        className="p-1 hover:scale-115 transition-transform"
                      >
                        <FaStarSolid
                          className={`w-6 h-6 ${
                            star <= formData.rating
                              ? "text-amber-400"
                              : "text-slate-200"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Relative Date */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Relative Date / Time
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 1 month ago"
                    value={formData.date}
                    onChange={(e) =>
                      setFormData({ ...formData, date: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-2"
                  />
                  {/* Preset chips */}
                  <div className="flex flex-wrap gap-1.5">
                    {DATE_PRESETS.map((preset) => (
                      <button
                        type="button"
                        key={preset}
                        onClick={() =>
                          setFormData({ ...formData, date: preset })
                        }
                        className={`text-[10px] px-2 py-0.5 rounded-md border transition-colors ${
                          formData.date === preset
                            ? "bg-indigo-50 text-indigo-600 border-indigo-200 font-semibold"
                            : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Review Text */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    Testimonial / Review Text{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <span className="text-xs text-slate-400">
                    {formData.text.length} characters •{" "}
                    <span className="font-medium text-slate-600">
                      {getCardWidthBadge(formData.text.length).label}
                    </span>
                  </span>
                </div>
                <textarea
                  required
                  rows={4}
                  placeholder="Paste or write the student's review quote here..."
                  value={formData.text}
                  onChange={(e) =>
                    setFormData({ ...formData, text: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed"
                />
              </div>

              {/* Live Preview Box */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Live Preview (As seen on website)
                </label>
                <div
                  className={`bg-white rounded-2xl border border-slate-200 shadow-md p-5 relative border-t-4 ${previewConfig.border}`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${previewConfig.bg}`}
                    >
                      <PreviewIcon className="w-3 h-3" />
                      {previewConfig.label}
                    </span>
                    <span className="text-xs text-slate-400">
                      {formData.date || "Recently"}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 mb-3">
                    {[...Array(5)].map((_, i) => (
                      <FaStarSolid
                        key={i}
                        className={`w-3.5 h-3.5 ${
                          i < formData.rating
                            ? "text-amber-400"
                            : "text-slate-200"
                        }`}
                      />
                    ))}
                  </div>

                  <p className="text-sm text-slate-700 leading-relaxed mb-4 italic">
                    &ldquo;
                    {formData.text ||
                      "Your review quote will appear here in the live website card..."}
                    &rdquo;
                  </p>

                  <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shadow-xs">
                      {formData.name
                        ? formData.name
                            .split(" ")
                            .filter(Boolean)
                            .map((n) => n[0])
                            .join("")
                            .slice(0, 2)
                            .toUpperCase()
                        : "IN"}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">
                        {formData.name || "Student Name"}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        Inxyme Verified Learner
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 text-slate-600 hover:text-slate-800 font-medium text-sm rounded-xl hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-xl shadow-sm transition-all disabled:opacity-50"
                >
                  {submitting
                    ? "Saving..."
                    : editingItem
                    ? "Update Testimonial"
                    : "Add Testimonial"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseTestimonials;

