import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../../../api/axios';
import ActivityForm from '../../../components/admin/activities/ActivityForm';
import SubmissionsModal from '../../../components/admin/activities/SubmissionsModal';

const ActivityManagement = () => {
  const [activities, setActivities] = useState([]);
  const [courses, setCourses] = useState([]);
  const [selectedCourseFilter, setSelectedCourseFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  // Modals state
  const [showActivityForm, setShowActivityForm] = useState(false);
  const [editingActivity, setEditingActivity] = useState(null);
  const [viewingSubmissionsActivity, setViewingSubmissionsActivity] = useState(null);

  useEffect(() => {
    fetchCourses();
    fetchActivities();
  }, []);

  const fetchCourses = async () => {
    try {
      const res = await api.get('/courses');
      setCourses(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Error fetching courses:', err);
    }
  };

  const fetchActivities = async () => {
    setLoading(true);
    try {
      const res = await api.get('/activities');
      setActivities(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch (err) {
      console.error('Error fetching activities:', err);
      toast.error('Failed to load course activities');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateActivity = async (formData) => {
    try {
      const res = await api.post('/activities', formData);
      toast.success('Course Activity published successfully!');
      setShowActivityForm(false);
      fetchActivities();
    } catch (err) {
      console.error('Error creating activity:', err);
      toast.error(err.response?.data?.message || 'Failed to create activity');
    }
  };

  const handleUpdateActivity = async (id, formData) => {
    try {
      await api.put(`/activities/${id}`, formData);
      toast.success('Activity updated successfully!');
      setEditingActivity(null);
      fetchActivities();
    } catch (err) {
      console.error('Error updating activity:', err);
      toast.error(err.response?.data?.message || 'Failed to update activity');
    }
  };

  const handleDeleteActivity = async (id) => {
    if (!window.confirm('Are you sure you want to delete this activity? This will also remove any student submissions.')) {
      return;
    }
    try {
      await api.delete(`/activities/${id}`);
      toast.success('Activity deleted successfully');
      setActivities(activities.filter((a) => a._id !== id));
    } catch (err) {
      console.error('Error deleting activity:', err);
      toast.error('Failed to delete activity');
    }
  };

  const filteredActivities = activities.filter((act) => {
    if (selectedCourseFilter !== 'ALL') {
      const courseId = String(act.course?._id || act.course || '');
      return courseId === selectedCourseFilter;
    }
    return true;
  });

  const totalSubmissions = activities.reduce((sum, a) => sum + (a.totalSubmissions || 0), 0);

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-xs font-bold uppercase tracking-wider mb-1">
            LMS Academic Assessment
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Course Activities &amp; Quizzes</h1>
          <p className="text-xs text-gray-500 mt-1">
            Create 1-3 question quiz activities per course. All students enrolled in the course can view and submit answers.
          </p>
        </div>

        <button
          onClick={() => setShowActivityForm(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-semibold text-xs flex items-center shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create New Activity
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Total Activities</p>
            <p className="text-lg font-bold text-slate-900">{activities.length}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Published Quizzes</p>
            <p className="text-lg font-bold text-slate-900">
              {activities.filter((a) => a.status === 'Published').length}
            </p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Student Submissions</p>
            <p className="text-lg font-bold text-slate-900">{totalSubmissions}</p>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mb-6 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <label className="text-xs font-bold text-slate-700 whitespace-nowrap">Filter Course:</label>
          <select
            value={selectedCourseFilter}
            onChange={(e) => setSelectedCourseFilter(e.target.value)}
            className="w-full sm:w-72 text-xs border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white font-medium"
          >
            <option value="ALL">All Courses ({courses.length})</option>
            {courses.map((c) => (
              <option key={c._id} value={c._id}>
                {c.title}
              </option>
            ))}
          </select>
        </div>

        <span className="text-xs font-semibold text-slate-500 self-end sm:self-auto">
          Showing {filteredActivities.length} of {activities.length} activities
        </span>
      </div>

      {/* Activities Table */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500 text-sm">
          <div className="inline-block animate-spin w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full mb-2"></div>
          <p>Loading course activities...</p>
        </div>
      ) : filteredActivities.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
          <svg className="w-12 h-12 text-slate-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="text-sm font-bold text-slate-800">No activities found</h3>
          <p className="text-xs text-slate-500 mt-1 mb-4">
            Create quiz activities for this course so enrolled students can practice and submit answers.
          </p>
          <button
            onClick={() => setShowActivityForm(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-colors"
          >
            + Create First Activity
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Activity &amp; Title
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Target Course
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Questions
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Submissions
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Deadline
                  </th>
                  <th className="px-5 py-3.5 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {filteredActivities.map((act) => (
                  <tr key={act._id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-4">
                      <div className="text-xs font-bold text-slate-900">{act.title}</div>
                      {act.description && (
                        <div className="text-[11px] text-slate-500 line-clamp-1 max-w-xs mt-0.5">
                          {act.description}
                        </div>
                      )}
                    </td>

                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {act.course?.title || 'Course'}
                      </span>
                    </td>

                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className="text-xs font-bold text-slate-700">
                        {act.questions?.length || 0} Questions
                      </span>
                    </td>

                    <td className="px-5 py-4 whitespace-nowrap">
                      <button
                        onClick={() => setViewingSubmissionsActivity(act)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors cursor-pointer"
                        title="View student typed answers"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        {act.totalSubmissions || 0} Submitted
                      </button>
                    </td>

                    <td className="px-5 py-4 whitespace-nowrap">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          act.status === 'Published'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {act.status}
                      </span>
                    </td>

                    <td className="px-5 py-4 whitespace-nowrap text-xs text-slate-500">
                      {act.deadline ? new Date(act.deadline).toLocaleDateString() : 'No Deadline'}
                    </td>

                    <td className="px-5 py-4 whitespace-nowrap text-right text-xs font-medium space-x-2">
                      <button
                        onClick={() => setEditingActivity(act)}
                        className="text-indigo-600 hover:text-indigo-900 p-1 rounded hover:bg-indigo-50"
                        title="Edit Activity"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>

                      <button
                        onClick={() => handleDeleteActivity(act._id)}
                        className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                        title="Delete Activity"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Activity Modal */}
      {showActivityForm && (
        <ActivityForm
          courses={courses}
          onClose={() => setShowActivityForm(false)}
          onSubmit={handleCreateActivity}
        />
      )}

      {/* Edit Activity Modal */}
      {editingActivity && (
        <ActivityForm
          activity={editingActivity}
          courses={courses}
          onClose={() => setEditingActivity(null)}
          onSubmit={(formData) => handleUpdateActivity(editingActivity._id, formData)}
        />
      )}

      {/* View Submissions Modal */}
      {viewingSubmissionsActivity && (
        <SubmissionsModal
          activity={viewingSubmissionsActivity}
          onClose={() => setViewingSubmissionsActivity(null)}
        />
      )}
    </div>
  );
};

export default ActivityManagement;
