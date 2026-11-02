import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../../../api/axios';

const SubmissionsModal = ({ activity, onClose }) => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSub, setSelectedSub] = useState(null);
  const [gradeInput, setGradeInput] = useState('');
  const [feedbackInput, setFeedbackInput] = useState('');
  const [savingEvaluation, setSavingEvaluation] = useState(false);

  useEffect(() => {
    fetchSubmissions();
  }, [activity]);

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/activities/${activity._id}/submissions`);
      setSubmissions(res.data?.submissions || []);
      if (res.data?.submissions && res.data.submissions.length > 0) {
        setSelectedSub(res.data.submissions[0]);
        setGradeInput(res.data.submissions[0].marksObtained ?? '');
        setFeedbackInput(res.data.submissions[0].feedback || '');
      }
    } catch (err) {
      console.error('Error fetching submissions:', err);
      toast.error('Failed to load activity submissions');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSubmission = (sub) => {
    setSelectedSub(sub);
    setGradeInput(sub.marksObtained ?? '');
    setFeedbackInput(sub.feedback || '');
  };

  const handleSaveEvaluation = async () => {
    if (!selectedSub) return;
    setSavingEvaluation(true);
    try {
      await api.post(`/activities/${activity._id}/grade-submission`, {
        submissionId: selectedSub._id,
        marksObtained: gradeInput !== '' ? Number(gradeInput) : undefined,
        feedback: feedbackInput,
        status: 'Graded',
      });
      toast.success('Evaluation and feedback saved successfully!');
      fetchSubmissions();
    } catch (err) {
      console.error('Error saving grade:', err);
      toast.error('Failed to save evaluation');
    } finally {
      setSavingEvaluation(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold uppercase tracking-wider mb-1">
              Student Submissions Review
            </div>
            <h2 className="text-xl font-bold text-slate-900">
              Quiz Submissions: <span className="text-indigo-600">{activity?.title}</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Review answers typed by enrolled students and provide feedback.
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

        {/* Modal Body */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          {/* Left Column: List of Students who submitted */}
          <div className="w-full md:w-80 border-b md:border-b-0 md:border-r border-slate-200 bg-slate-50/50 flex flex-col overflow-y-auto">
            <div className="p-3 border-b border-slate-200 bg-white font-bold text-xs text-slate-700 flex justify-between items-center">
              <span>Submitted Students</span>
              <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-[11px]">
                {submissions.length} Total
              </span>
            </div>

            {loading ? (
              <div className="p-6 text-center text-xs text-slate-400">Loading submissions...</div>
            ) : submissions.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                No students have submitted this activity yet.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {submissions.map((sub) => {
                  const studentName = sub.student?.fullname || sub.student?.name || 'Student';
                  const isSelected = selectedSub?._id === sub._id;
                  return (
                    <div
                      key={sub._id}
                      onClick={() => handleSelectSubmission(sub)}
                      className={`p-3.5 cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-indigo-50/80 border-l-4 border-indigo-600'
                          : 'hover:bg-slate-100/60'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                          {studentName.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-slate-800 truncate">{studentName}</p>
                          <p className="text-[11px] text-slate-500 truncate">{sub.student?.email}</p>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-[10px] text-slate-400">
                              {new Date(sub.submittedAt).toLocaleDateString()}
                            </span>
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                sub.status === 'Graded'
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : 'bg-amber-100 text-amber-700'
                              }`}
                            >
                              {sub.status || 'Submitted'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: Answers Details & Evaluation Form */}
          <div className="flex-1 overflow-y-auto p-6 bg-white space-y-6">
            {!selectedSub ? (
              <div className="h-full flex items-center justify-center text-center p-8 text-slate-400 text-sm">
                Select a student submission from the left to view their answers.
              </div>
            ) : (
              <>
                {/* Student header info */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      {selectedSub.student?.fullname || selectedSub.student?.name || 'Student'}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {selectedSub.student?.email} {selectedSub.student?.phone && `• ${selectedSub.student.phone}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-500">
                      Submitted on: {new Date(selectedSub.submittedAt).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Answers List */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Student Responses (1 - 3 Questions)
                  </h4>

                  {activity.questions?.map((q, idx) => {
                    const ansObj = selectedSub.answers?.find(
                      (a) => a.questionIndex === idx || a.questionText === q.questionText
                    );
                    const studentAnswer = ansObj?.studentAnswer || '(No answer provided)';

                    return (
                      <div
                        key={idx}
                        className="p-4 rounded-xl border border-slate-200 bg-white space-y-2.5 shadow-sm"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-indigo-700 flex items-center gap-1.5">
                            <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-800 text-[10px] font-bold flex items-center justify-center">
                              {idx + 1}
                            </span>
                            Question {idx + 1}
                          </span>
                          <span className="text-[11px] font-semibold text-slate-400">
                            Max Marks: {q.maxMarks || 10}
                          </span>
                        </div>

                        <p className="text-xs font-medium text-slate-800 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                          {q.questionText}
                        </p>

                        <div>
                          <label className="block text-[11px] font-bold text-emerald-800 mb-1">
                            Student Typed Answer:
                          </label>
                          <div className="p-3 bg-emerald-50/50 border border-emerald-200 rounded-lg text-xs text-slate-800 whitespace-pre-wrap font-mono leading-relaxed">
                            {studentAnswer}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Grade & Feedback section */}
                <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/30 space-y-3">
                  <h4 className="text-xs font-bold text-slate-800">Teacher / Admin Evaluation</h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        Marks / Points Awarded
                      </label>
                      <input
                        type="number"
                        value={gradeInput}
                        onChange={(e) => setGradeInput(e.target.value)}
                        placeholder="e.g. 28"
                        className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        Feedback / Remarks for Student
                      </label>
                      <input
                        type="text"
                        value={feedbackInput}
                        onChange={(e) => setFeedbackInput(e.target.value)}
                        placeholder="e.g. Excellent explanation of React component re-rendering!"
                        className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={handleSaveEvaluation}
                      disabled={savingEvaluation}
                      className="px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {savingEvaluation ? 'Saving...' : 'Save Evaluation & Feedback'}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubmissionsModal;
