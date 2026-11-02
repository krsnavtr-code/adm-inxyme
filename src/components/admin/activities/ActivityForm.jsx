import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

const ActivityForm = ({ activity, courses = [], onSubmit, onClose }) => {
  const [title, setTitle] = useState(activity?.title || '');
  const [course, setCourse] = useState(
    activity?.course?._id || activity?.course || (courses.length > 0 ? courses[0]._id : '')
  );
  const [description, setDescription] = useState(activity?.description || '');
  const [deadline, setDeadline] = useState(
    activity?.deadline ? new Date(activity.deadline).toISOString().split('T')[0] : ''
  );
  const [status, setStatus] = useState(activity?.status || 'Published');

  // Quiz questions state (1 to 3 questions)
  const [questions, setQuestions] = useState(
    activity?.questions && activity.questions.length > 0
      ? activity.questions.map((q) => ({
          questionText: q.questionText || '',
          maxMarks: q.maxMarks || 10,
          hint: q.hint || '',
        }))
      : [{ questionText: '', maxMarks: 10, hint: '' }]
  );

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (activity) {
      setTitle(activity.title || '');
      setCourse(activity.course?._id || activity.course || (courses.length > 0 ? courses[0]._id : ''));
      setDescription(activity.description || '');
      setDeadline(
        activity.deadline ? new Date(activity.deadline).toISOString().split('T')[0] : ''
      );
      setStatus(activity.status || 'Published');
      if (activity.questions && activity.questions.length > 0) {
        setQuestions(
          activity.questions.map((q) => ({
            questionText: q.questionText || '',
            maxMarks: q.maxMarks || 10,
            hint: q.hint || '',
          }))
        );
      }
    }
  }, [activity, courses]);

  // Add question (up to 3)
  const handleAddQuestion = () => {
    if (questions.length >= 3) {
      toast.warning('Maximum 3 questions allowed per quiz activity');
      return;
    }
    setQuestions([...questions, { questionText: '', maxMarks: 10, hint: '' }]);
  };

  // Remove question (minimum 1)
  const handleRemoveQuestion = (index) => {
    if (questions.length <= 1) {
      toast.warning('An activity must have at least 1 question');
      return;
    }
    const updated = [...questions];
    updated.splice(index, 1);
    setQuestions(updated);
  };

  // Update question field
  const handleUpdateQuestion = (index, field, value) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    setQuestions(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error('Please enter an activity title');
      return;
    }

    if (!course) {
      toast.error('Please select a target course');
      return;
    }

    if (questions.length < 1 || questions.length > 3) {
      toast.error('Activity quiz must contain between 1 and 3 questions');
      return;
    }

    for (let i = 0; i < questions.length; i++) {
      if (!questions[i].questionText.trim()) {
        toast.error(`Please write question text for Question ${i + 1}`);
        return;
      }
    }

    setSubmitting(true);
    try {
      await onSubmit({
        title: title.trim(),
        course,
        description: description.trim(),
        deadline: deadline || undefined,
        status,
        activityType: 'Quiz',
        questions: questions.map((q) => ({
          questionText: q.questionText.trim(),
          maxMarks: Number(q.maxMarks) || 10,
          hint: q.hint.trim(),
        })),
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-[11px] font-bold uppercase tracking-wider mb-1">
              Course Activity &amp; Quiz Builder
            </div>
            <h2 className="text-xl font-bold text-slate-900">
              {activity ? `Edit Activity: ${activity.title}` : 'Create Course Quiz Activity'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Activities will automatically show in the Student Portal for all enrolled students in this course.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto p-6">
          <form id="activity-form" onSubmit={handleSubmit} className="space-y-5">
            {/* Row 1: Title & Course */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Activity Title *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Sprint 2: React State & Lifecycle Quiz"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Target Course *</label>
                <select
                  value={course}
                  onChange={(e) => setCourse(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white font-medium"
                  required
                >
                  <option value="" disabled>Select Target Course</option>
                  {courses.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Row 2: Deadline & Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Submission Deadline (Optional)</label>
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Publish Status *</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white font-medium"
                >
                  <option value="Published">Published (Visible to Enrolled Students)</option>
                  <option value="Draft">Draft (Saved Privately)</option>
                </select>
              </div>
            </div>

            {/* Description / Instructions */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Instructions / Description for Students
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="e.g. Read each conceptual question carefully and type your solution or explanation in the answer box."
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            {/* QUIZ QUESTIONS BUILDER (1 to 3 Questions) */}
            <div className="border border-indigo-200 bg-indigo-50/30 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-indigo-100 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <span className="p-1 rounded bg-indigo-600 text-white">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </span>
                    Quiz Questions (1 to 3 Questions)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Write between 1 and 3 questions. Students will get an answer box to type their reply.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-700">
                    {questions.length} / 3 Questions
                  </span>

                  {questions.length < 3 && (
                    <button
                      type="button"
                      onClick={handleAddQuestion}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 shadow-sm"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Add Question
                    </button>
                  )}
                </div>
              </div>

              {/* Questions List */}
              <div className="space-y-4">
                {questions.map((q, index) => (
                  <div
                    key={index}
                    className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">
                          {index + 1}
                        </span>
                        <span className="text-xs font-bold text-slate-800">
                          Question {index + 1}
                        </span>
                      </div>

                      {questions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveQuestion(index)}
                          className="text-xs font-semibold text-red-500 hover:text-red-700 p-1 flex items-center gap-1"
                          title="Remove Question"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Delete
                        </button>
                      )}
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        Question Prompt / Problem Statement *
                      </label>
                      <textarea
                        value={q.questionText}
                        onChange={(e) => handleUpdateQuestion(index, 'questionText', e.target.value)}
                        rows={2}
                        placeholder={`e.g. Write question ${index + 1} here... What is the core difference between SQL and NoSQL databases?`}
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div>
                        <label className="block text-[11px] font-medium text-slate-500 mb-1">
                          Max Marks / Points
                        </label>
                        <input
                          type="number"
                          value={q.maxMarks}
                          onChange={(e) => handleUpdateQuestion(index, 'maxMarks', e.target.value)}
                          min={1}
                          max={100}
                          className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-medium text-slate-500 mb-1">
                          Optional Hint / Direction for Student
                        </label>
                        <input
                          type="text"
                          value={q.hint}
                          onChange={(e) => handleUpdateQuestion(index, 'hint', e.target.value)}
                          placeholder="e.g. Mention ACID properties and scalability"
                          className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </form>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-medium">
            This activity contains <strong className="text-indigo-600">{questions.length}</strong> question(s).
          </span>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="activity-form"
              disabled={submitting}
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/30 transition-all cursor-pointer disabled:opacity-50"
            >
              {submitting ? 'Saving Activity...' : activity ? 'Update Activity' : 'Publish Activity'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivityForm;
