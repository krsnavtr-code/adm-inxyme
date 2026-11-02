import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../../../api/axios';

const AssignStudentsModal = ({ job, onClose, onAssign }) => {
  const [batches, setBatches] = useState([]);
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [batchStudents, setBatchStudents] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [referralStatus, setReferralStatus] = useState('Referred');
  const [referralNotes, setReferralNotes] = useState('Recommended via Inxyme Placement Cell');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingBatches, setLoadingBatches] = useState(true);

  // Initialize with currently assigned students if any
  useEffect(() => {
    if (job?.assignedStudents) {
      const existingIds = job.assignedStudents.map((s) => (typeof s === 'object' ? s._id : s));
      setSelectedStudents(existingIds);
    }
  }, [job]);

  // Fetch batches
  useEffect(() => {
    const fetchBatches = async () => {
      setLoadingBatches(true);
      try {
        const res = await api.get('/batches');
        const batchList = Array.isArray(res.data?.data)
          ? res.data.data
          : Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data?.batches)
          ? res.data.batches
          : [];

        const jobCourseId = String(job?.courseId?._id || job?.courseId || '');

        // Sort or prioritize batches for this job's course
        const relevantBatches = batchList.filter((b) => {
          if (!jobCourseId) return true;
          const bCourseId = String(b.course?._id || b.course || '');
          return bCourseId === jobCourseId;
        });

        // Fallback to all batches if no course-specific batches found
        const finalBatches = relevantBatches.length > 0 ? relevantBatches : batchList;
        setBatches(finalBatches);

        if (finalBatches.length > 0) {
          setSelectedBatchId(finalBatches[0]._id);
          extractStudentsFromBatch(finalBatches[0]);
        }
      } catch (error) {
        console.error('Error fetching batches for career assignment:', error);
        toast.error('Failed to load batches');
      } finally {
        setLoadingBatches(false);
      }
    };

    fetchBatches();
  }, [job]);

  // Extract students from selected batch
  const extractStudentsFromBatch = (batch) => {
    if (!batch || !Array.isArray(batch.students)) {
      setBatchStudents([]);
      return;
    }
    const mapped = batch.students.map((s) => {
      if (typeof s === 'object') {
        return {
          _id: s._id,
          name: s.fullname || s.name || 'Student',
          email: s.email || '',
          phone: s.phone || '',
        };
      }
      return { _id: s, name: 'Student', email: '' };
    });
    setBatchStudents(mapped);
  };

  const handleBatchChange = async (batchId) => {
    setSelectedBatchId(batchId);
    const chosenBatch = batches.find((b) => b._id === batchId);
    if (chosenBatch) {
      // If batch students are already populated
      if (chosenBatch.students && chosenBatch.students.length > 0 && typeof chosenBatch.students[0] === 'object') {
        extractStudentsFromBatch(chosenBatch);
      } else {
        // Fetch detailed batch
        try {
          const res = await api.get(`/batches/${batchId}`);
          const detailed = res.data?.data || res.data;
          extractStudentsFromBatch(detailed);
        } catch {
          extractStudentsFromBatch(chosenBatch);
        }
      }
    }
  };

  const toggleStudentSelection = (studentId) => {
    setSelectedStudents((prev) => {
      if (prev.includes(studentId)) {
        return prev.filter((id) => id !== studentId);
      } else {
        return [...prev, studentId];
      }
    });
  };

  const selectAllBatchStudents = () => {
    const allBatchIds = batchStudents.map((s) => s._id);
    const combined = Array.from(new Set([...selectedStudents, ...allBatchIds]));
    setSelectedStudents(combined);
  };

  const deselectAllBatchStudents = () => {
    const batchIdSet = new Set(batchStudents.map((s) => s._id));
    setSelectedStudents((prev) => prev.filter((id) => !batchIdSet.has(id)));
  };

  const handleAssign = async () => {
    if (selectedStudents.length === 0) {
      toast.warning('Please select at least one student to refer');
      return;
    }

    setIsLoading(true);
    try {
      await onAssign(job._id, selectedStudents, selectedBatchId, referralStatus, referralNotes);
      toast.success(`Successfully referred ${selectedStudents.length} student(s) to ${job.title}!`);
      onClose();
    } catch (error) {
      console.error('Error assigning students:', error);
      toast.error('Failed to assign students');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredStudents = batchStudents.filter(
    (student) =>
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[88vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-200 bg-slate-50 flex justify-between items-start">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[11px] font-bold uppercase tracking-wider mb-1">
              Career Referrals &amp; Placements
            </div>
            <h2 className="text-lg font-bold text-slate-900">
              Refer Batch Students to: <span className="text-blue-600">{job?.title}</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Select a batch cohort and choose students to refer for this hiring partner opportunity.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
            disabled={isLoading}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Batch Selector & Referral Config Bar */}
        <div className="p-4 border-b border-slate-200 bg-white space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Batch Dropdown */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Select Batch Cohort
              </label>
              {loadingBatches ? (
                <div className="text-xs text-slate-400 py-2">Loading batches...</div>
              ) : (
                <select
                  value={selectedBatchId}
                  onChange={(e) => handleBatchChange(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-slate-50 font-medium"
                >
                  {batches.map((b) => (
                    <option key={b._id} value={b._id}>
                      {b.name || b.batchName} ({b.code || b.batchCode || 'Batch'}) - {b.students?.length || 0} students
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Referral Status */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Referral Status
              </label>
              <select
                value={referralStatus}
                onChange={(e) => setReferralStatus(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-slate-50 font-medium"
              >
                <option value="Referred">Referred by Inxyme</option>
                <option value="Shortlisted">Resume Shortlisted</option>
                <option value="Interview Scheduled">Interview Scheduled</option>
                <option value="Offer Received">Offer Received</option>
              </select>
            </div>
          </div>

          {/* Referral Notes Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Referral Recommendation Notes (Visible to Student)
            </label>
            <input
              type="text"
              value={referralNotes}
              onChange={(e) => setReferralNotes(e.target.value)}
              placeholder="e.g. Recommended for Frontend Role - Scored 90%+ in Course Projects"
              className="w-full text-xs border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* Search & Bulk Selection Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-1">
            <div className="relative w-full sm:w-64">
              <input
                type="text"
                className="w-full text-xs pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Search students in batch..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
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
                onClick={selectAllBatchStudents}
                className="px-2.5 py-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold transition-colors cursor-pointer"
              >
                Select All ({batchStudents.length})
              </button>
              <button
                type="button"
                onClick={deselectAllBatchStudents}
                className="px-2.5 py-1 rounded bg-slate-100 text-slate-600 hover:bg-slate-200 font-semibold transition-colors cursor-pointer"
              >
                Deselect Batch
              </button>
            </div>
          </div>
        </div>

        {/* Student List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {batchStudents.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              No students enrolled in this batch yet.
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              No students match your search filter.
            </div>
          ) : (
            filteredStudents.map((student) => {
              const isSelected = selectedStudents.includes(student._id);
              return (
                <div
                  key={student._id}
                  onClick={() => toggleStudentSelection(student._id)}
                  className={`p-3 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-blue-50/80 border-blue-400 shadow-sm'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}} // handled by parent onClick
                      className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 pointer-events-none"
                    />
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                      {student.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">{student.name}</p>
                      <p className="text-[11px] text-slate-500">{student.email}</p>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {isSelected ? 'Selected' : 'Click to Select'}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-600">
            Selected: <strong className="text-blue-600">{selectedStudents.length}</strong> student(s)
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAssign}
              disabled={isLoading || selectedStudents.length === 0}
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-600/30 transition-all cursor-pointer disabled:opacity-50"
            >
              {isLoading ? 'Saving Referrals...' : `Refer ${selectedStudents.length} Student${selectedStudents.length !== 1 ? 's' : ''}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssignStudentsModal;
