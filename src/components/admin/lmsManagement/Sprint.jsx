import React, { useState, useEffect } from "react";
import dayjs from "dayjs";
import Sessions from "./Sessions";
import { getCourses } from "../../../api/courseApi";
import {
  createSprint,
  getSprintsByCourse,
  updateSprint,
  deleteSprint,
  getAllSprints,
} from "../../../api/sprintApi";

const Sprint = () => {
  const [courses, setCourses] = useState([]);
  const [sprints, setSprints] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingSprint, setEditingSprint] = useState(null);
  const [viewingSprints, setViewingSprints] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // 'all', 'active', 'draft'

  // Form State
  const [formData, setFormData] = useState({
    courseId: "",
    name: "",
    description: "",
    goal: "",
    whatsappGroupLink: "",
    isActive: true,
    startDate: "",
    endDate: "",
  });

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const data = await getCourses();
        setCourses(Array.isArray(data) ? data : data.data || []);
      } catch (error) {
        console.error("Error fetching courses:", error);
      }
    };
    fetchCourses();
  }, []);

  useEffect(() => {
    fetchSprints(selectedCourse || null);
  }, [selectedCourse]);

  const fetchSprints = async (courseId) => {
    try {
      setLoading(true);
      const response = courseId
        ? await getSprintsByCourse(courseId)
        : await getAllSprints();
      const data = response?.data?.sprints || response?.data || response || [];
      setSprints(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching sprints:", error);
      setSprints([]);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (sprint = null) => {
    setEditingSprint(sprint);
    if (sprint) {
      setFormData({
        courseId: sprint.courseId?._id || sprint.courseId || "",
        name: sprint.name,
        description: sprint.description || "",
        goal: sprint.goal || "",
        whatsappGroupLink: sprint.whatsappGroupLink || "",
        isActive: sprint.isActive,
        startDate: sprint.startDate
          ? dayjs(sprint.startDate).format("YYYY-MM-DD")
          : "",
        endDate: sprint.endDate
          ? dayjs(sprint.endDate).format("YYYY-MM-DD")
          : "",
      });
    } else {
      setFormData({
        courseId: selectedCourse || "",
        name: "",
        description: "",
        goal: "",
        whatsappGroupLink: "",
        isActive: true,
        startDate: "",
        endDate: "",
      });
    }
    setIsModalVisible(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.courseId) {
      alert("Please select a course for this sprint.");
      return;
    }
    const sprintData = {
      ...formData,
      startDate: dayjs(formData.startDate).toISOString(),
      endDate: dayjs(formData.endDate).toISOString(),
    };

    try {
      if (editingSprint) {
        await updateSprint(editingSprint._id, sprintData);
      } else {
        await createSprint(sprintData);
      }
      setIsModalVisible(false);
      fetchSprints(selectedCourse);
    } catch (error) {
      console.error(error);
      alert("Failed to save sprint. Make sure name is unique for the course.");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this sprint?")) {
      try {
        await deleteSprint(id);
        fetchSprints(selectedCourse);
      } catch (error) {
        console.error("Error deleting sprint:", error);
      }
    }
  };

  // Metrics
  const totalSprints = sprints.length;
  const activeSprintsCount = sprints.filter((s) => s.isActive).length;
  const draftSprintsCount = sprints.filter((s) => !s.isActive).length;
  const liveSprintsCount = sprints.filter((s) => {
    if (!s.isActive || !s.startDate || !s.endDate) return false;
    const now = dayjs();
    return now.isAfter(dayjs(s.startDate)) && now.isBefore(dayjs(s.endDate));
  }).length;

  // Filter Sprints
  const filteredSprints = sprints.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.goal && s.goal.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (s.description &&
        s.description.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && s.isActive) ||
      (statusFilter === "draft" && !s.isActive);

    return matchesSearch && matchesStatus;
  });

  // Group sprints by Course
  const sprintsGroupedByCourse = filteredSprints.reduce((acc, sprint) => {
    const courseId = sprint.courseId?._id || sprint.courseId || "unassigned";
    const courseTitle =
      sprint.courseId?.title || "General / Unassigned Sprints";
    if (!acc[courseId]) {
      acc[courseId] = {
        title: courseTitle,
        sprints: [],
      };
    }
    acc[courseId].sprints.push(sprint);
    return acc;
  }, {});

  const sortedCourseGroups = Object.keys(sprintsGroupedByCourse)
    .map((key) => ({ id: key, ...sprintsGroupedByCourse[key] }))
    .sort((a, b) => a.title.localeCompare(b.title));

  if (viewingSprints) {
    const activeSprint = sprints.find((s) => s._id === viewingSprints);
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Modern Breadcrumb */}
        <div className="mb-6 flex flex-wrap items-center gap-2 text-sm bg-slate-50 border border-slate-100 p-4 rounded-2xl shadow-sm">
          <button
            onClick={() => setViewingSprints(null)}
            className="flex items-center font-bold text-slate-500 hover:text-blue-600 transition-colors"
          >
            <svg
              className="w-5 h-5 mr-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.5"
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Sprints
          </button>
          <span className="text-slate-300 font-bold">/</span>
          <span className="text-slate-400 font-medium">
            {activeSprint?.courseId?.title || "Course"}
          </span>
          <span className="text-slate-300 font-bold">/</span>
          <span className="text-blue-600 font-black tracking-tight">
            {activeSprint?.name || "Sessions"}
          </span>
        </div>

        <Sessions
          sprintId={viewingSprints}
          sprint={activeSprint}
          onClose={() => setViewingSprints(null)}
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 transition-colors text-slate-800">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-10">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-xs font-bold uppercase tracking-wider mb-4">
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.5"
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
            Curriculum Architecture
          </div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900">
            Sprint Management
          </h1>
          <p className="text-slate-500 mt-2 max-w-2xl text-base leading-relaxed">
            Construct time-boxed development sprints, draft goals, and populate
            interactive learner sessions.
          </p>
        </div>

        <button
          onClick={() => openModal()}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-lg shadow-blue-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2.5"
              d="M12 4v16m8-8H4"
            />
          </svg>
          Create Sprint
        </button>
      </div>

      {/* Stats Summary Panel */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black uppercase text-slate-400 tracking-wider">
              Total Sprints
            </span>
            <span className="p-2 bg-slate-50 rounded-xl text-slate-600">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2"
                />
              </svg>
            </span>
          </div>
          <p className="text-2xl font-black text-slate-950">{totalSprints}</p>
        </div>

        <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black uppercase text-emerald-500 tracking-wider">
              Active Sprints
            </span>
            <span className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </span>
          </div>
          <p className="text-2xl font-black text-slate-950">
            {activeSprintsCount}
          </p>
        </div>

        <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black uppercase text-blue-500 tracking-wider">
              Live Sprints
            </span>
            <span className="p-2 bg-blue-50 rounded-xl text-blue-600 relative">
              <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </span>
          </div>
          <p className="text-2xl font-black text-slate-950">
            {liveSprintsCount}
          </p>
        </div>

        <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black uppercase text-amber-500 tracking-wider">
              Draft Sprints
            </span>
            <span className="p-2 bg-amber-50 rounded-xl text-amber-600">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5"
                />
              </svg>
            </span>
          </div>
          <p className="text-2xl font-black text-slate-950">
            {draftSprintsCount}
          </p>
        </div>
      </div>

      {/* Control Filter Bar */}
      <div className="bg-slate-50 border border-slate-150 p-4 rounded-3xl mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
          {/* Course select filter */}
          <div className="relative">
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="w-full sm:w-64 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 transition-all appearance-none pr-10 cursor-pointer"
            >
              <option value="">All Courses</option>
              {courses.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.title}
                </option>
              ))}
            </select>
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.5"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </span>
          </div>

          {/* Search bar */}
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search sprints, goals..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-medium placeholder:text-slate-400 text-slate-700 text-sm"
            />
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.5"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </span>
          </div>
        </div>

        {/* Tab filters for Status */}
        <div className="flex bg-white border border-slate-200 p-1.5 rounded-2xl gap-1 w-full md:w-auto overflow-x-auto">
          {["all", "active", "draft"].map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap ${
                statusFilter === tab
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              {tab === "all" ? "All" : tab === "active" ? "Active" : "Drafts"}
            </button>
          ))}
        </div>
      </div>

      {/* Main Sprints Showcase */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 text-slate-400 animate-pulse">
          <svg
            className="w-12 h-12 mb-4 animate-spin text-blue-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 15.89M21 21v-5h-.581"
            />
          </svg>
          <span className="font-bold tracking-wider uppercase text-xs">
            Loading Sprints...
          </span>
        </div>
      ) : sortedCourseGroups.length === 0 ? (
        <div className="text-center py-20 bg-white border border-slate-150 rounded-3xl italic text-slate-400 font-medium">
          No sprints found matching the active selection.
        </div>
      ) : (
        <div className="space-y-12">
          {sortedCourseGroups.map((group) => (
            <div
              key={group.id}
              className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-300"
            >
              {/* Group Course Header */}
              <div className="flex items-center gap-4 border-b border-slate-100 pb-3">
                <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                    />
                  </svg>
                </span>
                <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">
                  {group.title}
                </h2>
                <span className="px-2.5 py-0.5 bg-slate-100 text-slate-500 rounded-full text-xs font-bold">
                  {group.sprints.length}{" "}
                  {group.sprints.length === 1 ? "Sprint" : "Sprints"}
                </span>
              </div>

              {/* Sprint Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {group.sprints.map((s) => {
                  const start = dayjs(s.startDate);
                  const end = dayjs(s.endDate);
                  const today = dayjs();
                  let dateStatus = "scheduled";
                  if (today.isAfter(start) && today.isBefore(end)) {
                    dateStatus = "live";
                  } else if (today.isAfter(end)) {
                    dateStatus = "ended";
                  }

                  const durationInDays = end.diff(start, "day") + 1;

                  return (
                    <div
                      key={s._id}
                      className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 hover:border-blue-200 transition-all duration-300 relative flex flex-col justify-between group"
                    >
                      <div>
                        {/* Badges / Header Row */}
                        <div className="flex items-center justify-between gap-2 mb-4">
                          <span
                            className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                              s.isActive
                                ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                                : "bg-slate-50 text-slate-500 border-slate-150"
                            }`}
                          >
                            {s.isActive ? "Active" : "Draft"}
                          </span>

                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 border ${
                              dateStatus === "live"
                                ? "bg-red-50 text-red-700 border-red-100"
                                : dateStatus === "ended"
                                  ? "bg-slate-100 text-slate-400 border-slate-200"
                                  : "bg-amber-50 text-amber-600 border-amber-100"
                            }`}
                          >
                            {dateStatus === "live" && (
                              <span className="relative flex h-1.5 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-600"></span>
                              </span>
                            )}
                            {dateStatus === "live"
                              ? "Live Now"
                              : dateStatus === "ended"
                                ? "Completed"
                                : "Scheduled"}
                          </span>
                        </div>

                        {/* Sprint Name */}
                        <h3 className="text-xl font-black text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1 mb-2">
                          {s.name}
                        </h3>

                        {/* Date & Duration Info */}
                        <div className="flex items-center gap-2 text-xs text-slate-400 font-bold mb-3">
                          <svg
                            className="w-4 h-4 text-slate-300"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                          <span>
                            {start.format("MMM D")} -{" "}
                            {end.format("MMM D, YYYY")} ({durationInDays} days)
                          </span>
                        </div>

                        {/* Description */}
                        {s.description && (
                          <p className="text-sm text-slate-500 leading-relaxed line-clamp-2 mb-4">
                            {s.description}
                          </p>
                        )}

                        {/* Goal Quote Block */}
                        {s.goal && (
                          <div className="mb-4 p-3 bg-blue-50/40 rounded-2xl border border-blue-50 text-xs text-blue-700 leading-relaxed font-medium">
                            <span className="font-black uppercase tracking-wider block text-[9px] text-blue-500 mb-0.5">
                              Sprint Goal
                            </span>
                            {s.goal}
                          </div>
                        )}

                        {/* WhatsApp Link Indicator */}
                        {s.whatsappGroupLink && (
                          <a
                            href={s.whatsappGroupLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 font-bold text-xs hover:bg-emerald-100 border border-emerald-100/50 mb-4 transition-all"
                            title="Join Sprint WhatsApp Group"
                          >
                            <svg
                              className="w-4 h-4 text-emerald-600"
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.262 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.739-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.965C16.528 2.01 14.069.99 11.45.989c-5.441 0-9.865 4.37-9.87 9.8-.001 1.774.475 3.508 1.378 5.04L1.95 21.025l5.312-1.392c-1.56 1.05-1.56.883-1.615.421z" />
                            </svg>
                            <span>WhatsApp Chat Room</span>
                          </a>
                        )}
                      </div>

                      {/* Card Footer Actions */}
                      <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                        <button
                          onClick={() => setViewingSprints(s._id)}
                          className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 font-bold rounded-xl text-sm transition-all"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2.5"
                              d="M12 4v16m8-8H4"
                            />
                          </svg>
                          <span>
                            Sessions{" "}
                            {s.sessions?.length ? `(${s.sessions.length})` : ""}
                          </span>
                        </button>

                        <div className="flex gap-1.5">
                          <button
                            onClick={() => openModal(s)}
                            className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl border border-transparent hover:border-amber-100 transition-all"
                            title="Edit Sprint Settings"
                          >
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                              />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(s._id)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl border border-transparent hover:border-red-100 transition-all"
                            title="Delete Sprint"
                          >
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Redesigned Custom Create/Edit Modal */}
      {isModalVisible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden border border-slate-100">
            <form onSubmit={handleSubmit}>
              {/* Modal Title */}
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h2 className="text-xl font-black uppercase text-slate-900 tracking-tight">
                  {editingSprint ? "Modify" : "Create"} Sprint
                </h2>
                <button
                  type="button"
                  onClick={() => setIsModalVisible(false)}
                  className="hover:text-slate-600 transition-colors p-1 rounded-lg hover:bg-slate-100"
                >
                  <svg
                    className="w-6 h-6 text-slate-400 hover:text-slate-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* Scrollable Fields */}
              <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto text-left">
                {/* Course Selection Inside Modal */}
                <div>
                  <label className="block text-xs font-black uppercase text-slate-500 tracking-wider mb-2">
                    Associated Course
                  </label>
                  <select
                    required
                    value={formData.courseId}
                    onChange={(e) =>
                      setFormData({ ...formData, courseId: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 text-slate-700 font-bold rounded-xl outline-none focus:ring-4 focus:ring-blue-500/10 transition-all cursor-pointer"
                  >
                    <option value="" disabled>
                      Select course linkage...
                    </option>
                    {courses.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Sprint Name */}
                <div>
                  <label className="block text-xs font-black uppercase text-slate-500 tracking-wider mb-2">
                    Sprint Name
                  </label>
                  <input
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-medium placeholder:text-slate-400"
                    placeholder="e.g., Week 1: Core Fundamentals"
                  />
                </div>

                {/* Date Selection */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black uppercase text-slate-500 tracking-wider mb-2">
                      Start Date
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.startDate}
                      onChange={(e) =>
                        setFormData({ ...formData, startDate: e.target.value })
                      }
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black uppercase text-slate-500 tracking-wider mb-2">
                      End Date
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.endDate}
                      onChange={(e) =>
                        setFormData({ ...formData, endDate: e.target.value })
                      }
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-bold"
                    />
                  </div>
                </div>

                {/* Sprint Goal */}
                <div>
                  <label className="block text-xs font-black uppercase text-slate-500 tracking-wider mb-2">
                    Sprint Goal
                  </label>
                  <textarea
                    rows="2"
                    value={formData.goal}
                    onChange={(e) =>
                      setFormData({ ...formData, goal: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-medium resize-none"
                    placeholder="Identify key target goals..."
                  />
                </div>

                {/* Description (Previously Missing) */}
                <div>
                  <label className="block text-xs font-black uppercase text-slate-500 tracking-wider mb-2">
                    Detailed Description
                  </label>
                  <textarea
                    rows="3"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-medium resize-none"
                    placeholder="What topics, technologies or concepts are included in this sprint?"
                  />
                </div>

                {/* WhatsApp Group Link (Previously Missing) */}
                <div>
                  <label className="block text-xs font-black uppercase text-slate-500 tracking-wider mb-2">
                    WhatsApp Group Link
                  </label>
                  <div className="relative">
                    <input
                      value={formData.whatsappGroupLink}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          whatsappGroupLink: e.target.value,
                        })
                      }
                      className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-medium placeholder:text-slate-400 text-sm"
                      placeholder="e.g. https://chat.whatsapp.com/invite/..."
                    />
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500">
                      <svg
                        className="w-5 h-5"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.262 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.739-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.965C16.528 2.01 14.069.99 11.45.989c-5.441 0-9.865 4.37-9.87 9.8-.001 1.774.475 3.508 1.378 5.04L1.95 21.025l5.312-1.392c-1.56 1.05-1.56.883-1.615.421z" />
                      </svg>
                    </span>
                  </div>
                </div>

                {/* Status/Visibility Switch */}
                <div className="flex items-center justify-between p-4 bg-blue-50/40 rounded-2xl border border-blue-100">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-blue-700">
                      Sprint Status
                    </span>
                    <span className="text-[10px] text-blue-500 font-medium">
                      Unpublished drafts will remain hidden from learner
                      dashboard.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, isActive: !formData.isActive })
                    }
                    className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${
                      formData.isActive ? "bg-blue-600" : "bg-slate-300"
                    }`}
                  >
                    <div
                      className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 ${
                        formData.isActive ? "translate-x-6" : ""
                      }`}
                    ></div>
                  </button>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalVisible(false)}
                  className="px-5 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-8 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 hover:scale-[1.01] active:scale-[0.99] transition-all"
                >
                  {editingSprint ? "Update Sprint" : "Create Sprint"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sprint;
