import React, { useState, useEffect, useMemo } from "react";
import {
  Star,
  CheckCircle,
  XCircle,
  Clock,
  Trash2,
  Share2,
  Copy,
  ExternalLink,
  MessageCircle,
  Search,
  Filter,
  RefreshCw,
  Sparkles,
  BookOpen,
  User,
  Phone,
  Mail,
  Award,
  AlertCircle,
  Check,
  Video,
  Play,
  FileText,
  Film,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import * as reviewApi from "../../api/reviewApi";

const ReviewsPage = () => {
  const [reviews, setReviews] = useState([]);
  const [courses, setCourses] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    textCount: 0,
    videoCount: 0,
    averageRating: 0,
  });

  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Filters & Pagination
  const [activeTab, setActiveTab] = useState("all"); // 'all' | 'pending' | 'approved' | 'rejected'
  const [selectedCourseFilter, setSelectedCourseFilter] = useState("");
  const [selectedRatingFilter, setSelectedRatingFilter] = useState("");
  const [selectedTypeFilter, setSelectedTypeFilter] = useState("all"); // 'all' | 'text' | 'video'
  const [searchQuery, setSearchQuery] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 1,
  });

  // Share Link Generator State
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedVideoLink, setCopiedVideoLink] = useState(false);

  // Modal State for Note / Details
  const [selectedReview, setSelectedReview] = useState(null);
  const [adminNoteInput, setAdminNoteInput] = useState("");
  const [noteModalOpen, setNoteModalOpen] = useState(false);

  // Video Player Modal State
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [activeVideoReview, setActiveVideoReview] = useState(null);
  const [videoError, setVideoError] = useState(false);

  // Determine Website Base URL for student share links
  const siteBaseUrl = useMemo(() => {
    if (typeof window !== "undefined") {
      const isLocal =
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1";
      return isLocal ? "http://localhost:3000" : "https://www.inxyme.com";
    }
    return "https://www.inxyme.com";
  }, []);

  // Universal student review links
  const generalShareLink = useMemo(() => {
    return `${siteBaseUrl}/review`;
  }, [siteBaseUrl]);

  const videoShareLink = useMemo(() => {
    return `${siteBaseUrl}/review?type=video`;
  }, [siteBaseUrl]);

  // Construct absolute video URL
  const getVideoUrl = (url) => {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    const isLocal =
      typeof window !== "undefined" &&
      (window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1");

    let apiHost =
      import.meta.env.VITE_API_URL ||
      import.meta.env.VITE_API_BASE_URL ||
      (isLocal ? "http://localhost:4002" : "https://www.inxyme.com");

    apiHost = apiHost.replace(/\/api\/?$/, "").replace(/\/$/, "");
    return `${apiHost}${url.startsWith("/") ? "" : "/"}${url}`;
  };

  // Load Courses for dropdowns
  const fetchCourses = async () => {
    try {
      const res = await reviewApi.getReviewCourses();
      if (res?.success) {
        setCourses(res.data || []);
      }
    } catch (err) {
      console.error("Failed to load courses:", err);
    }
  };

  // Load Stats
  const fetchStats = async () => {
    try {
      const res = await reviewApi.getReviewStats();
      if (res?.success) {
        setStats(res.data);
      }
    } catch (err) {
      console.error("Failed to load stats:", err);
    }
  };

  // Load Reviews
  const fetchReviews = async (page = 1) => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: pagination.limit,
      };

      if (activeTab !== "all") {
        params.status = activeTab;
      }
      if (selectedCourseFilter) {
        params.courseId = selectedCourseFilter;
      }
      if (selectedRatingFilter) {
        params.rating = selectedRatingFilter;
      }
      if (selectedTypeFilter !== "all") {
        params.reviewType = selectedTypeFilter;
      }
      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }

      const res = await reviewApi.getAdminReviews(params);
      if (res?.success) {
        setReviews(res.data || []);
        if (res.pagination) {
          setPagination(res.pagination);
        }
      }
    } catch (err) {
      console.error("Failed to load reviews:", err);
      toast.error("Failed to load reviews");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
    fetchStats();
  }, []);

  useEffect(() => {
    fetchReviews(1);
  }, [
    activeTab,
    selectedCourseFilter,
    selectedRatingFilter,
    selectedTypeFilter,
    searchQuery,
  ]);

  // Handle Verify / Status update
  const handleUpdateStatus = async (id, newStatus, note = "") => {
    setActionLoadingId(id);
    try {
      const res = await reviewApi.updateReviewStatus(id, {
        status: newStatus,
        adminNote: note,
      });
      if (res?.success) {
        toast.success(
          newStatus === "approved"
            ? "Review verified and approved! 🎉"
            : newStatus === "rejected"
              ? "Review rejected"
              : "Review marked as pending"
        );
        fetchReviews(pagination.page);
        fetchStats();
        if (noteModalOpen) {
          setNoteModalOpen(false);
        }
        if (videoModalOpen && activeVideoReview?._id === id) {
          setActiveVideoReview((prev) =>
            prev ? { ...prev, status: newStatus } : null
          );
        }
      }
    } catch (err) {
      console.error("Error updating status:", err);
      toast.error(
        err?.response?.data?.message || "Failed to update review status"
      );
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handle Delete Review
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to permanently delete this review?")) {
      return;
    }
    setActionLoadingId(id);
    try {
      const res = await reviewApi.deleteReview(id);
      if (res?.success) {
        toast.success("Review deleted successfully");
        fetchReviews(pagination.page);
        fetchStats();
        if (videoModalOpen && activeVideoReview?._id === id) {
          setVideoModalOpen(false);
        }
      }
    } catch (err) {
      console.error("Error deleting review:", err);
      toast.error("Failed to delete review");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handle Copy General Link
  const handleCopyLink = () => {
    navigator.clipboard.writeText(generalShareLink);
    setCopiedLink(true);
    toast.success("Standard review link copied to clipboard!");
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Handle Copy Video Link
  const handleCopyVideoLink = () => {
    navigator.clipboard.writeText(videoShareLink);
    setCopiedVideoLink(true);
    toast.success("Direct Video Review link copied to clipboard!");
    setTimeout(() => setCopiedVideoLink(false), 2500);
  };

  // Handle WhatsApp Share
  const handleWhatsAppShare = (isVideo = false) => {
    const link = isVideo ? videoShareLink : generalShareLink;
    const text = encodeURIComponent(
      isVideo
        ? `Dear Student 🎓,\n\nPlease share your quick Video Review for Inxyme in just 1 click!\nYou can record directly or upload from your phone.\n\n👉 Record / Upload Video Review: ${link}\n\nYour feedback inspires thousands of future learners! Thank you.\nTeam Inxyme`
        : `Dear Student 🎓,\n\nPlease share your honest experience & review for Inxyme in just 1 click!\n\n👉 Give Review: ${link}\n\nYour feedback helps us continuously improve. Thank you!\nTeam Inxyme`
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Star className="w-7 h-7 text-amber-500 fill-amber-400" />
            Student Reviews & Verification
          </h1>
          <p className="text-gray-600 text-sm mt-1">
            Manage course reviews and video testimonials submitted by students, verify them for authenticity, and share 1-click links.
          </p>
        </div>
        <button
          onClick={() => {
            fetchStats();
            fetchReviews(pagination.page);
          }}
          className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 shadow-sm transition-all"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-indigo-600" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Share Link Tool Card */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/15 text-indigo-100 border border-white/20">
                <Share2 className="w-3.5 h-3.5" />
                Quick Student Share Link (Written & Video)
              </span>
              <h2 className="text-xl md:text-2xl font-bold tracking-tight">
                Send Review Links to Students (Max 2-3 Clicks)
              </h2>
              <p className="text-indigo-200 text-sm">
                Students can write a review or record/upload a video review directly from their mobile or laptop in seconds.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row items-stretch sm:items-center gap-2.5">
              {/* WhatsApp Video Review Share */}
              <button
                onClick={() => handleWhatsAppShare(true)}
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-medium shadow-lg hover:shadow-rose-500/25 transition-all text-xs sm:text-sm"
              >
                <Video className="w-4 h-4" />
                Share Video Review (WhatsApp)
              </button>

              {/* WhatsApp Standard Share */}
              <button
                onClick={() => handleWhatsAppShare(false)}
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-medium shadow-lg hover:shadow-emerald-500/25 transition-all text-xs sm:text-sm"
              >
                <MessageCircle className="w-4 h-4" />
                Share Standard (WhatsApp)
              </button>

              {/* Open Preview Button */}
              <a
                href={generalShareLink}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium border border-white/20 transition-all text-xs sm:text-sm"
              >
                <ExternalLink className="w-4 h-4" />
                Preview Form
              </a>
            </div>
          </div>

          {/* Quick Copy Link Row */}
          <div className="mt-5 pt-4 border-t border-white/15 grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Standard Review Link */}
            <div className="flex items-center bg-indigo-950/80 border border-white/20 rounded-lg p-1.5 text-xs">
              <span className="text-[11px] font-semibold text-indigo-300 px-2 whitespace-nowrap">
                Standard:
              </span>
              <span className="flex-1 truncate text-indigo-100 font-mono text-[11px]">
                {generalShareLink}
              </span>
              <button
                onClick={handleCopyLink}
                className="px-2.5 py-1 bg-white/15 hover:bg-white/25 rounded-md text-[11px] font-medium text-white transition-all flex items-center gap-1"
              >
                {copiedLink ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                {copiedLink ? "Copied" : "Copy"}
              </button>
            </div>

            {/* Direct Video Review Link */}
            <div className="flex items-center bg-indigo-950/80 border border-rose-400/30 rounded-lg p-1.5 text-xs">
              <span className="text-[11px] font-semibold text-rose-300 px-2 whitespace-nowrap flex items-center gap-1">
                <Video className="w-3 h-3 text-rose-400" /> Video Only:
              </span>
              <span className="flex-1 truncate text-indigo-100 font-mono text-[11px]">
                {videoShareLink}
              </span>
              <button
                onClick={handleCopyVideoLink}
                className="px-2.5 py-1 bg-rose-500/30 hover:bg-rose-500/50 rounded-md text-[11px] font-medium text-white transition-all flex items-center gap-1"
              >
                {copiedVideoLink ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                {copiedVideoLink ? "Copied" : "Copy"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Reviews */}
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              Total Reviews
            </p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
            <div className="flex items-center gap-2 mt-1 text-[11px] text-gray-500 font-medium">
              <span>✍️ {stats.textCount || 0} Written</span>
              <span>•</span>
              <span className="text-rose-600 font-semibold">🎥 {stats.videoCount || 0} Video</span>
            </div>
          </div>
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
            <BookOpen className="w-6 h-6" />
          </div>
        </div>

        {/* Pending Verification */}
        <div
          onClick={() => setActiveTab("pending")}
          className={`bg-white rounded-xl p-5 border cursor-pointer transition-all shadow-sm flex items-center justify-between ${activeTab === "pending"
              ? "border-amber-500 ring-2 ring-amber-200"
              : "border-gray-200 hover:border-amber-300"
            }`}
        >
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Pending Verification
              </p>
              {stats.pending > 0 && (
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                </span>
              )}
            </div>
            <p className="text-2xl font-bold text-amber-600 mt-1">{stats.pending}</p>
          </div>
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* Approved & Verified */}
        <div
          onClick={() => setActiveTab("approved")}
          className={`bg-white rounded-xl p-5 border cursor-pointer transition-all shadow-sm flex items-center justify-between ${activeTab === "approved"
              ? "border-emerald-500 ring-2 ring-emerald-200"
              : "border-gray-200 hover:border-emerald-300"
            }`}
        >
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              Approved & Verified
            </p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">{stats.approved}</p>
          </div>
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
            <CheckCircle className="w-6 h-6" />
          </div>
        </div>

        {/* Rejected */}
        <div
          onClick={() => setActiveTab("rejected")}
          className={`bg-white rounded-xl p-5 border cursor-pointer transition-all shadow-sm flex items-center justify-between ${activeTab === "rejected"
              ? "border-rose-500 ring-2 ring-rose-200"
              : "border-gray-200 hover:border-rose-300"
            }`}
        >
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              Rejected
            </p>
            <p className="text-2xl font-bold text-rose-600 mt-1">{stats.rejected}</p>
          </div>
          <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center">
            <XCircle className="w-6 h-6" />
          </div>
        </div>

        {/* Average Rating */}
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              Average Rating
            </p>
            <div className="flex items-center gap-1.5 mt-1">
              <p className="text-2xl font-bold text-gray-900">
                {stats.averageRating ? stats.averageRating.toFixed(1) : "0.0"}
              </p>
              <span className="text-xs text-gray-400">/ 5.0</span>
            </div>
          </div>
          <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center">
            <Star className="w-6 h-6 fill-amber-400" />
          </div>
        </div>
      </div>

      {/* Filter Tabs and Search Bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Status Tabs */}
          <div className="flex items-center gap-2 border-b lg:border-b-0 pb-3 lg:pb-0 overflow-x-auto">
            {[
              { id: "all", label: "All Reviews", count: stats.total },
              { id: "pending", label: "Pending", count: stats.pending, highlight: stats.pending > 0 },
              { id: "approved", label: "Approved", count: stats.approved },
              { id: "rejected", label: "Rejected", count: stats.rejected },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === tab.id
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-gray-600 hover:bg-gray-100"
                  }`}
              >
                {tab.label}
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${activeTab === tab.id
                      ? "bg-white/20 text-white"
                      : tab.highlight
                        ? "bg-amber-100 text-amber-800 font-bold"
                        : "bg-gray-100 text-gray-600"
                    }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full lg:w-72">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by student, course, text..."
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Secondary Filters */}
        <div className="pt-3 border-t border-gray-100 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Filter By:
            </span>
          </div>

          {/* Format / Type Filter */}
          <select
            value={selectedTypeFilter}
            onChange={(e) => setSelectedTypeFilter(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Formats (Written & Video)</option>
            <option value="video">🎥 Video Reviews Only</option>
            <option value="text">✍️ Written Reviews Only</option>
          </select>

          {/* Course filter */}
          <select
            value={selectedCourseFilter}
            onChange={(e) => setSelectedCourseFilter(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-medium text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Courses</option>
            {courses.map((c) => (
              <option key={c._id} value={c._id}>
                {c.title}
              </option>
            ))}
          </select>

          {/* Rating filter */}
          <select
            value={selectedRatingFilter}
            onChange={(e) => setSelectedRatingFilter(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-medium text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Star Ratings</option>
            <option value="5">⭐⭐⭐⭐⭐ 5 Stars</option>
            <option value="4">⭐⭐⭐⭐ 4 Stars</option>
            <option value="3">⭐⭐⭐ 3 Stars</option>
            <option value="2">⭐⭐ 2 Stars</option>
            <option value="1">⭐ 1 Star</option>
          </select>

          {(selectedCourseFilter ||
            selectedRatingFilter ||
            selectedTypeFilter !== "all" ||
            searchQuery) && (
              <button
                onClick={() => {
                  setSelectedCourseFilter("");
                  setSelectedRatingFilter("");
                  setSelectedTypeFilter("all");
                  setSearchQuery("");
                }}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium ml-auto"
              >
                Reset Filters
              </button>
            )}
        </div>
      </div>

      {/* Review List Section */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center bg-white rounded-xl border border-gray-200">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-600"></div>
          <p className="text-gray-500 text-sm mt-3">Loading student reviews...</p>
        </div>
      ) : reviews.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center bg-white rounded-xl border border-gray-200 text-center px-4">
          <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-500 mb-3">
            <Star className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">No Reviews Found</h3>
          <p className="text-gray-500 text-sm max-w-md mt-1">
            {activeTab === "pending"
              ? "All caught up! There are no pending reviews waiting for verification."
              : "No reviews match your selected filter criteria. Try clearing filters or sharing the link with students."}
          </p>
          <div className="mt-5 flex gap-2 justify-center">
            <button
              onClick={handleCopyLink}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium shadow-sm transition-all"
            >
              <Copy className="w-4 h-4" />
              Copy Review Link
            </button>
            <button
              onClick={handleCopyVideoLink}
              className="inline-flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-sm font-medium shadow-sm transition-all"
            >
              <Video className="w-4 h-4" />
              Copy Video Link
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {reviews.map((review) => {
            const isPending = review.status === "pending";
            const isApproved = review.status === "approved";
            const isRejected = review.status === "rejected";
            const isActionLoading = actionLoadingId === review._id;
            const isVideoReview = review.reviewType === "video";

            return (
              <div
                key={review._id}
                className={`bg-white rounded-2xl border transition-all shadow-sm hover:shadow-md flex flex-col justify-between overflow-hidden ${isPending
                    ? "border-amber-300 ring-1 ring-amber-100"
                    : isApproved
                      ? "border-emerald-200"
                      : "border-gray-200 opacity-80"
                  }`}
              >
                {/* Card Top */}
                <div className="p-5 space-y-3.5 flex-1">
                  {/* Status Banner / Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {review.studentPhoto ? (
                        <img
                          src={getVideoUrl(review.studentPhoto)}
                          alt={review.studentName}
                          className="w-10 h-10 rounded-full object-cover border-2 border-indigo-200 shadow-sm flex-shrink-0"
                        />
                      ) : (
                        <div
                          className={`w-10 h-10 rounded-full text-white font-bold flex items-center justify-center text-sm shadow-sm flex-shrink-0 ${isVideoReview
                              ? "bg-gradient-to-tr from-rose-500 to-purple-600"
                              : "bg-gradient-to-tr from-indigo-500 to-purple-600"
                            }`}
                        >
                          {review.studentName ? review.studentName.charAt(0).toUpperCase() : "S"}
                        </div>
                      )}
                      <div>
                        <h4 className="font-semibold text-gray-900 text-base leading-snug">
                          {review.studentName}
                        </h4>
                        <p className="text-xs text-gray-500">
                          {new Date(review.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>

                    {/* Status Pill */}
                    <div className="flex flex-col items-end gap-1">
                      {isApproved && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                          <CheckCircle className="w-3.5 h-3.5" />
                          Verified
                        </span>
                      )}
                      {isPending && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 animate-pulse">
                          <Clock className="w-3.5 h-3.5" />
                          Pending Review
                        </span>
                      )}
                      {isRejected && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800">
                          <XCircle className="w-3.5 h-3.5" />
                          Rejected
                        </span>
                      )}

                      {/* Format Badge */}
                      {isVideoReview ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          <Video className="w-3 h-3 text-rose-600" /> Video
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                          <FileText className="w-3 h-3" /> Written
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Course Name */}
                  <div className="bg-slate-50 border border-slate-100 rounded-lg p-2.5 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                    <span className="text-xs font-medium text-slate-800 truncate">
                      {review.courseName || review.course?.title || "Inxyme Course"}
                    </span>
                  </div>

                  {/* Star Rating Display */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-4 h-4 ${star <= review.rating
                              ? "text-amber-400 fill-amber-400"
                              : "text-gray-200 fill-gray-100"
                            }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs font-bold text-gray-700">
                      {review.rating}.0 / 5.0
                    </span>
                  </div>

                  {/* VIDEO PREVIEW BOX IF VIDEO REVIEW */}
                  {isVideoReview && review.videoUrl && (
                    <div
                      onClick={() => {
                        setVideoError(false);
                        setActiveVideoReview(review);
                        setVideoModalOpen(true);
                      }}
                      className="relative rounded-xl overflow-hidden bg-slate-950 aspect-video border border-slate-300 group cursor-pointer shadow-sm hover:ring-2 hover:ring-rose-500 transition-all"
                    >
                      <video
                        src={getVideoUrl(review.videoUrl)}
                        className="w-full h-full object-cover opacity-85 group-hover:opacity-100 transition-opacity"
                        preload="metadata"
                      />
                      <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 flex items-center justify-center transition-all">
                        <div className="w-12 h-12 rounded-full bg-white text-rose-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                          <Play className="w-5 h-5 fill-rose-600 ml-0.5" />
                        </div>
                      </div>
                      <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-white text-[10px] font-semibold bg-black/70 px-2 py-1 rounded-md backdrop-blur-xs">
                        <span className="flex items-center gap-1">
                          <Film className="w-3 h-3 text-rose-400" /> Watch Student Video
                        </span>
                        {review.videoDuration > 0 && (
                          <span>
                            {Math.floor(review.videoDuration / 60)}:
                            {(review.videoDuration % 60).toString().padStart(2, "0")}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Tags / Highlights */}
                  {review.tags && review.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {review.tags.map((tag, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-100"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Student Review Feedback Text */}
                  {review.reviewText && (
                    <div className="relative pl-3 border-l-2 border-indigo-200 text-gray-700 text-sm italic bg-slate-50/50 p-2.5 rounded-r-lg">
                      "{review.reviewText}"
                    </div>
                  )}

                  {/* Student Contact Info if available */}
                  {(review.studentPhone || review.studentEmail) && (
                    <div className="text-xs text-gray-500 pt-1 border-t border-gray-100 flex flex-wrap gap-x-4 gap-y-1">
                      {review.studentPhone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-gray-400" />
                          {review.studentPhone}
                        </span>
                      )}
                      {review.studentEmail && (
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3 text-gray-400" />
                          {review.studentEmail}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Admin Note if any */}
                  {review.adminNote && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 text-xs text-amber-900">
                      <span className="font-semibold">Admin Note: </span>
                      {review.adminNote}
                    </div>
                  )}
                </div>

                {/* Card Bottom / Actions */}
                <div className="px-5 py-3.5 bg-gray-50/80 border-t border-gray-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {/* Approve / Verify Button */}
                    {!isApproved && (
                      <button
                        disabled={isActionLoading}
                        onClick={() => handleUpdateStatus(review._id, "approved")}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        Verify & Approve
                      </button>
                    )}

                    {/* Reject Button */}
                    {!isRejected && (
                      <button
                        disabled={isActionLoading}
                        onClick={() => handleUpdateStatus(review._id, "rejected")}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 rounded-lg text-xs font-medium transition-all disabled:opacity-50"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        Reject
                      </button>
                    )}

                    {/* Set to Pending if approved or rejected */}
                    {!isPending && (
                      <button
                        disabled={isActionLoading}
                        onClick={() => handleUpdateStatus(review._id, "pending")}
                        className="text-xs text-gray-500 hover:text-gray-800 font-medium px-2 py-1"
                      >
                        Set to Pending
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    {/* If video review, quick play button */}
                    {isVideoReview && review.videoUrl && (
                      <button
                        onClick={() => {
                          setActiveVideoReview(review);
                          setVideoModalOpen(true);
                        }}
                        title="Watch Video Review"
                        className="p-1.5 text-rose-600 hover:text-rose-700 rounded-lg hover:bg-rose-50 transition-colors"
                      >
                        <Play className="w-4 h-4 fill-rose-600" />
                      </button>
                    )}

                    {/* Note button */}
                    <button
                      onClick={() => {
                        setSelectedReview(review);
                        setAdminNoteInput(review.adminNote || "");
                        setNoteModalOpen(true);
                      }}
                      title="Add or Edit Admin Note"
                      className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <Sparkles className="w-4 h-4" />
                    </button>

                    {/* Delete button */}
                    <button
                      disabled={isActionLoading}
                      onClick={() => handleDelete(review._id)}
                      title="Delete Review"
                      className="p-1.5 text-gray-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between bg-white px-4 py-3 border border-gray-200 rounded-xl">
          <p className="text-sm text-gray-600">
            Showing Page <span className="font-semibold">{pagination.page}</span> of{" "}
            <span className="font-semibold">{pagination.totalPages}</span> ({pagination.total} Total)
          </p>
          <div className="flex items-center gap-2">
            <button
              disabled={pagination.page <= 1 || loading}
              onClick={() => fetchReviews(pagination.page - 1)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              disabled={pagination.page >= pagination.totalPages || loading}
              onClick={() => fetchReviews(pagination.page + 1)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Admin Note Modal */}
      {noteModalOpen && selectedReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">
                Admin Note for {selectedReview.studentName}
              </h3>
              <button
                onClick={() => setNoteModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-lg"
              >
                ✕
              </button>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Internal Note (only visible to admin staff):
              </label>
              <textarea
                value={adminNoteInput}
                onChange={(e) => setAdminNoteInput(e.target.value)}
                rows={4}
                placeholder="e.g. Verified via WhatsApp call, enrolled in batch #4..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setNoteModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  handleUpdateStatus(selectedReview._id, selectedReview.status, adminNoteInput)
                }
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold shadow-sm"
              >
                Save Note
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Video Player Modal */}
      {videoModalOpen && activeVideoReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center font-bold text-sm">
                  {activeVideoReview.studentName?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm sm:text-base leading-snug">
                    {activeVideoReview.studentName} — Video Review
                  </h3>
                  <p className="text-xs text-gray-500">
                    {activeVideoReview.courseName || "Inxyme Course"} • Rating: ⭐ {activeVideoReview.rating}/5
                  </p>
                </div>
              </div>

              <button
                onClick={() => setVideoModalOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Video Player Area */}
            <div className="bg-black min-h-[300px] max-h-[520px] aspect-video flex items-center justify-center relative overflow-hidden">
              {videoError ? (
                <div className="text-center p-6 text-white space-y-3">
                  <AlertCircle className="w-10 h-10 text-amber-400 mx-auto" />
                  <p className="text-sm font-semibold text-gray-200">
                    Video file could not be loaded or played.
                  </p>
                  <p className="text-xs text-gray-400 max-w-sm mx-auto font-mono break-all">
                    {getVideoUrl(activeVideoReview.videoUrl)}
                  </p>
                  <div className="flex items-center justify-center gap-3 pt-2">
                    <a
                      href={getVideoUrl(activeVideoReview.videoUrl)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-all"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Open Direct Link
                    </a>
                    <button
                      type="button"
                      onClick={() => {
                        setVideoError(false);
                        const v = document.getElementById("admin-review-video-player");
                        if (v) {
                          v.load();
                          v.play().catch(() => { });
                        }
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-white text-xs font-medium border border-gray-700 transition-all"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Retry
                    </button>
                  </div>
                </div>
              ) : (
                <video
                  id="admin-review-video-player"
                  key={activeVideoReview._id}
                  src={getVideoUrl(activeVideoReview.videoUrl)}
                  controls
                  autoPlay
                  preload="auto"
                  playsInline
                  onLoadedMetadata={(e) => {
                    const v = e.currentTarget;
                    setVideoError(false);
                    // Fix for Chrome/Chromium MediaRecorder WebM duration Infinity/0:00 bug
                    if (v.duration === Infinity || isNaN(v.duration)) {
                      v.currentTime = 1e101;
                      v.ontimeupdate = function () {
                        this.ontimeupdate = null;
                        this.currentTime = 0;
                        this.play().catch(() => { });
                      };
                    }
                  }}
                  onError={(e) => {
                    console.error("Video load error:", e);
                    setVideoError(true);
                  }}
                  className="w-full h-full object-contain"
                />
              )}
            </div>

            {/* Modal Footer / Review Info & Actions */}
            <div className="p-4 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-gray-100">
              <div>
                <span className="text-xs text-gray-500">
                  Status:{" "}
                  <strong
                    className={
                      activeVideoReview.status === "approved"
                        ? "text-emerald-600"
                        : activeVideoReview.status === "rejected"
                          ? "text-rose-600"
                          : "text-amber-600"
                    }
                  >
                    {activeVideoReview.status.toUpperCase()}
                  </strong>
                </span>
                {activeVideoReview.reviewText && (
                  <p className="text-xs text-gray-600 italic mt-0.5 line-clamp-2">
                    "{activeVideoReview.reviewText}"
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                {activeVideoReview.status !== "approved" && (
                  <button
                    onClick={() => handleUpdateStatus(activeVideoReview._id, "approved")}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Verify & Approve
                  </button>
                )}

                {activeVideoReview.status !== "rejected" && (
                  <button
                    onClick={() => handleUpdateStatus(activeVideoReview._id, "rejected")}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 rounded-lg text-xs font-medium transition-all"
                  >
                    <XCircle className="w-4 h-4" />
                    Reject
                  </button>
                )}

                <button
                  onClick={() => setVideoModalOpen(false)}
                  className="px-3.5 py-2 border border-gray-300 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewsPage;
