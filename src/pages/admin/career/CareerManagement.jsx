import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../../../contexts/AuthContext';
import api from '../../../api/axios';
import JobForm from '../../../components/admin/career/JobForm';
import JobList from '../../../components/admin/career/JobList';
import AssignStudentsModal from '../../../components/admin/career/AssignStudentsModal';

const CareerManagement = () => {
  const [jobs, setJobs] = useState([]);
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [showJobForm, setShowJobForm] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchJobs();
    fetchCourses();
  }, []);

  const fetchJobs = async () => {
    try {
      const res = await api.get('/careers');
      setJobs(res.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      toast.error('Failed to fetch jobs');
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const res = await api.get('/courses');
      setCourses(res.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to fetch courses');
    }
  };

  const handleCreateJob = async (jobData) => {
    try {
      const res = await api.post('/careers', jobData);
      setJobs([...jobs, res.data]);
      setShowJobForm(false);
      toast.success('Job created successfully');
    } catch (err) {
      console.error(err);
      toast.error('Failed to create job');
    }
  };

  const handleUpdateJob = async (id, jobData) => {
    try {
      const res = await api.put(`/careers/${id}`, jobData);
      setJobs(jobs.map(job => job._id === id ? res.data : job));
      setSelectedJob(null);
      toast.success('Job updated successfully');
    } catch (err) {
      console.error(err);
      toast.error('Failed to update job');
    }
  };

  const handleDeleteJob = async (id) => {
    if (window.confirm('Are you sure you want to delete this job?')) {
      try {
        await api.delete(`/careers/${id}`);
        setJobs(jobs.filter(job => job._id !== id));
        toast.success('Job deleted successfully');
      } catch (err) {
        console.error(err);
        toast.error('Failed to delete job');
      }
    }
  };

  const handleAssignStudents = async (jobId, studentIds) => {
    try {
      await api.put(`/careers/assign/${jobId}`, { studentId: studentIds });
      fetchJobs(); // Refresh jobs to show updated assignments
      setShowAssignModal(false);
      toast.success('Students assigned successfully');
    } catch (err) {
      console.error(err);
      toast.error('Failed to assign students');
    }
  };

  const handleOpenAssignModal = async (job) => {
    setSelectedJob(job);
    try {
      // First, get all enrollments
      const res = await api.get('/enrollments/all');
      
      // Check if res.data.data exists and is an array
      if (!res.data || !res.data.success || !Array.isArray(res.data.data)) {
        console.error('Unexpected API response format:', res.data);
        throw new Error('Invalid data format received from server');
      }
      
      // Get the enrollments array from response
      const enrollments = res.data.data;
      
      // Filter enrollments for the specific course and map to student data
      const jobCourseId = job.courseId?._id || job.courseId;
      
      // First, log all enrollments for the job's course regardless of status
      const allCourseEnrollments = enrollments.filter(enrollment => {
        const courseId = typeof enrollment.course === 'object' ? enrollment.course?._id : enrollment.course;
        const courseIdStr = String(courseId);
        const jobCourseIdStr = String(jobCourseId);
        const matches = courseIdStr === jobCourseIdStr;
        
        if (matches) {
          console.log('Found matching enrollment:', {
            enrollmentId: enrollment._id,
            courseId: courseId,
            courseIdStr,
            status: enrollment.status,
            user: enrollment.user
          });
        }
        
        return matches;
      });
      
      // Consider enrollments as active if status is undefined or 'active'
      const courseEnrollments = allCourseEnrollments.filter(enrollment => {
        const isActive = !enrollment.status || enrollment.status === 'active';
        if (!isActive) {
          console.log('Skipping inactive enrollment:', {
            enrollmentId: enrollment._id,
            status: enrollment.status,
            user: enrollment.user
          });
        } else {
          console.log('Including enrollment:', {
            enrollmentId: enrollment._id,
            status: enrollment.status,
            user: enrollment.user
          });
        }
        return isActive;
      });
      
      // Map to student data with better error handling
      const studentData = courseEnrollments.map(enrollment => {
        const user = typeof enrollment.user === 'object' ? enrollment.user : {};
        return {
          _id: user._id || enrollment.user, // Handle both populated and non-populated user
          name: user.name || 'Unknown Student',
          email: user.email || 'No email'
        };
      });
      
      // Remove duplicate students (in case of multiple enrollments)
      const uniqueStudents = Array.from(new Map(
        studentData.map(student => [student._id, student])
      ).values());
      
      
      if (uniqueStudents.length === 0) {
        toast.info('No active students found for this course');
        return;
      }
      
      setStudents(uniqueStudents);
      setShowAssignModal(true);
    } catch (err) {
      console.error('Error in handleOpenAssignModal:', {
        error: err,
        message: err.message,
        response: err.response?.data
      });
      toast.error(`Failed to fetch students: ${err.response?.data?.message || err.message || 'Please try again'}`);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Career Management</h1>
        <button
          onClick={() => setShowJobForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Post New Job
        </button>
      </div>

      <JobList 
        jobs={jobs} 
        onEdit={(job) => {
          setSelectedJob(job);
          setShowJobForm(true);
        }} 
        onDelete={handleDeleteJob}
        onAssign={handleOpenAssignModal}
      />

      {showJobForm && (
        <JobForm
          job={selectedJob}
          courses={courses}
          onClose={() => {
            setSelectedJob(null);
            setShowJobForm(false);
          }}
          onSubmit={selectedJob ? 
            (data) => handleUpdateJob(selectedJob._id, data) : 
            handleCreateJob
          }
        />
      )}

      {showAssignModal && selectedJob && (
        <AssignStudentsModal
          job={selectedJob}
          students={students}
          assignedStudents={selectedJob.assignedStudents?.map(s => s._id) || []}
          onClose={() => setShowAssignModal(false)}
          onAssign={handleAssignStudents}
        />
      )}
    </div>
  );
};

export default CareerManagement;
