import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import api from '../../../api/axios';

const JobForm = ({ job, courses = [], onSubmit, onClose }) => {
  const initialCourseId = courses.length > 0 ? courses[0]._id : '';

  const defaultValues = {
    title: '',
    companyName: 'Inxyme Hiring Partner',
    description: '',
    requirements: [''],
    responsibilities: [''],
    location: '',
    jobType: 'Full-time',
    salary: '',
    courseId: initialCourseId,
    status: 'Draft',
    applicationDeadline: ''
  };

  const { register, handleSubmit, formState: { errors }, reset, watch, setValue } = useForm({
    defaultValues: job ? {
      ...job,
      companyName: job.companyName || 'Inxyme Hiring Partner',
      courseId: job.courseId?._id || job.courseId || initialCourseId,
      applicationDeadline: job.applicationDeadline ? 
        new Date(job.applicationDeadline).toISOString().split('T')[0] : ''
    } : defaultValues
  });

  const selectedCourseId = watch('courseId');

  const [requirements, setRequirements] = useState(job?.requirements || ['']);
  const [responsibilities, setResponsibilities] = useState(job?.responsibilities || ['']);

  // Student referral state
  const [batches, setBatches] = useState([]);
  const [selectedBatchFilter, setSelectedBatchFilter] = useState('ALL');
  const [availableStudents, setAvailableStudents] = useState([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [studentSearch, setStudentSearch] = useState('');
  const [referralStatus, setReferralStatus] = useState('Referred');
  const [referralNotes, setReferralNotes] = useState('Recommended via Inxyme Placement Drive');

  // Initialize form state when job prop changes
  useEffect(() => {
    if (job) {
      const formattedJob = {
        ...job,
        companyName: job.companyName || 'Inxyme Hiring Partner',
        courseId: job.courseId?._id || job.courseId || initialCourseId,
        applicationDeadline: job.applicationDeadline ? 
          new Date(job.applicationDeadline).toISOString().split('T')[0] : ''
      };
      reset(formattedJob);
      setRequirements(job.requirements && job.requirements.length > 0 ? job.requirements : ['']);
      setResponsibilities(job.responsibilities && job.responsibilities.length > 0 ? job.responsibilities : ['']);

      // Pre-select already assigned students if editing
      if (job.assignedStudents && Array.isArray(job.assignedStudents)) {
        const ids = job.assignedStudents.map((s) => (typeof s === 'object' ? String(s._id) : String(s)));
        setSelectedStudentIds(ids);
      }
      if (job.studentReferrals && job.studentReferrals.length > 0) {
        if (job.studentReferrals[0].notes) setReferralNotes(job.studentReferrals[0].notes);
        if (job.studentReferrals[0].status) setReferralStatus(job.studentReferrals[0].status);
      }
    } else {
      reset(defaultValues);
      setRequirements(['']);
      setResponsibilities(['']);
      setSelectedStudentIds([]);
    }
  }, [job, reset]);

  // Fetch batches and students whenever the selected courseId changes
  useEffect(() => {
    if (!selectedCourseId) {
      setBatches([]);
      setAvailableStudents([]);
      return;
    }

    let isMounted = true;

    const fetchCourseStudentsAndBatches = async () => {
      setLoadingStudents(true);
      try {
        // 1. Fetch all batches or batches filtered by course
        const batchRes = await api.get('/batches', { params: { course: selectedCourseId } }).catch(() => null);
        const rawBatches = Array.isArray(batchRes?.data?.data)
          ? batchRes.data.data
          : Array.isArray(batchRes?.data)
          ? batchRes.data
          : Array.isArray(batchRes?.data?.batches)
          ? batchRes.data.batches
          : [];

        // Filter batches strictly for selected course
        const courseBatches = rawBatches.filter((b) => {
          const bCourseId = String(b.course?._id || b.course || '');
          return bCourseId === String(selectedCourseId);
        });

        // 2. Fetch direct course-enrolled users (safe fallback if 404 or fails)
        let enrolledRes = null;
        try {
          enrolledRes = await api.get(`/batches/course/${selectedCourseId}/enrolled-users`);
        } catch {
          // Ignore if 404/not available
        }
        const enrolledStudents = enrolledRes?.data?.enrolledStudents || [];

        // 3. Map and deduplicate students
        const studentMap = new Map();

        // Add students found in course batches
        courseBatches.forEach((batch) => {
          (batch.students || []).forEach((st) => {
            const sid = typeof st === 'object' ? String(st._id) : String(st);
            if (!sid) return;
            const bName = batch.name || batch.batchName || 'Batch';
            const bId = String(batch._id);

            const existing = studentMap.get(sid);
            if (existing) {
              if (!existing.batchNames.includes(bName)) existing.batchNames.push(bName);
              if (!existing.batchIds.includes(bId)) existing.batchIds.push(bId);
            } else {
              studentMap.set(sid, {
                _id: sid,
                name: (typeof st === 'object' && (st.fullname || st.name)) || 'Student',
                email: (typeof st === 'object' && st.email) || '',
                phone: (typeof st === 'object' && st.phone) || '',
                avatar: typeof st === 'object' ? st.avatar : null,
                batchNames: [bName],
                batchIds: [bId],
              });
            }
          });
        });

        // Add students from direct course enrollments
        enrolledStudents.forEach((st) => {
          const sid = String(st._id);
          if (!sid) return;
          const bName = st.assignedBatch?.name || null;
          const bId = st.assignedBatch?._id ? String(st.assignedBatch._id) : null;

          const existing = studentMap.get(sid);
          if (existing) {
            if (bName && !existing.batchNames.includes(bName)) existing.batchNames.push(bName);
            if (bId && !existing.batchIds.includes(bId)) existing.batchIds.push(bId);
          } else {
            studentMap.set(sid, {
              _id: sid,
              name: st.fullname || st.name || 'Student',
              email: st.email || '',
              phone: st.phone || '',
              avatar: st.avatar || null,
              batchNames: bName ? [bName] : ['Direct Enrolled'],
              batchIds: bId ? [bId] : [],
            });
          }
        });

        if (isMounted) {
          setBatches(courseBatches);
          const studentList = Array.from(studentMap.values());
          setAvailableStudents(studentList);
          setSelectedBatchFilter('ALL');
        }
      } catch (err) {
        console.error('Error fetching students for course:', err);
      } finally {
        if (isMounted) {
          setLoadingStudents(false);
        }
      }
    };

    fetchCourseStudentsAndBatches();

    return () => {
      isMounted = false;
    };
  }, [selectedCourseId]);

  // Requirement handlers
  const addRequirement = () => setRequirements([...requirements, '']);
  const removeRequirement = (index) => {
    if (requirements.length > 1) {
      const updated = [...requirements];
      updated.splice(index, 1);
      setRequirements(updated);
    }
  };
  const updateRequirement = (index, value) => {
    const updated = [...requirements];
    updated[index] = value;
    setRequirements(updated);
  };

  // Responsibility handlers
  const addResponsibility = () => setResponsibilities([...responsibilities, '']);
  const removeResponsibility = (index) => {
    if (responsibilities.length > 1) {
      const updated = [...responsibilities];
      updated.splice(index, 1);
      setResponsibilities(updated);
    }
  };
  const updateResponsibility = (index, value) => {
    const updated = [...responsibilities];
    updated[index] = value;
    setResponsibilities(updated);
  };

  // Student selection handlers
  const toggleStudentSelection = (studentId) => {
    const sId = String(studentId);
    setSelectedStudentIds((prev) =>
      prev.includes(sId) ? prev.filter((id) => id !== sId) : [...prev, sId]
    );
  };

  const selectAllFiltered = () => {
    const idsToAdd = filteredStudents.map((s) => s._id);
    setSelectedStudentIds((prev) => Array.from(new Set([...prev, ...idsToAdd])));
  };

  const deselectAllFiltered = () => {
    const filteredIdSet = new Set(filteredStudents.map((s) => s._id));
    setSelectedStudentIds((prev) => prev.filter((id) => !filteredIdSet.has(id)));
  };

  // Filter students based on batch dropdown and search query
  const filteredStudents = availableStudents.filter((student) => {
    if (selectedBatchFilter !== 'ALL') {
      if (!student.batchIds.includes(String(selectedBatchFilter))) {
        return false;
      }
    }
    if (studentSearch.trim()) {
      const q = studentSearch.toLowerCase();
      const matchName = student.name?.toLowerCase().includes(q);
      const matchEmail = student.email?.toLowerCase().includes(q);
      const matchPhone = student.phone?.includes(q);
      if (!matchName && !matchEmail && !matchPhone) return false;
    }
    return true;
  });

  const onFormSubmit = (data) => {
    const filteredRequirements = requirements.filter((req) => req.trim() !== '');
    const filteredResponsibilities = responsibilities.filter((resp) => resp.trim() !== '');

    if (filteredRequirements.length === 0 || filteredResponsibilities.length === 0) {
      toast.error('Please add at least one requirement and responsibility');
      return;
    }

    // Build student referrals and extract assigned batch IDs
    const assignedBatchesSet = new Set();
    const studentReferrals = selectedStudentIds.map((sid) => {
      const studentObj = availableStudents.find((s) => String(s._id) === String(sid));
      const primaryBatchId = studentObj?.batchIds?.[0] || undefined;
      if (primaryBatchId) assignedBatchesSet.add(primaryBatchId);

      return {
        student: sid,
        batch: primaryBatchId,
        status: referralStatus,
        notes: referralNotes,
        referredAt: new Date(),
      };
    });

    onSubmit({
      ...data,
      companyName: data.companyName || 'Inxyme Hiring Partner',
      requirements: filteredRequirements,
      responsibilities: filteredResponsibilities,
      courseId: data.courseId || initialCourseId,
      assignedStudents: selectedStudentIds,
      studentReferrals,
      assignedBatches: Array.from(assignedBatchesSet),
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 bg-slate-50/80 flex justify-between items-center">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[11px] font-bold uppercase tracking-wider mb-1">
              {job ? 'Edit Job Posting' : 'Post New Job & Student Referral'}
            </div>
            <h2 className="text-xl font-bold text-slate-900">
              {job ? `Edit Job: ${job.title}` : 'Create New Career Opportunity'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Select course, target specific batch students with multi-select, and publish placement opportunities.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto p-6">
          <form id="job-form" onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
            {/* Top Grid: Title, Company, Location, Type */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Job Title *</label>
                <input
                  type="text"
                  {...register('title', { required: 'Job title is required' })}
                  className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                    errors.title ? 'border-red-500 bg-red-50/30' : 'border-slate-300'
                  }`}
                  placeholder="e.g. Junior Full Stack Developer"
                />
                {errors.title && <p className="mt-1 text-xs text-red-600">{errors.title.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Company / Hiring Partner *</label>
                <input
                  type="text"
                  {...register('companyName', { required: 'Company name is required' })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="e.g. Google, Inxyme Partner, Infosys"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Location *</label>
                <input
                  type="text"
                  {...register('location', { required: 'Location is required' })}
                  className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                    errors.location ? 'border-red-500 bg-red-50/30' : 'border-slate-300'
                  }`}
                  placeholder="e.g. Remote / Bengaluru / Noida"
                />
                {errors.location && <p className="mt-1 text-xs text-red-600">{errors.location.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Job Type *</label>
                <select
                  {...register('jobType', { required: 'Job type is required' })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                >
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Contract">Contract</option>
                  <option value="Internship">Internship</option>
                  <option value="Freelance">Freelance</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Salary / CTC (Optional)</label>
                <input
                  type="text"
                  {...register('salary')}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="e.g. ₹4.5 LPA - ₹7.0 LPA"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Publish Status *</label>
                <select
                  {...register('status', { required: 'Status is required' })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                >
                  <option value="Draft">Draft (Hidden)</option>
                  <option value="Open">Open (Active for Placements)</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Target Course *</label>
                <select
                  {...register('courseId', { required: 'Course is required' })}
                  className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white ${
                    errors.courseId ? 'border-red-500' : 'border-slate-300'
                  }`}
                >
                  {courses.map((course) => (
                    <option key={course._id} value={course._id}>
                      {course.title}
                    </option>
                  ))}
                </select>
                {errors.courseId && <p className="mt-1 text-xs text-red-600">{errors.courseId.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Application Deadline *</label>
                <input
                  type="date"
                  {...register('applicationDeadline', { required: 'Deadline is required' })}
                  className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                    errors.applicationDeadline ? 'border-red-500' : 'border-slate-300'
                  }`}
                  min={new Date().toISOString().split('T')[0]}
                />
                {errors.applicationDeadline && (
                  <p className="mt-1 text-xs text-red-600">{errors.applicationDeadline.message}</p>
                )}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Job Description *</label>
              <textarea
                {...register('description', { required: 'Job description is required' })}
                rows={3}
                className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                  errors.description ? 'border-red-500' : 'border-slate-300'
                }`}
                placeholder="Detailed job description and expectations..."
              />
              {errors.description && <p className="mt-1 text-xs text-red-600">{errors.description.message}</p>}
            </div>

            {/* Requirements & Responsibilities */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-bold text-slate-700">Requirements *</label>
                  <button
                    type="button"
                    onClick={addRequirement}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-800"
                  >
                    + Add More
                  </button>
                </div>
                <div className="space-y-2">
                  {requirements.map((req, index) => (
                    <div key={index} className="flex items-center gap-1.5">
                      <span className="text-slate-400 text-xs">•</span>
                      <input
                        type="text"
                        value={req}
                        onChange={(e) => updateRequirement(index, e.target.value)}
                        className="flex-1 px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:outline-none"
                        placeholder={`Requirement ${index + 1}`}
                      />
                      {requirements.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeRequirement(index)}
                          className="text-slate-400 hover:text-red-500 p-1"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-bold text-slate-700">Responsibilities *</label>
                  <button
                    type="button"
                    onClick={addResponsibility}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-800"
                  >
                    + Add More
                  </button>
                </div>
                <div className="space-y-2">
                  {responsibilities.map((resp, index) => (
                    <div key={index} className="flex items-center gap-1.5">
                      <span className="text-slate-400 text-xs">•</span>
                      <input
                        type="text"
                        value={resp}
                        onChange={(e) => updateResponsibility(index, e.target.value)}
                        className="flex-1 px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:outline-none"
                        placeholder={`Responsibility ${index + 1}`}
                      />
                      {responsibilities.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeResponsibility(index)}
                          className="text-slate-400 hover:text-red-500 p-1"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* MULTI-SELECT STUDENTS SECTION */}
            <div className="border border-blue-200 bg-blue-50/30 rounded-2xl p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-blue-100 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-blue-600 text-white">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </span>
                    <h3 className="text-sm font-bold text-slate-800">
                      Refer Specific Students From Course (Multi-Select)
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Select only the students you want to recommend for this job opportunity (batch-wise or individual).
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-100 text-blue-800">
                    Selected: {selectedStudentIds.length} / {availableStudents.length} Students
                  </span>
                </div>
              </div>

              {/* Filter controls row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {/* Batch Cohort Filter */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Filter by Batch Cohort</label>
                  <select
                    value={selectedBatchFilter}
                    onChange={(e) => setSelectedBatchFilter(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white font-medium"
                  >
                    <option value="ALL">All Batches &amp; Enrolled ({batches.length} Cohorts)</option>
                    {batches.map((b) => (
                      <option key={b._id} value={b._id}>
                        {b.name || b.batchName} ({b.code || 'Batch'}) - {b.students?.length || 0} students
                      </option>
                    ))}
                  </select>
                </div>

                {/* Referral Status */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Referral Status</label>
                  <select
                    value={referralStatus}
                    onChange={(e) => setReferralStatus(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white font-medium"
                  >
                    <option value="Referred">Referred by Inxyme</option>
                    <option value="Shortlisted">Resume Shortlisted</option>
                    <option value="Interview Scheduled">Interview Scheduled</option>
                    <option value="Offer Received">Offer Received</option>
                  </select>
                </div>

                {/* Referral Notes */}
                <div className="sm:col-span-2 lg:col-span-1">
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Referral Recommendation Note</label>
                  <input
                    type="text"
                    value={referralNotes}
                    onChange={(e) => setReferralNotes(e.target.value)}
                    placeholder="e.g. Recommended for Full Stack Developer role"
                    className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                  />
                </div>
              </div>

              {/* Search & Bulk Selection Actions */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-1">
                <div className="relative w-full sm:w-72">
                  <input
                    type="text"
                    className="w-full text-xs pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                    placeholder="Search students by name, email..."
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                  />
                  <svg
                    className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto text-xs">
                  <button
                    type="button"
                    onClick={selectAllFiltered}
                    disabled={filteredStudents.length === 0}
                    className="px-3 py-1 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-semibold transition-colors cursor-pointer disabled:opacity-50"
                  >
                    Select All ({filteredStudents.length})
                  </button>
                  <button
                    type="button"
                    onClick={deselectAllFiltered}
                    disabled={selectedStudentIds.length === 0}
                    className="px-3 py-1 rounded-lg bg-slate-200 text-slate-700 hover:bg-slate-300 font-semibold transition-colors cursor-pointer disabled:opacity-50"
                  >
                    Clear Selected
                  </button>
                </div>
              </div>

              {/* Scrollable Student Multi-Select List */}
              <div className="max-h-56 overflow-y-auto space-y-2 pr-1 border border-slate-200 rounded-xl p-2 bg-white">
                {loadingStudents ? (
                  <div className="p-8 text-center text-slate-500 text-xs">
                    <div className="inline-block animate-spin w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full mb-2"></div>
                    <p>Loading course students and batches...</p>
                  </div>
                ) : availableStudents.length === 0 ? (
                  <div className="p-6 text-center text-slate-500 text-xs">
                    No students currently enrolled in this course or its batches. You can still post the job for future applicants.
                  </div>
                ) : filteredStudents.length === 0 ? (
                  <div className="p-6 text-center text-slate-500 text-xs">
                    No students match the search filter "{studentSearch}".
                  </div>
                ) : (
                  filteredStudents.map((student) => {
                    const isSelected = selectedStudentIds.includes(student._id);
                    return (
                      <div
                        key={student._id}
                        onClick={() => toggleStudentSelection(student._id)}
                        className={`p-2.5 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-blue-50 border-blue-400 shadow-sm ring-1 ring-blue-400'
                            : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}} // parent div handles onClick
                            className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 pointer-events-none cursor-pointer"
                          />
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-sm">
                            {student.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-xs font-bold text-slate-800">{student.name}</p>
                              {student.batchNames?.map((bName, i) => (
                                <span
                                  key={i}
                                  className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200"
                                >
                                  {bName}
                                </span>
                              ))}
                            </div>
                            <p className="text-[11px] text-slate-500">
                              {student.email} {student.phone && `• ${student.phone}`}
                            </p>
                          </div>
                        </div>

                        <span
                          className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                            isSelected
                              ? 'bg-blue-600 text-white shadow-sm'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {isSelected ? '✓ Selected' : 'Click to select'}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </form>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs font-medium text-slate-600">
            {selectedStudentIds.length > 0 ? (
              <span>
                <strong className="text-blue-600">{selectedStudentIds.length}</strong> student(s) will receive direct referrals for this job.
              </span>
            ) : (
              <span className="text-slate-500">No students selected (job will be open for all students to apply).</span>
            )}
          </div>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="job-form"
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-600/30 transition-all cursor-pointer"
            >
              {job ? 'Update Job & Referrals' : 'Publish Job & Referrals'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobForm;