import React, { useState, useEffect, useMemo } from "react";
import { toast } from "react-hot-toast";
import {
  FaSearch,
  FaTimes,
  FaPlus,
  FaUsers,
  FaUserGraduate,
  FaChalkboardTeacher,
  FaCalendarAlt,
  FaClock,
  FaVideo,
  FaWhatsapp,
  FaEdit,
  FaTrash,
  FaCheck,
  FaExclamationTriangle,
  FaFilter,
  FaLayerGroup,
  FaExternalLinkAlt,
  FaCheckCircle,
  FaGraduationCap
} from "react-icons/fa";
import {
  getBatches,
  createBatch,
  updateBatch,
  deleteBatch,
  getCourseEnrolledUsers,
  assignStudentsToBatch
} from "../../../api/batchApi";
import { getCourses } from "../../../api/courseApi";

const BatchesManagement = () => {
  const [batches, setBatches] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCourseFilter, setSelectedCourseFilter] = useState("all");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("all");

  // Create / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBatch, setEditingBatch] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Course Enrolled Users (for the currently selected course in the form)
  const [loadingEnrolledUsers, setLoadingEnrolledUsers] = useState(false);
  const [courseEnrolledData, setCourseEnrolledData] = useState({
    enrolledStudents: [],
    enrolledTeachers: [],
    allFaculty: [],
  });
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [studentSearchQuery, setStudentSearchQuery] = useState("");

  // Manage Students Drawer / Modal State
  const [isStudentsDrawerOpen, setIsStudentsDrawerOpen] = useState(false);
  const [viewingBatch, setViewingBatch] = useState(null);
  const [savingStudents, setSavingStudents] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    course: "",
    teacher: "",
    startDate: "",
    endDate: "",
    schedule: "",
    maxCapacity: 30,
    status: "upcoming",
    meetingLink: "",
    whatsappGroupLink: "",
    description: "",
  });

  // Fetch all batches and courses on mount
  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [batchesRes, coursesRes] = await Promise.all([
        getBatches(),
        getCourses(),
      ]);

      const batchesData = batchesRes?.data || batchesRes || [];
      const coursesData = Array.isArray(coursesRes)
        ? coursesRes
        : coursesRes?.data || [];

      setBatches(Array.isArray(batchesData) ? batchesData : []);
      setCourses(Array.isArray(coursesData) ? coursesData : []);
    } catch (error) {
      console.error("Error fetching batches:", error);
      toast.error("Failed to load batches and courses");
    } finally {
      setLoading(false);
    }
  };

  // When course changes in the form, load enrolled students and teachers for that course
  const handleCourseChange = async (courseId) => {
    setFormData((prev) => ({
      ...prev,
      course: courseId,
      // reset teacher if changing course unless editing existing batch
      teacher: editingBatch?.course?._id === courseId ? editingBatch.teacher?._id || editingBatch.teacher : "",
    }));

    if (!courseId) {
      setCourseEnrolledData({
        enrolledStudents: [],
        enrolledTeachers: [],
        allFaculty: [],
      });
      setSelectedStudentIds([]);
      return;
    }

    try {
      setLoadingEnrolledUsers(true);
      const data = await getCourseEnrolledUsers(courseId);
      if (data?.success) {
        setCourseEnrolledData({
          enrolledStudents: data.enrolledStudents || [],
          enrolledTeachers: data.enrolledTeachers || [],
          allFaculty: data.allFaculty || [],
        });

        // If creating new batch, auto-select unassigned students by default
        if (!editingBatch) {
          const unassigned = (data.enrolledStudents || [])
            .filter((s) => !s.assignedBatch)
            .map((s) => s._id);
          setSelectedStudentIds(unassigned);
        }
      }
    } catch (err) {
      console.error("Error fetching course enrolled users:", err);
      toast.error("Could not load enrolled users for this course");
    } finally {
      setLoadingEnrolledUsers(false);
    }
  };

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingBatch(null);
    setFormData({
      name: "",
      code: `BATCH-${Date.now().toString().slice(-4)}`,
      course: courses.length > 0 ? courses[0]._id : "",
      teacher: "",
      startDate: new Date().toISOString().split("T")[0],
      endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      schedule: "Mon - Fri, 10:00 AM - 12:00 PM",
      maxCapacity: 30,
      status: "upcoming",
      meetingLink: "",
      whatsappGroupLink: "",
      description: "",
    });
    setSelectedStudentIds([]);
    setStudentSearchQuery("");
    setIsModalOpen(true);

    if (courses.length > 0) {
      handleCourseChange(courses[0]._id);
    }
  };

  // Open Edit Modal
  const handleOpenEditModal = async (batch) => {
    setEditingBatch(batch);
    const cId = batch.course?._id || batch.course;
    const tId = batch.teacher?._id || batch.teacher;

    setFormData({
      name: batch.name || "",
      code: batch.code || "",
      course: cId || "",
      teacher: tId || "",
      startDate: batch.startDate ? new Date(batch.startDate).toISOString().split("T")[0] : "",
      endDate: batch.endDate ? new Date(batch.endDate).toISOString().split("T")[0] : "",
      schedule: batch.schedule || "",
      maxCapacity: batch.maxCapacity || 30,
      status: batch.status || "upcoming",
      meetingLink: batch.meetingLink || "",
      whatsappGroupLink: batch.whatsappGroupLink || "",
      description: batch.description || "",
    });

    const currentStudentIds = (batch.students || []).map((s) => (s._id || s).toString());
    setSelectedStudentIds(currentStudentIds);
    setStudentSearchQuery("");
    setIsModalOpen(true);

    if (cId) {
      try {
        setLoadingEnrolledUsers(true);
        const data = await getCourseEnrolledUsers(cId);
        if (data?.success) {
          setCourseEnrolledData({
            enrolledStudents: data.enrolledStudents || [],
            enrolledTeachers: data.enrolledTeachers || [],
            allFaculty: data.allFaculty || [],
          });
        }
      } catch (err) {
        console.error("Error fetching course enrolled users:", err);
      } finally {
        setLoadingEnrolledUsers(false);
      }
    }
  };

  // Open Manage Students Drawer
  const handleOpenStudentsDrawer = async (batch) => {
    setViewingBatch(batch);
    const cId = batch.course?._id || batch.course;
    const currentStudentIds = (batch.students || []).map((s) => (s._id || s).toString());
    setSelectedStudentIds(currentStudentIds);
    setStudentSearchQuery("");
    setIsStudentsDrawerOpen(true);

    if (cId) {
      try {
        setLoadingEnrolledUsers(true);
        const data = await getCourseEnrolledUsers(cId);
        if (data?.success) {
          setCourseEnrolledData({
            enrolledStudents: data.enrolledStudents || [],
            enrolledTeachers: data.enrolledTeachers || [],
            allFaculty: data.allFaculty || [],
          });
        }
      } catch (err) {
        console.error("Error loading enrolled students for batch:", err);
      } finally {
        setLoadingEnrolledUsers(false);
      }
    }
  };

  // Save Students in Drawer
  const handleSaveBatchStudents = async () => {
    if (!viewingBatch) return;
    try {
      setSavingStudents(true);
      const res = await assignStudentsToBatch(viewingBatch._id, selectedStudentIds);
      if (res.success) {
        toast.success(`Successfully assigned ${selectedStudentIds.length} student(s) to ${viewingBatch.name}`);
        setIsStudentsDrawerOpen(false);
        await fetchInitialData();
      }
    } catch (err) {
      console.error("Error saving batch students:", err);
      toast.error(err.response?.data?.message || "Failed to update batch students");
    } finally {
      setSavingStudents(false);
    }
  };

  // Submit Create or Edit Form
  const handleSubmitBatch = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.code.trim() || !formData.course || !formData.teacher) {
      toast.error("Please fill in Batch Name, Code, Course, and Assigned Teacher");
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        ...formData,
        code: formData.code.trim().toUpperCase(),
        students: selectedStudentIds,
        maxCapacity: Number(formData.maxCapacity) || 30,
      };

      if (editingBatch) {
        await updateBatch(editingBatch._id, payload);
        toast.success("Batch updated successfully!");
      } else {
        await createBatch(payload);
        toast.success("New batch created successfully!");
      }

      setIsModalOpen(false);
      await fetchInitialData();
    } catch (error) {
      console.error("Error saving batch:", error);
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to save batch"
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Batch
  const handleDeleteBatch = async (batchId, batchName) => {
    if (window.confirm(`Are you sure you want to delete batch "${batchName}"?`)) {
      try {
        await deleteBatch(batchId);
        toast.success("Batch deleted successfully");
        await fetchInitialData();
      } catch (err) {
        console.error("Error deleting batch:", err);
        toast.error(err.response?.data?.message || "Failed to delete batch");
      }
    }
  };

  // Toggle student selection
  const handleToggleStudent = (studentId) => {
    setSelectedStudentIds((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    );
  };

  // Select all or clear students
  const handleSelectAllStudents = (selectAll) => {
    if (selectAll) {
      const allIds = courseEnrolledData.enrolledStudents.map((s) => s._id);
      setSelectedStudentIds(allIds);
    } else {
      setSelectedStudentIds([]);
    }
  };

  // Filtered Batches List
  const filteredBatches = useMemo(() => {
    return batches.filter((batch) => {
      // Course filter
      if (selectedCourseFilter !== "all") {
        const cId = batch.course?._id || batch.course;
        if (cId !== selectedCourseFilter) return false;
      }

      // Status filter
      if (selectedStatusFilter !== "all") {
        if (batch.status !== selectedStatusFilter) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const nameMatch = batch.name?.toLowerCase().includes(q);
        const codeMatch = batch.code?.toLowerCase().includes(q);
        const courseMatch = batch.course?.title?.toLowerCase().includes(q);
        const teacherMatch = batch.teacher?.fullname?.toLowerCase().includes(q);
        if (!nameMatch && !codeMatch && !courseMatch && !teacherMatch) {
          return false;
        }
      }

      return true;
    });
  }, [batches, selectedCourseFilter, selectedStatusFilter, searchQuery]);

  // Filtered Enrolled Students inside Modal/Drawer
  const filteredModalStudents = useMemo(() => {
    const list = courseEnrolledData.enrolledStudents || [];
    if (!studentSearchQuery.trim()) return list;
    const q = studentSearchQuery.toLowerCase().trim();
    return list.filter(
      (s) =>
        s.fullname?.toLowerCase().includes(q) ||
        s.email?.toLowerCase().includes(q) ||
        s.phone?.includes(q)
    );
  }, [courseEnrolledData.enrolledStudents, studentSearchQuery]);

  // Overall Statistics
  const totalBatches = batches.length;
  const activeBatches = batches.filter((b) => b.status === "active").length;
  const upcomingBatches = batches.filter((b) => b.status === "upcoming").length;
  const totalStudentsInBatches = batches.reduce(
    (acc, b) => acc + (b.students?.length || b.currentEnrollment || 0),
    0
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 text-gray-900 [color-scheme:light]">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold uppercase tracking-wider mb-2">
            <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
            LMS Live Cohort Coordination
          </div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">
            Batch & Live Classes Management
          </h1>
          <p className="text-sm text-gray-600 mt-1 max-w-2xl">
            Create course-specific batches running simultaneously. Assign qualified teachers and allocate enrolled students into organized learning cohorts.
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl flex items-center gap-2 shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
        >
          <FaPlus className="text-xs" />
          <span>Create New Batch</span>
        </button>
      </div>

      {/* Metrics Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-xl shrink-0">
            <FaLayerGroup />
          </div>
          <div>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
              Total Batches
            </span>
            <span className="text-2xl font-black text-gray-900">{totalBatches}</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl shrink-0">
            <FaClock />
          </div>
          <div>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
              Active Batches
            </span>
            <span className="text-2xl font-black text-emerald-600">{activeBatches}</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl shrink-0">
            <FaCalendarAlt />
          </div>
          <div>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
              Upcoming Cohorts
            </span>
            <span className="text-2xl font-black text-blue-600">{upcomingBatches}</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-xl shrink-0">
            <FaUserGraduate />
          </div>
          <div>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
              Allocated Students
            </span>
            <span className="text-2xl font-black text-purple-600">{totalStudentsInBatches}</span>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Search Input */}
          <div className="relative">
            <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search batch name, code, or teacher..."
              className="w-full pl-9 pr-8 py-2 text-sm bg-white text-gray-900 placeholder-gray-400 border border-gray-300 rounded-xl focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer text-xs"
              >
                <FaTimes />
              </button>
            )}
          </div>

          {/* Course Filter */}
          <div>
            <select
              value={selectedCourseFilter}
              onChange={(e) => setSelectedCourseFilter(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white text-gray-900 border border-gray-300 rounded-xl focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none cursor-pointer"
            >
              <option value="all">All Courses ({courses.length})</option>
              {courses.map((course) => (
                <option key={course._id} value={course._id}>
                  {course.title}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white text-gray-900 border border-gray-300 rounded-xl focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active (In Session)</option>
              <option value="upcoming">Upcoming (Drafting/Enrolling)</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Batches Cards Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-600" />
          <p className="text-sm text-gray-500 font-medium">Loading LMS batches and allocations...</p>
        </div>
      ) : filteredBatches.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-3xl p-12 text-center max-w-lg mx-auto space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto text-2xl">
            <FaLayerGroup />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              {batches.length === 0 ? "No Batches Created Yet" : "No Batches Match Your Filters"}
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              {batches.length === 0
                ? "Get started by creating your first course batch, assigning teachers, and allocating enrolled students."
                : "Try clearing your search query or selecting a different course to view batches."}
            </p>
          </div>
          <button
            onClick={handleOpenCreateModal}
            className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-colors inline-flex items-center gap-2 cursor-pointer"
          >
            <FaPlus /> Create Batch
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBatches.map((batch) => {
            const studentCount = batch.students?.length || batch.currentEnrollment || 0;
            const maxCap = batch.maxCapacity || 30;
            const percentFilled = Math.min(100, Math.round((studentCount / maxCap) * 100));

            const statusColors = {
              active: "bg-emerald-50 text-emerald-700 border-emerald-200",
              upcoming: "bg-blue-50 text-blue-700 border-blue-200",
              completed: "bg-gray-100 text-gray-700 border-gray-200",
              cancelled: "bg-rose-50 text-rose-700 border-rose-200",
            };

            return (
              <div
                key={batch._id}
                className="bg-white rounded-3xl border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-200 flex flex-col justify-between overflow-hidden"
              >
                {/* Batch Top Header */}
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-gray-100 text-gray-800 border border-gray-200">
                      {batch.code}
                    </span>
                    <span
                      className={`text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                        statusColors[batch.status] || "bg-gray-100 text-gray-700 border-gray-200"
                      }`}
                    >
                      {batch.status}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-gray-900 leading-snug">
                      {batch.name}
                    </h3>
                    <div className="flex items-center gap-1.5 text-xs text-indigo-600 font-semibold mt-1">
                      <FaGraduationCap />
                      <span className="truncate">{batch.course?.title || "Assigned Course"}</span>
                    </div>
                  </div>

                  {/* Teacher Information Card */}
                  <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center shrink-0">
                      {batch.teacher?.fullname ? batch.teacher.fullname.charAt(0).toUpperCase() : "T"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
                        Assigned Teacher
                      </span>
                      <span className="text-xs font-bold text-gray-900 block truncate">
                        {batch.teacher?.fullname || "Unassigned"}
                      </span>
                      <span className="text-[11px] text-gray-500 block truncate">
                        {batch.teacher?.email}
                      </span>
                    </div>
                  </div>

                  {/* Schedule & Timing Info */}
                  <div className="space-y-1.5 text-xs text-gray-600">
                    {batch.schedule && (
                      <div className="flex items-center gap-2">
                        <FaClock className="text-gray-400 shrink-0" />
                        <span className="font-medium text-gray-800">{batch.schedule}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <FaCalendarAlt className="text-gray-400 shrink-0" />
                      <span>
                        {batch.startDate ? new Date(batch.startDate).toLocaleDateString() : "TBD"} —{" "}
                        {batch.endDate ? new Date(batch.endDate).toLocaleDateString() : "TBD"}
                      </span>
                    </div>
                  </div>

                  {/* Student Allocation Progress Bar */}
                  <div className="pt-2 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-gray-700 flex items-center gap-1">
                        <FaUsers className="text-indigo-500" />
                        <span>Students Assigned</span>
                      </span>
                      <span className="font-bold text-gray-900">
                        {studentCount} / {maxCap}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          percentFilled >= 90
                            ? "bg-rose-500"
                            : percentFilled >= 70
                            ? "bg-amber-500"
                            : "bg-indigo-600"
                        }`}
                        style={{ width: `${percentFilled}%` }}
                      />
                    </div>
                  </div>

                  {/* Live Meeting Links */}
                  {(batch.meetingLink || batch.whatsappGroupLink) && (
                    <div className="flex items-center gap-2 pt-2">
                      {batch.meetingLink && (
                        <a
                          href={batch.meetingLink}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-semibold flex items-center gap-1.5 border border-blue-200 transition-colors"
                        >
                          <FaVideo /> Live Classroom
                        </a>
                      )}
                      {batch.whatsappGroupLink && (
                        <a
                          href={batch.whatsappGroupLink}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-semibold flex items-center gap-1.5 border border-emerald-200 transition-colors"
                        >
                          <FaWhatsapp /> Batch Group
                        </a>
                      )}
                    </div>
                  )}
                </div>

                {/* Batch Action Footer */}
                <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenStudentsDrawer(batch)}
                    className="px-3 py-1.5 bg-white border border-gray-200 hover:border-indigo-400 text-indigo-600 hover:text-indigo-800 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
                  >
                    <FaUsers /> Manage Students ({studentCount})
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(batch)}
                      className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-white rounded-lg transition-colors cursor-pointer"
                      title="Edit Batch Details"
                    >
                      <FaEdit className="text-sm" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteBatch(batch._id, batch.name)}
                      className="p-2 text-gray-500 hover:text-red-600 hover:bg-white rounded-lg transition-colors cursor-pointer"
                      title="Delete Batch"
                    >
                      <FaTrash className="text-sm" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ============================================================== */}
      {/* CREATE / EDIT BATCH MODAL (With Course-based User Allocations)   */}
      {/* ============================================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/50 backdrop-blur-xs">
          <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-gray-200 max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 block">
                  {editingBatch ? "Edit Live Cohort" : "New Live Cohort Setup"}
                </span>
                <h2 className="text-xl font-bold text-gray-900 mt-0.5">
                  {editingBatch ? `Edit Batch: ${editingBatch.name}` : "Create Course Batch & Assign Users"}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <FaTimes />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleSubmitBatch} className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Step 1: Course Selection */}
              <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100 space-y-2">
                <label className="block text-xs font-bold text-indigo-900 uppercase tracking-wider">
                  Target Course <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.course}
                  onChange={(e) => handleCourseChange(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-sm bg-white text-gray-900 border border-indigo-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer"
                >
                  <option value="">-- Select Course --</option>
                  {courses.map((course) => (
                    <option key={course._id} value={course._id}>
                      {course.title}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-indigo-700">
                  Selecting a course dynamically loads all teachers and students currently enrolled in this course.
                </p>
              </div>

              {/* Step 2: Batch Basic Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Batch Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Full Stack - Morning Batch A"
                    required
                    className="w-full px-3 py-2 text-sm bg-white text-gray-900 border border-gray-300 rounded-xl focus:ring-1 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Batch Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="e.g., FSWD-2026-A"
                    required
                    className="w-full px-3 py-2 text-sm bg-white text-gray-900 font-mono border border-gray-300 rounded-xl focus:ring-1 focus:ring-indigo-500 outline-none uppercase"
                  />
                </div>
              </div>

              {/* Step 3: Teacher Assignment */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Assign Course Teacher <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.teacher}
                  onChange={(e) => setFormData({ ...formData, teacher: e.target.value })}
                  required
                  className="w-full px-3 py-2 text-sm bg-white text-gray-900 border border-gray-300 rounded-xl focus:ring-1 focus:ring-indigo-500 outline-none cursor-pointer"
                >
                  <option value="">-- Choose Assigned Teacher --</option>
                  {courseEnrolledData.allFaculty.map((teacher) => (
                    <option key={teacher._id} value={teacher._id}>
                      {teacher.fullname} ({teacher.email}) {teacher.isEnrolledInCourse ? "★ Enrolled Course Faculty" : ""}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-gray-500">
                  Teachers enrolled in this specific course are marked with ★. Any qualified faculty member can be assigned.
                </p>
              </div>

              {/* Step 4: Schedule, Timings & Capacity */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Start Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    required
                    className="w-full px-3 py-2 text-sm bg-white text-gray-900 border border-gray-300 rounded-xl focus:ring-1 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    End Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    required
                    className="w-full px-3 py-2 text-sm bg-white text-gray-900 border border-gray-300 rounded-xl focus:ring-1 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Max Capacity (Students)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={formData.maxCapacity}
                    onChange={(e) => setFormData({ ...formData, maxCapacity: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-white text-gray-900 border border-gray-300 rounded-xl focus:ring-1 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Class Schedule & Timings
                  </label>
                  <input
                    type="text"
                    value={formData.schedule}
                    onChange={(e) => setFormData({ ...formData, schedule: e.target.value })}
                    placeholder="e.g., Mon - Fri, 10:00 AM - 12:00 PM"
                    className="w-full px-3 py-2 text-sm bg-white text-gray-900 border border-gray-300 rounded-xl focus:ring-1 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Batch Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-white text-gray-900 border border-gray-300 rounded-xl focus:ring-1 focus:ring-indigo-500 outline-none cursor-pointer"
                  >
                    <option value="upcoming">Upcoming (Drafting/Enrolling)</option>
                    <option value="active">Active (Currently Running)</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              {/* Step 5: Live Classroom & WhatsApp Links */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
                    <FaVideo className="text-blue-500" />
                    <span>Live Online Meeting Link (Zoom / Meet)</span>
                  </label>
                  <input
                    type="url"
                    value={formData.meetingLink}
                    onChange={(e) => setFormData({ ...formData, meetingLink: e.target.value })}
                    placeholder="https://zoom.us/j/... or Meet link"
                    className="w-full px-3 py-2 text-sm bg-white text-gray-900 border border-gray-300 rounded-xl focus:ring-1 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
                    <FaWhatsapp className="text-emerald-500" />
                    <span>WhatsApp Batch Group Link</span>
                  </label>
                  <input
                    type="url"
                    value={formData.whatsappGroupLink}
                    onChange={(e) => setFormData({ ...formData, whatsappGroupLink: e.target.value })}
                    placeholder="https://chat.whatsapp.com/..."
                    className="w-full px-3 py-2 text-sm bg-white text-gray-900 border border-gray-300 rounded-xl focus:ring-1 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              {/* Step 6: Allocate Enrolled Students into this Batch */}
              <div className="border border-gray-200 rounded-2xl p-4 bg-gray-50/60 space-y-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                      <FaUserGraduate className="text-indigo-600" />
                      <span>
                        Assign Enrolled Students ({selectedStudentIds.length} of {courseEnrolledData.enrolledStudents.length} selected)
                      </span>
                    </h4>
                    <p className="text-[11px] text-gray-500">
                      Only students who are enrolled in this course are listed below. Check the students you want in this batch.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleSelectAllStudents(true)}
                      className="px-2.5 py-1 text-[11px] font-semibold text-indigo-600 hover:bg-indigo-50 rounded-lg cursor-pointer transition-colors"
                    >
                      Select All
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectAllStudents(false)}
                      className="px-2.5 py-1 text-[11px] font-semibold text-gray-500 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                {/* Search within enrolled students */}
                <div className="relative">
                  <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none" />
                  <input
                    type="text"
                    value={studentSearchQuery}
                    onChange={(e) => setStudentSearchQuery(e.target.value)}
                    placeholder="Filter enrolled students by name or email..."
                    className="w-full pl-8 pr-4 py-1.5 text-xs bg-white text-gray-900 border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {loadingEnrolledUsers ? (
                  <div className="py-6 text-center text-xs text-gray-500">
                    Loading enrolled students for this course...
                  </div>
                ) : filteredModalStudents.length === 0 ? (
                  <div className="py-6 text-center text-xs text-gray-400 italic bg-white rounded-xl border border-dashed border-gray-200">
                    {courseEnrolledData.enrolledStudents.length === 0
                      ? "No students are currently enrolled in this course. You can enroll users in Users Management first."
                      : "No students matching your search filter."}
                  </div>
                ) : (
                  <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin">
                    {filteredModalStudents.map((student) => {
                      const isSelected = selectedStudentIds.includes(student._id);
                      const isAssignedElsewhere =
                        student.assignedBatch &&
                        (!editingBatch || student.assignedBatch._id !== editingBatch._id);

                      return (
                        <div
                          key={student._id}
                          onClick={() => handleToggleStudent(student._id)}
                          className={`p-2.5 rounded-xl border text-xs flex items-center justify-between gap-3 cursor-pointer transition-all ${
                            isSelected
                              ? "bg-indigo-50/80 border-indigo-300 text-indigo-950 font-medium"
                              : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}}
                              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                            />
                            <div className="min-w-0">
                              <span className="font-bold text-gray-900 block truncate">
                                {student.fullname}
                              </span>
                              <span className="text-[11px] text-gray-500 block truncate">
                                {student.email}
                              </span>
                            </div>
                          </div>

                          <div className="shrink-0 text-right">
                            {isAssignedElsewhere ? (
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                                In: {student.assignedBatch.name}
                              </span>
                            ) : (
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                                Unassigned
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Modal Action Buttons */}
              <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 cursor-pointer shadow-md shadow-indigo-600/20"
                >
                  {submitting ? "Saving Batch..." : editingBatch ? "Update Batch" : "Create Batch & Assign Users"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MANAGE STUDENTS MODAL / DRAWER                                  */}
      {/* ============================================================== */}
      {isStudentsDrawerOpen && viewingBatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/50 backdrop-blur-xs">
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-gray-200 max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95">
            {/* Header */}
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 block">
                  Enrolled Students Allocation
                </span>
                <h3 className="text-lg font-bold text-gray-900 mt-0.5">
                  Batch: {viewingBatch.name} ({viewingBatch.code})
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Course: {viewingBatch.course?.title}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsStudentsDrawerOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100 cursor-pointer"
              >
                <FaTimes />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 flex-1 overflow-y-auto space-y-4">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-gray-700">
                  {selectedStudentIds.length} students allocated to this batch
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleSelectAllStudents(true)}
                    className="text-indigo-600 hover:underline font-semibold cursor-pointer"
                  >
                    Select All Enrolled
                  </button>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={() => handleSelectAllStudents(false)}
                    className="text-gray-500 hover:underline font-semibold cursor-pointer"
                  >
                    Clear All
                  </button>
                </div>
              </div>

              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none" />
                <input
                  type="text"
                  value={studentSearchQuery}
                  onChange={(e) => setStudentSearchQuery(e.target.value)}
                  placeholder="Filter student list..."
                  className="w-full pl-8 pr-4 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1 scrollbar-thin">
                {filteredModalStudents.map((student) => {
                  const isAssigned = selectedStudentIds.includes(student._id);

                  return (
                    <div
                      key={student._id}
                      onClick={() => handleToggleStudent(student._id)}
                      className={`p-3 rounded-2xl border text-xs flex items-center justify-between gap-3 cursor-pointer transition-all ${
                        isAssigned
                          ? "bg-indigo-50/70 border-indigo-200 text-indigo-950 font-medium"
                          : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isAssigned}
                          onChange={() => {}}
                          className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                        <div>
                          <span className="font-bold text-gray-900 block">
                            {student.fullname}
                          </span>
                          <span className="text-[11px] text-gray-500 block">
                            {student.email}
                          </span>
                        </div>
                      </div>

                      <div>
                        {isAssigned ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                            Assigned to Batch
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                            Available
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsStudentsDrawerOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveBatchStudents}
                disabled={savingStudents}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all disabled:opacity-50 cursor-pointer shadow-md shadow-indigo-600/20"
              >
                {savingStudents ? "Updating..." : "Save Student Allocation"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BatchesManagement;

